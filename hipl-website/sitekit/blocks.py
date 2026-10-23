"""Render an Explorations entry from CMS blocks into the same interactive
markup the hand-built sample entries use, so site.js brings it to life."""

import html
import re

from . import md
from .schema import BLOCKS

ESC = lambda s: html.escape(str(s or ""), quote=True)
ACCENTS = ["#FFC93C", "#FF8A1F", "#FF6FA3"]


def deva_span(item, cls=""):
    if not item.get("deva"):
        return ""
    c = f' class="{cls}"' if cls else ""
    return f'<span{c} lang="sa">{ESC(item["deva"])}</span>'


def source_item(k, s, root):
    link = f' <a href="{ESC(s["url"])}" rel="noopener">link</a>' if s.get("url") else ""
    ver = ' <span class="verify">VERIFY</span>' if s.get("verify") else ""
    return f'<li id="src-{k + 1}"><span>{md.inline(s.get("text", ""), root)}{link}{ver}</span></li>'


def figcap(cap):
    return f'<figcaption class="small muted">{ESC(cap)}</figcaption>' if cap else ""


def claim(kind):
    return f'<span class="claim" data-kind="{kind}"></span>' if kind in md.CLAIM_KINDS else ""


def youtube_id(v):
    v = (v or "").strip()
    m = re.search(r"(?:v=|youtu\.be/|embed/|shorts/)([\w-]{6,})", v)
    return m.group(1) if m else v


class Ctx:
    def __init__(self, root, entry):
        self.root = root
        self.entry = entry
        self.chapter = 0
        self.scene = 0
        self.toc = []

    def md(self, text):
        return md.render(text, self.root)

    def il(self, text):
        return md.inline(text, self.root)


def kcards(cards, ctx, label):
    items = []
    n = len(cards)
    for i, c in enumerate(cards):
        deva = f'<span lang="sa" class="deva">{ESC(c.get("deva"))}</span>' if c.get("deva") else ""
        src = f'<p class="tiny" style="opacity:.75">{ESC(c.get("source"))}</p>' if c.get("source") else ""
        items.append(
            f'<article class="kcard"><div class="k-n"><span>{ESC(c.get("kicker") or label)} · {i + 1}/{n}</span>{deva}</div>'
            f'<h4>{ESC(c.get("title"))}</h4><div><p>{ESC(md.plain(c.get("text")))}</p>{src}</div></article>'
        )
    return (
        f'<div class="kcards"><div class="kcards-track" tabindex="0" aria-label="{ESC(label)}">{"".join(items)}</div>'
        '<div class="kcards-nav"><div class="row" style="--gap:8px"><button class="icon-btn" type="button" data-k="prev" aria-label="Previous card">←</button>'
        '<button class="icon-btn" type="button" data-k="next" aria-label="Next card">→</button>'
        f'<span class="small muted k-pos" aria-live="polite">Card 1 of {n}</span></div>'
        '<button class="btn small ghost" type="button" data-k="save">Save card as image</button></div></div>'
    )


