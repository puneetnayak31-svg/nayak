#!/usr/bin/env python3
"""Build the HIPL website into dist/.

Pages live in src/pages as HTML fragments. Each starts with a meta comment:
    <!--meta {"title": "...", "description": "...", "nav": "dialogues"} -->
The build wraps every fragment in the shared layout (head, header, footer),
renders Explorations cards and series pages from src/data/explorations.json,
and copies assets/. Standard library only.

    python3 build.py            # build dist/
    python3 build.py --preview  # also write dist/_preview.html (no document wrapper)
"""

import html
import json
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src", "pages")
DIST = os.path.join(ROOT, "dist")
SITE_URL = "https://hipl.example"  # replace with the real domain before launch

DATA = json.load(open(os.path.join(ROOT, "src", "data", "explorations.json")))
SERIES = {s["slug"]: s for s in DATA["series"]}

NAV = [
    ("dialogues", "Dialogues", "dialogues.html"),
    ("interviews", "Interviews", "interviews.html"),
    ("questions", "100 Questions", "questions.html"),
    ("explorations", "Explorations", "explorations.html"),
    ("reading-circle", "Reading Circle", "reading-circle.html"),
    ("dispatch", "Dispatch", "dispatch.html"),
    ("voices", "Voices", "voices.html"),
    ("about", "About", "about.html"),
]

BARS = [
    (16, 44, 1), (30, 30, 2), (8, 52, 1), (36, 24, 1), (20, 40, 3), (4, 56, 1),
    (32, 28, 2), (12, 48, 1), (24, 36, 1), (1, 59, 3), (34, 26, 1), (16, 44, 2),
    (10, 50, 1), (28, 32, 1), (2, 58, 3), (38, 22, 1), (14, 46, 2), (22, 38, 1),
    (6, 54, 1), (32, 28, 3), (18, 42, 1), (26, 34, 2), (4, 56, 1), (30, 30, 1),
]


def sabha(cls="", live=False, label=None, style=""):
    """The Sabha symbol from the master geometry. Colours come from CSS vars."""
    a11y = f'role="img" aria-label="{label}"' if label else 'aria-hidden="true"'
    out = [f'<svg class="sabha{" live" if live else ""} {cls}" viewBox="0 0 200 200" {a11y}'
           f'{f" style={chr(34)}{style}{chr(34)}" if style else ""}><g class="spin">']
    for i, (y, h, s) in enumerate(BARS):
        if live:
            # Deterministic variety: every voice breathes at its own pace.
            sc = 0.55 + ((i * 37) % 11) / 16
            dur = 4 + ((i * 53) % 7) * 0.6
            dl = -((i * 29) % 13) * 0.4
            st = f' style="--s:{sc:.2f};--d:{dur:.1f}s;--delay:{dl:.1f}s"'
        else:
            st = ""
        out.append(f'<g transform="rotate({i * 15} 100 100)"><rect class="b{s}" x="96" y="{y}" width="8" height="{h}" rx="4" data-i="{i}"{st}/></g>')
    out.append('<circle class="core" cx="100" cy="100" r="24"/></g></svg>')
    return "".join(out)


def read_svg(name):
    with open(os.path.join(ROOT, "assets", "brand", name)) as f:
        svg = f.read().strip()
    return svg


def esc(s):
    return html.escape(s, quote=True)


def entry_url(e, root):
    return f'{root}explorations/{e["series"]}/{e["slug"]}.html' if e.get("built") else None


