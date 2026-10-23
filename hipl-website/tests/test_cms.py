"""The CMS server end to end, against a throwaway copy of the content.

Starts the real HTTP handler on a free port with its data, state and build
directories pointed at temp folders, so nothing in the repository changes.
"""

import http.cookiejar
import json
import os
import shutil
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(SITE, "cms"))
sys.path.insert(0, SITE)
import server as S  # noqa: E402
import ai  # noqa: E402

PASSWORD = "test-password-123"


class CMSTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp(prefix="hipl-cms-")
        S.DATA = os.path.join(cls.tmp, "data")
        shutil.copytree(os.path.join(SITE, "src", "data"), S.DATA)
        S.STATE = os.path.join(cls.tmp, "state")
        S.INBOX = os.path.join(S.STATE, "inbox")
        S.HISTORY = os.path.join(S.STATE, "history")
        S.CONFIG = os.path.join(S.STATE, "config.json")
        S.UPLOADS = os.path.join(cls.tmp, "uploads")
        S.DIST = os.path.join(cls.tmp, "dist")
        os.makedirs(S.DIST)
        with open(os.path.join(S.DIST, "index.html"), "w") as fh:
            fh.write("<h1>home</h1>")
        os.makedirs(S.STATE)
        S.CFG = {"password": S.hash_pw(PASSWORD), "model": "claude-opus-5-5", "api_key": "", "deploy_hook": ""}
        S.RATE.clear()
        cls.srv = S.http.server.ThreadingHTTPServer(("127.0.0.1", 0), S.Handler)
        cls.base = f"http://127.0.0.1:{cls.srv.server_address[1]}"
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def setUp(self):
        S.RATE.clear()
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def call(self, method, path, body=None, header=True, headers=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, method=method)
        req.add_header("Content-Type", "application/json")
        if header:
            req.add_header("X-HIPL", "1")
        for k, v in (headers or {}).items():
            req.add_header(k, v)
        try:
            with self.opener.open(req, timeout=10) as r:
                raw = r.read()
                return r.status, (json.loads(raw) if r.headers.get_content_type() == "application/json" else raw), r.headers
        except urllib.error.HTTPError as e:
            raw = e.read()
            try:
                return e.code, json.loads(raw), e.headers
            except ValueError:
                return e.code, raw, e.headers

    def login(self):
        code, _, headers = self.call("POST", "/api/login", {"password": PASSWORD})
        self.assertEqual(code, 200)
        return headers

    # -- public
    def test_health_and_site(self):
        self.assertEqual(self.call("GET", "/api/health")[0], 200)
        code, body, _ = self.call("GET", "/")
        self.assertEqual(code, 200)
        self.assertIn(b"home", body)

    def test_path_traversal_is_blocked(self):
        for p in ["/../cms/state/config.json", "/%2e%2e/state/config.json", "/admin/../../state/config.json"]:
            code, body, _ = self.call("GET", p)
            self.assertNotEqual(code, 200, p)

    def test_public_form_lands_in_inbox(self):
        code, _, _ = self.call("POST", "/api/forms/question", {"question": "Why do we light lamps?", "name": "Asha"}, header=False)
        self.assertEqual(code, 200)
        recs = S.inbox_all("question")
        self.assertTrue(any(r["data"].get("question") == "Why do we light lamps?" for r in recs))

    def test_honeypot_and_unknown_form(self):
        before = len(S.inbox_all("dispatch"))
        self.assertEqual(self.call("POST", "/api/forms/dispatch", {"email": "a@b.c", "website": "spam"}, header=False)[0], 200)
        self.assertEqual(len(S.inbox_all("dispatch")), before)
        self.assertEqual(self.call("POST", "/api/forms/nope", {"x": 1}, header=False)[0], 404)

    def test_form_rate_limit(self):
        codes = [self.call("POST", "/api/forms/interest", {"name": str(i)}, header=False)[0] for i in range(10)]
        self.assertEqual(codes[:8], [200] * 8)
        self.assertEqual(codes[-1], 429)

    def test_rate_limit_uses_forwarded_ip_only_behind_proxy(self):
        S.TRUST_PROXY = True
        try:
            for i in range(9):
                code = self.call("POST", "/api/forms/interest", {"n": i}, header=False, headers={"X-Forwarded-For": f"10.0.0.{i}"})[0]
                self.assertEqual(code, 200)
        finally:
            S.TRUST_PROXY = False

    def test_cors_only_for_allowed_origins(self):
        S.FORMS_ORIGINS = {"https://hipl.example"}
        try:
            code, _, headers = self.call("OPTIONS", "/api/forms/question", headers={"Origin": "https://hipl.example"}, header=False)
            self.assertEqual(code, 204)
            self.assertEqual(headers.get("Access-Control-Allow-Origin"), "https://hipl.example")
            code, _, headers = self.call("POST", "/api/forms/question", {"question": "CORS?"}, header=False, headers={"Origin": "https://evil.example"})
            self.assertIsNone(headers.get("Access-Control-Allow-Origin"))
            self.assertEqual(self.call("OPTIONS", "/api/content/events", headers={"Origin": "https://hipl.example"})[0], 405)
        finally:
            S.FORMS_ORIGINS = set()

    # -- auth
    def test_admin_api_needs_login(self):
        self.assertEqual(self.call("GET", "/api/content/events")[0], 401)
        self.assertEqual(self.call("POST", "/api/login", {"password": "wrong"})[0], 401)

    def test_login_cookie_flags(self):
        cookie = self.login().get("Set-Cookie")
        self.assertIn("HttpOnly", cookie)
        self.assertIn("SameSite=Strict", cookie)
        self.assertNotIn("Secure", cookie)

    def test_secure_cookie_behind_https_proxy(self):
        S.TRUST_PROXY = True
        try:
            code, _, headers = self.call("POST", "/api/login", {"password": PASSWORD}, headers={"X-Forwarded-Proto": "https"})
            self.assertEqual(code, 200)
            self.assertIn("Secure", headers.get("Set-Cookie"))
        finally:
            S.TRUST_PROXY = False

    def test_login_rate_limit(self):
        codes = [self.call("POST", "/api/login", {"password": "wrong"})[0] for _ in range(11)]
        self.assertEqual(codes[-1], 429)

    def test_mutations_need_csrf_header(self):
        self.login()
        self.assertEqual(self.call("PUT", "/api/content/settings", {"tagline": "x"}, header=False)[0], 403)

    # -- content
    def test_read_and_update_single(self):
        self.login()
        code, settings, _ = self.call("GET", "/api/content/settings")
        self.assertEqual(code, 200)
        self.assertIn("hero", settings)
        self.assertEqual(self.call("PUT", "/api/content/settings", {"tagline": "Changed in a test"})[0], 200)
        self.assertEqual(S.read_json("site.json")["tagline"], "Changed in a test")
        self.assertTrue(os.listdir(os.path.join(S.HISTORY, "site")))

    def test_create_update_delete_event(self):
        self.login()
        code, item, _ = self.call("POST", "/api/content/events", {"title": "Test Salon", "status": "draft", "kind": "salon"})
        self.assertEqual(code, 200)
        self.assertEqual(item["slug"], "test-salon")
        self.assertEqual(self.call("POST", "/api/content/events", {"title": "Test Salon", "slug": "test-salon"})[0], 409)
        code, item, _ = self.call("PUT", "/api/content/events/test-salon", {"title": "Test Salon", "slug": "test-salon", "venue": "Somewhere"})
        self.assertEqual(item["venue"], "Somewhere")
        self.assertEqual(self.call("DELETE", "/api/content/events/test-salon")[0], 200)
        self.assertEqual(self.call("DELETE", "/api/content/events/test-salon")[0], 404)

    def test_approve_question_publishes_it(self):
        self.call("POST", "/api/forms/question", {"question": "Is karma fate?", "name": "Ravi"}, header=False)
        rec = [r for r in S.inbox_all("question") if r["data"].get("question") == "Is karma fate?"][0]
        self.login()
        code, body, _ = self.call("POST", f"/api/inbox/question/{rec['id']}/approve", {})
        self.assertEqual(code, 200)
        self.assertIn("Published as question", body["message"])
        self.assertTrue(any(q["q"] == "Is karma fate?" for q in S.read_json("questions.json")["questions"]))

    def test_page_editor_requires_meta_and_stays_inside_pages(self):
        self.login()
        self.assertEqual(self.call("PUT", "/api/pages/../../evil.html", {"html": "<!--meta {} -->"})[0], 400)
        self.assertEqual(self.call("PUT", "/api/pages/privacy.html", {"html": "<p>no meta</p>"})[0], 400)

    def test_upload_rejects_other_types(self):
        self.login()
        self.assertEqual(self.call("POST", "/api/upload", {"name": "x.html", "data": ""})[0], 400)

    def test_schema_and_validate(self):
        self.login()
        code, schema, _ = self.call("GET", "/api/schema")
        self.assertEqual(code, 200)
        self.assertIn("blocks", schema)
        self.assertEqual(self.call("GET", "/api/validate/28")[0], 200)


class AIHelpersTest(unittest.TestCase):
    """No network: only the parts that shape what the model returns."""

    def test_parse_json_tolerates_wrapping(self):
        self.assertEqual(ai.parse_json('Here you go:\n{"title": "x"}\nThanks'), {"title": "x"})
        with self.assertRaises(ai.AIError):
            ai.parse_json("no json here")

    def test_clean_entry_forces_draft_and_drops_unknown_blocks(self):
        e = ai.clean_entry({"title": "Svadharma & You!", "status": "published",
                            "blocks": [{"type": "hook", "text": "Hi", "extra": 1}, {"type": "evil"}]})
        self.assertEqual(e["status"], "draft")
        self.assertEqual(e["slug"], "svadharma-you")
        self.assertEqual(e["blocks"], [{"type": "hook", "text": "Hi"}])


if __name__ == "__main__":
    unittest.main()
