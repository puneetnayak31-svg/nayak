"""Renders a 9:16 Instagram Reel for one of Dr Piyush Kiran Nayak's paintings.

Usage:
    python3 render.py SLUG OUT.mp4 MUSIC.wav [--safezones]
    python3 render.py SLUG OUTPREFIX --frames 3.5,8      # still frames (design check)
    python3 render.py SLUG OUT.jpg --thumbnail           # thumbnail (title card)
    python3 render.py SLUG x --check                     # safe-area check

Stories, camera moves and music styles live in paintings.py. Every caption and CTA
stays inside the Instagram Reels safe area (top 270 px, bottom 440 px, right 150 px
and left 90 px carry no text).
"""
import math
import os
import subprocess
import sys
from functools import lru_cache
from multiprocessing import Pool

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from music import bar_seconds
from paintings import CREDENTIALS, PAINTINGS, SCENE_BARS

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, "assets")
FONTS = os.path.join(A, "fonts")

W, H = 1080, 1920
FPS = 30

# Instagram Reels safe area for text and key graphics
SAFE_TOP, SAFE_BOTTOM, SAFE_LEFT, SAFE_RIGHT = 270, H - 440, 90, W - 150
CX = 540

CREAM = (250, 244, 230)
PAPER = (246, 238, 220)
RED = (176, 36, 28)
INK = (26, 22, 20)
GREEN = (78, 122, 46)
GOLD = (232, 182, 72)
WHITE = (255, 255, 255)

SAFEZONES = False
TEXT_BOUNDS = None  # list when checking the safe area

LOGO = Image.open(os.path.join(A, "logo.png")).convert("RGBA")
UP = 2

# Set by load(): the current painting and its timeline.
P = PAINT = PAINT_UP = CONTENT = SHADE = None
BAR = DUR = 0.0
SCENES = []