def x_card(e, root):
    s = SERIES[e["series"]]
    url = entry_url(e, root)
    tag = "a" if url else "article"
    href = f' href="{url}"' if url else ""
    planned = not e.get("built")
    status = "Sample draft" if e.get("built") else ("In production" if e["priority"] == "start" else "Planned")
    read_band = "u10" if e["read"] < 10 else ("10-20" if e["read"] <= 20 else "20p")
    hook = e.get("hook") or e["element"]
    attrs = (
        f'data-series="{e["series"]}" data-type="{e["type"]}" data-level="{e["level"]}" '
        f'data-read="{read_band}" data-topics="{esc("|".join(e["topics"]))}" '
        f'data-title="{esc(e["title"].lower() + " " + hook.lower())}" data-n="{e["n"]}"'
    )
    return (
        f'<{tag}{href} class="x-card series-{e["series"]}{" planned" if planned else ""}" {attrs}>'
        f'<div class="cover"><canvas data-art="{e["n"]}" aria-hidden="true"></canvas>'
        f'<span class="n num">{e["n"]:02d}</span><span class="tag">{DATA["types"][e["type"]]}</span></div>'
        f'<div class="body"><div class="meta"><span>{esc(s["short"])}</span><span>{e["read"]} min</span><span>{e["level"]}</span></div>'
        f'<h3>{esc(e["title"])}</h3><p class="small muted">{esc(hook)}</p>'
        f'<div class="meta"><span class="status {"answered" if e.get("built") else ("answering" if e["priority"] == "start" else "received")}">{status}</span>'
        f'{"<span>Expert review</span>" if e.get("sensitive") else ""}</div></div></{tag}>'
    )


def render_tokens(body, root):
    home = root or "./"
    body = body.replace("{{root}}", root).replace("{{home}}", home)
    def sabha_token(m):
        args = m.group(2) or ""
        style = ""
        sm = re.search(r'style="([^"]*)"', args)
        if sm:
            style = sm.group(1)
            args = args.replace(sm.group(0), "")
        classes = args.split()
        live = bool(m.group(1)) or "live" in classes
        classes = [c for c in classes if c != "live"]
        return sabha(" ".join(classes), live=live, style=style)

    body = re.sub(r"<!--sabha(:live)?(?: (.*?))?-->", sabha_token, body)

    def cards(m):
        arg = m.group(1)
        es = DATA["entries"]
        if arg == "all":
            pick = es
        elif arg == "start":
            pick = [e for e in es if e["n"] in (1, 2, 14)]
        elif arg == "featured":
            pick = [e for e in es if e.get("built")][:4]
        elif arg == "built":
            pick = [e for e in es if e.get("built")]
        elif arg.startswith("series="):
            slug = arg.split("=", 1)[1]
            pick = sorted([e for e in es if e["series"] == slug], key=lambda e: (e["priority"] != "start", not e.get("built"), e["n"]))
        elif arg.startswith("n="):
            ns = [int(x) for x in arg.split("=", 1)[1].split(",")]
            pick = [e for n in ns for e in es if e["n"] == n]
        else:
            raise ValueError(arg)
        return "".join(x_card(e, root) for e in pick)

    body = re.sub(r"\{\{xcards:([^}]+)\}\}", cards, body)

    def glossary(m):
        out = []
        for c in DATA["concepts"]:
            if c.get("page"):
                out.append(f'<a href="{root}explorations/concepts/{c["term"]}.html"><b>{esc(c["iast"])}</b><span lang="sa">{c["deva"]}</span></a>')
            else:
                out.append(f'<button type="button" class="concept-btn" data-concept="{c["term"]}"><b>{esc(c["iast"])}</b><span lang="sa">{c["deva"]}</span></button>')
        return "".join(out)

    body = re.sub(r"\{\{ring:(\d+)\}\}", lambda m: "".join('<i class="on"></i>' if i < int(m.group(1)) else "<i></i>" for i in range(100)), body)
    body = body.replace("{{glossary}}", glossary(None))
    return body


