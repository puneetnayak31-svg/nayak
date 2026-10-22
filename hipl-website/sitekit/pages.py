"""Data-driven sections and pages: events, In Person, team, interviews,
Voices, the Dispatch and the Reading Circle. Everything here is edited in
the CMS and rendered by build.py."""

import datetime as dt
import html
import urllib.parse

from . import md

ESC = lambda s: html.escape(str(s if s is not None else ""), quote=True)
KIND_LABEL = {
    "launch": "Launch", "dialogue": "HIPL Dialogues", "salon": "HIPL Salon", "heritage-walk": "Heritage Walk",
    "seva": "Seva Saturday", "culture-night": "Culture Night", "campus": "Campus Circle", "reading-circle": "Reading Circle",
}
KIND_COLOR = {"launch": "saffron", "dialogue": "saffron", "salon": "lotus", "heritage-walk": "marigold",
              "seva": "chalk", "culture-night": "lotus", "campus": "marigold", "reading-circle": "marigold"}
SAMPLE_FLAG = '<span class="sample-flag">Sample</span>'
VISIBLE = {"published", "sample", "upcoming", "planned", "past", "current", "active", "starting", "coming"}


def initials(name):
    name = name or ""
    return "?" if not name or name.startswith("[") else "".join(w[0] for w in name.split()[:2]).upper()


def avatar(person, size=64):
    if person.get("photo"):
        return f'<img class="avatar-img" src="{ESC(person["photo"])}" alt="" style="width:{size}px;height:{size}px">'
    return f'<span class="avatar-ph" style="width:{size}px;height:{size}px">{initials(person.get("name"))}</span>'


# ---------------------------------------------------------------- events

def parse_date(e):
    try:
        d = dt.date.fromisoformat(e.get("date") or "")
    except ValueError:
        return None
    return d


def date_long(e):
    d = parse_date(e)
    if not d:
        return e.get("date_label") or "Date to be announced"
    return f"{d:%A} {d.day} {d:%B %Y}"


def iso_start(e):
    d = parse_date(e)
    if not d:
        return ""
    t = e.get("start") or "18:00"
    return f"{d.isoformat()}T{t}:00+05:30"


def gcal_link(e, site_url):
    d = parse_date(e)
    if not d:
        return ""
    hh, mm = (e.get("start") or "18:00").split(":")
    start = dt.datetime(d.year, d.month, d.day, int(hh), int(mm))
    end = start + dt.timedelta(hours=3)
    q = {
        "action": "TEMPLATE", "text": e["title"],
        "dates": f"{start:%Y%m%dT%H%M%S}/{end:%Y%m%dT%H%M%S}", "ctz": "Asia/Kolkata",
        "details": md.plain(e.get("description"), 400) + f"\n{site_url}/events/{e['slug']}",
        "location": ", ".join(x for x in [e.get("venue"), e.get("address") or e.get("city")] if x),
    }
    return "https://calendar.google.com/calendar/render?" + urllib.parse.urlencode(q)


def sorted_events(events, kinds=None):
    vis = [e for e in events if e.get("status") in VISIBLE and (not kinds or e.get("kind") in kinds)]
    return sorted(vis, key=lambda e: (e.get("status") == "past", e.get("date") or "9999", e.get("title")))


def event_url(e, root):
    return f"{root}events/{e['slug']}.html"


def event_card(e, root, dark=False):
    color = KIND_COLOR.get(e.get("kind"), "saffron")
    label = KIND_LABEL.get(e.get("kind"), "Event")
    if e.get("dialogue_number"):
        label = f"Dialogue {int(e['dialogue_number']):02d}" + (" · Launch" if e.get("kind") == "launch" else "")
    when = date_long(e) + (f" · {e['time_label']}" if e.get("time_label") else "")
    where = ", ".join(x for x in [e.get("venue"), e.get("city")] if x)
    cd = f' data-countdown="{iso_start(e)}"' if iso_start(e) and e.get("status") == "upcoming" else ""
    return (
        f'<a class="card linked ev-card{" dark" if dark else ""}" href="{event_url(e, root)}" data-kind="{ESC(e.get("kind"))}">'
        f'<div class="row" style="justify-content:space-between"><span class="tag {color}">{ESC(label)}</span><span class="small countdown"{cd}></span></div>'
        f'<h3>{ESC(e["title"])}</h3>'
        f'<p class="small{" muted" if not dark else ""}">{ESC(when)}<br>{ESC(where)}</p>'
        f'<span class="arrow-link" style="justify-self:start">{"RSVP and details" if e.get("rsvp") and e.get("status") == "upcoming" else "Details"}</span></a>'
    )