def render_block(b, i, ctx):
    t = b.get("type")
    bid = f"b{i}"
    if t == "hook":
        ctx.toc.append((bid, "The question"))
        return f'<div class="block" id="{bid}"><span class="eyebrow">The question</span><div class="hook-block">{md.inline(md.plain(b.get("text")), ctx.root)}</div></div>'
    if t == "context":
        ctx.toc.append((bid, "Context"))
        return f'<div class="block" id="{bid}"><span class="eyebrow">Context</span><div class="prose">{ctx.md(b.get("body"))}</div></div>'
    if t == "chapter":
        ctx.chapter += 1
        n = ctx.chapter
        ctx.toc.append((bid, f"{n}. {b.get('title', '')}"))
        c = claim(b.get("claim"))
        return (f'<div class="block" id="{bid}"><div class="chapter-head"><span class="chapter-n">{n:02d}</span><h2>{ESC(b.get("title"))}</h2></div>'
                f'<div class="prose">{f"<p>{c}</p>" if c else ""}{ctx.md(b.get("body"))}</div></div>')
    if t == "pull_quote":
        src, tr = b.get("source", ""), b.get("translator", "")
        ok = bool(src.strip())
        cite = " — ".join(x for x in [src, f"trans. {tr}" if tr else ""] if x) or "[Source required before publishing]"
        ver = ' <span class="verify">VERIFY</span>' if b.get("verify") or not ok else ""
        return (f'<figure class="pull{" placeholder" if not ok else ""} block" id="{bid}" style="margin:0" data-share-card data-share-kicker="{ESC(ctx.entry.get("title"))}" data-share-title="{ESC(md.plain(b.get("text"), 220))}" data-share-body="{ESC(src)}">'
                f'<p>{ctx.il(md.plain(b.get("text")))}</p><cite>{ESC(cite)}{ver}</cite></figure>')
    if t == "knowledge_cards":
        title = b.get("title") or "Knowledge cards"
        ctx.toc.append((bid, title))
        return f'<div class="block" id="{bid}"><span class="eyebrow">{ESC(title)}</span>{kcards(b.get("cards") or [], ctx, title)}</div>'
    if t == "meaning_layers":
        layers = b.get("layers") or []
        ctx.toc.append((bid, f"Meanings of {b.get('term', '')}"))
        tabs, panels = [], []
        for j, L in enumerate(layers):
            tabs.append(f'<button role="tab" id="{bid}t{j}" aria-controls="{bid}p{j}" aria-selected="{"true" if j == 0 else "false"}"><span>{j + 1}</span>{ESC(L.get("label"))}</button>')
            panels.append(f'<div class="layers-panel" role="tabpanel" id="{bid}p{j}" aria-labelledby="{bid}t{j}"{"" if j == 0 else " hidden"}><span class="eyebrow">{ESC(L.get("eyebrow"))}</span><h4>{ESC(L.get("title"))}</h4>{ctx.md(L.get("text"))}</div>')
        rings = "".join(f'<circle cx="110" cy="110" r="{20 * (k + 1)}"/>' for k in range(min(len(layers), 5)))
        return (f'<div class="block" id="{bid}"><span class="eyebrow">Meaning layers · tap through</span><div class="layers">'
                f'<div class="layers-tabs" role="tablist" aria-label="Layers of meaning of {ESC(b.get("term"))}">{"".join(tabs)}</div>'
                f'<div style="position:relative;min-width:0"><svg class="layers-rings" viewBox="0 0 220 220" aria-hidden="true">{rings}</svg>{"".join(panels)}</div></div></div>')
    if t == "scenarios":
        items = b.get("items") or []
        title = b.get("title") or "Everyday scenarios"
        ctx.toc.append((bid, title))
        tabs, panels = [], []
        for j, it in enumerate(items):
            tabs.append(f'<button role="tab" id="{bid}t{j}" aria-controls="{bid}p{j}" aria-selected="{"true" if j == 0 else "false"}">{ESC(it.get("tab"))}</button>')
            persp = "".join(f'<div class="persp"><h4>{ESC(p.get("title"))}</h4>{ctx.md(p.get("text"))}{claim(p.get("claim"))}</div>' for p in it.get("perspectives") or [])
            panels.append(f'<div role="tabpanel" id="{bid}p{j}" aria-labelledby="{bid}t{j}" class="stack" style="--gap:14px"{"" if j == 0 else " hidden"}><p class="scenario">{ctx.il(md.plain(it.get("scenario")))}</p><div class="perspectives">{persp}</div></div>')
        return (f'<div class="block" id="{bid}"><span class="eyebrow">Interactive · scenarios</span><h2>{ESC(title)}</h2>'
                f'<div class="dilemma on-dark" style="gap:18px"><div class="scenario-tabs" role="tablist" aria-label="Scenarios">{"".join(tabs)}</div>{"".join(panels)}</div></div>')
    if t == "dilemma":
        opts = b.get("options") or []
        title = b.get("title") or "What would you do?"
        ctx.toc.append((bid, title))
        btns = "".join(f'<button type="button" data-base="0"><span>{ESC(o.get("label"))}</span><span class="share-bar"><i></i></span><span class="pct"></span></button>' for o in opts)
        persp = "".join(f'<div class="persp" data-opt="{j}" hidden><h4>{ESC(o.get("perspective_title") or o.get("label"))}</h4>{ctx.md(o.get("perspective"))}{claim(o.get("claim"))}</div>' for j, o in enumerate(opts))
        fallback = "".join(f"<p><b>{ESC(o.get('label'))}.</b> {ESC(md.plain(o.get('perspective')))}</p>" for o in opts)
        return (f'<div class="block" id="{bid}"><div class="dilemma on-dark" data-id="{ESC(ctx.entry.get("slug"))}-{bid}"><span class="eyebrow">{ESC(title)}</span>'
                f'<p class="scenario">{ctx.il(md.plain(b.get("scenario")))}</p><div class="options">{btns}</div>'
                '<p class="small muted">No score and no correct answer. After you choose, you\'ll see a perspective on every option and what share of readers chose each.</p>'
                f'<div class="perspectives">{persp}</div><button class="btn small ghost after-choice" type="button" data-share-choice hidden>Share my choice</button></div>'
                f'<details class="fallback" style="margin-top:12px"><summary>Text version of this interactive</summary><div class="prose small"><p><b>Scenario:</b> {ESC(md.plain(b.get("scenario")))}</p>{fallback}</div></details></div>')
    if t == "compare":
        cols = b.get("columns") or []
        rows = b.get("rows") or []
        title = b.get("title") or "Compare"
        ctx.toc.append((bid, title))
        head = "".join(f'<th scope="col">{ESC(c.get("name"))}{deva_span(c)}</th>' for c in cols)
        body = ""
        cells_by_row = []
        for r in rows:
            cells = [x.strip() for x in (r.get("cells") or "").split("|")]
            cells += [""] * (len(cols) - len(cells))
            cells_by_row.append(cells)
            body += f'<tr><th scope="row">{ESC(r.get("label"))}</th>{"".join(f"<td>{ESC(x)}</td>" for x in cells[:len(cols)])}</tr>'
        cards = ""
        for ci, c in enumerate(cols):
            dl = "".join(f"<dt>{ESC(r.get('label'))}</dt><dd>{ESC(cells_by_row[ri][ci])}</dd>" for ri, r in enumerate(rows))
            cards += f'<article><h3>{ESC(c.get("name"))}</h3><dl>{dl}</dl></article>'
        return (f'<div class="block" id="{bid}"><span class="eyebrow">Compare cards</span><h2>{ESC(title)}</h2>'
                f'<div class="compare-wrap"><table class="compare"><caption class="sr-only">{ESC(title)}</caption><thead><tr><th scope="col"><span class="sr-only">Row</span></th>{head}</tr></thead><tbody>{body}</tbody></table></div>'
                f'<div class="compare-cards" aria-label="Swipe through the comparison">{cards}</div></div>')
    if t == "characters":
        chars = b.get("characters") or []
        title = b.get("title") or "The cast"
        ctx.toc.append((bid, title))
        cards = ""
        for j, c in enumerate(chars):
            acc = ACCENTS[j % 3]
            cards += (f'<button class="char" type="button" aria-expanded="false" style="--accent:{acc}"><span class="face"><canvas data-face="{j + 1}" data-accent="{acc}" aria-hidden="true"></canvas></span>'
                      f'<span class="who"><b>{ESC(c.get("name"))}</b>{deva_span(c, "deva")}'
                      f'<span class="tiny" style="color:var(--on-dark-muted)">{ESC(c.get("role"))}</span></span><span class="more" hidden>{ESC(md.plain(c.get("text")))}</span></button>')
        return f'<div class="block" id="{bid}"><span class="eyebrow">{ESC(title)} · tap a card</span><div class="chars on-dark">{cards}</div></div>'
    if t == "scene":
        ctx.scene += 1
        ctx.toc.append((bid, f"{ctx.scene}. {b.get('title', '')}"))
        if b.get("image"):
            art = f'<img src="{ESC(md._link(b["image"], ctx.root))}" alt="{ESC(b.get("alt"))}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">'
        else:
            art = f'<canvas data-scene="{ESC(b.get("art") or ((ctx.scene - 1) % 6 + 1))}" aria-hidden="true"></canvas>'
        pause = f'<div class="pause"><b>Pause and think</b><p>{ESC(b.get("pause"))}</p></div>' if b.get("pause") else ""
        return (f'<article class="scene" id="{bid}"><div class="scene-art">{art}<span class="scene-n">Scene {ctx.scene}</span></div>'
                f'<div class="scene-text"><h3>{ESC(b.get("title"))}</h3>{ctx.md(b.get("text"))}</div></article>{pause}')
    if t == "map":
        pts = b.get("points") or []
        title = b.get("title") or "Explore the map"
        ctx.toc.append((bid, title))
        btns, off, tpls, rows = "", "", "", ""
        for j, p in enumerate(pts):
            tid = f"{bid}m{j}"
            if p.get("on_map", True) and p.get("lat") not in (None, "") and p.get("lon") not in (None, ""):
                btns += f'<button class="map-pt" type="button" data-lat="{ESC(p.get("lat"))}" data-lon="{ESC(p.get("lon"))}" data-label="{ESC(p.get("label") or p.get("region"))}" data-card="{tid}" aria-label="{ESC(p.get("title"))}, {ESC(p.get("region"))}"></button>'
            else:
                off += f'<button type="button" data-card="{tid}">{ESC(p.get("title"))} · {ESC(p.get("region"))}</button>'
            tpls += (f'<template id="{tid}"><span class="eyebrow">{ESC(p.get("region"))}</span><h4>{ESC(p.get("title"))}</h4><dl>'
                     f'<dt>Author</dt><dd>{ESC(p.get("author") or "—")}</dd><dt>Period</dt><dd>{ESC(p.get("period") or "—")}</dd>'
                     f'<dt>How it differs</dt><dd>{ESC(md.plain(p.get("differs")))}</dd></dl>{claim(p.get("claim"))}</template>')
            rows += f'<tr><td>{ESC(p.get("title"))}</td><td>{ESC(p.get("region"))}</td><td>{ESC(md.plain(p.get("differs")))}</td></tr>'
        offrow = f'<div class="offmap"><span>Across regions:</span>{off}</div>' if off else ""
        return (f'<div class="block" id="{bid}"><span class="eyebrow">Explore the map · tap a point</span><h2>{ESC(title)}</h2>{ctx.md(b.get("intro"))}'
                f'<div class="map"><div class="map-canvas"><canvas aria-hidden="true"></canvas>{btns}</div>'
                f'<div class="map-side" aria-live="polite"><span class="eyebrow">Tap a point on the map</span><h4>{ESC(title)}</h4><p class="small">Each point opens a card.</p></div>{offrow}</div>'
                f'<p class="tiny muted">Map is schematic.</p>{tpls}'
                f'<details class="fallback"><summary>Text version of the map</summary><div class="table-wrap"><table><thead><tr><th>Item</th><th>Region</th><th>Note</th></tr></thead><tbody>{rows}</tbody></table></div></details></div>')
    if t == "timeline":
        title = b.get("title") or "Timeline"
        ctx.toc.append((bid, title))
        evs = "".join(f'<div class="tl-item{" debated" if e.get("confidence") == "debated" else ""}"><span class="when">{ESC(e.get("when"))}</span>'
                      f'<span class="conf">{ESC(e.get("confidence") or "")}</span><b>{ESC(e.get("label"))}</b>{ctx.md(e.get("text"))}{claim(e.get("claim"))}</div>'
                      for e in b.get("events") or [])
        return f'<div class="block" id="{bid}"><span class="eyebrow">Timeline</span><h2>{ESC(title)}</h2><div class="timeline">{evs}</div></div>'
    if t == "poll":
        ctx.toc.append((bid, "Your turn"))
        opts = "".join(f'<button type="button" data-base="0"><span class="fill"></span><span>{ESC(o.get("label"))}</span><span class="pct"></span></button>' for o in b.get("options") or [])
        return (f'<div class="block" id="{bid}"><div class="poll" data-id="{ESC(ctx.entry.get("slug"))}-{bid}"><span class="eyebrow">Your turn</span><h4>{ESC(b.get("question"))}</h4>'
                f'<div class="poll-opts">{opts}</div><p class="note">Anonymous. Results appear after you vote.</p></div></div>')
    if t == "interpretations":
        title = b.get("title") or "How different traditions read this"
        ctx.toc.append((bid, title))
        items = "".join(f'<div class="persp"><h4>{ESC(x.get("title"))}</h4>{ctx.md(x.get("text"))}{claim(x.get("claim"))}</div>' for x in b.get("items") or [])
        return f'<div class="block" id="{bid}"><span class="eyebrow">Interpretations</span><h2>{ESC(title)}</h2><div class="grid" style="--cols:2">{items}</div></div>'
    if t == "why":
        ctx.toc.append((bid, "Why it matters today"))
        return (f'<div class="block" id="{bid}"><div class="why on-dark"><span class="eyebrow">Why it matters today</span><h2>{ESC(b.get("title"))}</h2>'
                f'<div class="muted" style="max-width:var(--read)">{ctx.md(b.get("text"))}</div></div></div>')
    if t == "image":
        if not b.get("src"):
            return ""
        cap = " · ".join(x for x in [b.get("caption"), b.get("credit")] if x)
        return (f'<figure class="block" id="{bid}" style="margin:0"><img src="{ESC(md._link(b["src"], ctx.root))}" alt="{ESC(b.get("alt"))}" loading="lazy">'
                f'{figcap(cap)}</figure>')
    if t == "video":
        vid = youtube_id(b.get("youtube"))
        return (f'<div class="block" id="{bid}"><button class="video" type="button" data-youtube="{ESC(vid or "[VIDEO ID]")}" aria-label="Play video">'
                f'<span class="play" aria-hidden="true"></span><span class="cap"><span>{ESC(b.get("caption"))}</span><span>Loads from YouTube on click</span></span></button></div>')
    if t == "callout":
        return f'<div class="notice block" id="{bid}"><b>{ESC(b.get("title"))}</b><div>{ctx.md(b.get("text"))}</div></div>'
    if t == "text":
        if b.get("title"):
            ctx.toc.append((bid, b["title"]))
        h = f'<h2>{ESC(b.get("title"))}</h2>' if b.get("title") else ""
        return f'<div class="block" id="{bid}">{h}<div class="prose">{ctx.md(b.get("body"))}</div></div>'
    return ""


