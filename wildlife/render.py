"""Renders the "explore/indian/wildlife" jackal reel (1080x1920, 30 fps) in the Pugmark Pin brand.

    python3 render.py LANG                      # build/mix-LANG.wav -> output/jackal-LANG.mp4
    python3 render.py LANG --frames 2,9,30      # design-check stills in build/
    python3 render.py LANG --thumbnail          # output/jackal-LANG-cover.jpg
    python3 render.py LANG --check              # safe-area check for every text box

Text and key graphics stay inside x 90-920, y 290-1440: clear of the YouTube Shorts and
Instagram Reels header (top), caption/channel rows (bottom 480 px) and action buttons (right 160 px).
"""
import json
import math
import os
import re
import subprocess
import sys
from functools import lru_cache
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from fontTools.ttLib import TTFont

from story import TEXT, TRACK_ID

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, "assets")
W, H, FPS = 1080, 1920, 30
SAFE = (90, 290, 920, 1440)
SX0, SY0, SX1, SY1 = SAFE
SCX = (SX0 + SX1) // 2

TEAL = (14, 59, 58)
CANOPY = (31, 94, 76)
LIME = (200, 224, 74)
MIST = (232, 239, 234)
GRAPH = (11, 22, 21)

LANG = "hi"
TL = None
TX = None
BOXES = None  # text boxes collected by --check


# ------------------------------------------------------------------ fonts
FONT_FILES = {
    "display": ["SpaceGrotesk-700.ttf"],
    "display-m": ["SpaceGrotesk-500.ttf"],
    "mono": ["IBMPlexMono-400.ttf"],
    "mono-b": ["IBMPlexMono-600.ttf"],
    "hi": ["Mukta-devanagari-800.ttf", "Mukta-latin-800.ttf", "SpaceGrotesk-700.ttf"],
    "hi-m": ["Mukta-devanagari-500.ttf", "Mukta-latin-500.ttf", "IBMPlexMono-400.ttf"],
}


@lru_cache(None)
def cmap(f):
    return set(TTFont(os.path.join(A, "fonts", f)).getBestCmap())


@lru_cache(None)
def _font(f, size):
    return ImageFont.truetype(os.path.join(A, "fonts", f), size)


def runs(text, kind):
    """Split text into (substring, font file) runs using the first font that has each char."""
    files = FONT_FILES[kind]
    out = []
    for ch in text:
        f = next((f for f in files if ord(ch) in cmap(f) or ch == " "), files[-1])
        if out and (out[-1][1] == f or ch == " " or ("ऀ" <= ch <= "ॿ" and out[-1][1] == f)):
            out[-1][0] += ch
        else:
            out.append([ch, f])
    return out


def text_kind(lang_text=True):
    return "hi" if (LANG == "hi" and lang_text) else "display"


def measure(text, kind, size):
    return sum(_font(f, size).getlength(s) for s, f in runs(text, kind))


def draw_rich(d, x, y, text, kind, size, color=MIST, accent=LIME, anchor="l"):
    """Draws text with *accent* markup on one line; returns its width. y is the baseline."""
    parts = re.split(r"(\*[^*]+\*)", text)
    segs = [(p.strip("*"), accent if p.startswith("*") else color) for p in parts if p]
    w = sum(measure(s, kind, size) for s, _ in segs)
    if anchor == "c":
        x -= w / 2
    elif anchor == "r":
        x -= w
    x0 = x
    for s, c in segs:
        for sub, f in runs(s, kind):
            d.text((x, y), sub, font=_font(f, size), fill=c, anchor="ls")
            x += _font(f, size).getlength(sub)
    if BOXES is not None:
        BOXES.append((x0, y - size * 0.95, x0 + w, y + size * 0.3, text))
    return w


