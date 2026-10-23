#!/usr/bin/env python3
"""HIPL CMS: edit everything on the site, approve submissions, draft
Explorations with AI, and publish.

    python cms/server.py                 # http://localhost:8800/admin
    python cms/server.py --host 0.0.0.0  # when hosting on a server (set a strong password!)

Environment (all optional; see docs/DEPLOYMENT.md):
    HIPL_CMS_PASSWORD   first password, used only when cms/state/config.json doesn't exist yet
    HIPL_CMS_HOST, PORT bind address and port (default 127.0.0.1:8800)
    HIPL_TRUST_PROXY=1  behind a reverse proxy: take the client IP from X-Forwarded-For
                        and treat X-Forwarded-Proto: https as HTTPS
    HIPL_SECURE_COOKIE=1  always mark the session cookie Secure
    HIPL_FORMS_ORIGINS  comma-separated site origins allowed to post forms from another
                        domain, e.g. https://hipl.in,https://www.hipl.in (static site on
                        Vercel, CMS elsewhere). Not needed when the CMS serves the site.
    ANTHROPIC_API_KEY   used by the AI Composer when no key is saved in Settings

Standard library only, except the AI Composer, which needs `pip install anthropic`
and an Anthropic API key (set it under Settings, or ANTHROPIC_API_KEY).

The same server also serves the built website at / and receives its forms at
/api/forms/<kind>, so submissions land in the CMS Inbox.
"""

import argparse
import base64
import hashlib
import hmac
import http.server
import json
import mimetypes
import os
import re
import secrets
import shutil
import subprocess
import sys
import threading
import time
import traceback
import urllib.parse
import urllib.request
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, SITE)

import content_model as CM  # noqa: E402
from sitekit import blocks as BK  # noqa: E402

DATA = os.path.join(SITE, "src", "data")
PAGES = os.path.join(SITE, "src", "pages")
UPLOADS = os.path.join(SITE, "assets", "uploads")
DIST = os.path.join(SITE, "dist")
PREVIEW = os.path.join(SITE, ".preview")
ADMIN = os.path.join(HERE, "admin")
STATE = os.path.join(HERE, "state")          # config, inbox, history (not committed)
INBOX = os.path.join(STATE, "inbox")
HISTORY = os.path.join(STATE, "history")
CONFIG = os.path.join(STATE, "config.json")
MAX_BODY = 25 * 1024 * 1024
WRITE_LOCK = threading.Lock()
SESSIONS = {}
JOBS = {}
RATE = {}
TRUST_PROXY = os.environ.get("HIPL_TRUST_PROXY") == "1"
SECURE_COOKIE = os.environ.get("HIPL_SECURE_COOKIE") == "1"
SESSION_SECONDS = 12 * 3600
FORMS_ORIGINS = {o.strip().rstrip("/") for o in os.environ.get("HIPL_FORMS_ORIGINS", "").split(",") if o.strip()}


def rate_ok(bucket, ip, limit, window):
    """Sliding-window limit per client IP. Returns False when over the limit."""
    now = time.time()
    if len(RATE) > 5000:  # forget idle clients
        for k in [k for k, v in RATE.items() if not v or now - v[-1] > 3600]:
            RATE.pop(k, None)
    key = (bucket, ip)
    hits = [t for t in RATE.get(key, []) if now - t < window]
    if len(hits) >= limit:
        RATE[key] = hits
        return False
    RATE[key] = hits + [now]
    return True


# ---------------------------------------------------------------- config & auth

def load_config():
    os.makedirs(STATE, exist_ok=True)
    if os.path.exists(CONFIG):
        with open(CONFIG, encoding="utf-8") as fh:
            return json.load(fh)
    env_pw = os.environ.get("HIPL_CMS_PASSWORD")
    pw = env_pw or secrets.token_urlsafe(9)
    cfg = {"password": hash_pw(pw), "model": "claude-opus-5-5", "api_key": "", "deploy_hook": ""}
    if not env_pw:  # a generated password is shown once so the owner can sign in
        cfg["first_password"] = pw
    save_config(cfg)
    return cfg