def date_block(e):
    d = parse_date(e)
    if not d:
        return f'<div class="date-block"><span>{ESC(e.get("date_label") or "Date to be announced")}</span></div>'
    return (f'<div class="date-block" aria-label="{ESC(date_long(e))}"><span>{d:%A}</span>'
            f'<b>{d.day}</b><span>{d:%B %Y}</span></div>')


def vote_bars(e):
    b, a = e.get("vote_before") or {}, e.get("vote_after") or {}
    if not sum(b.values() or [0]) or not sum(a.values() or [0]):
        return ""
    out = ""
    for label, v in (("Before", b), ("After", a)):
        tot = sum(v.values()) or 1
        pf, pa, pu = (round(v.get(k, 0) * 100 / tot) for k in ("for", "against", "undecided"))
        out += (f'<p class="tiny muted">{label}</p><div class="vote-bar" aria-label="{label}: {pf}% for, {pu}% undecided, {pa}% against">'
                f'<span class="agree" style="flex-basis:{pf}%">{pf}%</span><span class="unsure" style="flex-basis:{pu}%">{pu}%</span>'
                f'<span class="disagree" style="flex-basis:{pa}%">{pa}%</span></div>')
    return out + '<div class="legend"><span><i style="background:var(--saffron)"></i>For</span><span><i style="background:var(--chalk);box-shadow:inset 0 0 0 1px var(--midnight)"></i>Undecided</span><span><i style="background:var(--lotus)"></i>Against</span></div>'