def layout(meta, body, root, path):
    title = meta["title"]
    full_title = "HIPL — Hinduism in Public Life" if title == "Home" else f"{title} · HIPL"
    desc = meta.get("description", "HIPL is a modern ideas platform that makes Hindu thought interesting and credible. Heritage that thinks forward.")
    nav_items = []
    for key, label, href in NAV:
        cur = ' aria-current="page"' if meta.get("nav") == key else ""
        nav_items.append(f'<a href="{root}{href}"{cur}>{label}</a>')
    canonical = SITE_URL + "/" + path.replace("index.html", "").replace(".html", "")
    header_logo = read_svg("hipl-compact-on-dark.svg").replace("<svg ", '<svg class="wm" style="height:34px;width:auto" ', 1)
    footer_logo = read_svg("hipl-lockup-horizontal-on-dark.svg").replace("<svg ", '<svg class="footer-lockup" ', 1)
    body_class = meta.get("body_class", "")
    fid = re.sub(r"[^a-z0-9]+", "-", path.lower())
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(full_title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="HIPL — Hinduism in Public Life">
<meta property="og:title" content="{esc(full_title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{SITE_URL}/assets/img/og-default.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#14123A">
<link rel="icon" href="{root}assets/brand/hipl-favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;800&family=Instrument+Sans:wght@400;500;600;700&family=Mukta:wght@400;700&display=swap">
<link rel="stylesheet" href="{root}assets/css/site.css">
</head>
<body class="{body_class}" data-root="{root}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="{root or './'}" aria-label="HIPL home">{header_logo}</a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav class="nav" id="site-nav" aria-label="Main">
      {"".join(nav_items)}
      <a class="btn" href="{root}questions.html#ask">Ask a question</a>
    </nav>
  </div>
</header>
<main id="main">
{body}
</main>
<footer class="site-footer on-dark">
  <div class="wrap">
    <div class="footer-sub">
      <div class="stack" style="--gap:12px">
        <span class="eyebrow">The Weekly Dispatch</span>
        <h2>One email a week. Five minutes. Worth opening.</h2>
        <p class="muted">One idea, the week in Hindu culture and public life, one good story, the best of HIPL, three things to read, and one question for you.</p>
      </div>
      <form class="form js-form" data-kind="dispatch" novalidate>
        <div class="field">
          <label for="f-dispatch-email-{fid}">Email address</label>
          <div class="inline-form">
            <input id="f-dispatch-email-{fid}" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
            <button class="btn" type="submit">Subscribe</button>
          </div>
        </div>
        <label class="check"><input type="checkbox" name="consent" required><span>Send me the Weekly Dispatch. I can unsubscribe at any time. See the <a href="{root}privacy.html">privacy note</a>.</span></label>
        <div class="hp" aria-hidden="true"><label>Leave this empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      </form>
    </div>
    <div class="footer-grid">
      <div class="stack" style="--gap:18px">
        {footer_logo}
        <p style="color:var(--marigold);font-weight:500">Heritage that thinks forward.</p>
        <p class="muted small" style="max-width:38ch">A modern ideas platform that makes Hindu thought interesting and credible for young people and serious readers.</p>
      </div>
      <div><h3>Take part</h3><ul>
        <li><a href="{root}dialogues.html">Dialogues</a></li>
        <li><a href="{root}interviews.html">Interviews</a></li>
        <li><a href="{root}questions.html">The First 100 Questions</a></li>
        <li><a href="{root}reading-circle.html">Reading Circle</a></li>
      </ul></div>
      <div><h3>Read</h3><ul>
        <li><a href="{root}explorations.html">Explorations</a></li>
        <li><a href="{root}voices.html">Voices</a></li>
        <li><a href="{root}dispatch.html">The Weekly Dispatch</a></li>
        <li><a href="{root}write.html">Write for HIPL</a></li>
      </ul></div>
      <div><h3>HIPL</h3><ul>
        <li><a href="{root}about.html">About</a></li>
        <li><a href="{root}about.html#standards">Editorial standards</a></li>
        <li><a href="{root}corrections.html">Corrections</a></li>
        <li><a href="{root}privacy.html">Privacy</a></li>
      </ul></div>
    </div>
    <div class="footer-base">
      <span>© HIPL — Hinduism in Public Life. Many voices, one circle.</span>
      <span>Hindi edition coming later · <span lang="hi" class="deva">हिंदी जल्द ही</span></span>
    </div>
  </div>
</footer>
<script src="{root}assets/js/data.js"></script>
<script src="{root}assets/js/site.js"></script>
</body>
</html>
"""


def parse(path):
    raw = open(path).read()
    m = re.match(r"\s*<!--meta (\{.*?\}) -->\s*", raw, re.S)
    if not m:
        raise SystemExit(f"missing meta comment in {path}")
    return json.loads(m.group(1)), raw[m.end():]


def series_page(s):
    entries = [e for e in DATA["entries"] if e["series"] == s["slug"]]
    built = sum(1 for e in entries if e.get("built"))
    start = sum(1 for e in entries if e["priority"] == "start")
    concepts = "".join(
        f'<button type="button" class="concept-btn" data-concept="{c}"><b>{esc(next(x["iast"] for x in DATA["concepts"] if x["term"] == c))}</b>'
        f'<span lang="sa">{next(x["deva"] for x in DATA["concepts"] if x["term"] == c)}</span></button>'
        for c in s["concepts"]
    )
    meta = {"title": s["name"], "description": f'{s["name"]}: {s["line"]} Part of HIPL Explorations.', "nav": "explorations"}
    body = f"""
<section class="band-dark series-{s['slug']}" style="background:var(--accent);color:var(--midnight)">
  <div class="wrap page-hero" style="position:relative;overflow:hidden">
    <nav class="crumbs" aria-label="Breadcrumb" style="color:var(--midnight)"><a href="{{{{root}}}}explorations.html">Explorations</a><span>/</span><span>{esc(s['name'])}</span></nav>
    <span class="eyebrow" style="color:var(--midnight)">Series · 12 entries</span>
    <h1 style="max-width:14ch">{esc(s['name'])}</h1>
    <p class="lede">{esc(s['intro'])}</p>
    <div class="row"><span class="tag">{built} sample drafts</span><span class="tag chalk">{start} in the first batch</span><span class="tag outline">{12 - start} planned</span></div>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">Recommended reading order</span><h2>Start at the top, or wherever your question is.</h2></div>
    <p class="small muted" style="max-width:40ch">Entries marked Planned are not written yet. We show them so you can see where the library is going, and never present an empty page as finished.</p></div>
    <div class="grid" style="--cols:3">{{{{xcards:series={s['slug']}}}}}</div>
  </div>
</section>
<section class="section tight band-sand">
  <div class="wrap stack" style="--gap:18px">
    <span class="eyebrow">Related concepts</span>
    <div class="glossary">{concepts}</div>
  </div>
</section>
"""
    return meta, body


def main():
    preview = "--preview" in sys.argv
    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)
    shutil.copytree(os.path.join(ROOT, "assets"), os.path.join(DIST, "assets"))

    # Client-side data for filters, pop-ups and generative covers.
    with open(os.path.join(DIST, "assets", "js", "data.js"), "w") as f:
        f.write("window.HIPL_DATA = " + json.dumps(DATA, ensure_ascii=False) + ";\n")

    pages = []
    for dirpath, _, files in os.walk(SRC):
        for fn in files:
            if fn.endswith(".html"):
                full = os.path.join(dirpath, fn)
                rel = os.path.relpath(full, SRC)
                meta, body = parse(full)
                pages.append((rel, meta, body))
    for s in DATA["series"]:
        meta, body = series_page(s)
        pages.append((f"explorations/{s['slug']}.html", meta, body))

    sitemap = []
    for rel, meta, body in pages:
        depth = rel.count("/")
        root = "../" * depth
        out = layout(meta, render_tokens(body, root), root, rel)
        dest = os.path.join(DIST, rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "w") as f:
            f.write(out)
        sitemap.append(SITE_URL + "/" + rel.replace("index.html", "").replace(".html", ""))
        if preview and rel == "index.html":
            # The artifact host supplies its own document wrapper for the entry page.
            inner = re.sub(r"(?s)^<!doctype html>\s*<html[^>]*>\s*<head>", "", out)
            inner = inner.replace("</head>", "").replace("</body>", "").replace("</html>", "")
            inner = re.sub(r'<body class="([^"]*)" data-root="">', r'<div class="page-root \1" data-root="">', inner)
            inner = inner.replace('<script src="assets/js/data.js">', '</div><script src="assets/js/data.js">', 1)
            inner = re.sub(r'<meta charset="utf-8">\s*<meta name="viewport"[^>]*>', "", inner)
            with open(os.path.join(DIST, "_preview.html"), "w") as f:
                f.write(inner.strip() + "\n")

    with open(os.path.join(DIST, "sitemap.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for u in sorted(sitemap):
            f.write(f"  <url><loc>{u}</loc></url>\n")
        f.write("</urlset>\n")
    with open(os.path.join(DIST, "robots.txt"), "w") as f:
        f.write(f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n")
    shutil.copy(os.path.join(ROOT, "vercel.json"), os.path.join(DIST, "vercel.json"))
    print(f"built {len(pages)} pages into {os.path.relpath(DIST, ROOT)}/")


if __name__ == "__main__":
    main()