def save_config(cfg):
    os.makedirs(STATE, exist_ok=True)
    tmp = CONFIG + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(cfg, fh, indent=2)
    os.replace(tmp, CONFIG)


def hash_pw(pw, salt=None):
    salt = salt or secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 200_000)
    return f"pbkdf2${salt}${dk.hex()}"


def check_pw(pw, stored):
    try:
        _, salt, digest = stored.split("$")
    except ValueError:
        return False
    return hmac.compare_digest(hash_pw(pw, salt).split("$")[2], digest)


CFG = None


# ---------------------------------------------------------------- data helpers

def read_json(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as fh:
        return json.load(fh)


def write_json(name, data, who="cms"):
    """Atomic write, with the previous version kept in history."""
    path = os.path.join(DATA, name)
    with WRITE_LOCK:
        if os.path.exists(path):
            hdir = os.path.join(HISTORY, name.replace(".json", ""))
            os.makedirs(hdir, exist_ok=True)
            shutil.copy(path, os.path.join(hdir, time.strftime("%Y%m%d-%H%M%S") + f"-{uuid.uuid4().hex[:4]}.json"))
            # keep the last 60 versions per file
            olds = sorted(os.listdir(hdir))
            for o in olds[:-60]:
                os.remove(os.path.join(hdir, o))
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        os.replace(tmp, path)


def items_of(col, data):
    return data.get(col["path"], []) if col.get("path") else None


def find(items, key, value):
    for i, it in enumerate(items):
        if str(it.get(key)) == str(value):
            return i
    return -1


def coerce(col, item):
    """Make numbers numbers, so keys like n=28 stay ints."""
    def fix(fields, obj):
        for fd in fields:
            k, v = fd["name"], obj.get(fd["name"])
            if fd["kind"] == "number" and isinstance(v, str):
                obj[k] = int(v) if re.fullmatch(r"-?\d+", v.strip() or "x") else (float(v) if re.fullmatch(r"-?\d+\.\d+", v.strip()) else (None if not v.strip() else v))
            elif fd["kind"] == "numbers" and isinstance(v, list):
                obj[k] = [int(x) for x in v if str(x).strip().isdigit()]
            elif fd["kind"] == "group" and isinstance(v, dict):
                fix(fd["fields"], v)
            elif fd["kind"] == "list" and isinstance(v, list):
                for row in v:
                    if isinstance(row, dict):
                        fix(fd["fields"], row)
    fix(col["fields"], item)
    return item


# ---------------------------------------------------------------- inbox

def inbox_path(kind):
    os.makedirs(INBOX, exist_ok=True)
    return os.path.join(INBOX, f"{kind}.jsonl")


def inbox_add(kind, data, ip):
    rec = {"id": uuid.uuid4().hex[:12], "kind": kind, "at": time.strftime("%Y-%m-%d %H:%M"), "status": "new",
           "from": hashlib.sha256((ip or "").encode()).hexdigest()[:10], "data": data}
    # files (pitch drafts) are saved beside the inbox, never published automatically
    for k, v in list(data.items()):
        if isinstance(v, dict) and v.get("data"):
            fdir = os.path.join(INBOX, "files")
            os.makedirs(fdir, exist_ok=True)
            safe = re.sub(r"[^A-Za-z0-9._-]+", "-", v.get("name", "file"))[-80:]
            fname = f"{rec['id']}-{safe}"
            with open(os.path.join(fdir, fname), "wb") as fh:
                fh.write(base64.b64decode(v["data"]))
            data[k] = {"name": v.get("name"), "type": v.get("type"), "file": fname}
    with WRITE_LOCK, open(inbox_path(kind), "a", encoding="utf-8") as fh:
        fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
    return rec


def inbox_all(kind):
    p = inbox_path(kind)
    if not os.path.exists(p):
        return []
    with open(p, encoding="utf-8") as fh:
        return [json.loads(l) for l in fh if l.strip()]


def inbox_save(kind, recs):
    with WRITE_LOCK:
        tmp = inbox_path(kind) + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            for r in recs:
                fh.write(json.dumps(r, ensure_ascii=False) + "\n")
        os.replace(tmp, inbox_path(kind))


def approve(kind, rec):
    """Turn an approved submission into content."""
    d = rec["data"]
    if kind == "question":
        data = read_json("questions.json")
        n = max([q["n"] for q in data["questions"]] + [0]) + 1
        data["questions"].append({"n": n, "q": d.get("question", "").strip(), "asked_by": d.get("name") or "Anonymous",
                                  "theme": d.get("theme") or "Belief and self", "status": "received", "comments": []})
        write_json("questions.json", data)
        return f"Published as question {n:03d}."
    if kind == "comment":
        m = re.search(r"/questions/(\d{3})", d.get("page", ""))
        if not m:
            return "Marked approved (no question page found to attach it to)."
        data = read_json("questions.json")
        i = find(data["questions"], "n", int(m.group(1)))
        if i < 0:
            return "Marked approved (question not found)."
        data["questions"][i].setdefault("comments", []).append({"name": d.get("name", ""), "place": d.get("city", ""), "text": d.get("comment", "")})
        write_json("questions.json", data)
        return f"Comment added to question {int(m.group(1)):03d}."
    return "Marked done."


# ---------------------------------------------------------------- build

def run_build(preview=False):
    args = [sys.executable, os.path.join(SITE, "build.py")]
    if preview:
        args += ["--drafts", "--out", PREVIEW]
    p = subprocess.run(args, cwd=SITE, capture_output=True, text=True, timeout=300)
    return p.returncode == 0, (p.stdout + p.stderr).strip()


def deploy():
    hook = (CFG or {}).get("deploy_hook", "").strip()
    if not hook:
        return False, "No deploy hook set. Add one under Settings (for example a Vercel deploy hook URL)."
    try:
        req = urllib.request.Request(hook, method="POST", data=b"")
        with urllib.request.urlopen(req, timeout=30) as r:
            return True, f"Deploy started (HTTP {r.status})."
    except Exception as e:  # noqa: BLE001
        return False, f"Deploy hook failed: {e}"


# ---------------------------------------------------------------- AI jobs

def start_job(fn, *args):
    jid = uuid.uuid4().hex[:10]
    JOBS[jid] = {"id": jid, "status": "running", "log": [], "result": None, "error": None, "started": time.time()}

    def log(msg):
        JOBS[jid]["log"].append(time.strftime("%H:%M:%S ") + msg)

    def run():
        try:
            JOBS[jid]["result"] = fn(*args, log=log)
            JOBS[jid]["status"] = "done"
        except Exception as e:  # noqa: BLE001
            JOBS[jid]["status"] = "error"
            JOBS[jid]["error"] = str(e) if e.__class__.__name__ == "AIError" else f"{e.__class__.__name__}: {e}"
            if e.__class__.__name__ != "AIError":
                traceback.print_exc()
    threading.Thread(target=run, daemon=True).start()
    return jid


def api_key():
    return (CFG or {}).get("api_key") or os.environ.get("ANTHROPIC_API_KEY") or None


# ---------------------------------------------------------------- HTTP

class Handler(http.server.BaseHTTPRequestHandler):
    server_version = "HIPL-CMS"

    def log_message(self, fmt, *args):
        if "/api/jobs/" not in self.path:
            sys.stderr.write("  " + (fmt % args) + "\n")

    # -- helpers
    def send(self, code, body=b"", ctype="application/json", headers=None):
        if isinstance(body, (dict, list)):
            body = json.dumps(body, ensure_ascii=False).encode()
        elif isinstance(body, str):
            body = body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype + ("; charset=utf-8" if ctype.startswith(("text/", "application/json")) else ""))
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        for k, v in {**self.cors(), **(headers or {})}.items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def cors(self):
        """CORS headers for public forms posted from an allowed site origin."""
        origin = self.headers.get("Origin", "").rstrip("/")
        if origin and origin in FORMS_ORIGINS and self.path.startswith("/api/forms/"):
            return {"Access-Control-Allow-Origin": origin, "Vary": "Origin",
                    "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Max-Age": "86400"}
        return {}

    def err(self, code, msg):
        self.send(code, {"error": msg})

    def body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > MAX_BODY:
            raise ValueError("too large")
        raw = self.rfile.read(n) if n else b"{}"
        return json.loads(raw or b"{}")

    def client_ip(self):
        if TRUST_PROXY:
            xff = self.headers.get("X-Forwarded-For", "")
            if xff.strip():
                return xff.split(",")[-1].strip()  # the address our own proxy saw
        return self.client_address[0]

    def https(self):
        return SECURE_COOKIE or (TRUST_PROXY and self.headers.get("X-Forwarded-Proto", "").lower() == "https")

    def session(self):
        c = self.headers.get("Cookie", "")
        m = re.search(r"hipl_cms=([A-Za-z0-9_-]+)", c)
        if not m:
            return None
        s = SESSIONS.get(m.group(1))
        if not s or s["exp"] < time.time():
            return None
        return s

    def authed(self):
        if not self.session():
            self.err(401, "Please sign in.")
            return False
        if self.command in ("POST", "PUT", "DELETE") and self.headers.get("X-HIPL") != "1":
            self.err(403, "Missing request header.")
            return False
        return True

    def static(self, root, rel):
        rel = urllib.parse.unquote(rel.split("?")[0]).lstrip("/")
        if rel == "" or rel.endswith("/"):
            rel += "index.html"
        path = os.path.normpath(os.path.join(root, rel))
        base = os.path.normpath(root)
        if path != base and not path.startswith(base + os.sep):
            return self.err(403, "Forbidden")
        if not os.path.isfile(path) and os.path.isfile(path + ".html"):
            path += ".html"
        if not os.path.isfile(path):
            return self.send(404, "<h1>Not found</h1>", "text/html")
        ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        with open(path, "rb") as fh:
            self.send(200, fh.read(), ctype, {"Cache-Control": "no-cache"})

    # -- routes
    def do_HEAD(self):
        self.do_GET()

    def do_OPTIONS(self):
        if self.cors():
            return self.send(204, b"", "text/plain")
        return self.err(405, "Method not allowed")

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        p = u.path
        if p in ("/admin", "/admin/"):
            return self.static(ADMIN, "index.html")
        if p.startswith("/admin/"):
            return self.static(ADMIN, p[len("/admin/"):])
        if p.startswith("/preview/"):
            if not self.session():
                return self.send(302, b"", "text/plain", {"Location": "/admin/"})
            return self.static(PREVIEW, p[len("/preview/"):])
        if p.startswith("/api/"):
            return self.api_get(p, urllib.parse.parse_qs(u.query))
        if not os.path.isdir(DIST):
            return self.send(200, "<p>The site hasn't been built yet. Open <a href='/admin/'>/admin</a> and press Publish.</p>", "text/html")
        return self.static(DIST, p)

    def do_POST(self):
        p = urllib.parse.urlparse(self.path).path
        try:
            data = self.body()
        except (ValueError, json.JSONDecodeError):
            return self.err(400, "Bad request")
        if p.startswith("/api/forms/"):
            return self.public_form(p.rsplit("/", 1)[-1], data)
        if p == "/api/login":
            return self.login(data)
        if not self.authed():
            return
        return self.api_post(p, data)

    def do_PUT(self):
        p = urllib.parse.urlparse(self.path).path
        if not self.authed():
            return
        try:
            data = self.body()
        except (ValueError, json.JSONDecodeError):
            return self.err(400, "Bad request")
        return self.api_put(p, data)

    def do_DELETE(self):
        p = urllib.parse.urlparse(self.path).path
        if not self.authed():
            return
        return self.api_delete(p)

    # -- public forms
    def public_form(self, kind, data):
        if kind not in CM.FORM_KINDS:
            return self.err(404, "Unknown form")
        ip = self.client_ip()
        if not rate_ok("form", ip, 8, 60):
            return self.err(429, "Too many submissions")
        if data.get("website"):
            return self.send(200, {"ok": True})  # honeypot: pretend success
        data.pop("kind", None)
        clean = {}
        for k, v in data.items():
            if isinstance(v, str):
                clean[k[:40]] = v[:8000]
            elif isinstance(v, (bool, int, float)) or v is None:
                clean[k[:40]] = v
            elif isinstance(v, dict) and kind == "pitch" and len(v.get("data", "")) < 7_000_000:
                if re.search(r"\.(pdf|docx)$", v.get("name", ""), re.I):
                    clean[k[:40]] = v
        inbox_add(kind, clean, ip)
        return self.send(200, {"ok": True})

    def login(self, data):
        if not rate_ok("login", self.client_ip(), 10, 300):
            return self.err(429, "Too many attempts. Wait a few minutes.")
        if check_pw(data.get("password", ""), CFG["password"]):
            now = time.time()
            for k in [k for k, v in SESSIONS.items() if v["exp"] < now]:
                SESSIONS.pop(k, None)
            tok = secrets.token_urlsafe(24)
            SESSIONS[tok] = {"exp": now + SESSION_SECONDS}
            secure = "; Secure" if self.https() else ""
            return self.send(200, {"ok": True}, headers={"Set-Cookie": f"hipl_cms={tok}; HttpOnly; SameSite=Strict; Path=/; Max-Age={SESSION_SECONDS}{secure}"})
        time.sleep(0.8)
        return self.err(401, "Wrong password.")

    # -- API
    def api_get(self, p, q):
        if p == "/api/health":
            return self.send(200, {"ok": True, "built": os.path.isdir(DIST)})
        if p == "/api/status":
            return self.send(200, {"signed_in": bool(self.session()), "first_run": bool(CFG.get("first_password"))})
        if not self.session():
            return self.err(401, "Please sign in.")
        if p == "/api/schema":
            return self.send(200, CM.public_schema())
        if p == "/api/dashboard":
            counts = {k: sum(1 for r in inbox_all(k) if r["status"] == "new") for k in CM.FORM_KINDS}
            ex = read_json("explorations.json")["entries"]
            workflow = {}
            for e in ex:
                workflow[e.get("status", "planned")] = workflow.get(e.get("status", "planned"), 0) + 1
            evs = [e for e in read_json("events.json")["events"] if e.get("status") == "upcoming"]
            try:
                import anthropic  # noqa: F401
                sdk = True
            except ImportError:
                sdk = False
            return self.send(200, {"inbox": counts, "workflow": workflow, "upcoming": [{"title": e["title"], "date": e.get("date"), "slug": e["slug"]} for e in evs],
                                   "built": os.path.isdir(DIST), "ai": {"sdk": sdk, "key": bool(api_key()), "model": CFG.get("model")},
                                   "first_password": CFG.get("first_password", "")})
        m = re.fullmatch(r"/api/content/([a-z_]+)", p)
        if m:
            col = CM.BY_ID.get(m.group(1))
            if not col:
                return self.err(404, "Unknown collection")
            data = read_json(col["file"])
            if col.get("single"):
                return self.send(200, {k: data.get(k) for k in [fd["name"] for fd in col["fields"]]})
            return self.send(200, items_of(col, data))
        m = re.fullmatch(r"/api/validate/(\d+)", p)
        if m:
            ex = read_json("explorations.json")["entries"]
            i = find(ex, "n", int(m.group(1)))
            return self.send(200, {"problems": BK.validate(ex[i]) if i >= 0 else ["Not found"]})
        if p == "/api/inbox":
            kind = (q.get("kind") or [""])[0]
            kinds = [kind] if kind else list(CM.FORM_KINDS)
            out = []
            for k in kinds:
                out += inbox_all(k)
            out.sort(key=lambda r: r["at"], reverse=True)
            return self.send(200, out)
        m = re.fullmatch(r"/api/inbox/file/([A-Za-z0-9._-]+)", p)
        if m:
            fp = os.path.join(INBOX, "files", m.group(1))
            if not os.path.isfile(fp):
                return self.err(404, "Not found")
            with open(fp, "rb") as fh:
                return self.send(200, fh.read(), mimetypes.guess_type(fp)[0] or "application/octet-stream",
                                 {"Content-Disposition": f'attachment; filename="{m.group(1)}"'})
        if p == "/api/inbox.csv":
            kind = (q.get("kind") or ["rsvp"])[0]
            recs = inbox_all(kind)
            keys = sorted({k for r in recs for k in r["data"]})
            import csv
            import io
            buf = io.StringIO()
            w = csv.writer(buf)
            w.writerow(["received", "status"] + keys)
            for r in recs:
                w.writerow([r["at"], r["status"]] + [r["data"].get(k, "") if not isinstance(r["data"].get(k), dict) else r["data"][k].get("name", "") for k in keys])
            return self.send(200, buf.getvalue(), "text/csv", {"Content-Disposition": f'attachment; filename="hipl-{kind}.csv"'})
        if p == "/api/pages":
            out = []
            for d, _, files in os.walk(PAGES):
                for fn in files:
                    if fn.endswith(".html"):
                        out.append(os.path.relpath(os.path.join(d, fn), PAGES).replace(os.sep, "/"))
            return self.send(200, sorted(out))
        m = re.fullmatch(r"/api/pages/(.+\.html)", p)
        if m:
            fp = self.page_path(m.group(1))
            if not fp or not os.path.isfile(fp):
                return self.err(404, "Not found")
            with open(fp, encoding="utf-8") as fh:
                return self.send(200, {"path": m.group(1), "html": fh.read()})
        if p == "/api/media":
            os.makedirs(UPLOADS, exist_ok=True)
            files = sorted(os.listdir(UPLOADS), key=lambda f: -os.path.getmtime(os.path.join(UPLOADS, f)))
            return self.send(200, [{"name": f, "url": f"assets/uploads/{f}", "size": os.path.getsize(os.path.join(UPLOADS, f))} for f in files if not f.startswith(".")])
        m = re.fullmatch(r"/api/history/([a-z_]+)", p)
        if m:
            hdir = os.path.join(HISTORY, m.group(1))
            vs = sorted(os.listdir(hdir), reverse=True) if os.path.isdir(hdir) else []
            return self.send(200, vs[:60])
        m = re.fullmatch(r"/api/jobs/([a-f0-9]+)", p)
        if m:
            j = JOBS.get(m.group(1))
            return self.send(200, j) if j else self.err(404, "No such job")
        if p == "/api/settings":
            return self.send(200, {"model": CFG.get("model"), "deploy_hook": CFG.get("deploy_hook", ""), "api_key_set": bool(CFG.get("api_key")),
                                   "env_key": bool(os.environ.get("ANTHROPIC_API_KEY"))})
        return self.err(404, "Not found")

    def page_path(self, rel):
        fp = os.path.normpath(os.path.join(PAGES, rel))
        return fp if fp.startswith(os.path.normpath(PAGES) + os.sep) and fp.endswith(".html") else None

    def api_post(self, p, data):
        m = re.fullmatch(r"/api/content/([a-z_]+)", p)
        if m:  # create
            col = CM.BY_ID.get(m.group(1))
            if not col or col.get("single"):
                return self.err(400, "Can't add to this collection")
            file = read_json(col["file"])
            items = items_of(col, file)
            item = coerce(col, data)
            key = col["key"]
            if key == "n" and not item.get("n"):
                item["n"] = max([x.get("n", 0) for x in items] + [0]) + 1
            if key == "number" and item.get("number") in (None, ""):
                item["number"] = max([int(x.get("number", 0)) for x in items] + [-1]) + 1
            if key in ("slug",) and not item.get("slug"):
                item["slug"] = re.sub(r"[^a-z0-9]+", "-", str(item.get(col["title"], "item")).lower()).strip("-")[:60] or uuid.uuid4().hex[:6]
            if find(items, key, item.get(key)) >= 0:
                return self.err(409, f"An item with this {key} already exists.")
            items.append(item)
            write_json(col["file"], file)
            return self.send(200, item)
        if p == "/api/upload":
            name = re.sub(r"[^A-Za-z0-9._-]+", "-", data.get("name", "upload"))[-80:]
            if not re.search(r"\.(png|jpe?g|webp|gif|svg|pdf)$", name, re.I):
                return self.err(400, "Upload an image (png, jpg, webp, gif, svg) or a PDF.")
            os.makedirs(UPLOADS, exist_ok=True)
            base, ext = os.path.splitext(name)
            final = f"{base}{ext}"
            k = 1
            while os.path.exists(os.path.join(UPLOADS, final)):
                final = f"{base}-{k}{ext}"
                k += 1
            with open(os.path.join(UPLOADS, final), "wb") as fh:
                fh.write(base64.b64decode(data.get("data", "")))
            return self.send(200, {"url": f"assets/uploads/{final}", "name": final})
        if p == "/api/build":
            ok, out = run_build(preview=bool(data.get("preview")))
            return self.send(200 if ok else 500, {"ok": ok, "log": out})
        if p == "/api/deploy":
            ok, out = run_build()
            if not ok:
                return self.send(500, {"ok": False, "log": out})
            dok, dmsg = deploy()
            return self.send(200, {"ok": True, "log": out + "\n" + dmsg, "deployed": dok})
        m = re.fullmatch(r"/api/inbox/([a-z-]+)/([a-f0-9]+)/(approve|done|archive|new)", p)
        if m:
            kind, rid, action = m.groups()
            recs = inbox_all(kind)
            i = find(recs, "id", rid)
            if i < 0:
                return self.err(404, "Not found")
            msg = approve(kind, recs[i]) if action == "approve" else "Updated."
            recs[i]["status"] = {"approve": "approved", "done": "done", "archive": "archived", "new": "new"}[action]
            inbox_save(kind, recs)
            return self.send(200, {"ok": True, "message": msg})
        m = re.fullmatch(r"/api/history/([a-z_]+)/restore", p)
        if m:
            name, ver = m.group(1), os.path.basename(data.get("version", ""))
            src = os.path.join(HISTORY, name, ver)
            if not os.path.isfile(src):
                return self.err(404, "Version not found")
            with open(src, encoding="utf-8") as fh:
                write_json(name + ".json", json.load(fh))
            return self.send(200, {"ok": True})
        if p == "/api/ai/compose":
            import ai
            if not data.get("topic"):
                return self.err(400, "Give the composer a topic.")
            series = {s["slug"]: s["name"] for s in read_json("explorations.json")["series"]}
            data["series_name"] = series.get(data.get("series"), "")
            # images uploaded with the brief are saved to the media library so the page can use them
            for a in data.get("attachments") or []:
                if a.get("type", "").startswith("image/"):
                    nm = re.sub(r"[^A-Za-z0-9._-]+", "-", a.get("name", "image"))[-80:]
                    os.makedirs(UPLOADS, exist_ok=True)
                    with open(os.path.join(UPLOADS, nm), "wb") as fh:
                        fh.write(base64.b64decode(a["data"]))
                    a["url"] = f"assets/uploads/{nm}"
            jid = start_job(lambda brief, log: ai.compose(brief, api_key=api_key(), model=CFG.get("model"), log=log), data)
            return self.send(200, {"job": jid})
        if p == "/api/ai/assist":
            import ai
            try:
                blk = ai.assist_block(data.get("block") or {}, data.get("instruction", ""), data.get("context") or {}, api_key=api_key(), model=CFG.get("model"))
            except ai.AIError as e:
                return self.err(400, str(e))
            return self.send(200, blk)
        if p == "/api/settings":
            if data.get("new_password"):
                if not check_pw(data.get("current_password", ""), CFG["password"]):
                    return self.err(400, "Current password is wrong.")
                if len(data["new_password"]) < 10:
                    return self.err(400, "Use at least 10 characters.")
                CFG["password"] = hash_pw(data["new_password"])
                CFG.pop("first_password", None)
            if "api_key" in data and data["api_key"] != "":
                CFG["api_key"] = data["api_key"].strip()
            if data.get("clear_api_key"):
                CFG["api_key"] = ""
            for k in ("model", "deploy_hook"):
                if k in data:
                    CFG[k] = str(data[k]).strip()
            save_config(CFG)
            return self.send(200, {"ok": True})
        if p == "/api/logout":
            c = re.search(r"hipl_cms=([A-Za-z0-9_-]+)", self.headers.get("Cookie", ""))
            if c:
                SESSIONS.pop(c.group(1), None)
            return self.send(200, {"ok": True}, headers={"Set-Cookie": "hipl_cms=; Path=/; Max-Age=0"})
        return self.err(404, "Not found")

    def api_put(self, p, data):
        m = re.fullmatch(r"/api/content/([a-z_]+)(?:/(.+))?", p)
        if m:
            col = CM.BY_ID.get(m.group(1))
            if not col:
                return self.err(404, "Unknown collection")
            file = read_json(col["file"])
            if col.get("single"):
                file.update({k: v for k, v in data.items() if k in [fd["name"] for fd in col["fields"]]})
                write_json(col["file"], file)
                return self.send(200, {"ok": True})
            items = items_of(col, file)
            key = urllib.parse.unquote(m.group(2) or "")
            i = find(items, col["key"], key)
            if i < 0:
                return self.err(404, "Item not found")
            item = coerce(col, data)
            # keep fields the form doesn't know about (e.g. "built", "made_with")
            merged = dict(items[i])
            merged.update(item)
            j = find(items, col["key"], merged.get(col["key"]))
            if j >= 0 and j != i:
                return self.err(409, f"Another item already uses this {col['key']}.")
            items[i] = merged
            write_json(col["file"], file)
            return self.send(200, merged)
        m = re.fullmatch(r"/api/pages/(.+\.html)", p)
        if m:
            fp = self.page_path(m.group(1))
            if not fp:
                return self.err(400, "Bad page path")
            html = data.get("html", "")
            if not html.lstrip().startswith("<!--meta "):
                return self.err(400, "A page must start with its <!--meta {...} --> line.")
            os.makedirs(os.path.dirname(fp), exist_ok=True)
            if os.path.exists(fp):
                hdir = os.path.join(HISTORY, "pages")
                os.makedirs(hdir, exist_ok=True)
                shutil.copy(fp, os.path.join(hdir, m.group(1).replace("/", "__") + "." + time.strftime("%Y%m%d-%H%M%S")))
            with open(fp, "w", encoding="utf-8") as fh:
                fh.write(html)
            return self.send(200, {"ok": True})
        return self.err(404, "Not found")

    def api_delete(self, p):
        m = re.fullmatch(r"/api/content/([a-z_]+)/(.+)", p)
        if m:
            col = CM.BY_ID.get(m.group(1))
            if not col or col.get("single"):
                return self.err(400, "Can't delete here")
            file = read_json(col["file"])
            items = items_of(col, file)
            i = find(items, col["key"], urllib.parse.unquote(m.group(2)))
            if i < 0:
                return self.err(404, "Item not found")
            items.pop(i)
            write_json(col["file"], file)
            return self.send(200, {"ok": True})
        m = re.fullmatch(r"/api/media/([A-Za-z0-9._-]+)", p)
        if m:
            fp = os.path.join(UPLOADS, m.group(1))
            if os.path.isfile(fp):
                os.remove(fp)
            return self.send(200, {"ok": True})
        return self.err(404, "Not found")