def event_page(e, root, site, partners):
    title = e["title"]
    label = KIND_LABEL.get(e.get("kind"), "Event")
    if e.get("dialogue_number"):
        label = f"HIPL Dialogues · {int(e['dialogue_number']):02d}"
    upcoming = e.get("status") == "upcoming"
    cd = f'<p class="countdown big" data-countdown="{iso_start(e)}"></p>' if upcoming and iso_start(e) else ""
    company = " · ".join(ESC(c) for c in e.get("company") or [])
    gcal = gcal_link(e, site.get("site_url", ""))
    cal_btns = ""
    if gcal and upcoming:
        cal_btns = (f'<a class="btn ghost" href="{ESC(gcal)}" target="_blank" rel="noopener">Add to Google Calendar</a>'
                    f'<button class="btn ghost" type="button" data-ics data-title="{ESC(title)}" data-start="{iso_start(e)}" '
                    f'data-location="{ESC(", ".join(x for x in [e.get("venue"), e.get("address") or e.get("city")] if x))}" '
                    f'data-details="{ESC(md.plain(e.get("description"), 300))}" data-slug="{ESC(e["slug"])}">Download calendar file</button>')
    share_card = (f' data-share-card data-share-kicker="{ESC(label)}" data-share-title="{ESC(title)}" '
                  f'data-share-body="{ESC(date_long(e) + " · " + (e.get("time_label") or "") + " · " + (e.get("venue") or ""))}" data-share-theme="midnight"')
    rsvp_btn = '<a class="btn" href="#rsvp">RSVP</a>' if e.get("rsvp") and upcoming else ""

    motion = ""
    if e.get("motion"):
        host = ""
        if e.get("hosted_by"):
            p = next((x for x in partners if x.get("name") == e["hosted_by"]), {})
            logo = f'<img src="{ESC(p["logo"])}" alt="{ESC(p["name"])}" style="height:34px">' if p.get("logo") else f'<span class="partner-badge">{ESC(e["hosted_by"])}</span>'
            host = f'<div class="row" style="--gap:10px"><span class="tiny muted" style="letter-spacing:.16em;text-transform:uppercase">Debate hosted by</span>{logo}</div>'
        poll = (f'<div class="poll" data-id="{ESC(e["slug"])}-before"><h4>Where do you stand before the debate?</h4><div class="poll-opts">'
                '<button type="button" data-base="0"><span class="fill"></span><span>For the motion</span><span class="pct"></span></button>'
                '<button type="button" data-base="0"><span class="fill"></span><span>Against the motion</span><span class="pct"></span></button>'
                '<button type="button" data-base="0"><span class="fill"></span><span>Undecided</span><span class="pct"></span></button></div>'
                '<p class="note">Anonymous. The room votes again at the end; we publish both results.</p></div>') if upcoming else ""
        motion = f"""
<section class="section band-sand" id="motion">
  <div class="wrap split rev">
    <div class="motion-card" data-share-card data-share-kicker="The motion · {ESC(label)}" data-share-title="“{ESC(e['motion'])}”" data-share-body="{ESC(date_long(e))} · {ESC(e.get('venue'))}" data-share-theme="saffron">
      <span class="tag">The motion</span>
      <p class="motion-text">“{ESC(e['motion'])}”</p>
      {host}
      <button class="btn small dark" type="button" data-share-this>Share the motion</button>
    </div>
    <div class="stack" style="--gap:18px">
      <span class="eyebrow">The debate</span>
      <h2>Two sides. One motion. The room decides.</h2>
      <p>An Oxford-style debate: speakers for and against the motion, a moderator, questions from the floor, and a vote before and after. We announce the shift, not a winner.</p>
      {poll}
    </div>
  </div>
</section>"""

    speakers = ""
    sp = e.get("speakers") or []
    if sp:
        def side(name, key, color):
            people = "".join(f'<div class="speaker">{avatar(p)}<div><b>{ESC(p["name"])}</b><p class="small muted">{ESC(p.get("role"))}</p></div></div>' for p in sp if p.get("side") == key)
            return f'<div class="card" style="gap:14px"><span class="tag {color}" style="justify-self:start">{name}</span>{people}</div>' if people else ""
        speakers = f"""
<section class="section">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">Speakers</span><h2>Who's arguing</h2></div><span class="sample-flag">Speakers announced soon</span></div>
    <div class="grid" style="--cols:2">{side("For the motion", "proposition", "saffron")}{side("Against the motion", "opposition", "lotus")}</div>
    {f'<div class="speaker" style="margin-top:20px">{avatar({"name": e.get("moderator")})}<div><b>Moderator: {ESC(e.get("moderator"))}</b></div></div>' if e.get("moderator") else ""}
  </div>
</section>"""

    brief = ""
    if e.get("brief"):
        brief = f"""
<section class="section">
  <div class="wrap split">
    <div class="stack" style="--gap:12px"><span class="eyebrow">Background brief</span><h2>What's being argued, in two minutes.</h2><p class="small muted">A draft brief; the reading list is added before the evening.</p></div>
    <div class="prose">{md.render(e['brief'], root)}</div>
  </div>
</section>"""

    watch_video = ""
    if e.get("video_id") or e.get("status") == "past" or e.get("dialogue_number"):
        vid = e.get("video_id") or "[VIDEO ID]"
        moments = "".join(f'<li style="grid-template-columns:72px minmax(0,1fr)"><div><b>{ESC(m.get("time"))} {ESC(m.get("label"))}</b>{ESC(m.get("text"))}</div></li>' for m in e.get("key_moments") or [])
        votes = vote_bars(e)
        summary = md.render(e.get("summary"), root) if e.get("summary") else ""
        note = "" if e.get("video_id") else '<p class="small muted">The full recording, with captions, appears here after the event.</p>'
        watch_video = f"""
<section class="section band-dark on-dark" id="watch">
  <div class="wrap split rev">
    <div class="stack" style="--gap:20px">
      <button class="video" type="button" data-youtube="{ESC(vid)}" aria-label="Play the recording of {ESC(title)}"><span class="play" aria-hidden="true"></span><span class="cap"><span>Full recording{' · uploaded after the event' if not e.get('video_id') else ''}</span><span>Loads from YouTube on click</span></span></button>
      {f'<ol class="steps" style="counter-reset:none">{moments}</ol>' if moments else ''}
      {f'<details class="fallback"><summary>Read the full transcript</summary><div class="prose small">{md.render(e.get("transcript"), root)}</div></details>' if e.get("transcript") else ''}
    </div>
    <div class="stack" style="--gap:16px">
      <span class="eyebrow">Watch</span>
      <h2>{'The whole evening, on video.' if e.get('video_id') else 'The recording will be here.'}</h2>
      {note}
      {votes}
      {f'<div class="notice"><b>Summary</b><div>{summary}</div></div>' if summary else ''}
    </div>
  </div>
</section>"""

    rsvp = ""
    if e.get("rsvp") and upcoming:
        qbox = ""
        if e.get("motion"):
            qbox = f"""
    <div class="stack" style="--gap:18px" id="ask">
      <span class="eyebrow">Question box</span>
      <h2>Ask the speakers</h2>
      <form class="form js-form" data-kind="dialogue-question" novalidate>
        <input type="hidden" name="event" value="{ESC(e['slug'])}">
        <div class="field"><label for="dq-q">Your question</label><textarea id="dq-q" name="question" required></textarea></div>
        <div class="field"><label for="dq-side">For</label><select id="dq-side" name="side"><option value="both">Both sides</option><option value="for">For the motion</option><option value="against">Against the motion</option></select></div>
        <div class="field"><label for="dq-name">Name <span class="hint">(optional)</span></label><input id="dq-name" name="name" type="text"></div>
        <label class="check"><input type="checkbox" name="consent" required><span>HIPL may read my question aloud and include it in the summary.</span></label>
        <div class="hp" aria-hidden="true"><label>Leave empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <button class="btn dark" type="submit" style="justify-self:start">Send question</button>
      </form>
    </div>"""
        rsvp = f"""
<section class="section band-sand">
  <div class="wrap split even">
    <div class="stack" id="rsvp" style="--gap:18px">
      <span class="eyebrow">RSVP</span>
      <h2>Save your seat</h2>
      <form class="form js-form" data-kind="rsvp" novalidate>
        <input type="hidden" name="event" value="{ESC(e['slug'])}">
        <div class="form-row">
          <div class="field"><label for="r-name">Name</label><input id="r-name" name="name" type="text" autocomplete="name" required></div>
          <div class="field"><label for="r-email">Email</label><input id="r-email" name="email" type="email" autocomplete="email" required></div>
        </div>
        <div class="form-row">
          <div class="field"><label for="r-phone">Phone <span class="hint">(optional, for day-of updates)</span></label><input id="r-phone" name="phone" type="tel" autocomplete="tel"></div>
          <div class="field"><label for="r-seats">Seats</label><select id="r-seats" name="seats"><option>1</option><option>2</option></select></div>
        </div>
        <div class="field"><label for="r-org">College or organisation <span class="hint">(optional)</span></label><input id="r-org" name="organisation" type="text"></div>
        <label class="check"><input type="checkbox" name="consent" required><span>Use my details to send event information. Deleted 30 days after the event. <a href="{root}privacy.html">Privacy</a></span></label>
        <label class="check"><input type="checkbox" name="dispatch"><span>Also send me the Weekly Dispatch.</span></label>
        <div class="hp" aria-hidden="true"><label>Leave empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <button class="btn dark" type="submit" style="justify-self:start">Reserve my seat</button>
      </form>
    </div>
    {qbox}
  </div>
</section>"""

    programme = "".join(f'<li><b>{ESC(p.get("label"))}</b>{ESC(p.get("detail"))}</li>' for p in e.get("programme") or [])
    where = ESC(e.get("venue")) + (f'<br><span class="small muted">{ESC(e.get("address"))}</span>' if e.get("address") else "")
    maps = "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(", ".join(x for x in [e.get("venue"), e.get("address") or e.get("city")] if x))
    return f"""
<section class="event-hero on-dark"{share_card}>
  <div class="wrap">
    <div class="event-hero-grid">
      <div class="stack" style="--gap:20px">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="{root}in-person.html">In person</a><span>/</span><span>{ESC(label)}</span></nav>
        <span class="eyebrow">{ESC(e.get('kicker') or label)}</span>
        <h1>{ESC(title)}</h1>
        <p class="tagline">{ESC(site.get('tagline'))}</p>
        {f'<p class="company"><span>In the company of</span> {company}</p>' if company else ''}
        {cd}
        <div class="row">{rsvp_btn}{cal_btns}<button class="btn ghost" type="button" data-share-this>Share the invite</button></div>
      </div>
      <div class="event-sun">
        <!--sabha:live-->
        {date_block(e)}
      </div>
    </div>
    <div class="event-facts">
      <div><span class="eyebrow">When</span><b>{ESC(date_long(e))}</b><span>{ESC(e.get('time_label'))}</span></div>
      <div><span class="eyebrow">Where</span><b>{where}</b><a href="{ESC(maps)}" target="_blank" rel="noopener" class="small">Open in Maps</a></div>
      {f'<div><span class="eyebrow">The evening</span><ol class="evening">{programme}</ol></div>' if programme else ''}
    </div>
  </div>
</section>
{f'<section class="section tight"><div class="wrap prose" style="max-width:var(--read)">{md.render(e.get("description"), root)}</div></section>' if e.get('description') else ''}
{motion}
{speakers}
{brief}
{watch_video}
{rsvp}
"""