def load(slug):
    global P, PAINT, PAINT_UP, CONTENT, SHADE, BAR, DUR, SCENES
    P = PAINTINGS[slug]
    PAINT = Image.open(os.path.join(A, "paintings", slug + ".png")).convert("RGB")
    PAINT_UP = PAINT.resize((PAINT.width * UP, PAINT.height * UP), Image.LANCZOS).filter(
        ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
    CONTENT = P["content"]  # painted area inside the photograph (excludes the dark surround)
    SHADE = P["shade"]
    BAR = bar_seconds(slug)
    fns = {"hook": s_hook, "title": s_title, "story": s_story, "statement": s_statement,
           "technique": s_technique, "elements": s_elements, "reveal": s_reveal,
           "artist": s_artist, "cta": s_cta}
    SCENES, t = [], 0.0
    for name, bars in SCENE_BARS:
        SCENES.append((t, t + bars * BAR, fns[name]))
        t += bars * BAR
    DUR = t


def font(name, size):
    files = {
        "serif": "CormorantGaramond_500Medium.ttf",
        "serif-semi": "CormorantGaramond_600SemiBold.ttf",
        "serif-italic": "CormorantGaramond_500Medium_Italic.ttf",
        "sans": "Jost_400Regular.ttf",
        "sans-medium": "Jost_500Medium.ttf",
        "sans-semi": "Jost_600SemiBold.ttf",
        "deva": "TiroDevanagariHindi_400Regular.ttf",
    }
    return _font(files[name], size)


@lru_cache(None)
def _font(f, size):
    return ImageFont.truetype(os.path.join(FONTS, f), size)


# ------------------------------------------------------------------ easing
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_in_out(x):
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def lerp(a, b, x):
    return a + (b - a) * x


def back_out(x, s=1.4):
    x = clamp(x)
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


# ------------------------------------------------------------------ painting views
def view(cx, cy, vw, ow=W, oh=H, src=None):
    """Window of the painting centred on (cx, cy) in painting px, vw px wide,
    scaled to ow x oh. Clamped to the painted area so no dark edge shows."""
    vh = vw * oh / ow
    x0, y0, x1, y1 = CONTENT
    vw = min(vw, x1 - x0)
    vh = min(vh, y1 - y0)
    vw = min(vw, vh * ow / oh)
    vh = vw * oh / ow
    cx = clamp(cx, x0 + vw / 2, x1 - vw / 2)
    cy = clamp(cy, y0 + vh / 2, y1 - vh / 2)
    box = ((cx - vw / 2) * UP, (cy - vh / 2) * UP, (cx + vw / 2) * UP, (cy + vh / 2) * UP)
    return (src or PAINT_UP).resize((int(ow), int(oh)), Image.BICUBIC, box=box)


def full_painting(ow, z=1.0, fx=0.5, fy=0.5):
    """Whole painted area at zoom z (1 = entire painting) scaled to width ow."""
    x0, y0, x1, y1 = CONTENT
    cw, ch = x1 - x0, y1 - y0
    oh = round(ow * ch / cw)
    vw = cw / z
    vh = ch / z
    cx = x0 + vw / 2 + (cw - vw) * fx
    cy = y0 + vh / 2 + (ch - vh) * fy
    box = ((cx - vw / 2) * UP, (cy - vh / 2) * UP, (cx + vw / 2) * UP, (cy + vh / 2) * UP)
    return PAINT_UP.resize((ow, oh), Image.LANCZOS, box=box)


# ------------------------------------------------------------------ decorative pieces
def _paper():
    import random
    rnd = random.Random(3)
    base = Image.new("RGB", (W // 4, H // 4), PAPER)
    px = base.load()
    for y in range(H // 4):
        for x in range(W // 4):
            n = rnd.randint(-5, 5)
            r, g, b = PAPER
            px[x, y] = (r + n, g + n, b + n - 1)
    base = base.resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))
    # warm vignette
    v = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(v)
    d.ellipse((-W * 0.35, -H * 0.15, W * 1.35, H * 1.15), fill=255)
    v = v.filter(ImageFilter.GaussianBlur(160))
    dark = Image.new("RGB", (W, H), (226, 208, 178))
    return Image.composite(base, dark, v)


PAPER_BG = _paper()


def petal_band(width, height=84, up=True):
    """Mithila border: red petals between ink rules, with dots (as in the logo)."""
    s = 3
    w, h = width * s, height * s
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    lw = 3 * s
    d.rectangle((0, 0, w, h), fill=CREAM + (255,))
    d.line((0, 6 * s, w, 6 * s), fill=INK, width=lw)
    d.line((0, h - 6 * s, w, h - 6 * s), fill=INK, width=lw)
    unit = 54 * s
    top, bot = 14 * s, h - 14 * s
    n = w // unit + 2
    off = (w - (n - 1) * unit) / 2
    for i in range(n):
        x = off + i * unit
        pts = []
        steps = 18
        base_y, tip_y = (bot, top) if up else (top, bot)
        half = unit * 0.42
        for k in range(steps + 1):  # left edge: concave curve to tip
            a = k / steps
            px_ = x - half + half * a
            py_ = base_y + (tip_y - base_y) * (a ** 0.75)
            pts.append((px_ - half * 0.18 * math.sin(math.pi * a), py_))
        for k in range(steps + 1):
            a = 1 - k / steps
            px_ = x + half - half * a
            py_ = base_y + (tip_y - base_y) * (a ** 0.75)
            pts.append((px_ + half * 0.18 * math.sin(math.pi * a), py_))
        d.polygon(pts, fill=RED, outline=INK, width=2 * s)
        dx = x + unit / 2
        dy = (top + bot) / 2 + (8 * s if up else -8 * s)
        d.ellipse((dx - 4 * s, dy - 4 * s, dx + 4 * s, dy + 4 * s), fill=INK)
    return im.resize((width, height), Image.LANCZOS)


def petal_ring(diameter, band=64, n=30):
    """Circular Mithila petal ring (outer band of the artist's logo)."""
    s = 2
    D = diameter * s
    im = Image.new("RGBA", (D, D), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = D / 2
    ro = D / 2 - 4 * s
    ri = ro - band * s
    d.ellipse((c - ro, c - ro, c + ro, c + ro), fill=CREAM + (255,), outline=INK, width=4 * s)
    d.ellipse((c - ri, c - ri, c + ri, c + ri), outline=INK, width=4 * s)
    pr_in, pr_out = ri + 7 * s, ro - 9 * s
    for i in range(n):
        a0 = 2 * math.pi * i / n
        span = 2 * math.pi / n * 0.46
        pts = []
        for k in range(13):
            f = k / 12
            ang = a0 - span + 2 * span * f
            r = pr_in + (pr_out - pr_in) * (1 - abs(2 * f - 1)) ** 0.7
            pts.append((c + r * math.cos(ang), c + r * math.sin(ang)))
        d.polygon(pts, fill=RED, outline=INK, width=2 * s)
        ad = a0 + math.pi / n
        rd = (pr_in + pr_out) / 2 + 6 * s
        d.ellipse((c + rd * math.cos(ad) - 4 * s, c + rd * math.sin(ad) - 4 * s,
                   c + rd * math.cos(ad) + 4 * s, c + rd * math.sin(ad) + 4 * s), fill=INK)
    # punch the centre
    m = Image.new("L", (D, D), 255)
    ImageDraw.Draw(m).ellipse((c - ri + 2 * s, c - ri + 2 * s, c + ri - 2 * s, c + ri - 2 * s), fill=0)
    im.putalpha(Image.composite(im.getchannel("A"), Image.new("L", (D, D), 0), m))
    return im.resize((diameter, diameter), Image.LANCZOS)


def lotus(size=90, color=RED):
    s = 4
    S = size * s
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, by = S / 2, S * 0.78
    lw = int(2.4 * s)

    def petal(angle, length, width):
        pts = []
        for k in range(25):
            f = k / 24
            y = -length * f
            x = width * math.sin(math.pi * f) ** 0.8
            pts.append((x, y))
        pts += [(-x, y) for x, y in reversed(pts)]
        ca, sa = math.cos(angle), math.sin(angle)
        return [(cx + x * ca - y * sa, by + x * sa + y * ca) for x, y in pts]

    for ang, ln, wd in [(-1.15, S * .34, S * .07), (1.15, S * .34, S * .07),
                        (-0.55, S * .5, S * .1), (0.55, S * .5, S * .1), (0, S * .62, S * .12)]:
        d.polygon(petal(ang, ln, wd), fill=CREAM + (255,), outline=color, width=lw)
    d.arc((cx - S * .3, by - S * .12, cx + S * .3, by + S * .12), 0, 180, fill=color, width=lw)
    return im.resize((size, size), Image.LANCZOS)


BAND_TOP = petal_band(W, 84, up=False)
BAND_BOT = petal_band(W, 84, up=True)
RING_MED = petal_ring(860, band=70, n=34)
RING_LOGO = petal_ring(440, band=40, n=26)
LOTUS = lotus(96)
LOTUS_W = lotus(80, CREAM)


def circle_mask(d, s=3):
    m = Image.new("L", (d * s, d * s), 0)
    ImageDraw.Draw(m).ellipse((0, 0, d * s - 1, d * s - 1), fill=255)
    return m.resize((d, d), Image.LANCZOS)


MASK_MED = circle_mask(730)


# ------------------------------------------------------------------ text
MAX_TEXT_W = 2 * min(CX - SAFE_LEFT, SAFE_RIGHT - CX) - 20


def is_deva(text):
    return any("\u0900" <= ch <= "\u097f" for ch in text)


@lru_cache(512)
def text_img(text, fname, size, fill, tracking=0, shadow=0):
    if is_deva(text):
        tracking = 0  # letter-spacing would break the conjuncts
    f = font(fname, size)
    if tracking:
        widths = [f.getlength(ch) for ch in text]
        tw = sum(widths) + tracking * (len(text) - 1)
    else:
        tw = f.getlength(text)
    asc, desc = f.getmetrics()
    # put_text shifts by 0.18 * align; for Devanagari that lands the headline (shirorekha) on y
    align = f.getbbox("क")[1] / 0.18 if is_deva(text) else asc
    pad = 30 + shadow * 2
    im = Image.new("RGBA", (int(tw) + pad * 2, asc + desc + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if tracking:
        x = pad
        for ch, wch in zip(text, widths):
            d.text((x, pad), ch, font=f, fill=fill)
            x += wch + tracking
    else:
        d.text((pad, pad), text, font=f, fill=fill)
    if shadow:
        a = im.getchannel("A").filter(ImageFilter.GaussianBlur(shadow))
        sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
        sh.putalpha(a.point(lambda v: int(v * 0.85)))
        sh.alpha_composite(im)
        sh.alpha_composite(im)
        im = Image.alpha_composite(sh, im)
    return im, pad, align


def fade_alpha(im, alpha):
    if alpha >= 0.999:
        return im
    im = im.copy()
    im.putalpha(im.getchannel("A").point(lambda v: int(v * alpha)))
    return im


def put_text(canvas, text, fname, size, fill, y, alpha=1.0, x=CX, align="center",
             tracking=0, shadow=0, dy=0.0):
    """y is the top of the cap line. Returns the rendered width."""
    if alpha <= 0.003:
        return 0
    im, pad, asc = text_img(text, fname, size, fill, tracking, shadow)
    tw = im.width - 2 * pad
    if tw > MAX_TEXT_W and align == "center":  # shrink to fit the safe width
        size = int(size * MAX_TEXT_W / tw)
        im, pad, asc = text_img(text, fname, size, fill, tracking, shadow)
        tw = im.width - 2 * pad
    if align == "center":
        px = x - tw / 2 - pad
    elif align == "left":
        px = x - pad
    else:
        px = x - tw - pad
    py = y - pad - asc * 0.18 + dy
    if is_deva(text):
        py += 0.15 * size  # leave room for the matras above the headline
    if TEXT_BOUNDS is not None and alpha > 0.5:
        bb = im.getchannel("A").getbbox()
        if bb:
            TEXT_BOUNDS.append((text, px + bb[0], py + bb[1], px + bb[2], py + bb[3]))
    im = fade_alpha(im, alpha)
    canvas.alpha_composite(im, (int(round(px)), int(round(py))))
    return tw


def reveal(t, t0, dur=0.55, t_out=None, out_dur=0.35, rise=34):
    """alpha, dy for a line that fades/rises in at t0 and fades out at t_out."""
    a = ease_out((t - t0) / dur)
    dy = (1 - a) * rise
    if t_out is not None:
        o = clamp((t - t_out) / out_dur)
        a *= 1 - o
        dy -= o * 14
    return a, dy


def wrap(text, fname, size, maxw):
    f = font(fname, size)
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        trial = (cur + " " + w_).strip()
        if f.getlength(trial) <= maxw:
            cur = trial
        else:
            lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


# ------------------------------------------------------------------ layers
@lru_cache(8)
def _grad(y0, y1, strength, flip):
    g = Image.new("L", (1, 256))
    for i in range(256):
        v = i / 255
        g.putpixel((0, i), int(255 * strength * ease_in_out(1 - v if flip else v)))
    g = g.resize((W, y1 - y0))
    layer = Image.new("RGBA", (W, y1 - y0), SHADE + (0,))
    layer.putalpha(g)
    return layer


def shade(canvas, y0, y1, strength, flip=False):
    canvas.alpha_composite(_grad(y0, y1, strength, flip), (0, y0))


@lru_cache(4)
def _scrim(y0, y1, strength):
    pad = 140
    m = Image.new("L", (W, y1 - y0 + 2 * pad), 0)
    ImageDraw.Draw(m).rounded_rectangle((60, pad, W - 60, pad + y1 - y0), 120, fill=int(255 * strength))
    m = m.filter(ImageFilter.GaussianBlur(70))
    layer = Image.new("RGBA", m.size, SHADE + (0,))
    layer.putalpha(m)
    return layer


def scrim(canvas, y0, y1, strength=0.62):
    """Soft dark pool behind a block of light text."""
    canvas.alpha_composite(_scrim(y0, y1, strength), (0, y0 - 140))


def card(canvas, x0, y0, x1, y1, alpha=1.0):
    """Museum-label card: cream with a red rule, soft shadow."""
    if alpha <= 0.003:
        return
    w, h = x1 - x0, y1 - y0
    pad = 40
    sh = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((pad, pad + 10, pad + w, pad + h + 10), 18, fill=(0, 0, 0, int(120 * alpha)))
    sh = sh.filter(ImageFilter.GaussianBlur(16))
    canvas.alpha_composite(sh, (x0 - pad, y0 - pad))
    c = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    d.rounded_rectangle((0, 0, w - 1, h - 1), 18, fill=CREAM + (int(242 * alpha),))
    d.rounded_rectangle((10, 10, w - 11, h - 11), 12, outline=RED + (int(255 * alpha),), width=2)
    canvas.alpha_composite(c, (x0, y0))


def gallery_frame(canvas, img, cx, cy, alpha=1.0):
    """Portfolio-style hang: shadow, ink frame, white mat, hairline."""
    mat, edge = 22, 6
    w, h = img.width + 2 * (mat + edge), img.height + 2 * (mat + edge)
    x0, y0 = int(cx - w / 2), int(cy - h / 2)
    sh = Image.new("RGBA", (w + 120, h + 120), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rectangle((60, 78, 60 + w, 78 + h), fill=(60, 30, 10, int(110 * alpha)))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(22)), (x0 - 60, y0 - 60))
    fr = Image.new("RGBA", (w, h), INK + (255,))
    d = ImageDraw.Draw(fr)
    d.rectangle((edge, edge, w - edge - 1, h - edge - 1), fill=WHITE)
    d.rectangle((edge + mat - 5, edge + mat - 5, w - edge - mat + 4, h - edge - mat + 4), outline=INK, width=2)
    fr.paste(img, (edge + mat, edge + mat))
    canvas.alpha_composite(fade_alpha(fr, alpha), (x0, y0))
    return x0, y0, x0 + w, y0 + h


def paper_canvas(bands=True):
    c = PAPER_BG.convert("RGBA")
    if bands:
        c.alpha_composite(BAND_TOP, (0, 70))
        c.alpha_composite(BAND_BOT, (0, H - 70 - BAND_BOT.height))
    return c


def kicker(canvas, text, y, alpha, dy=0, color=RED, size=27):
    put_text(canvas, text, "sans-medium", size, color, y, alpha, tracking=6, dy=dy)


# ------------------------------------------------------------------ scenes
# Scene functions get design time t in 0..5 s whatever the scene's real length
# (frame_at rescales), so every reveal lands in proportion to the music.

def path(views, k):
    (ax, ay, aw), (bx, by, bw) = views
    return lerp(ax, bx, k), lerp(ay, by, k), lerp(aw, bw, k)


def fit_painting(maxw, maxh, z=1.0, fx=0.5, fy=0.5):
    x0, y0, x1, y1 = CONTENT
    ow = int(min(maxw, maxh * (x1 - x0) / (y1 - y0)))
    return full_painting(ow, z, fx, fy)


def s_hook(t, d):
    spec = P["hook"]
    c = view(*path(spec["views"], ease_in_out(t / d))).convert("RGBA")
    shade(c, 0, 600, 0.85, flip=True)
    shade(c, 760, H, 0.95)
    scrim(c, 1090, 1440, 0.62 * ease_out(t / 0.5))
    a, dy = reveal(t, 0.25)
    kicker(c, f"A MITHILA PAINTING  ·  N° {P['number']}", 330, a, dy, color=CREAM)
    l1, l2, l3 = spec["lines"]
    for txt, t0, y, f, sz, col in [(l1, 0.55, 1110, "serif-italic", 88, WHITE),
                                   (l2, 2.0, 1225, "serif-italic", 88, WHITE),
                                   (l3, 2.9, 1330, "serif-semi", 96, GOLD)]:
        a, dy = reveal(t, t0, 0.6)
        put_text(c, txt, f, sz, col, y, a, dy=dy, shadow=6)
    fl = clamp((t - (d - 0.25)) / 0.25)  # flash into the title on the bar line
    if fl > 0:
        c.alpha_composite(Image.new("RGBA", (W, H), CREAM + (int(255 * fl),)))
    return c


def s_title(t, d):
    spec = P["title"]
    c = paper_canvas()
    img = fit_painting(900, 700, lerp(1.0, 1.07, t / d), 0.5, 0.42)
    cy = 990 - 28 - img.height / 2  # frame ends just above the title block
    sc = lerp(0.96, 1.0, ease_out(t / 0.8))
    if sc < 0.999:
        img = img.resize((int(img.width * sc), int(img.height * sc)), Image.LANCZOS)
    a, _ = reveal(t, 0.0, 0.5)
    gallery_frame(c, img, CX, cy, a)
    lines = spec["lines"]
    big = 112 if len(lines) == 1 else 92
    y = 1060
    a, dy = reveal(t, 0.35)
    kicker(c, f"N° {P['number']}  ·  THE PAINTING", y, a, dy)
    y += 48
    for j, ln in enumerate(lines):
        a, dy = reveal(t, 0.6 + 0.2 * j, 0.7)
        put_text(c, ln, "serif-semi", big, INK, y, a, dy=dy)
        y += 104 if len(lines) == 1 else 92
    sub, sub_font = spec["subtitle"]
    y += 36 if len(lines) == 1 else 30
    a, dy = reveal(t, 1.1, 0.7)
    put_text(c, sub, sub_font, 60 if sub_font == "deva" else 58, RED, y, a, dy=dy)
    a, dy = reveal(t, 1.6)
    put_text(c, spec["tags"], "sans", 23, (90, 78, 66), y + 117, a, dy=dy, tracking=3)
    return c


def s_story(t, d):
    # Two cards; the camera whips from the first view to the second in the middle.
    c1, c2 = P["story"]
    m = ease_in_out((t - 2.2) / 0.5)
    v1 = path(c1["views"], clamp(t / 2.7))
    v2 = path(c2["views"], clamp((t - 2.2) / 2.8))
    vw = lerp(v1[2], v2[2], m) * (1 + 0.1 * math.sin(math.pi * m))
    c = view(lerp(v1[0], v2[0], m), lerp(v1[1], v2[1], m), vw).convert("RGBA")
    if 0 < m < 1:  # motion blur on the whip
        c = c.filter(ImageFilter.BoxBlur(int(8 * math.sin(math.pi * m))))
    shade(c, 1000, H, 0.55)
    y0, y1 = 1150, 1440
    card(c, 120, y0, 960, y1, ease_out(t / 0.45) * (1 - clamp((t - (d - 0.2)) / 0.2)))
    for spec, t_in, t_out in ((c1, 0.2, 2.15), (c2, 2.6, d - 0.25)):
        a, dy = reveal(t, t_in, t_out=t_out)
        kicker(c, spec["kicker"], y0 + 46, a, dy)
        put_text(c, spec["lines"][0], "serif-semi", 64, INK, y0 + 102, a, dy=dy)
        put_text(c, spec["lines"][1], "serif-italic", 54, (60, 50, 44), y0 + 186, a, dy=dy)
    return c


def s_statement(t, d):
    spec = P["statement"]
    c = view(*path(spec["views"], ease_in_out(t / d))).convert("RGBA")
    shade(c, 760, H, 0.95)
    scrim(c, 1070, 1430, 0.62 * ease_out(t / 0.5))
    a, dy = reveal(t, 0.25)
    kicker(c, spec["kicker"], 1080, a, dy, color=GOLD)
    l1, l2, l3 = spec["lines"]
    for txt, t0, y, f, sz, col in [(l1, 0.55, 1150, "serif-italic", 74, WHITE),
                                   (l2, 1.35, 1245, "serif-italic", 74, WHITE),
                                   (l3, 2.15, 1340, "serif-semi", 80, GOLD)]:
        a, dy = reveal(t, t0, 0.7)
        put_text(c, txt, f, sz, col, y, a, dy=dy, shadow=6)
    return c


def s_technique(t, d):
    half = d / 2
    i = 0 if t < half else 1
    tt = t - i * half
    spec = P["technique"][i]
    c = view(*path(spec["views"], ease_out(tt / half) if i else tt / half)).convert("RGBA")
    if tt < 0.18:  # punch-in on the cut
        s = lerp(1.06, 1.0, ease_out(tt / 0.18))
        c = c.resize((int(W * s), int(H * s)), Image.BICUBIC).crop(
            (int((W * s - W) / 2), int((H * s - H) / 2), int((W * s - W) / 2) + W, int((H * s - H) / 2) + H))
    shade(c, 1000, H, 0.55)
    y0, y1 = 1120, 1450
    card(c, 120, y0, 960, y1, ease_out(tt / 0.3) * (1 - clamp((tt - (half - 0.15)) / 0.15)))
    a, dy = reveal(tt, 0.12, t_out=half - 0.25, out_dur=0.2)
    put_text(c, spec["label"], "sans-semi", 44, RED, y0 + 42, a, dy=dy, tracking=14)
    put_text(c, spec["lines"][0], "serif-semi", 64, INK, y0 + 112, a, dy=dy)
    put_text(c, spec["lines"][1], "serif-italic", 60, (60, 50, 44), y0 + 190, a, dy=dy)
    put_text(c, spec["note"].upper(), "sans", 22, (110, 96, 84), y0 + 276, a, dy=dy, tracking=4)
    return c


def s_elements(t, d):
    els = P["elements"]
    c = paper_canvas()
    seg = d / len(els)
    i = min(int(t / seg), len(els) - 1)
    tt = t - i * seg
    ex, ey, size, label = els[i]
    a, dy = reveal(t, 0.0, 0.4)
    kicker(c, "MITHILA ELEMENTS", 300, a, dy)
    cyc, md = 770, 730
    ring = RING_MED.rotate(-t * 9, Image.BICUBIC)
    s = lerp(0.82, 1.0, back_out(tt / 0.35, 1.6))
    inner = view(ex, ey, size * lerp(1.0, 0.9, tt / seg), md, md).convert("RGBA")
    inner.putalpha(MASK_MED)
    if abs(s - 1) > 0.001:
        inner = inner.resize((max(1, int(md * s)), max(1, int(md * s))), Image.LANCZOS)
    c.alpha_composite(ring, (CX - ring.width // 2, cyc - ring.height // 2))
    c.alpha_composite(inner, (CX - inner.width // 2, cyc - inner.height // 2))
    a, dy = reveal(tt, 0.08, 0.35, t_out=seg - 0.18, out_dur=0.15)
    put_text(c, f"0{i + 1} / 0{len(els)}", "sans-medium", 26, RED, 1250, a, dy=dy, tracking=5)
    put_text(c, label, "serif-semi", 76, INK, 1300, a, dy=dy)
    return c


def s_reveal(t, d):
    spec = P["reveal"]
    c = paper_canvas()
    fx, fy = spec["focus"]
    img = fit_painting(900, 680, lerp(1.9, 1.0, ease_in_out(t / 2.2)), fx, fy)
    gallery_frame(c, img, CX, 975 - 28 - img.height / 2)
    c.alpha_composite(LOTUS, (CX - LOTUS.width // 2, 1012))
    a, dy = reveal(t, 0.9)
    kicker(c, spec["kicker"], 1120, a, dy)
    a, dy = reveal(t, 1.2, 0.7)
    put_text(c, spec["lines"][0], "serif-semi", 78, INK, 1170, a, dy=dy)
    a, dy = reveal(t, 1.6, 0.7)
    put_text(c, spec["lines"][1], "serif-italic", 58, (70, 58, 50), 1268, a, dy=dy)
    a, dy = reveal(t, 2.3)
    put_text(c, spec["medium"], "sans", 22, (110, 96, 84), 1372, a, dy=dy, tracking=3)
    return c


def s_artist(t, d):
    c = paper_canvas()
    ghost = fade_alpha(fit_painting(1000, 900).convert("RGBA"), 0.10)  # the painting, faint
    c.alpha_composite(ghost, (CX - ghost.width // 2, 780 - ghost.height // 2))
    ld = int(380 * lerp(0.7, 1.0, back_out(t / 0.6, 1.2)))
    logo = LOGO.resize((ld, ld), Image.LANCZOS)
    a, _ = reveal(t, 0.0, 0.4)
    c.alpha_composite(fade_alpha(logo, a), (CX - ld // 2, 600 - ld // 2))
    a, dy = reveal(t, 0.35, 0.6)
    put_text(c, "Dr Piyush Kiran Nayak", "serif-semi", 80, INK, 835, a, dy=dy)
    a, dy = reveal(t, 0.6)
    kicker(c, "MITHILA / MADHUBANI ARTIST  ·  BHOPAL", 950, a, dy, size=24)
    a, dy = reveal(t, 0.9)
    c.alpha_composite(fade_alpha(LOTUS, a), (CX - LOTUS.width // 2, 1010))
    for j, ln in enumerate(CREDENTIALS):
        a, dy = reveal(t, 1.15 + j * 0.35, 0.6)
        put_text(c, ln, "serif-semi" if j == 0 else "serif", 52 if j == 0 else 48,
                 RED if j == 0 else (54, 44, 38), 1150 + j * 74, a, dy=dy)
    return c


@lru_cache(1)
def _cta_bg():
    b = view(*P["cta_view"]).filter(ImageFilter.GaussianBlur(26)).convert("RGBA")
    b.alpha_composite(Image.new("RGBA", (W, H), tuple(int(v * 0.6) for v in SHADE) + (190,)))
    return b


def follow_button(canvas, y, t):
    """Instagram-style Follow pill that gets 'tapped' and flips to Following."""
    tap = 1.9
    pressed = clamp(1 - abs(t - tap) / 0.12)
    done = t > tap
    s = 1 - 0.06 * pressed
    bw, bh = int(560 * s), int(118 * s)
    x0, y0 = CX - bw // 2, y + (118 - bh) // 2
    a, _ = reveal(t, 0.55, 0.5)
    if a <= 0:
        return
    lay = Image.new("RGBA", (W, 240), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    fill = CREAM if done else RED
    d.rounded_rectangle((x0, 60, x0 + bw, 60 + bh), bh // 2, fill=fill + (255,),
                        outline=(CREAM if not done else RED) + (255,), width=3)
    canvas.alpha_composite(fade_alpha(lay, a), (0, y0 - 60))
    col = RED if done else CREAM
    put_text(canvas, "Following" if done else "+  Follow", "sans-semi", 50, col, y0 + bh / 2 - 26, a)
    # tap ripple
    if tap - 0.35 < t < tap + 0.5:
        r = 30 + 160 * ease_out((t - tap + 0.1) / 0.6)
        ra = clamp(1 - (t - tap + 0.1) / 0.6) * 0.6
        rp = Image.new("RGBA", (W, 400), (0, 0, 0, 0))
        fx, fy = CX + 150, 200
        ImageDraw.Draw(rp).ellipse((fx - r, fy - r, fx + r, fy + r), outline=WHITE + (int(255 * ra),), width=6)
        canvas.alpha_composite(rp, (0, y0 + bh // 2 - 200))


def s_cta(t, d):
    c = _cta_bg().copy()
    # logo with rotating Mithila ring
    a, _ = reveal(t, 0.0, 0.5)
    ring = RING_LOGO.rotate(-t * 12, Image.BICUBIC)
    c.alpha_composite(fade_alpha(ring, a), (CX - ring.width // 2, 520 - ring.height // 2))
    ld = 330
    logo = LOGO.resize((ld, ld), Image.LANCZOS)
    c.alpha_composite(fade_alpha(logo, a), (CX - ld // 2, 520 - ld // 2))
    a, dy = reveal(t, 0.3)
    put_text(c, "Follow for more Mithila stories", "serif-italic", 62, WHITE, 790, a, dy=dy, shadow=4)
    a, dy = reveal(t, 0.45)
    put_text(c, "@piyushart_gallery", "sans-medium", 46, GOLD, 880, a, dy=dy, tracking=2)
    follow_button(c, 975, t)
    a, dy = reveal(t, 2.3)
    kicker(c, "COMMISSIONS  ·  WORKSHOPS  ·  EXHIBITIONS", 1150, a, dy, color=CREAM, size=24)
    a, dy = reveal(t, 2.6, 0.7)
    put_text(c, "piyushkirannayak.com", "serif-semi", 82, WHITE, 1212, a, dy=dy, shadow=4)
    # underline drawing in
    u = ease_out((t - 3.0) / 0.8)
    if u > 0:
        lw = int(620 * u)
        ImageDraw.Draw(c).line((CX - lw // 2, 1318, CX + lw // 2, 1318), fill=GOLD, width=4)
    a, dy = reveal(t, 3.2)
    kicker(c, "BHOPAL, INDIA", 1352, a, dy, color=(220, 210, 190), size=22)
    return c


XFADE = 0.3


# ------------------------------------------------------------------ safe-zone overlay
def safezone_overlay():
    o = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(o)
    zone = (230, 40, 60, 90)
    d.rectangle((0, 0, W, SAFE_TOP), fill=zone)
    d.rectangle((0, SAFE_BOTTOM, W, H), fill=zone)
    d.rectangle((SAFE_RIGHT, SAFE_TOP, W, SAFE_BOTTOM), fill=(230, 40, 60, 55))
    d.rectangle((0, SAFE_TOP, SAFE_LEFT, SAFE_BOTTOM), fill=(230, 40, 60, 40))
    # dashed safe-area outline
    for x in range(SAFE_LEFT, SAFE_RIGHT, 24):
        d.line((x, SAFE_TOP, x + 12, SAFE_TOP), fill=(255, 255, 0, 230), width=3)
        d.line((x, SAFE_BOTTOM, x + 12, SAFE_BOTTOM), fill=(255, 255, 0, 230), width=3)
    for y in range(SAFE_TOP, SAFE_BOTTOM, 24):
        d.line((SAFE_LEFT, y, SAFE_LEFT, y + 12), fill=(255, 255, 0, 230), width=3)
        d.line((SAFE_RIGHT, y, SAFE_RIGHT, y + 12), fill=(255, 255, 0, 230), width=3)
    # 3:4 profile-grid crop guides
    g = (H - 1440) // 2
    for y in (g, H - g):
        for x in range(0, W, 30):
            d.line((x, y, x + 14, y), fill=(0, 220, 255, 200), width=2)
    f = font("sans-semi", 26)
    d.text((24, 120), "TOP UI ZONE · 270 px", font=f, fill=(255, 255, 255, 230))
    d.text((24, SAFE_BOTTOM + 150), "CAPTION / AUDIO / CTA ZONE · 440 px", font=f, fill=(255, 255, 255, 230))
    d.text((24, g + 8), "3:4 GRID CROP", font=font("sans", 22), fill=(0, 220, 255, 230))
    # right-rail action icons placeholders
    for i, yy in enumerate(range(SAFE_BOTTOM - 520, SAFE_BOTTOM + 260, 130)):
        d.ellipse((W - 112, yy, W - 52, yy + 60), outline=(255, 255, 255, 200), width=3)
    return o


# ------------------------------------------------------------------ frame + main
DESIGN = 5.0  # scene functions are written against a 5-second scene


def run(fn, t, s, e):
    return fn((t - s) * DESIGN / (e - s), DESIGN)


def frame_at(t):
    for i, (s, e, fn) in enumerate(SCENES):
        if s <= t < e or i == len(SCENES) - 1:
            img = run(fn, t, s, e)
            # crossfade with the next scene across the cut (not after the hook's flash)
            if i + 1 < len(SCENES) and t > e - XFADE / 2 and fn is not s_hook:
                ns, ne, nfn = SCENES[i + 1]
                k = ease_in_out((t - (e - XFADE / 2)) / XFADE)
                img = Image.blend(img, run(nfn, t, ns, ne), k)
            if i > 0 and t < s + XFADE / 2 and SCENES[i - 1][2] is not s_hook:
                ps, pe, pfn = SCENES[i - 1]
                k = ease_in_out((t - (s - XFADE / 2)) / XFADE)
                img = Image.blend(run(pfn, t, ps, pe), img, k)
            if i == 1 and t - s < 0.35:  # flash out of the hook
                fl = 1 - ease_out((t - s) / 0.35)
                img.alpha_composite(Image.new("RGBA", (W, H), CREAM + (int(255 * fl),)))
            break
    if SAFEZONES:
        img.alpha_composite(_overlay())
    return img.convert("RGB")


@lru_cache(1)
def _overlay():
    return safezone_overlay()


def render_frame(n):
    return frame_at(n / FPS).tobytes()


def main():
    global SAFEZONES
    args = sys.argv[1:]
    SAFEZONES = "--safezones" in args
    load(args.pop(0))
    if "--thumbnail" in args:
        s, e, _ = SCENES[1]  # the title card, fully revealed
        frame_at(s + 0.8 * (e - s)).save(args[0], quality=92)
        return
    if "--check" in args:
        global TEXT_BOUNDS
        bad = set()
        for n in range(0, int(DUR * FPS), 3):
            TEXT_BOUNDS = []
            frame_at(n / FPS)
            for txt, x0, y0, x1, y1 in TEXT_BOUNDS:
                if x0 < SAFE_LEFT or x1 > SAFE_RIGHT or y0 < SAFE_TOP or y1 > SAFE_BOTTOM:
                    bad.add((txt, int(x0), int(y0), int(x1), int(y1)))
        for b_ in sorted(bad):
            print("OUTSIDE SAFE AREA:", b_)
        print("safe-area check done,", len(bad), "issues")
        return
    if "--frames" in args:
        ts = [float(x) for x in args[args.index("--frames") + 1].split(",")]
        out = args[0]
        for t in ts:
            frame_at(t).save(f"{out}_{t:05.2f}.png")
        return
    out, music = args[0], args[1]
    total = int(DUR * FPS)
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-i", music,
           "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
           "-profile:v", "high", "-level", "4.1", "-r", str(FPS),
           "-af", "loudnorm=I=-14:TP=-1.5:LRA=7",
           "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
           "-shortest", "-movflags", "+faststart", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with Pool(os.cpu_count()) as pool:
        for i, buf in enumerate(pool.imap(render_frame, range(total), chunksize=6)):
            p.stdin.write(buf)
            if i % 150 == 0:
                print(f"frame {i}/{total}", flush=True)
    p.stdin.close()
    p.wait()
    print("wrote", out)


if __name__ == "__main__":
    main()
