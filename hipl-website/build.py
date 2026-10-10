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
QUESTIONS = json.load(open(os.path.join(ROOT, "src", "data", "questions.json")))["questions"]
Q_STATUS = {"received": "Waiting for an answer", "answering": "Being answered", "answered": "Answered"}

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


def initials(name):
    return "?" if name.startswith("[") else "".join(w[0] for w in name.split()[:2]).upper()


def q_by(a, label, size=""):
    return (
        f'<div class="q-by{" " + size if size else ""}"><span class="avatar-ph">{initials(a["name"])}</span>'
        f'<div><span class="eyebrow">{label}</span><b>{esc(a["name"])}</b><span class="q-title">{esc(a["title"])}</span></div></div>'
    )


def q_item(q, root):
    href = f'{root}questions/{q["n"]:03d}.html'
    video_tag = '<span class="tag saffron">Video answer</span>' if q.get("video") and q["status"] != "received" else ""
    parts = [f'<a class="q-card" href="{href}" data-status="{q["status"]}">',
             f'<div class="q-top"><span class="qn">{q["n"]:03d}/100</span><span class="status {q["status"]}">{Q_STATUS[q["status"]]}</span>'
             f'{video_tag}</div>',
             f'<h3>{esc(q["q"])}</h3><p class="asked">Asked by {esc(q["asked_by"])}</p>']
    if q["status"] == "answered":
        parts.append(q_by(q["answerer"], "Answered by"))
        parts.append(f'<p class="excerpt">{esc(q["answer"][0])}</p>')
        parts.append(f'<div class="q-foot"><span class="arrow-link">Read the answer</span><span>{len(q["comments"])} comment{"s" if len(q["comments"]) != 1 else ""}</span></div>')
    elif q["status"] == "answering":
        parts.append(q_by(q["answerer"], "Being answered by"))
        parts.append('<div class="q-foot"><span class="arrow-link">See the question</span></div>')
    else:
        parts.append('<div class="q-foot"><span class="arrow-link">See the question</span></div>')
    parts.append("</a>")
    return "".join(parts)


def q_page(q):
    n = q["n"]
    ns = [x["n"] for x in QUESTIONS]
    i = ns.index(n)
    prev_q = QUESTIONS[i - 1] if i > 0 else None
    next_q = QUESTIONS[i + 1] if i < len(QUESTIONS) - 1 else None
    meta = {"title": f'Question {n:03d}: {q["q"]}', "description": f'The First 100 Questions, {n:03d}/100: {q["q"]}', "nav": "questions"}
    if q["status"] == "answered":
        a = q["answerer"]
        video = (f'<button class="video" type="button" data-youtube="[VIDEO ID]" aria-label="Play the video answer"><!--sabha--><span class="play" aria-hidden="true"></span>'
                 f'<span class="cap"><span>Video answer · {esc(a["name"])}</span><span>Loads from YouTube on click</span></span></button>') if q.get("video") else ""
        paras = "".join(f"<p>{esc(p)}</p>" for p in q["answer"])
        answer = f"""
      <div class="answer-card">
        {q_by(a, "Answered by", "big")}
        <p class="small muted">{esc(a.get("bio", ""))}</p>
      </div>
      {video}
      <div class="stack" style="--gap:12px">
        <span class="eyebrow">{"The answer, in writing" if q.get("video") else "The answer"}</span>
        <div class="prose answer-text">{paras}</div>
        <p class="small muted">Answered on {esc(q.get("answered_on", "[DATE]"))}. <span class="sample-flag">Sample answer, written to test the layout</span></p>
      </div>"""
    elif q["status"] == "answering":
        a = q["answerer"]
        answer = f"""
      <div class="answer-card">
        {q_by(a, "Being answered by", "big")}
        <p class="small">The answer is being prepared{" as a video" if q.get("video") else ""}. It will appear here, and in the Weekly Dispatch, as soon as it's ready.</p>
      </div>"""
    else:
        answer = """
      <div class="answer-card waiting">
        <span class="eyebrow">Waiting for an answer</span>
        <p>We've published this question and are finding the right scholar or guest to answer it. Every one of the first 100 questions will be answered in public.</p>
      </div>"""
    comments = "".join(
        f'<li class="comment"><span class="avatar-ph">{initials(c["name"])}</span><div><b>{esc(c["name"])}</b> <span class="small muted">{esc(c.get("place", ""))}</span><p>{esc(c["text"])}</p></div></li>'
        for c in q["comments"]
    ) or '<li class="small muted">No comments yet. Start the conversation.</li>'
    sample_note = '<p class="small muted"><span class="sample-flag">Sample comments</span></p>' if q["comments"] else ""
    nav = ""
    if prev_q:
        nav += f'<a class="q-nav" href="{{{{root}}}}questions/{prev_q["n"]:03d}.html"><span class="eyebrow">← Previous</span><b>{esc(prev_q["q"])}</b></a>'
    else:
        nav += "<span></span>"
    if next_q:
        nav += f'<a class="q-nav next" href="{{{{root}}}}questions/{next_q["n"]:03d}.html"><span class="eyebrow">Next →</span><b>{esc(next_q["q"])}</b></a>'
    body = f"""
<section class="band-saffron">
  <div class="wrap page-hero" style="max-width:calc(900px + 2 * var(--gutter))">
    <nav class="crumbs" aria-label="Breadcrumb" style="color:var(--midnight)"><a href="{{{{root}}}}questions.html">The First 100 Questions</a><span>/</span><span>{n:03d}</span></nav>
    <div class="row" style="justify-content:space-between"><span class="q-big num">{n:03d}<small>/100</small></span><span class="status {q["status"]}" style="font-size:.9375rem">{Q_STATUS[q["status"]]}</span></div>
    <h1 style="font-size:clamp(2rem,5vw,3.6rem)">{esc(q["q"])}</h1>
    <p>Asked by {esc(q["asked_by"])} · {esc(q["theme"])}</p>
  </div>
</section>
<section class="section">
  <div class="wrap stack" style="--gap:36px;max-width:calc(900px + 2 * var(--gutter))">
    {answer}
    <div class="share" aria-label="Share this question"><a data-share="whatsapp" href="#">WhatsApp</a><a data-share="x" href="#">X</a><a data-share="linkedin" href="#">LinkedIn</a><button type="button" data-share="copy">Copy link</button></div>
  </div>
</section>
<section class="section band-sand" id="comments">
  <div class="wrap split" style="max-width:calc(1100px + 2 * var(--gutter))">
    <div class="stack" style="--gap:16px">
      <span class="eyebrow">Comments</span>
      <h2>{len(q["comments"])} comment{"s" if len(q["comments"]) != 1 else ""}</h2>
      <ul class="comments">{comments}</ul>
      {sample_note}
    </div>
    <div class="stack" style="--gap:14px">
      <span class="eyebrow">Add a comment</span>
      <form class="form js-form" data-kind="comment" novalidate>
        <div class="form-row">
          <div class="field"><label for="cm-name">Name</label><input id="cm-name" name="name" type="text" autocomplete="name" required></div>
          <div class="field"><label for="cm-city">City <span class="hint">(optional)</span></label><input id="cm-city" name="city" type="text"></div>
        </div>
        <div class="field"><label for="cm-text">Your comment</label><textarea id="cm-text" name="comment" maxlength="1000" required></textarea></div>
        <label class="check"><input type="checkbox" name="consent" required><span>Publish my comment with my name. I understand comments are reviewed before they appear. <a href="{{{{root}}}}privacy.html">Privacy</a></span></label>
        <div class="hp" aria-hidden="true"><label>Leave empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <button class="btn dark" type="submit" style="justify-self:start">Post comment</button>
        <p class="tiny muted">Disagree freely, argue kindly. Abuse, spam and personal attacks are removed.</p>
      </form>
    </div>
  </div>
</section>
<section class="section tight">
  <div class="wrap q-navs" style="max-width:calc(1100px + 2 * var(--gutter))">{nav}</div>
</section>
"""
    return meta, body