# ---------------------------------------------------------------- In Person

def programmes_orbit(progs, root):
    """The two-arc diagram: Seva & Community above, Live & In-person below."""
    seva = [p for p in progs if p.get("group") == "seva"]
    live = [p for p in progs if p.get("group") == "live"]

    def node(p, i, dark):
        status = {"coming": "Coming soon", "starting": "Starting now", "active": "Open"}.get(p.get("status"), "")
        return (f'<a class="orbit-node {"dark" if dark else "light"}" href="#{ESC(p["slug"])}" style="--i:{i}">'
                f'<b>{ESC(p["name"])}</b><span>{ESC(p["line"])}</span>{f"<em>{status}</em>" if status else ""}</a>')

    top = "".join(node(p, i, True) for i, p in enumerate(reversed(seva)))
    bottom = "".join(node(p, i, False) for i, p in enumerate(live))
    return f"""
<div class="orbit">
  <svg class="orbit-path" viewBox="0 0 600 640" preserveAspectRatio="none" aria-hidden="true">
    <path d="M 520 30 C 260 60, 90 150, 110 320" fill="none" stroke="var(--midnight)" stroke-width="5" stroke-linecap="round"/>
    <path d="M 110 320 C 120 470, 250 560, 520 610" fill="none" stroke="var(--lotus)" stroke-width="5" stroke-linecap="round"/>
  </svg>
  <span class="orbit-label top">Seva &amp; community</span>
  <span class="orbit-label bottom">Live &amp; in person</span>
  <div class="orbit-col top">{top}</div>
  <div class="orbit-col bottom">{bottom}</div>
</div>"""


