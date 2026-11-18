"""Fill the Chairman's Award - Team template for The 3C Project."""
import copy, sys
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from PIL import Image

SRC, OUT, IMG = sys.argv[1], sys.argv[2], sys.argv[3]
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
GOLD = RGBColor(0xFF, 0xC8, 0x57)
INK = RGBColor(0x2A, 0x05, 0x0A)
REG, MED, SEMI = "Poppins", "Poppins Medium", "Poppins SemiBold"

prs = Presentation(SRC)
S = list(prs.slides)


def set_title(slide, text):
    for sh in slide.shapes:
        if sh.is_placeholder and sh.placeholder_format.type in (3, 1):  # ctrTitle / title
            runs = sh.text_frame.paragraphs[0].runs
            runs[0].text = text
            for r in runs[1:]:
                r._r.getparent().remove(r._r)
            return sh


def drop(slide, name_start):
    for sh in list(slide.shapes):
        if sh.name.startswith(name_start):
            sh._element.getparent().remove(sh._element)


def alpha(shape, pct):
    """Make a solid fill translucent: pct = opacity 0-100."""
    clr = shape.fill._xPr.find(qn("a:solidFill"))[0]
    a = clr.makeelement(qn("a:alpha"), {"val": str(int(pct * 1000))})
    clr.append(a)


def card(slide, x, y, w, h, color=INK, opacity=55, name="Card", radius=0.06):
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    sh.adjustments[0] = radius
    sh.fill.solid(); sh.fill.fore_color.rgb = color
    alpha(sh, opacity)
    sh.line.fill.background()
    sh.shadow.inherit = False
    sh.name = name
    return sh


def text(slide, x, y, w, h, runs_by_para, name="Text", anchor=MSO_ANCHOR.TOP, align=PP_ALIGN.LEFT,
         space_after=10, line=1.08):
    """runs_by_para: list of paragraphs; each a list of (text, size, font, color, italic)."""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tb.name = name
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, para in enumerate(runs_by_para):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(space_after)
        p.line_spacing = line
        for t, size, font, color, *rest in para:
            r = p.add_run(); r.text = t
            r.font.size = Pt(size); r.font.name = font; r.font.color.rgb = color
            r.font.italic = bool(rest and rest[0])
    return tb


def bullets(slide, x, y, w, h, items, size=30, name="Bullets", head_color=GOLD):
    """items: list of (bold lead, rest)."""
    tb = text(slide, x, y, w, h, [[(lead, size, SEMI, head_color), (rest, size, REG, WHITE)] for lead, rest in items],
              name=name, space_after=22)
    for p in tb.text_frame.paragraphs:
        pPr = p._p.get_or_add_pPr()
        pPr.set("marL", str(Inches(0.55))); pPr.set("indent", str(-Inches(0.55)))
        bu = pPr.makeelement(qn("a:buChar"), {"char": "•"})
        bc = pPr.makeelement(qn("a:buClr"), {}); s = bc.makeelement(qn("a:srgbClr"), {"val": "FFC857"}); bc.append(s)
        pPr.append(bc); pPr.append(bu)
    return tb


def photo(slide, path, x, y, w, h, name="Photo", focus_y=0.5):
    """Center-crop the image to the frame's aspect ratio, as a rounded picture."""
    im = Image.open(path); iw, ih = im.size
    fr = w / h
    pic = slide.shapes.add_picture(path, Inches(x), Inches(y), Inches(w), Inches(h))
    if iw / ih > fr:  # too wide
        c = (1 - fr * ih / iw) / 2; pic.crop_left = pic.crop_right = c
    else:
        keep = (iw / fr) / ih; spare = 1 - keep
        pic.crop_top = spare * focus_y; pic.crop_bottom = spare * (1 - focus_y)
    pic.auto_shape_type = MSO_SHAPE.ROUNDED_RECTANGLE
    geom = pic._element.spPr.find(qn("a:prstGeom"))
    av = geom.find(qn("a:avLst")) if geom.find(qn("a:avLst")) is not None else geom.makeelement(qn("a:avLst"), {})
    if av.getparent() is None: geom.append(av)
    av.append(av.makeelement(qn("a:gd"), {"name": "adj", "fmla": "val 4000"}))
    pic.name = name
    return pic


def notes(slide, t):
    slide.notes_slide.notes_text_frame.text = t


# ---------------- Slide 1: cover / team details ----------------
s = S[0]
body = [sh for sh in s.shapes if sh.name.startswith("Team Name")][0]
tf = body.text_frame
lines = [
    ("Team Name: ", "The 3C Project — Candid Constructive Conversations"),
    ("Team Member Names with Emp ID (Not More Than 20): ", "[to be added]"),
    ("SBU & Department: ", "[to be added]"),
    ("HOD: ", "[to be added]"),
]
for p, (lab, val) in zip(tf.paragraphs, lines):
    for r in list(p.runs):
        r._r.getparent().remove(r._r)
    r1 = p.add_run(); r1.text = lab; r1.font.bold = True; r1.font.size = Pt(36)
    r2 = p.add_run(); r2.text = val; r2.font.size = Pt(36)
    if val.startswith("["):
        r2.font.color.rgb = GOLD; r2.font.italic = True