def validate(entry):
    """Problems an editor must fix before an entry can be published."""
    problems = []
    for i, b in enumerate(entry.get("blocks") or []):
        if b.get("type") not in BLOCKS:
            problems.append(f"Block {i + 1}: unknown type {b.get('type')!r}")
        if b.get("type") == "pull_quote" and not (b.get("source") or "").strip():
            problems.append(f"Block {i + 1}: pull quote has no source")
        if b.get("type") == "image" and b.get("src") and not (b.get("alt") or "").strip():
            problems.append(f"Block {i + 1}: image has no description (alt text)")
    text = repr(entry)
    if "VERIFY" in text:
        problems.append("Contains VERIFY markers that a fact-checker must clear")
    if not entry.get("sources"):
        problems.append("No sources listed")
    return problems


def render_entry(entry, series, root, xcards, types, preview=False, next_entry=None):
    """Full page body for a block-built entry."""
    ctx = Ctx(root, entry)
    blocks_html = "".join(render_block(b, i, ctx) for i, b in enumerate(entry.get("blocks") or []))
    is_story = entry.get("type") == "story"
    toc = "".join(f'<a href="#{a}">{ESC(t)}</a>' for a, t in ctx.toc)
    toc += '<a href="#sources">Sources</a>'
    sources = "".join(source_item(k, s, root) for k, s in enumerate(entry.get("sources") or [])) \
        or '<li><span class="ph">[Sources to be added before publishing]</span></li>'
    status = entry.get("status", "draft")
    notice = ""
    if status != "published":
        notice = (f'<div class="notice"><b>{"Preview · " if preview else ""}Status: {ESC(status.replace("-", " ").capitalize())}</b>'
                  '<span>Not yet published. Text marked <span class="verify">VERIFY</span> must be checked against the named edition and translation.</span></div>')
    cover = (f'<img src="{ESC(md._link(entry["cover_image"], root))}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">'
             if entry.get("cover_image") else f'<canvas data-art="{entry.get("n", 0)}" aria-hidden="true"></canvas>')
    related = xcards(entry.get("related") or []) if entry.get("related") else ""
    nxt = ""
    if next_entry:
        nxt = (f'<a class="next-card" href="{root}explorations/{next_entry["series"]}/{next_entry["slug"]}.html"><div class="stack" style="--gap:6px">'
               f'<span class="eyebrow" style="color:var(--midnight)">Next in this series</span><h3>{ESC(next_entry["title"])}</h3></div><span class="big" aria-hidden="true">→</span></a>')
    accent_tag = {"hindu-universe": "saffron", "stories-that-stay": "marigold", "ancient-ideas-modern-life": "lotus"}.get(entry.get("series"), "saffron")
    main = f"""
<section class="section">
  <div class="wrap entry-body">
    <nav class="toc" aria-label="Jump to section"><b>Jump to</b>{toc}</nav>
    <div class="entry-main">
      {notice}
      {blocks_html}
      <div class="block" id="sources">
        <span class="eyebrow">Go deeper</span><h2>Sources</h2>
        <ol class="sources">{sources}</ol>
        {f'<div class="stack" style="--gap:12px"><b>Keep exploring</b><div class="grid" style="--cols:3">{related}</div></div>' if related else ""}
        <div class="row" style="justify-content:space-between;gap:14px">
          <div class="share" aria-label="Share this entry"><a data-share="whatsapp" href="#">WhatsApp</a><a data-share="x" href="#">X</a><a data-share="linkedin" href="#">LinkedIn</a><button type="button" data-share="copy">Copy link</button><button type="button" data-share="native" hidden>Share…</button></div>
          <a class="small" href="{root}corrections.html#report">Suggest a correction</a>
        </div>
        {nxt}
      </div>
    </div>
  </div>
</section>"""
    if is_story:
        main = f'<div class="story on-dark">{main}</div>'
    return f"""<div class="series-{ESC(entry.get('series'))}">
<section class="entry-cover on-dark">
  <div class="wrap">
    <div class="stack" style="--gap:22px">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="{root}explorations.html">Explorations</a><span>/</span><a href="{root}explorations/{ESC(entry.get('series'))}.html">{ESC(series['name'])}</a><span>/</span><span>{int(entry.get('n') or 0):02d}</span></nav>
      <div class="entry-meta"><span class="tag {accent_tag}">{ESC(series['name'])} · {int(entry.get('n') or 0):02d}</span><span class="tag chalk">{ESC(types.get(entry.get('type'), ''))}</span><span class="tag outline">{ESC(entry.get('read'))} min</span><span class="tag outline">{ESC(entry.get('level'))}</span>{'' if status == 'published' else '<span class="sample-flag">' + ESC(status.replace('-', ' ')) + '</span>'}</div>
      <h1>{ESC(entry.get('title'))}</h1>
      <p class="hook">{md.inline(md.plain(entry.get('hook')), root)}</p>
    </div>
    <div class="art">{cover}</div>
  </div>
</section>
<div class="read-progress" aria-hidden="true"><span></span></div>
{main}
<button class="btn {'dark' if not is_story else ''} toc-sheet-btn" type="button" aria-expanded="false">Sections</button>
</div>"""