def programme_sections(progs, events, root):
    out = []
    for i, p in enumerate(progs):
        evs = [e for e in sorted_events(events, {p.get("event_kind")}) if e.get("status") != "past"] if p.get("event_kind") else []
        ev_html = "".join(event_card(e, root) for e in evs[:3])
        how = "".join(f"<li>{ESC(h)}</li>" for h in p.get("how") or [])
        status = {"coming": "Coming soon", "starting": "Starting now", "active": "Open now"}.get(p.get("status"), "")
        cta_link = f'{root}{p["link"]}' if p.get("link") else f'#join" data-programme="{ESC(p["slug"])}'
        band = "band-sand" if i % 2 else ""
        out.append(f"""
<section class="section {band}" id="{ESC(p['slug'])}">
  <div class="wrap split">
    <div class="stack" style="--gap:16px">
      <span class="eyebrow">{"Seva &amp; community" if p.get("group") == "seva" else "Live &amp; in person"} · {ESC(p.get('cadence'))}</span>
      <h2>{ESC(p['name'])}</h2>
      <p class="lede" style="max-width:none">{ESC(p['line'])}.</p>
      {f'<span class="status-pill {ESC(p.get("status"))}">{status}</span>' if status else ''}
    </div>
    <div class="stack" style="--gap:18px">
      <p>{ESC(p.get('description'))}</p>
      {f'<ul class="prose" style="font-size:1rem">{how}</ul>' if how else ''}
      {f'<div class="grid" style="--cols:2">{ev_html}</div>' if ev_html else ''}
      <a class="btn dark" href="{cta_link}" style="justify-self:start">{ESC(p.get('cta') or 'Get involved')}</a>
    </div>
  </div>
</section>""")
    return "".join(out)


def interest_options(progs):
    return "".join(f'<option value="{ESC(p["slug"])}">{ESC(p["name"])} · {ESC(p.get("cta"))}</option>' for p in progs if not p.get("link"))


# ---------------------------------------------------------------- team

def founders(team):
    out = []
    for p in team:
        if not p.get("founder"):
            continue
        out.append(f"""
      <div class="founder" data-share-card data-share-kicker="HIPL · {ESC(p.get('role'))}" data-share-title="{ESC(p['name'])}" data-share-body="{ESC(md.plain(p.get('bio'), 160))}">
        {avatar(p, 112)}
        <div class="stack" style="--gap:6px"><h3>{ESC(p['name'])}</h3><span class="eyebrow">{ESC(p.get('role'))}</span><p>{ESC(p.get('bio'))}</p></div>
      </div>""")
    return "".join(out)


def team_grid(team):
    return "".join(f'<div class="speaker">{avatar(p)}<div><b>{ESC(p["name"])}</b><p class="small muted">{ESC(p.get("role"))}</p></div></div>' for p in team)


def partners_html(partners):
    return "".join(
        f'<div class="partner"><span class="partner-badge big">{ESC(p["name"])}</span><span class="small muted">{ESC(p.get("role"))}</span></div>'
        if not p.get("logo") else f'<div class="partner"><img src="{ESC(p["logo"])}" alt="{ESC(p["name"])}"><span class="small muted">{ESC(p.get("role"))}</span></div>'
        for p in partners)


# ---------------------------------------------------------------- interviews

def ep_visible(ep):
    return ep.get("status") in ("published", "sample")