tf.word_wrap = True
notes(s, "Team details still to be filled in: member names with Employee IDs (max 20; mix of front-end, back-end, "
         "cross-functional and multi-location is preferred), SBU & Department, HOD, and the team group photo.")

# ---------------- Slide 2: Situation ----------------
s = S[1]
set_title(s, "Situation")
drop(s, "Describe")
text(s, 1.5, 4.0, 13.6, 2.0, [[("India is talking louder — and listening less.", 46, SEMI, WHITE)]], name="Lead")
bullets(s, 1.5, 6.3, 13.4, 6.4, [
    ("Polarised public discourse: ", "caste, faith, youth and justice divide families, campuses and timelines."),
    ("Debate TV rewards noise: ", "politicians, experts and anchors perform for their side; the people actually living the issue are rarely heard."),
    ("Trust in media is eroding ", "as audiences see conversation turned into spectacle."),
    ("The opportunity for ITG: ", "build a format where common people with opposing lived experiences talk to each other — candidly, constructively, towards common ground."),
], size=28)
photo(s, f"{IMG}/1.jpg", 16.1, 3.95, 8.9, 9.2, name="Photo 3C on stage", focus_y=0.62)
notes(s, "Set the context: the problem 3C was created to solve — polarised discourse and a debate culture that "
         "rewards noise over listening. 3C is ITG's answer: 'This is not a debate. This is not a shouting match.'")

# ---------------- Slide 3: Challenges ----------------
s = S[2]
set_title(s, "Challenges")
drop(s, "List")
ch = [
    ("01", "India's most sensitive topics", "Caste, juvenile justice, kids on social media, interfaith love — high editorial, legal and backlash risk."),
    ("02", "Finding real voices", "Casting ordinary citizens with opposing lived experiences, and earning the trust to speak on camera."),
    ("03", "Civil without a referee", "No anchor, politician or expert to steer — conversations had to stay candid yet respectful."),
    ("04", "A brand-new property", "No ready audience, competing for attention against sensational shout-fest formats."),
    ("05", "One story, many platforms", "Long-form YouTube, TV, X Spaces, Reddit and social — each with its own grammar and team."),
    ("06", "Impact beyond views", "Proving that people engage with nuance — participation, not just reach."),
]
cw, chh, gx, gy, x0, y0 = 7.45, 4.7, 0.45, 0.45, 1.5, 4.0
for i, (n, h, d) in enumerate(ch):
    cx = x0 + (i % 3) * (cw + gx); cy = y0 + (i // 3) * (chh + gy)
    card(s, cx, cy, cw, chh, name=f"Card {n}")
    text(s, cx + 0.5, cy + 0.4, cw - 1.0, chh - 0.8, [
        [(n, 40, SEMI, GOLD)],
        [(h, 30, SEMI, WHITE)],
        [(d, 24, REG, WHITE)],
    ], name=f"Challenge {n}", space_after=6)
notes(s, "Six challenges the team had to solve, from editorial risk on sensitive subjects to proving engagement beyond views.")

# ---------------- Slide 4: Action ----------------
s = S[3]
set_title(s, "Action")
drop(s, "Describe")
steps = [
    ("Redesigned the talk show", "Removed the middlemen: no politicians, experts or anchors in the primary exchange."),
    ("Cast lived experience", "Researched and brought together real people directly shaped by each issue, holding divergent views."),
    ("Produced for synthesis", "Focussed and solution-oriented: from clash to conversation, with mutual respect."),
    ("Built a 360° ecosystem", "YouTube long-form, curated TV episodes, live X Spaces, Reddit threads and social bites."),
]
sw, sh_, sg, sx, sy = 5.55, 6.3, 0.6, 1.5, 4.0
for i, (h, d) in enumerate(steps):
    cx = sx + i * (sw + sg)
    card(s, cx, sy, sw, sh_, name=f"Step {i+1}")
    circ = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(cx + 0.5), Inches(sy + 0.5), Inches(1.3), Inches(1.3))
    circ.fill.solid(); circ.fill.fore_color.rgb = GOLD; circ.line.fill.background(); circ.name = f"Step num {i+1}"
    ctf = circ.text_frame; ctf.margin_left = ctf.margin_right = 0
    cp = ctf.paragraphs[0]; cp.alignment = PP_ALIGN.CENTER
    r = cp.add_run(); r.text = str(i + 1); r.font.size = Pt(40); r.font.name = SEMI; r.font.color.rgb = INK
    text(s, cx + 0.5, sy + 2.15, sw - 1.0, sh_ - 2.5, [[(h, 30, SEMI, WHITE)], [(d, 24, REG, WHITE)]],
         name=f"Step text {i+1}", space_after=8)
    if i < 3:
        ar = s.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(cx + sw + 0.1), Inches(sy + 0.85), Inches(0.4), Inches(0.6))
        ar.fill.solid(); ar.fill.fore_color.rgb = GOLD; ar.line.fill.background(); ar.name = f"Arrow {i+1}"