def wrap(text, kind, size, maxw):
    words = text.split(" ")
    lines, cur = [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if measure(t.replace("*", ""), kind, size) <= maxw or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w_
    lines.append(cur)
    # carry open accents across line breaks
    out, open_ = [], False
    for ln in lines:
        if open_:
            ln = "*" + ln
        open_ = ln.count("*") % 2 == 1
        if open_:
            ln += "*"
        out.append(ln)
    return out


# ------------------------------------------------------------------ easing
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def eo(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def eio(x):
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def back(x, s=1.6):
    x = clamp(x)
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


def lerp(a, b, x):
    return a + (b - a) * x


# ------------------------------------------------------------------ brand marks
def pin_poly(cx, cy, r, tip):
    """Map-pin outline: circle of radius r around (cx, cy) with a point at cy + tip."""
    th = math.acos(r / tip)
    pts = []
    for i in range(61):
        a = math.pi / 2 + th + (2 * math.pi - 2 * th) * i / 60
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    pts.append((cx, cy + tip))
    return pts


def paw(d, cx, cy, s, fill, dot=None):
    """Pugmark: main pad and four toes, centred on the pad; s = pad width."""
    pw, ph = s, s * 0.78
    d.ellipse([cx - pw / 2, cy - ph * 0.35, cx + pw / 2, cy + ph * 0.65], fill=fill)
    d.ellipse([cx - pw * 0.42, cy - ph * 0.5, cx + pw * 0.42, cy + ph * 0.3], fill=fill)
    for dx, dy, rw, rh in ((-0.62, -0.62, 0.21, 0.27), (-0.22, -0.95, 0.22, 0.29),
                           (0.22, -0.95, 0.22, 0.29), (0.62, -0.62, 0.21, 0.27)):
        x, y = cx + dx * s, cy + dy * s
        d.ellipse([x - rw * s, y - rh * s, x + rw * s, y + rh * s], fill=fill)
    if dot:
        r = s * 0.085
        d.ellipse([cx - r, cy + ph * 0.12 - r, cx + r, cy + ph * 0.12 + r], fill=dot)


@lru_cache(None)
def emblem(size, pin=MIST, ink=TEAL, dot=LIME, dashed=True):
    """The Pugmark Pin: pin, dashed ring, pugmark with a lime dot. Returns RGBA, size px wide."""
    S = 4
    w = size * S
    r = w * 0.48
    im = Image.new("RGBA", (w, int(w * 1.3)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, cy = w / 2, w / 2
    d.polygon(pin_poly(cx, cy, r, r * 1.62), fill=pin)
    if dashed:
        rr = r * 0.78
        n = 34
        for i in range(n):
            a0, a1 = 360 * i / n, 360 * (i + 0.5) / n
            d.arc([cx - rr, cy - rr, cx + rr, cy + rr], a0, a1, fill=ink, width=max(2, int(w * 0.012)))
    paw(d, cx, cy + r * 0.12, r * 0.62, ink, dot)
    return im.resize((size, int(size * 1.3)), Image.LANCZOS)


@lru_cache(None)
def avatar(size, bg=LIME, ink=GRAPH):
    S = 4
    w = size * S
    im = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([0, 0, w - 1, w - 1], fill=bg)
    paw(d, w / 2, w * 0.56, w * 0.36, ink)
    return im.resize((size, size), Image.LANCZOS)


@lru_cache(None)
def pin_icon(size, bg=LIME, ink=GRAPH):
    S = 4
    w = size * S
    r = w * 0.48
    im = Image.new("RGBA", (w, int(w * 1.3)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.polygon(pin_poly(w / 2, w / 2, r, r * 1.6), fill=bg)
    paw(d, w / 2, w / 2 + r * 0.14, r * 0.62, ink)
    return im.resize((size, int(size * 1.3)), Image.LANCZOS)


def wordmark(d, x, y, size, color=MIST, slash=LIME):
    """explore/indian/wildlife with lime slashes; y is the baseline. Returns the width."""
    f = _font("SpaceGrotesk-700.ttf", size)
    x0 = x
    for part in re.split(r"(/)", "explore/indian/wildlife"):
        d.text((x, y), part, font=f, fill=slash if part == "/" else color, anchor="ls")
        x += f.getlength(part)
    if BOXES is not None:
        BOXES.append((x0, y - size, x, y + size * 0.3, "wordmark"))
    return x - x0


# ------------------------------------------------------------------ photos
@lru_cache(None)
def photo(name):
    im = np.asarray(Image.open(os.path.join(A, "photos", name + ".jpg")).convert("RGB")).astype(np.float32) / 255
    # brand grade: a touch more contrast, teal-leaning shadows, slightly muted greens
    lum = im @ np.array([0.299, 0.587, 0.114], np.float32)
    im = (im - 0.5) * 1.12 + 0.5
    sh = np.clip(1 - lum * 1.8, 0, 1)[..., None]
    im = im * (1 - 0.18 * sh) + np.array([0.05, 0.23, 0.23], np.float32) * 0.18 * sh
    g = im[..., 1:2]
    im = im * 0.9 + g * 0.1
    im = np.clip(im, 0, 1)
    return Image.fromarray((im * 255).astype(np.uint8)).filter(ImageFilter.UnsharpMask(2, 60, 2))


def view(name, cx, cy, vh):
    """Portrait window of photo `name`, centred on (cx, cy) in photo px, vh photo px tall."""
    p = photo(name)
    vh = min(vh, p.height)
    vw = vh * W / H
    cx = clamp(cx, vw / 2, p.width - vw / 2)
    cy = clamp(cy, vh / 2, p.height - vh / 2)
    return p.resize((W, H), Image.BICUBIC, box=(cx - vw / 2, cy - vh / 2, cx + vw / 2, cy + vh / 2)), (cx, cy, vh)


def to_screen(pt, cam):
    cx, cy, vh = cam
    s = H / vh
    return (W / 2 + (pt[0] - cx) * s, H / 2 + (pt[1] - cy) * s)


@lru_cache(None)
def vignette():
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((x - W / 2) / (W * 0.75)) ** 2 + ((y - H / 2) / (H * 0.62)) ** 2)
    v = np.clip(1 - 0.55 * np.clip(r - 0.45, 0, 1) ** 1.4, 0, 1)
    top = np.clip(1 - y / 700, 0, 1) ** 2 * 0.45  # darker top and bottom for the HUD and captions
    bot = np.clip((y - 1150) / 770, 0, 1) ** 1.5 * 0.55
    return Image.fromarray(((v * (1 - top) * (1 - bot)) * 255).astype(np.uint8))


@lru_cache(None)
def grain(k):
    r = np.random.default_rng(k)
    n = r.normal(0, 9, (H // 2, W // 2)).astype(np.float32)
    return Image.fromarray(np.clip(n + 128, 0, 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)


def finish(img, t):
    """Vignette and film grain on a photo frame."""
    black = Image.new("RGB", (W, H), (4, 12, 11))
    img = Image.composite(img, black, vignette())
    g = grain(int(t * FPS) % 6).convert("RGB")
    return Image.blend(img, Image.eval(Image.blend(img, g, 0.5), lambda v: v), 0.0) if False else \
        Image.fromarray(np.clip(np.asarray(img, np.int16) + (np.asarray(g, np.int16) - 128) // 2, 0, 255).astype(np.uint8))


@lru_cache(None)
def topo():
    """Contour-line field for graphic scenes (deep teal, canopy lines)."""
    r = np.random.default_rng(4)
    small = r.normal(0, 1, (12, 7)).astype(np.float32)
    f = np.asarray(Image.fromarray(small).resize((W // 2, H // 2), Image.BICUBIC), np.float32)
    f = f + 0.3 * np.asarray(Image.fromarray(r.normal(0, 1, (30, 17)).astype(np.float32)).resize((W // 2, H // 2), Image.BICUBIC))
    bands = np.abs(((f * 6) % 1) - 0.5) < 0.045
    base = np.zeros((H // 2, W // 2, 3), np.uint8)
    base[:] = TEAL
    base[bands] = (23, 76, 68)
    return Image.fromarray(base).resize((W, H), Image.BILINEAR)


# ------------------------------------------------------------------ overlays
def overlay():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def rrect(d, box, r, fill=None, outline=None, width=1):
    d.rounded_rectangle([int(v) for v in box], r, fill=fill, outline=outline, width=width)


def brackets(d, box, arm, color=LIME, w=5):
    x0, y0, x1, y1 = box
    for (x, y, dx, dy) in ((x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)):
        d.line([(x, y + dy * arm), (x, y), (x + dx * arm, y)], fill=color, width=w, joint="curve")


def alpha(c, a):
    return c + (int(255 * clamp(a)),)


def hud(o, t):
    """Persistent HUD: viewfinder corners, brand bug, REC chip and track id."""
    d = ImageDraw.Draw(o)
    brackets(d, (44, 250, W - 44, 1500), 64, alpha(LIME, 0.85), 5)
    ic = pin_icon(40)
    o.alpha_composite(ic, (SX0, 300))
    wordmark(d, SX0 + 54, 340, 32)
    mono = _font("IBMPlexMono-400.ttf", 21)
    d.text((SX0 + 54, 372), f"TRACK_ID {TRACK_ID} · STATUS ACTIVE", font=mono, fill=alpha(MIST, 0.7), anchor="ls")
    # REC chip
    rec = f"REC {int(t // 60):02d}:{int(t % 60):02d}"
    fb = _font("IBMPlexMono-600.ttf", 24)
    tw = fb.getlength(rec)
    x1 = SX1
    rrect(d, (x1 - tw - 58, 306, x1, 350), 8, fill=alpha(GRAPH, 0.8))
    if int(t * 2) % 2 == 0:
        d.ellipse([x1 - tw - 44, 320, x1 - tw - 28, 336], fill=(235, 70, 60))
    d.text((x1 - 14, 337), rec, font=fb, fill=MIST, anchor="rs")
    if BOXES is not None:
        BOXES.append((x1 - tw - 58, 306, x1, 350, "rec"))
        BOXES.append((SX0, 300, SX0 + 54 + 600, 380, "bug"))


def caption(o, t):
    line = None
    lines = TL["lines"]
    for i, l in enumerate(lines):
        nxt = lines[i + 1]["start"] if i + 1 < len(lines) else TL["duration"]
        if l["start"] - 0.08 <= t < min(nxt - 0.02, l["end"] + 1.2):
            line = l
    if not line:
        return
    k = eo((t - line["start"] + 0.08) / 0.18)
    kind = "hi" if LANG == "hi" else "display"
    size = 54 if LANG == "hi" else 48
    rows = wrap(line["caption"], kind, size, 760)
    lh = size * (1.32 if LANG == "hi" else 1.22)
    bh = lh * len(rows) + 34
    y1 = SY1 - (1 - k) * 18
    y0 = y1 - bh
    widths = [measure(r.replace("*", ""), kind, size) for r in rows]
    bw = max(widths) + 56
    d = ImageDraw.Draw(o)
    rrect(d, (SCX - bw / 2, y0, SCX + bw / 2, y1), 20, fill=alpha(GRAPH, 0.84 * k))
    d.rectangle([SCX - bw / 2 + 20, y0, SCX - bw / 2 + 64, y0 + 5], fill=alpha(LIME, k))
    for i, r in enumerate(rows):
        draw_rich(d, SCX, y0 + 17 + lh * (i + 0.78), r, kind, size, color=alpha(MIST, k), accent=alpha(LIME, k), anchor="c")


def headline(o, x, y, rows, size, t0, t, anchor="l", box=False):
    """Display rows sliding up in sequence. *word* = lime. box=True draws a lime block behind."""
    kind = "hi" if LANG == "hi" else "display"
    d = ImageDraw.Draw(o)
    lh = size * (1.08 if LANG == "hi" else 1.0)
    for i, r in enumerate(rows):
        k = eo((t - t0 - i * 0.12) / 0.4)
        if k <= 0:
            continue
        yy = y + lh * (i + 1) + (1 - k) * 40
        if box:
            w = measure(r.replace("*", ""), kind, size)
            xx = x - (w / 2 if anchor == "c" else 0)
            rrect(d, (xx - 18, yy - size * 0.92, xx + w + 18, yy + size * 0.22), 6, fill=alpha(LIME, k))
            draw_rich(d, x, yy, r.replace("*", ""), kind, size, color=alpha(GRAPH, k), anchor=anchor)
        else:
            draw_rich(d, x, yy, r, kind, size, color=alpha(MIST, k), accent=alpha(LIME, k), anchor=anchor)


def mono_text(d, x, y, s, size=24, color=LIME, bold=False, anchor="ls"):
    f = _font("IBMPlexMono-600.ttf" if bold else "IBMPlexMono-400.ttf", size)
    d.text((x, y), s, font=f, fill=color, anchor=anchor)
    if BOXES is not None:
        w = f.getlength(s)
        x0 = x - (w if anchor[0] == "r" else w / 2 if anchor[0] == "m" else 0)
        BOXES.append((x0, y - size, x0 + w, y + 4, s))


def lines_of(scene):
    return [l for l in TL["lines"] if l["scene"] == scene]


# ------------------------------------------------------------------ scenes
# Each scene draws (t_local, t_global, scene dict) -> RGB frame (before HUD/captions).
FACE04 = (1010, 600)
FACE01 = (835, 430)
FACE02 = (560, 520)
FACE03 = (1010, 180)


def s_hook(tl, t, S):
    dur = S["end"] - S["start"]
    cam_cx = lerp(880, 1000, eio(tl / dur))
    img, cam = view("jackal-04", cam_cx, 750, lerp(1500, 1380, tl / dur))
    img = finish(img, t)
    o = overlay()
    d = ImageDraw.Draw(o)
    # wandering reticle that finishes on the face
    path = [(560, 820), (1350, 520), (700, 1150), (1500, 1050), (1180, 700), FACE04]
    u = clamp(tl / (dur + 0.2)) * (len(path) - 1)
    i = min(int(u), len(path) - 2)
    f = eio(u - i)
    p = (lerp(path[i][0], path[i + 1][0], f), lerp(path[i][1], path[i + 1][1], f))
    x, y = to_screen(p, cam)
    r = 110
    d.ellipse([x - r, y - r, x + r, y + r], outline=alpha(LIME, 0.95), width=4)
    d.line([(x - r - 26, y), (x - r + 18, y)], fill=LIME, width=3)
    d.line([(x + r - 18, y), (x + r + 26, y)], fill=LIME, width=3)
    d.line([(x, y - r - 26), (x, y - r + 18)], fill=LIME, width=3)
    d.line([(x, y + r - 18), (x, y + r + 26)], fill=LIME, width=3)
    pct = min(99, int(tl / dur * 100))
    mono_text(d, clamp(x - r, SX0, SX1 - 260), clamp(y + r + 44, SY0 + 120, 1180), f"{TX['scan']}… {pct:02d}%", 24, LIME, True)
    headline(o, SX0, 430, TX["hook"], 118 if LANG == "en" else 124, 0.0, tl)
    return img, o


def s_lock(tl, t, S):
    z = eio(tl / 0.9)
    vh = lerp(1380, 880, z) - tl * 12
    cy = lerp(750, FACE04[1] + 140, z)
    cx = lerp(1000, FACE04[0], z)
    img, cam = view("jackal-04", cx, cy, vh)
    img = finish(img, t)
    o = overlay()
    d = ImageDraw.Draw(o)
    x, y = to_screen(FACE04, cam)
    half = 170 * (H / vh) / (1920 / 880) + 20 * (1 - eo(tl / 0.35))
    brackets(d, (x - half, y - half, x + half, y + half), 40, LIME, 6)
    if int(tl * 6) % 2 == 0 or tl > 0.7:
        mono_text(d, x - half, y - half - 16, "TARGET LOCKED", 22, LIME, True)
    k = eo((tl - 0.7) / 0.4)
    if k > 0:
        y0 = 900 + (1 - k) * 40
        rrect(d, (SX0, y0, SX0 + 600, y0 + 250), 22, fill=alpha(GRAPH, 0.88 * k))
        mono_text(d, SX0 + 30, y0 + 46, "SPECIES DETECTED", 22, alpha(LIME, k), True)
        d.text((SX0 + 28, y0 + 120), "Golden Jackal", font=_font("SpaceGrotesk-700.ttf", 62), fill=alpha(MIST, k), anchor="ls")
        mono_text(d, SX0 + 30, y0 + 166, "Canis aureus", 28, alpha(MIST, 0.8 * k))
        local = TX["species_local"]
        for sub, f in runs(local, "hi-m"):
            pass
        draw_rich(d, SX0 + 30, y0 + 222, local, "hi-m", 36, color=alpha(LIME, k))
    return img, o


def s_location(tl, t, S):
    dur = S["end"] - S["start"]
    img, cam = view("jackal-01", lerp(720, 880, eio(tl / dur)), 600, lerp(1200, 1080, tl / dur))
    img = finish(img, t)
    o = overlay()
    d = ImageDraw.Draw(o)
    L = lines_of("location")
    k = eo((tl - 0.2) / 0.45)
    y0 = 1010 + (1 - k) * 60
    rrect(d, (SX0, y0, SX1, y0 + 132), 66, fill=alpha(GRAPH, 0.92 * k))
    # avatar drops in
    kb = back((tl - 0.35) / 0.5)
    av = avatar(104)
    if kb > 0:
        o.alpha_composite(av, (SX0 + 14, int(y0 + 14 - (1 - kb) * 80)))
    d.text((SX0 + 140, y0 + 64), "Dhikala Zone", font=_font("SpaceGrotesk-700.ttf", 46), fill=alpha(MIST, k), anchor="ls")
    mono_text(d, SX0 + 142, y0 + 100, "CORBETT NP · UTTARAKHAND", 21, alpha(LIME, k))
    coords = "29.5°N  78.9°E"
    n = int(clamp((tl - 0.6) / 1.0) * len(coords))
    mono_text(d, SX1 - 34, y0 + 64, coords[:n], 21, alpha(MIST, 0.8 * k), anchor="rs")
    if BOXES is not None:
        BOXES.append((SX0, y0, SX1, y0 + 132, "pill"))
    k2 = eo((t - L[1]["start"] + 0.1) / 0.35)
    if k2 > 0:
        y1 = y0 - 70 + (1 - k2) * 20
        s = "› NEAR SARAPDULI F.R.H."
        f = _font("IBMPlexMono-600.ttf", 24)
        rrect(d, (SX0 + 20, y1, SX0 + 20 + f.getlength(s) + 36, y1 + 50), 10, fill=alpha(LIME, k2))
        mono_text(d, SX0 + 38, y1 + 34, s, 24, alpha(GRAPH, k2), True)
    return img, o


def s_stare(tl, t, S):
    dur = S["end"] - S["start"]
    vh = lerp(1150, 720, eio(tl / dur))
    img, cam = view("jackal-03", FACE03[0], 0, vh)
    img = finish(img, t)
    o = overlay()
    d = ImageDraw.Draw(o)
    for ex in (975, 1050):
        x, y = to_screen((ex, 165), cam)
        r = 34 * H / vh / 1.6 + 6
        k = eo((tl - 0.3) / 0.3)
        if k > 0:
            brackets(d, (x - r, y - r * 0.7, x + r, y + r * 0.7), 14, alpha(LIME, k), 4)
    k = eo((tl - 0.5) / 0.4)
    if k > 0:
        y0 = 1060
        rrect(d, (SX0, y0, SX0 + 470, y0 + 64), 12, fill=alpha(GRAPH, 0.88 * k))
        mono_text(d, SX0 + 22, y0 + 43, "EYE CONTACT › LOCKED", 26, alpha(LIME, k), True)
        stare = f"STARE {tl:04.1f}s"
        mono_text(d, SX0 + 4, y0 + 110, stare, 22, alpha(MIST, 0.8 * k))
    return img, o


def s_howl(tl, t, S):
    dur = S["end"] - S["start"]
    img, cam = view("jackal-02", lerp(640, 560, eio(tl / dur)), 560, lerp(1200, 980, tl / dur))
    L = lines_of("howl")
    dusk = eio((t - L[0]["start"]) / 1.6)
    a = np.asarray(img, np.float32)
    tint = np.array([0.55, 0.62, 0.85], np.float32) * (1 - dusk) + np.array([0.42, 0.52, 0.72], np.float32) * dusk
    a = a * (1 - dusk * (1 - tint))
    a[..., 0] += 18 * dusk * np.linspace(1, 0, H, dtype=np.float32)[:, None]  # last orange light at the top
    img = finish(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)), t)
    o = overlay()
    d = ImageDraw.Draw(o)
    # dusk clock
    mins = int(lerp(17 * 60 + 58, 18 * 60 + 42, dusk))
    k = eo(tl / 0.4)
    y0 = 430
    rrect(d, (SX0, y0, SX0 + 420, y0 + 64), 12, fill=alpha(GRAPH, 0.85 * k))
    mono_text(d, SX0 + 22, y0 + 43, f"{mins // 60:02d}:{mins % 60:02d} IST · DUSK", 26, alpha(LIME, k), True)
    # sun sinking, moon rising
    cx = SX0 + 520
    sy = y0 + 32 + dusk * 40
    d.pieslice([cx - 26, sy - 26, cx + 26, sy + 26], 180, 360, fill=alpha((240, 170, 80), (1 - dusk) * k))
    if dusk > 0.3:
        d.ellipse([cx - 22, y0 + 10 - (dusk - 0.3) * 30, cx + 22, y0 + 54 - (dusk - 0.3) * 30], fill=alpha(MIST, dusk * k))
    # howl waveform in the gap after line 2
    h0 = L[1]["end"] - 0.15
    hk = clamp((t - h0) / 0.3) * clamp((L[2]["end"] + 0.4 - t) / 0.4)
    if hk > 0:
        yc = 1060
        n = 64
        x0, x1 = SX0 + 6, SX1 - 6
        mono_text(d, SX0, yc - 110, "AUDIO › DUSK HOWL · Canis aureus", 22, alpha(LIME, hk), True)
        for i in range(n):
            u = (t - h0) * 3 - i * 0.07
            amp = (0.35 + 0.65 * abs(math.sin(u * 1.7 + i * 0.4))) * math.exp(-((i - n / 2) / (n / 2.4)) ** 2)
            live = clamp((t - h0) / 2.6) if t < L[2]["start"] else 0.4
            hh = 6 + 80 * amp * (0.3 + 0.7 * live)
            x = x0 + (x1 - x0) * i / (n - 1)
            d.rounded_rectangle([x - 4, yc - hh, x + 4, yc + hh], 4, fill=alpha(LIME, hk))
        if BOXES is not None:
            BOXES.append((x0 - 4, yc - 90, x1 + 4, yc + 90, "wave"))
    return img, o


def s_hunter(tl, t, S):
    dur = S["end"] - S["start"]
    img, cam = view("jackal-01", lerp(800, FACE01[0], eio(tl / dur)), lerp(640, 560, tl / dur), lerp(1200, 900, eio(tl / dur)))
    img = finish(img, t)
    o = overlay()
    d = ImageDraw.Draw(o)
    L = lines_of("hunter")
    # respect meter during line 1
    k = eo((t - L[0]["start"] + 0.1) / 0.35) * (1 - eo((t - L[1]["start"] + 0.2) / 0.3))
    if k > 0:
        y0 = 440
        rrect(d, (SX0, y0, SX1, y0 + 220), 22, fill=alpha(GRAPH, 0.88 * k))
        mono_text(d, SX0 + 30, y0 + 50, "RESPECT METER", 22, alpha(LIME, k), True)
        for j, (name, val) in enumerate((("TIGER", 1.0), ("JACKAL", 0.18))):
            yy = y0 + 100 + j * 70
            mono_text(d, SX0 + 30, yy + 22, name, 26, alpha(MIST, k), True)
            bx0, bx1 = SX0 + 210, SX1 - 34
            rrect(d, (bx0, yy, bx1, yy + 30), 6, outline=alpha(MIST, 0.35 * k), width=2)
            fill = val * eo((t - L[0]["start"] - 0.3 - j * 0.3) / 0.8)
            if fill > 0.01:
                rrect(d, (bx0 + 4, yy + 4, bx0 + 4 + (bx1 - bx0 - 8) * fill, yy + 26), 4, fill=alpha(LIME if j == 0 else (235, 90, 70), k))
    # stamp from line 2
    if t >= L[1]["start"] - 0.05:
        headline(o, SX0, 420, TX["hunter"], 112 if LANG == "en" else 116, L[1]["start"] + 0.15, t, box=False)
    # diet log during line 3
    k = eo((t - L[2]["start"] + 0.1) / 0.3)
    if k > 0:
        y0 = 740
        rrect(d, (SX0, y0, SX0 + 560, y0 + 330), 22, fill=alpha(GRAPH, 0.88 * k))
        mono_text(d, SX0 + 30, y0 + 50, "DIET LOG", 22, alpha(LIME, k), True)
        span = L[2]["end"] - L[2]["start"]
        for q, item in enumerate(TX["diet"]):
            kq = eo((t - L[2]["start"] - span * (q + 0.3) / 4) / 0.2)
            if kq <= 0:
                continue
            yy = y0 + 110 + q * 58
            rrect(d, (SX0 + 30, yy - 28, SX0 + 64, yy + 6), 6, fill=alpha(LIME, kq))
            d.line([(SX0 + 37, yy - 11), (SX0 + 45, yy - 2), (SX0 + 58, yy - 22)], fill=alpha(GRAPH, kq), width=4)
            draw_rich(d, SX0 + 86, yy, item, "hi-m" if LANG == "hi" else "display-m" if False else "hi-m", 38, color=alpha(MIST, kq))
    return img, o


def canid_print(d, x, y, s, ang, fill):
    """Jackal/dog print: oval pad, four oval toes, claw dots. ang = direction of travel."""
    ca, sa = math.cos(ang), math.sin(ang)

    def P(u, v):  # u forward, v sideways
        return (x + u * ca * s - v * sa * s, y + u * sa * s + v * ca * s)

    def ell(u, v, ru, rv):
        pts = [P(u + ru * math.cos(a), v + rv * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 24)]
        d.polygon(pts, fill=fill)

    ell(-0.25, 0, 0.32, 0.36)
    for u, v in ((0.45, -0.17), (0.45, 0.17), (0.2, -0.45), (0.2, 0.45)):
        ell(u, v, 0.17, 0.13)
    for u, v in ((0.72, -0.17), (0.72, 0.17), (0.45, -0.58), (0.45, 0.58)):
        ell(u, v, 0.05, 0.04)


def tiger_print(d, x, y, s, ang, color, width):
    ca, sa = math.cos(ang), math.sin(ang)

    def P(u, v):
        return (x + u * ca * s - v * sa * s, y + u * sa * s + v * ca * s)

    def ell(u, v, ru, rv):
        pts = [P(u + ru * math.cos(a), v + rv * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 28)]
        d.line(pts + [pts[0]], fill=color, width=width, joint="curve")

    ell(-0.2, 0, 0.42, 0.5)
    for u, v in ((0.42, -0.22), (0.5, 0.08), (0.36, 0.38), (0.15, -0.55)):
        ell(u, v, 0.15, 0.14)


def s_cleaner(tl, t, S):
    dur = S["end"] - S["start"]
    bgp, _ = view("jackal-02", 700, 600, 1200)
    bg = bgp.filter(ImageFilter.GaussianBlur(18))
    img = Image.blend(bg, topo(), 0.82)
    o = overlay()
    d = ImageDraw.Draw(o)
    L = lines_of("cleaner")
    # trail: tiger prints then jackal prints following, bottom-left to top-right, inside the safe area
    trail = [(SX0 + 80 + i * 92, 1150 - i * 66 + (28 if i % 2 else -28)) for i in range(9)]
    ang = math.atan2(-66, 92)
    t0 = L[0]["start"] - 0.2
    for i, (x, y) in enumerate(trail):
        k = clamp((t - t0 - i * 0.22) / 0.2)
        if k > 0:
            tiger_print(d, x, y, 78, ang, alpha(LIME, k), 5)
    for i, (x, y) in enumerate(trail[:-1]):
        k = clamp((t - t0 - 1.0 - i * 0.22) / 0.2)
        if k > 0:
            canid_print(d, x - 30, y + 46, 44, ang, alpha(MIST, k))
    kk = eo((t - t0 - 0.4) / 0.4)
    if kk > 0:
        mono_text(d, trail[2][0] + 60, trail[2][1] + 10, "TIGER", 24, alpha(LIME, kk), True)
        mono_text(d, trail[1][0] + 20, trail[1][1] + 110, "JACKAL", 24, alpha(MIST, eo((t - t0 - 1.4) / 0.4)), True)
    # kill-site share marker on line 2
    k2 = eo((t - L[1]["start"]) / 0.35)
    if k2 > 0:
        x, y = trail[-1]
        x = min(x, SX1 - 70)
        d.ellipse([x - 52, y - 52, x + 52, y + 52], outline=alpha(LIME, k2), width=5)
        d.pieslice([x - 40, y - 40, x + 40, y + 40], -90, -90 + 90 * k2, fill=alpha(LIME, k2))
        mono_text(d, x, y + 92, "SHARE", 22, alpha(LIME, k2), True, anchor="ms")
    # headline on line 3
    headline(o, SX0, 400, TX["cleaner"], 104 if LANG == "en" else 112, L[2]["start"], t)
    k3 = eo((t - L[2]["start"] - 0.6) / 0.4)
    if k3 > 0:
        mono_text(d, SX0, 680, "ROLE › FOREST CLEAN-UP CREW" if LANG == "en" else "ROLE › FOREST CLEAN-UP CREW", 24, alpha(LIME, k3), True)
    return img, o


def s_loyal(tl, t, S):
    dur = S["end"] - S["start"]
    img, cam = view("jackal-03", lerp(950, 1010, eio(tl / dur)), 600, lerp(1200, 1050, tl / dur))
    img = finish(img, t)
    o = overlay()
    d = ImageDraw.Draw(o)
    L = lines_of("loyal")
    k = eo((t - L[0]["start"] + 0.1) / 0.35)
    y0 = 880
    if k > 0:
        rrect(d, (SX0, y0, SX1, y0 + 120), 22, fill=alpha(GRAPH, 0.9 * k))
        mono_text(d, SX0 + 30, y0 + 48, "LOYALTY", 24, alpha(LIME, k), True)
        segs = 16
        fill = eio((t - L[0]["start"] - 0.2) / 1.6)
        for s in range(segs):
            x = SX0 + 30 + s * 45
            on = s < round(fill * segs)
            d.rounded_rectangle([x, y0 + 66, x + 36, y0 + 96], 4, fill=alpha(LIME if on else (40, 62, 58), k))
        pct = int(fill * 100)
        mono_text(d, SX1 - 30, y0 + 48, f"{pct}%", 26, alpha(MIST, k), True, anchor="rs")
    for j, (a, b) in enumerate(TX["loyal_rows"]):
        kj = eo((t - L[1 + j]["start"]) / 0.35)
        if kj <= 0:
            continue
        yy = y0 + 140 + j * 96 + (1 - kj) * 20
        rrect(d, (SX0, yy, SX1, yy + 82), 18, fill=alpha(GRAPH, 0.9 * kj))
        o.alpha_composite(avatar(56), (SX0 + 14, int(yy + 13)))
        draw_rich(d, SX0 + 90, yy + 37, a, "hi-m", 30, color=alpha(LIME, kj))
        draw_rich(d, SX0 + 90, yy + 70, b, "hi-m", 30, color=alpha(MIST, kj))
    return img, o


def s_salute(tl, t, S):
    dur = S["end"] - S["start"]
    z = eio(tl / dur)
    img, cam = view("jackal-04", lerp(FACE04[0], 1000, z), lerp(FACE04[1] + 120, 750, z), lerp(800, 1500, z))
    img = finish(img, t)
    o = overlay()
    d = ImageDraw.Draw(o)
    k = back((tl - 0.15) / 0.5, 1.2)
    if k > 0:
        size = int(190 * (1.25 - 0.25 * min(k, 1)))
        kind = "hi" if LANG == "hi" else "display"
        draw_rich(d, SCX, 640, TX["salute"][0], kind, size, color=alpha(MIST, clamp(k)), accent=alpha(LIME, clamp(k)), anchor="c")
    k2 = eo((tl - 0.6) / 0.4)
    if k2 > 0:
        draw_rich(d, SCX, 712, TX["salute_sub"], "hi-m", 32, color=alpha(MIST, k2), anchor="c")
    return img, o


def s_cta(tl, t, S):
    img = topo().copy()
    o = overlay()
    d = ImageDraw.Draw(o)
    L = lines_of("cta")
    # emblem drop
    kb = back(tl / 0.6, 1.3)
    em = emblem(330)
    ex = SCX - 165
    ey = int(400 - (1 - kb) * 160)
    if kb > 0:
        ring = int(220 + 30 * math.sin(tl * 3))
        d.ellipse([SCX - ring, 600 - ring, SCX + ring, 600 + ring], outline=alpha(CANOPY, 0.9), width=2)
        o.alpha_composite(em, (ex, ey))
    k = eo((tl - 0.4) / 0.4)
    if k > 0:
        f = _font("SpaceGrotesk-700.ttf", 66)
        w = f.getlength("explore/indian/wildlife")
        wordmark(ImageDraw.Draw(o), SCX - w / 2, 925 + (1 - k) * 20, 66)
        mono_text(d, SCX, 975, "// tracking India's wild, one pugmark at a time", 22, alpha(LIME, k), anchor="ms")
    # buttons
    tap = L[0]["end"] - 0.6
    k = eo((tl - 0.8) / 0.4)
    if k > 0:
        y0 = 1030
        done = t >= tap + 0.08
        press = 1 - 0.06 * math.sin(math.pi * clamp((t - tap) / 0.2))
        bw, bh = 380, 96
        bx = SX0 + 10
        cx, cy = bx + bw / 2, y0 + bh / 2
        rrect(d, (cx - bw / 2 * press, cy - bh / 2 * press, cx + bw / 2 * press, cy + bh / 2 * press), 48,
              fill=alpha(MIST if done else LIME, k))
        lab = TX["subscribe"]
        kind = "hi" if LANG == "hi" else "display"
        draw_rich(d, cx + 14, cy + 15, lab if LANG == "hi" else lab, kind, 36, color=alpha(GRAPH, k), anchor="c")
        # bell
        bxl = cx - bw / 2 + 44
        d.pieslice([bxl - 16, cy - 20, bxl + 16, cy + 14], 180, 360, fill=alpha(GRAPH, k))
        d.rectangle([bxl - 16, cy - 4, bxl + 16, cy + 8], fill=alpha(GRAPH, k))
        d.ellipse([bxl - 5, cy + 8, bxl + 5, cy + 18], fill=alpha(GRAPH, k))
        fx0 = bx + bw + 30
        rrect(d, (fx0, y0, SX1 - 10, y0 + bh), 48, outline=alpha(MIST, k), width=4)
        draw_rich(d, (fx0 + SX1 - 10) / 2, cy + 14, TX["follow"], kind, 36, color=alpha(MIST, k), anchor="c")
        mono_text(d, SCX, y0 + bh + 48, "YOUTUBE · INSTAGRAM", 22, alpha(MIST, 0.7 * k), anchor="ms")
        if BOXES is not None:
            BOXES.append((bx, y0, SX1 - 10, y0 + bh, "buttons"))
        # tapping finger dot
        if tap - 0.5 < t < tap + 0.5:
            fk = 1 - abs(t - tap) / 0.5
            fx_, fy_ = cx + 60, cy + 30 + (1 - fk) * 60
            d.ellipse([fx_ - 30, fy_ - 30, fx_ + 30, fy_ + 30], fill=(255, 255, 255, int(150 * fk)), outline=alpha(GRAPH, fk), width=3)
    return img, o


SCENE_FN = {n[2:]: f for n, f in globals().items() if n.startswith("s_")}


# ------------------------------------------------------------------ frame
def scene_at(t):
    for i, s in enumerate(TL["scenes"]):
        if s["start"] <= t < s["end"] or i == len(TL["scenes"]) - 1:
            return i, s
    return 0, TL["scenes"][0]


def draw_scene(s, t):
    img, o = SCENE_FN[s["name"]](t - s["start"], t, s)
    img = img.convert("RGBA")
    img.alpha_composite(o)
    return img


WIPE = 0.32


def frame(t):
    i, s = scene_at(t)
    img = draw_scene(s, t)
    # lime scan-bar wipe into each scene: old scene stays on the right of the bar
    if i > 0 and t - s["start"] < WIPE:
        u = eio((t - s["start"]) / WIPE)
        prev = TL["scenes"][i - 1]
        old = draw_scene(prev, t)
        xb = int(u * (W + 40)) - 20
        if xb < W:
            img.paste(old.crop((max(xb, 0), 0, W, H)), (max(xb, 0), 0))
        dd = ImageDraw.Draw(img)
        dd.rectangle([xb - 10, 0, xb + 10, H], fill=LIME + (255,))
        dd.rectangle([xb - 40, 0, xb - 10, H], fill=LIME + (60,))
    o = overlay()
    if s["name"] != "cta":
        hud(o, t)
    caption(o, t)
    img.alpha_composite(o)
    return img.convert("RGB")


def load(lang):
    global LANG, TL, TX
    LANG = lang
    TL = json.load(open(os.path.join(HERE, "build", f"vo-{lang}.json")))
    TX = TEXT[lang]


def _render_chunk(args):
    lang, i0, i1, path = args
    load(lang)
    with open(path, "wb") as f:
        for i in range(i0, i1):
            f.write(frame(i / FPS).tobytes())
    return path


def render(lang):
    load(lang)
    n = int(TL["duration"] * FPS)
    os.makedirs(os.path.join(HERE, "output"), exist_ok=True)
    out = os.path.join(HERE, "output", f"jackal-{lang}.mp4")
    workers = os.cpu_count() or 2
    step = math.ceil(n / workers)
    chunks = [(lang, a, min(n, a + step), os.path.join(HERE, "build", f"raw-{lang}-{k}.rgb"))
              for k, a in enumerate(range(0, n, step))]
    with Pool(workers) as p:
        p.map(_render_chunk, chunks)
    cat = subprocess.Popen(["cat"] + [c[3] for c in chunks], stdout=subprocess.PIPE)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                    "-r", str(FPS), "-i", "-", "-i", os.path.join(HERE, "build", f"mix-{lang}.wav"),
                    "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-maxrate", "6M", "-bufsize", "12M", "-pix_fmt", "yuv420p", "-profile:v", "high",
                    "-movflags", "+faststart", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k",
                    "-ar", "48000", "-shortest", out], stdin=cat.stdout, check=True)
    for c in chunks:
        os.remove(c[3])
    print(out)


def thumbnail(lang):
    """9:16 cover in the brand thumbnail style: REC chip, lime-box headline, track tag."""
    load(lang)
    img, cam = view("jackal-03", FACE03[0], 0, 760)
    img = finish(img, 0).convert("RGBA")
    o = overlay()
    d = ImageDraw.Draw(o)
    rrect(d, (SX0, 320, SX0 + 500, 370), 6, fill=GRAPH + (235,))
    d.ellipse([SX0 + 18, 337, SX0 + 34, 353], fill=LIME)
    mono_text(d, SX0 + 48, 355, "REC · DHIKALA, CORBETT", 24, LIME, True)
    rows = ["जंगल का", "सफ़ाईकर्मी"] if lang == "hi" else ["THE FOREST'S", "CLEANER."]
    kind = "hi" if lang == "hi" else "display"
    size = 120 if lang == "hi" else 110
    y = 1000
    for r in rows:
        w = measure(r, kind, size)
        rrect(d, (SX0 - 6, y - size * 0.9, SX0 + w + 30, y + size * 0.24), 6, fill=LIME + (255,))
        draw_rich(d, SX0 + 12, y, r, kind, size, color=GRAPH)
        y += size * 1.22
    rrect(d, (SX1 - 190, y - 40, SX1, y + 10), 6, fill=GRAPH + (235,))
    mono_text(d, SX1 - 95, y - 6, TRACK_ID, 24, MIST, anchor="ms")
    o.alpha_composite(pin_icon(64), (SX0, int(y + 40)))
    wordmark(d, SX0 + 84, int(y + 100), 44)
    img.alpha_composite(o)
    out = os.path.join(HERE, "output", f"jackal-{lang}-cover.jpg")
    img.convert("RGB").save(out, quality=92)
    print(out)


def check(lang):
    global BOXES
    load(lang)
    bad = 0
    for i in range(0, int(TL["duration"] * FPS), 3):
        BOXES = []
        frame(i / FPS)
        for x0, y0, x1, y1, s in BOXES:
            if x0 < SX0 - 1 or x1 > SX1 + 1 or y0 < SY0 - 1 or y1 > SY1 + 1:
                bad += 1
                if bad < 25:
                    print(f"t={i / FPS:5.2f} out of safe area: ({x0:.0f},{y0:.0f},{x1:.0f},{y1:.0f}) {s[:40]}")
    BOXES = None
    print("safe-area violations:", bad)


if __name__ == "__main__":
    lang = sys.argv[1]
    if "--frames" in sys.argv:
        load(lang)
        for ts in sys.argv[sys.argv.index("--frames") + 1].split(","):
            frame(float(ts)).save(os.path.join(HERE, "build", f"frame-{lang}-{ts}.jpg"), quality=88)
    elif "--thumbnail" in sys.argv:
        thumbnail(lang)
    elif "--check" in sys.argv:
        check(lang)
    else:
        render(lang)