def ep_card(ep, root, themes):
    theme = themes.get(ep.get("theme"), "")
    color = ep.get("color") or "midnight"
    bg = {"marigold": "var(--marigold)", "lotus": "var(--lotus)", "saffron": "var(--saffron)", "chalk": "var(--chalk);box-shadow:inset 0 0 0 2px var(--midnight)",
          "midnight-2": "var(--midnight-2)"}.get(color, "var(--midnight)")
    guest = ", ".join(g["name"] for g in ep.get("guests") or [])
    runtime = f"<span>{ESC(ep['runtime'])}</span>" if ep.get("runtime") else ""
    flag = '<span class="sample-flag">Sample</span>' if ep.get("status") == "sample" else ('<span class="status answering">Planned</span>' if not ep_visible(ep) else "")
    inner = (f'<div style="aspect-ratio:16/9;background:{bg};display:flex;align-items:flex-end;padding:14px"><span class="tag">{ESC(ep.get("series") or theme)}</span></div>'
             f'<div class="meta"><span>{ESC(theme)}</span>{runtime}{flag}</div>'
             f'<h3>{ESC(ep["title"])}</h3><p class="small muted">{ESC(guest)}</p>')
    if ep_visible(ep):
        return f'<a class="card linked ep-card" data-theme="{ESC(ep.get("theme"))}" href="{root}interviews/{ESC(ep["slug"])}.html">{inner}</a>'
    return f'<article class="card ep-card" data-theme="{ESC(ep.get("theme"))}">{inner}</article>'


def ep_page(ep, root, themes, xcards):
    guests = "".join(f'<div class="speaker">{avatar({"name": g.get("tag") or g["name"]})}<div><b>{ESC(g["name"])}</b><p class="small muted">{ESC(g.get("bio"))}</p></div></div>' for g in ep.get("guests") or [])
    moments = "".join(f'<li style="grid-template-columns:72px minmax(0,1fr)"><div><b>{ESC(m.get("time"))} {ESC(m.get("label"))}</b>{ESC(m.get("text"))}</div></li>' for m in ep.get("key_moments") or [])
    transcript = md.render(ep.get("transcript"), root) or '<p class="ph">[Transcript is added by the editor after the episode is published.]</p>'
    related = xcards(ep.get("related") or [])
    return f"""
<section class="band-marigold">
  <div class="wrap page-hero" style="padding-bottom:32px">
    <nav class="crumbs" aria-label="Breadcrumb" style="color:var(--midnight)"><a href="{root}interviews.html">Interviews</a><span>/</span><span>{ESC(ep.get('series') or themes.get(ep.get('theme'), ''))}</span></nav>
    <div class="row"><span class="tag">{ESC(ep.get('series') or 'HIPL Interviews')} · {ESC(themes.get(ep.get('theme'), ''))}</span>{'<span class="sample-flag">Sample episode page</span>' if ep.get('status') == 'sample' else ''}</div>
    <h1 style="max-width:18ch">{ESC(ep['title'])}</h1>
  </div>
</section>
<section class="section" style="padding-top:clamp(28px,4vw,48px)">
  <div class="wrap split rev">
    <div class="stack" style="--gap:28px">
      <button class="video" type="button" data-youtube="{ESC(ep.get('video_id') or '[VIDEO ID]')}" aria-label="Play {ESC(ep['title'])}"><!--sabha--><span class="play" aria-hidden="true"></span><span class="cap"><span>{ESC(ep.get('runtime'))} · Captions available</span><span>Loads from YouTube on click</span></span></button>
      {f'<div class="stack" style="--gap:12px"><span class="eyebrow">Key moments</span><ol class="steps" style="counter-reset:none">{moments}</ol></div>' if moments else ''}
      <details class="fallback"><summary>Read the full transcript</summary><div class="prose small">{transcript}</div></details>
    </div>
    <div class="stack" style="--gap:24px">
      <div class="stack" style="--gap:14px"><span class="eyebrow">The guests</span>{guests}
        {f'<div class="speaker">{avatar({"name": "H"})}<div><b>Host: {ESC(ep.get("host"))}</b></div></div>' if ep.get('host') else ''}</div>
      {f'<p>{ESC(ep.get("summary"))}</p>' if ep.get('summary') else ''}
      <div class="share" aria-label="Share this episode"><a data-share="whatsapp" href="#">WhatsApp</a><a data-share="x" href="#">X</a><a data-share="linkedin" href="#">LinkedIn</a><button type="button" data-share="copy">Copy link</button></div>
      {f'<div class="stack" style="--gap:12px"><span class="eyebrow">Related Explorations</span>{related}</div>' if related else ''}
    </div>
  </div>
</section>"""