def render_tokens(body, root):
    home = root + "index.html"
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
    body = body.replace("{{qlist}}", "".join(q_item(q, root) for q in QUESTIONS))
    body = body.replace("{{qlatest}}", next(q_item(q, root) for q in QUESTIONS if q["status"] == "answered"))
    body = body.replace("{{qcount}}", str(len(QUESTIONS)))
    body = body.replace("{{qcount3}}", f"{len(QUESTIONS):03d}")
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
    header_logo = read_svg("hipl-lockup-horizontal-on-dark.svg").replace("<svg ", '<svg class="lockup" ', 1)
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
<link rel="icon" href="{root}assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="{root}assets/img/apple-touch-icon.png">
<link rel="stylesheet" href="{root}assets/fonts/fonts.css">
<link rel="stylesheet" href="{root}assets/css/site.css">
</head>
<body class="{body_class}" data-root="{root}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="{root}index.html" aria-label="HIPL home">{header_logo}</a>
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


def inline_assets(page, root):
    """Offline build: put CSS and JS inside each page, so a page opened on its own
    still looks right, and warn when it was opened from inside a zip file."""
    def read(*parts):
        with open(os.path.join(DIST, *parts), encoding="utf-8") as f:
            return f.read()
    fonts = read("assets", "fonts", "fonts.css").replace("url(", f"url({root}assets/fonts/")
    css = read("assets", "css", "site.css")
    js = [read("assets", "js", "data.js"), read("assets", "js", "site.js")]
    safe = lambda t: t.replace("</", "<\\/")
    page = page.replace(f'<link rel="stylesheet" href="{root}assets/fonts/fonts.css">', f"<style>{fonts}</style>")
    page = page.replace(f'<link rel="stylesheet" href="{root}assets/css/site.css">', f"<style>{css}</style>")
    page = page.replace(f'<script src="{root}assets/js/data.js"></script>', f"<script>{safe(js[0])}</script>")
    page = page.replace(f'<script src="{root}assets/js/site.js"></script>', f"<script>{safe(js[1])}</script>")
    note = (
        '<div id="zip-note" hidden style="background:#FFC93C;color:#14123A;padding:16px 20px;font:600 16px/1.5 sans-serif;border-bottom:3px solid #14123A">'
        "This page was opened from inside the zip file, so the other pages can't open from here. "
        "Close this window, right-click the zip file, choose <b>Extract All</b> (Windows) or double-click it (Mac), "
        "then open <b>Open HIPL website</b> in the extracted folder.</div>"
        f'<script>(function(){{var i=new Image();i.onerror=function(){{document.getElementById("zip-note").hidden=false}};i.src="{root}assets/brand/hipl-favicon.svg";}})();</script>'
    )
    return page.replace('<a class="skip" href="#main">Skip to content</a>', note + '<a class="skip" href="#main">Skip to content</a>', 1)


def main():
    preview = "--preview" in sys.argv
    offline = "--offline" in sys.argv
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
    for q in QUESTIONS:
        meta, body = q_page(q)
        pages.append((f"questions/{q['n']:03d}.html", meta, body))

    sitemap = []
    for rel, meta, body in pages:
        depth = rel.count("/")
        root = "../" * depth
        out = layout(meta, render_tokens(body, root), root, rel)
        if offline:
            out = inline_assets(out, root)
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