card(s, 1.5, 10.75, 23.85, 2.6, name="Episodes band")
text(s, 2.0, 10.95, 22.85, 2.2, [
    [("Delivered so far  ", 28, SEMI, GOLD), ("Ep 1  Caste Reservations   ·   Ep 2  Should Kids Be on Social Media?   ·   Ep 3  Juveniles & Heinous Crimes", 26, REG, WHITE)],
    [("Coming soon  ", 28, SEMI, GOLD), ("Faith & Union — interfaith relationships in India", 26, REG, WHITE)],
], name="Episodes", anchor=MSO_ANCHOR.MIDDLE, space_after=14)
notes(s, "Walk through the four moves the team made, then the episodes delivered. Mention the cross-functional effort: "
         "editorial, casting/research, video production, TV, social, community (X/Reddit) and brand.")

# ---------------- Slide 5: Impact ----------------
s = S[4]
set_title(s, "Impact")
drop(s, "Describe")
stats = [
    ("~2.7M+", "cumulative views across YouTube, Instagram & X"),
    ("~1.48M+", "views for Episode 1 — Caste Reservations"),
    ("~4.7K", "live tune-ins across 3 X Spaces"),
    ("6–7K+", "views per Reddit discussion thread"),
]
bw, bh, bg = 7.6, 3.85, 0.45
for i, (big, lab) in enumerate(stats):
    cx = 1.5 + (i % 2) * (bw + bg); cy = 4.15 + (i // 2) * (bh + bg)
    card(s, cx, cy, bw, bh, name=f"Stat {i+1}")
    text(s, cx + 0.5, cy + 0.35, bw - 1.0, bh - 0.7, [[(big, 80, SEMI, GOLD)], [(lab, 26, REG, WHITE)]],
         name=f"Stat text {i+1}", space_after=2, line=1.0)
card(s, 1.5, 12.45, 15.65, 1.25, name="TV band", opacity=35)
text(s, 2.0, 12.45, 14.8, 1.25, [[("2 dedicated TV sessions ", 24, SEMI, GOLD),
                                  ("took the debates to broadcast audiences", 24, REG, WHITE)]],
     name="TV text", anchor=MSO_ANCHOR.MIDDLE)
photo(s, f"{IMG}/2.jpg", 17.6, 4.15, 7.75, 9.55, name="Photo audience", focus_y=0.45)
notes(s, "Numbers are directional (cumulative, YouTube + Instagram + X). Ep 2 and Ep 3 averaged ~600K+ views each. "
         "X Spaces: Ep1 ~1K, Ep2 ~2.5K, Ep3 ~1.2K live tune-ins; 30-40 min sessions with 12-15 speakers. "
         "Reddit recently activated with 6-7K+ views per thread. Point: people want participatory, civil discourse.")

# ---------------- Slide 6 (extra): award parameters ----------------
s = S[5]
set_title(s, "Against the Award Criteria")
drop(s, "Describe")
cols = [
    ("Industry / Media Impact",
     ["Re-imagined the TV debate: no anchors, experts or politicians — only lived experience",
      "~2.7M+ views and ~4.7K live participants on India's most divisive topics",
      "Positions ITG as the group rebuilding trust through human-centred storytelling"]),
    ("Highest Standards of Delivery",
     ["3 flagship episodes on high-risk subjects delivered with editorial care",
      "Each episode extended to TV, X Spaces, Reddit and social",
      "A repeatable format, with the 4th episode — Faith & Union — in the pipeline"]),
    ("Out of the Box & Cross-functional",
     ["First-of-its-kind format: conversation, not debate; synthesis, not winning",
      "Editorial, production, TV, social and community teams working as one",
      "One idea, carried across five platforms by many teams"]),
]
kw, kg = 7.6, 0.525
for i, (h, pts) in enumerate(cols):
    cx = 1.5 + i * (kw + kg)
    card(s, cx, 4.15, kw, 9.5, name=f"Criterion {i+1}")
    text(s, cx + 0.5, 4.6, kw - 1.0, 1.6, [[(h, 32, SEMI, GOLD)]], name=f"Criterion head {i+1}", line=1.0)
    tb = text(s, cx + 0.5, 6.5, kw - 1.0, 6.9, [[(p, 24, REG, WHITE)] for p in pts], name=f"Criterion body {i+1}",
              space_after=22)
    for p in tb.text_frame.paragraphs:
        pPr = p._p.get_or_add_pPr()
        pPr.set("marL", str(Inches(0.45))); pPr.set("indent", str(-Inches(0.45)))
        bc = pPr.makeelement(qn("a:buClr"), {}); bc.append(bc.makeelement(qn("a:srgbClr"), {"val": "FFC857"}))
        pPr.append(bc); pPr.append(pPr.makeelement(qn("a:buChar"), {"char": "•"}))
notes(s, "Additional slide (not part of the HR template): maps 3C directly to the three Chairman's Award - Team "
         "parameters: Industry/Media impact, highest standards of Delivery, and Out-of-the-box with cross-functional synergy.")

prs.save(OUT)
print("saved", OUT)