# ---------------------------------------------------------------- voices

def v_visible(a):
    return a.get("status") in ("published", "sample")


def v_card(a, root, formats):
    fm = formats.get(a.get("format"), {})
    tag = f'<span class="tag {ESC(fm.get("color", "outline"))}">{ESC(fm.get("name", ""))}</span>'
    flag = '<span class="sample-flag">Sample</span>' if a.get("status") == "sample" else ('<span class="status received">Coming soon</span>' if not v_visible(a) else "")
    inner = f'<div class="meta">{tag}{flag}</div><h3>{ESC(a["title"])}</h3><p class="small muted">{ESC(a["writer"]["name"])} for HIPL · {ESC(a.get("read"))} min</p>'
    attrs = f'data-format="{ESC(a.get("format"))}" data-topic="{ESC("|".join(a.get("topics") or []))}"'
    if v_visible(a):
        return f'<a class="card linked v-card" {attrs} href="{root}voices/{ESC(a["slug"])}.html">{inner}</a>'
    return f'<article class="card v-card" {attrs}>{inner}</article>'


def v_page(a, root, formats, xcards):
    fm = formats.get(a.get("format"), {})
    w = a["writer"]
    contrib = f'{root}contributors/{ESC(w["slug"])}.html' if w.get("slug") else "#"
    srcs = "".join(f'<li id="src-{k + 1}"><span>{md.inline(s, root)}</span></li>' for k, s in enumerate(a.get("sources") or []))
    related = xcards(a.get("related") or [])
    return f"""
<article>
<section class="band-lotus">
  <div class="wrap page-hero" style="max-width:calc(900px + 2 * var(--gutter))">
    <nav class="crumbs" aria-label="Breadcrumb" style="color:var(--midnight)"><a href="{root}voices.html">Voices</a><span>/</span><span>{ESC(fm.get('name'))}</span></nav>
    <div class="row"><span class="tag">{ESC(fm.get('name'))}</span>{'<span class="sample-flag">Sample text written to test the layout</span>' if a.get('status') == 'sample' else ''}</div>
    <h1>{ESC(a['title'])}</h1>
    {f'<p class="lede">{ESC(a.get("dek"))}</p>' if a.get('dek') else ''}
    <div class="speaker">{avatar(w)}<div><b><a href="{contrib}">{ESC(w['name'])}</a> for HIPL</b><p class="small">{ESC(w.get('city'))} · {ESC(a.get('date'))} · {ESC(a.get('read'))} min read</p></div></div>
  </div>
</section>
<section class="section">
  <div class="wrap" style="max-width:calc(var(--read) + 2 * var(--gutter))">
    <div class="prose">
      <div class="notice"><b>Views are the writer's own.</b><span>HIPL publishes a range of perspectives.</span></div>
      {md.render(a.get('body'), root)}
      {f'<h2>Sources</h2><ol class="sources">{srcs}</ol>' if srcs else ''}
    </div>
    <div class="stack" style="--gap:20px;margin-top:48px">
      <div class="card" style="grid-template-columns:72px minmax(0,1fr);align-items:center">{avatar(w, 72)}<div><b>{ESC(w['name'])}</b><p class="small muted">{ESC(w.get('bio'))}</p><a class="small" href="{contrib}">All pieces by this writer →</a></div></div>
      <div class="row" style="justify-content:space-between;gap:14px">
        <div class="share" aria-label="Share this piece"><a data-share="whatsapp" href="#">WhatsApp</a><a data-share="x" href="#">X</a><a data-share="linkedin" href="#">LinkedIn</a><button type="button" data-share="copy">Copy link</button></div>
        <a class="btn dark small" href="{root}write.html#pitch">Write a response</a>
      </div>
      {f'<div class="stack" style="--gap:12px"><b>Keep exploring</b><div class="grid" style="--cols:2">{related}</div></div>' if related else ''}
    </div>
  </div>
</section>
</article>"""


def contributor_page(name, slug, articles, root, formats):
    w = articles[0]["writer"]
    cards = "".join(v_card(a, root, formats) for a in articles)
    return f"""
<section class="band-sand">
  <div class="wrap page-hero">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="{root}voices.html">Voices</a><span>/</span><span>Contributors</span></nav>
    <div class="row" style="--gap:24px;align-items:center">{avatar(w, 120)}
      <div class="stack" style="--gap:8px"><h1 style="font-size:clamp(2rem,5vw,3.4rem)">{ESC(name)}</h1><p class="muted">{ESC(w.get('city'))} · Writes for HIPL Voices</p></div></div>
    <p class="lede">{ESC(w.get('bio'))}</p>
  </div>
</section>
<section class="section"><div class="wrap"><div class="sec-head"><div><span class="eyebrow">Pieces</span><h2>All their writing for HIPL</h2></div></div><div class="grid" style="--cols:3">{cards}</div></div></section>"""