def main():
    global CFG
    ap = argparse.ArgumentParser(description="HIPL CMS")
    ap.add_argument("--host", default=os.environ.get("HIPL_CMS_HOST", "127.0.0.1"))
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8800")))
    ap.add_argument("--no-browser", action="store_true")
    args = ap.parse_args()
    if args.host not in ("127.0.0.1", "localhost"):
        args.no_browser = True  # hosted: no desktop to open
    CFG = load_config()
    if not os.path.isdir(DIST):
        print("Building the site for the first time…")
        ok, out = run_build()
        print(out)
    url = f"http://{'localhost' if args.host in ('127.0.0.1', '0.0.0.0') else args.host}:{args.port}"
    print("\n  HIPL CMS is running")
    print(f"  Admin:   {url}/admin")
    print(f"  Website: {url}/")
    if CFG.get("first_password"):
        print(f"\n  First-time password:  {CFG['first_password']}")
        print("  (Change it under Settings once you're in.)")
    print("\n  Leave this window open while you work. Press Ctrl+C to stop.\n")
    srv = http.server.ThreadingHTTPServer((args.host, args.port), Handler)
    if not args.no_browser:
        try:
            import webbrowser
            threading.Timer(1.0, lambda: webbrowser.open(url + "/admin")).start()
        except Exception:  # noqa: BLE001
            pass
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