# ---------------------------------------------------------------- dispatch

DISPATCH_SECTIONS = [
    ("idea", "One idea worth thinking about"),
    ("this_week", "This week in Hindu culture and public life"),
    ("positive_story", "One positive story"),
    ("from_hipl", "From HIPL"),
    ("three_things", "Three things to read, watch or hear"),
    ("question", "One question for you"),
]


def issue_url(i, root):
    return f"{root}dispatch/issue-{int(i['number']):02d}.html"


def issue_page(i, root):
    secs = ""
    for n, (key, label) in enumerate(DISPATCH_SECTIONS, 1):
        body = i.get(key) or ""
        if key == "question":
            secs += f'<section style="background:var(--marigold)"><h3><span style="color:var(--midnight)">06</span>{label}</h3><p class="big-quote" style="font-size:1.4rem">{ESC(body)}</p><p class="small">Hit reply. The best answers feature next week.</p></section>'
            continue
        title = f'<h4 style="font-family:var(--f-display);font-size:1.25rem">{ESC(i.get("idea_title"))}</h4>' if key == "idea" and i.get("idea_title") else ""
        secs += f'<section><h3><span>{n:02d}</span>{label}</h3>{title}<div class="prose" style="font-size:1rem">{md.render(body, root)}</div></section>'
    return f"""
<section class="section band-sand">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb" style="justify-content:center;margin-bottom:20px"><a href="{root}dispatch.html">The Weekly Dispatch</a><span>/</span><span>Issue {int(i['number']):02d}</span></nav>
    <article class="dispatch-issue">
      <header class="on-dark">
        <div class="row" style="justify-content:space-between"><div class="row" style="--gap:10px"><!--sabha style="width:28px;height:28px"--><span style="font-size:.75rem;font-weight:600;letter-spacing:.2em">THE WEEKLY DISPATCH · {int(i['number']):02d}</span></div>{'<span class="sample-flag">Sample issue</span>' if i.get('status') == 'sample' else ''}</div>
        <h1 style="font-size:clamp(1.6rem,3.6vw,2.4rem)">{ESC(i.get('subject'))}</h1>
        <p class="small muted">{ESC(i.get('date'))} · 5-minute read</p>
      </header>
      {secs}
    </article>
  </div>
</section>"""


def issue_list(issues, root):
    vis = sorted([i for i in issues if i.get("status") in ("published", "sample")], key=lambda i: -int(i["number"]))
    return "".join(
        f'<a class="q-item" href="{issue_url(i, root)}" style="text-decoration:none;grid-template-columns:96px minmax(0,1fr) auto"><span class="qn">Issue {int(i["number"]):02d}</span>'
        f'<div><h3>{ESC(i.get("subject"))}</h3><div class="meta"><span>{ESC(i.get("date"))}</span>{SAMPLE_FLAG if i.get("status") == "sample" else ""}</div></div><span class="arrow-link" aria-hidden="true">Read</span></a>'
        for i in vis)


# ---------------------------------------------------------------- reading circle

def circle_current(months):
    return next((m for m in months if m.get("status") == "current"), months[0] if months else None)


def guide_page(m, root):
    secs = "".join(f'<section><h3><span>{k:02d}</span>{ESC(s.get("title"))}</h3><div class="prose" style="font-size:1rem">{md.render(s.get("text"), root)}</div></section>' for k, s in enumerate(m.get("guide") or [], 1))
    return f"""
<section class="section">
  <div class="wrap" style="max-width:calc(820px + 2 * var(--gutter))">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="{root}reading-circle.html">Reading Circle</a><span>/</span><span>Reading guide</span></nav>
    <article class="dispatch-issue" style="margin-top:20px">
      <header class="on-dark"><div class="row" style="justify-content:space-between"><span class="eyebrow">HIPL Reading Circle · Reading guide</span>{'<span class="sample-flag">Sample</span>' if m.get('month') == 'Sample month' else ''}</div><h1 style="font-size:clamp(1.8rem,4vw,2.8rem)">{ESC(m.get('text'))}</h1><p style="color:var(--marigold)">{ESC(m.get('question'))}</p></header>
      {secs}
    </article>
  </div>
</section>"""
