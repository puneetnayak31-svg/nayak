"""Renders the 9:16 Instagram Reel for 'Amausa Ka Mela' by Dr Piyush Kiran Nayak.

Usage:
    python3 render.py OUT.mp4 MUSIC.wav [--safezones] [--frames a,b,c]

Every caption and CTA is kept inside the Instagram Reels safe area
(top 270 px, bottom 440 px, right 150 px, left 90 px are left free of text).
--safezones burns those zones in as a translucent overlay for review.
"""
import math
import os
import subprocess
import sys
from functools import lru_cache
from multiprocessing import Pool

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, "assets")
FONTS = os.path.join(A, "fonts")

W, H = 1080, 1920
FPS = 30
DUR = 45.0
BAR = 2.5  # music: 96 bpm, 4/4

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
LANG = "en"  # "hi" renders the Hindi text version
TEXT_BOUNDS = None  # list when checking the safe area

# ------------------------------------------------------------------ assets
PAINT = Image.open(os.path.join(A, "painting.png")).convert("RGB")
PW, PH = PAINT.size
# painted area inside the photograph (excludes the dark surround)
CONTENT = (40, 30, 1250, 903)
UP = 2
PAINT_UP = PAINT.resize((PW * UP, PH * UP), Image.LANCZOS).filter(
    ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
LOGO = Image.open(os.path.join(A, "logo.png")).convert("RGBA")


def font(name, size):
    files = {
        "serif": "CormorantGaramond_500Medium.ttf",
        "serif-semi": "CormorantGaramond_600SemiBold.ttf",
        "serif-italic": "CormorantGaramond_500Medium_Italic.ttf",
        "sans": "Jost_400Regular.ttf",
        "sans-medium": "Jost_500Medium.ttf",
        "sans-semi": "Jost_600SemiBold.ttf",
        "deva": "TiroDevanagariHindi_400Regular.ttf",
        # Hindi version
        "hi-serif": "Martel_600SemiBold.ttf",
        "hi-serif-bold": "Martel_700Bold.ttf",
        "hi-serif-light": "Martel_300Light.ttf",
        "hi-sans": "Hind_400Regular.ttf",
        "hi-sans-medium": "Hind_500Medium.ttf",
        "hi-sans-semi": "Hind_600SemiBold.ttf",
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
HI_FONT = {  # Latin face -> Devanagari face, size factor
    "serif": ("hi-serif", 0.8), "serif-semi": ("hi-serif-bold", 0.8),
    "serif-italic": ("hi-serif-light", 0.8), "sans": ("hi-sans", 1.3),
    "sans-medium": ("hi-sans-medium", 1.3), "sans-semi": ("hi-sans-semi", 1.1),
}
MAX_TEXT_W = 2 * min(CX - SAFE_LEFT, SAFE_RIGHT - CX) - 20


def is_deva(text):
    return any("\u0900" <= ch <= "\u097f" for ch in text)


def tr(text):
    return HI.get(text, text) if LANG == "hi" else text


@lru_cache(512)
def text_img(text, fname, size, fill, tracking=0, shadow=0):
    if is_deva(text):
        if fname in HI_FONT:
            fname, k = HI_FONT[fname]
            size = round(size * k)
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
    text = tr(text)
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
    layer = Image.new("RGBA", (W, y1 - y0), (8, 12, 30, 0))
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
    layer = Image.new("RGBA", m.size, (8, 12, 30, 0))
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
    if LANG == "hi":
        y -= 14
    put_text(canvas, text, "sans-medium", size, color, y, alpha, tracking=6, dy=dy)


# ------------------------------------------------------------------ scenes
# Each scene: (start, end, fn(t_local, dur) -> RGBA canvas)

def s_hook(t, d):
    # Eyes meeting across the river, slowly pulling back to both faces.
    k = ease_in_out(t / d)
    c = view(lerp(548, 552, k), lerp(395, 420, k), lerp(400, 490, k)).convert("RGBA")
    shade(c, 0, 560, 0.7, flip=True)
    shade(c, 760, H, 0.95)
    scrim(c, 1090, 1440, 0.62 * ease_out(t / 0.5))
    a, dy = reveal(t, 0.25)
    kicker(c, "A MITHILA PAINTING  ·  N° 01", 330, a, dy, color=CREAM)
    lines = [("Two childhood friends.", 0.55, 1110, "serif-italic", 88, WHITE),
             ("One river.", 2.0, 1225, "serif-italic", 88, WHITE),
             ("One fair.", 2.9, 1330, "serif-semi", 96, GOLD)]
    for txt, t0, y, f, sz, col in lines:
        a, dy = reveal(t, t0, 0.6)
        put_text(c, txt, f, sz, col, y, a, dy=dy, shadow=6)
    # flash into the title on the bar line
    fl = clamp((t - (d - 0.25)) / 0.25)
    if fl > 0:
        c.alpha_composite(Image.new("RGBA", (W, H), CREAM + (int(255 * fl),)))
    return c


def s_title(t, d):
    c = paper_canvas()
    z = lerp(1.0, 1.07, t / d)
    img = full_painting(900, z, 0.5, 0.42)
    a, _ = reveal(t, 0.0, 0.5)
    sc = lerp(0.96, 1.0, ease_out(t / 0.8))
    if sc < 0.999:
        img = img.resize((int(img.width * sc), int(img.height * sc)), Image.LANCZOS)
    gallery_frame(c, img, CX, 680, a)
    a, dy = reveal(t, 0.35)
    kicker(c, "N° 01  ·  THE PAINTING", 1060, a, dy)
    first, second = ("Amausa Ka Mela", "अमौसा का मेला") if LANG == "en" else ("अमौसा का मेला", "Amausa Ka Mela")
    a, dy = reveal(t, 0.6, 0.7)
    if LANG == "en":
        put_text(c, first, "serif-semi", 112, INK, 1108, a, dy=dy)
    else:
        put_text(c, first, "deva", 100, INK, 1112, a, dy=dy)
    a, dy = reveal(t, 1.1, 0.7)
    if LANG == "en":
        put_text(c, second, "deva", 60, RED, 1248, a, dy=dy)
    else:
        put_text(c, second, "serif-italic", 60, RED, 1250, a, dy=dy)
    a, dy = reveal(t, 1.6)
    put_text(c, "FOLK LIFE  ·  FESTIVALS  ·  CONTEMPORARY MITHILA", "sans", 23, (90, 78, 66), 1365, a, dy=dy, tracking=3)
    return c


def s_friends(t, d):
    # Pan from the left face to the right face with a whip move in the middle.
    m = ease_in_out((t - 2.2) / 0.5)
    drift = t * 6
    cx = lerp(300 + drift, 800 - (d - t) * 6, m)
    cy = lerp(430, 445, m)
    vw = 460 + 50 * math.sin(math.pi * m)
    c = view(cx, cy, vw).convert("RGBA")
    if 0 < m < 1:  # motion blur on the whip
        c = c.filter(ImageFilter.BoxBlur(int(8 * math.sin(math.pi * m))))
    shade(c, 1000, H, 0.55)
    y0, y1 = 1150, 1440
    ca = ease_out(t / 0.45) * (1 - clamp((t - (d - 0.2)) / 0.2))
    card(c, 120, y0, 960, y1, ca)
    a, dy = reveal(t, 0.2, t_out=2.15)
    kicker(c, "THE REUNION", y0 + 46, a, dy)
    put_text(c, "Champa & Chameli —", "serif-semi", 66, INK, y0 + 100, a, dy=dy)
    put_text(c, "childhood friends, together again", "serif-italic", 50, (60, 50, 44), y0 + 186, a, dy=dy)
    a, dy = reveal(t, 2.6, t_out=d - 0.25)
    kicker(c, "AT A MELA IN PRAYAGRAJ", y0 + 46, a, dy)
    put_text(c, "trading stories of families,", "serif-semi", 60, INK, y0 + 104, a, dy=dy)
    put_text(c, "married lives and homes", "serif-italic", 56, (60, 50, 44), y0 + 186, a, dy=dy)
    return c


def s_river(t, d):
    k = ease_in_out(t / d)
    c = view(lerp(575, 520, k), lerp(470, 560, k), lerp(490, 420, k)).convert("RGBA")
    shade(c, 760, H, 0.95)
    scrim(c, 1070, 1430, 0.62 * ease_out(t / 0.5))
    a, dy = reveal(t, 0.25)
    kicker(c, "THE GANGES BETWEEN THEM", 1080, a, dy, color=GOLD)
    a, dy = reveal(t, 0.55, 0.7)
    put_text(c, "a river that has held", "serif-italic", 74, WHITE, 1150, a, dy=dy, shadow=6)
    a, dy = reveal(t, 1.35, 0.7)
    put_text(c, "their conversation", "serif-italic", 74, WHITE, 1245, a, dy=dy, shadow=6)
    a, dy = reveal(t, 2.15, 0.7)
    put_text(c, "in trust for years.", "serif-semi", 80, GOLD, 1340, a, dy=dy, shadow=6)
    return c


def s_technique(t, d):
    half = d / 2
    if t < half:
        tt = t
        # Kachni: drift across the hatched waves like the current
        c = view(lerp(470, 640, tt / half), 250, 420).convert("RGBA")
        label, l1, l2, note = "KACHNI", "Blue waves, hatched", "line by line", "patient, rhythmic linework"
    else:
        tt = t - half
        k = ease_out(tt / half)
        c = view(lerp(905, 895, k), lerp(735, 715, k), lerp(470, 430, k)).convert("RGBA")
        label, l1, l2, note = "BHARNI", "Solid colour fills", "that warm the figures", "acrylic on handmade paper"
    # punch-in on the cut
    if tt < 0.18:
        s = lerp(1.06, 1.0, ease_out(tt / 0.18))
        c = c.resize((int(W * s), int(H * s)), Image.BICUBIC).crop(
            (int((W * s - W) / 2), int((H * s - H) / 2), int((W * s - W) / 2) + W, int((H * s - H) / 2) + H))
    shade(c, 1000, H, 0.55)
    y0, y1 = 1120, 1450
    card(c, 120, y0, 960, y1, ease_out(tt / 0.3) * (1 - clamp((tt - (half - 0.15)) / 0.15)))
    a, dy = reveal(tt, 0.12, t_out=half - 0.25, out_dur=0.2)
    put_text(c, label, "sans-semi", 44, RED, y0 + 42, a, dy=dy, tracking=14)
    put_text(c, l1, "serif-semi", 64, INK, y0 + 112, a, dy=dy)
    put_text(c, l2, "serif-italic", 60, (60, 50, 44), y0 + 190, a, dy=dy)
    put_text(c, tr(note).upper(), "sans", 22, (110, 96, 84), y0 + 276, a, dy=dy, tracking=4)
    return c


ELEMENTS = [  # painting cx, cy, crop size, label
    (1118, 150, 300, "Birds in flight"),
    (150, 645, 270, "Floral fills"),
    (905, 700, 300, "Geometric patterning"),
    (905, 470, 280, "Ornamental motifs"),
]


def s_elements(t, d):
    c = paper_canvas()
    seg = d / len(ELEMENTS)
    i = min(int(t / seg), len(ELEMENTS) - 1)
    tt = t - i * seg
    ex, ey, size, label = ELEMENTS[i]
    a, dy = reveal(t, 0.0, 0.4)
    kicker(c, "MITHILA ELEMENTS", 300, a, dy)
    # medallion
    cyc = 770
    ring = RING_MED.rotate(-t * 9, Image.BICUBIC)
    pop = back_out(tt / 0.35, 1.6)
    s = lerp(0.82, 1.0, pop)
    zoom = lerp(1.0, 0.9, tt / seg)
    md = 730
    inner = view(ex, ey, size * zoom, md, md).convert("RGBA")
    inner.putalpha(MASK_MED)
    if s < 0.999 or s > 1.001:
        inner = inner.resize((max(1, int(md * s)), max(1, int(md * s))), Image.LANCZOS)
    c.alpha_composite(ring, (CX - ring.width // 2, cyc - ring.height // 2))
    c.alpha_composite(inner, (CX - inner.width // 2, cyc - inner.height // 2))
    # counter + label
    a, dy = reveal(tt, 0.08, 0.35, t_out=seg - 0.18, out_dur=0.15)
    put_text(c, f"0{i + 1} / 0{len(ELEMENTS)}", "sans-medium", 26, RED, 1250, a, dy=dy, tracking=5)
    put_text(c, label, "serif-semi", 76, INK, 1300, a, dy=dy)
    return c


def s_reveal(t, d):
    c = paper_canvas()
    k = ease_in_out(t / 2.2)
    z = lerp(1.9, 1.0, k)
    img = full_painting(900, z, 0.42, 0.42)
    gallery_frame(c, img, CX, 640)
    c.alpha_composite(LOTUS, (CX - LOTUS.width // 2, 1012))
    a, dy = reveal(t, 0.9)
    kicker(c, "INSPIRED BY THE POEM", 1120, a, dy)
    a, dy = reveal(t, 1.2, 0.7)
    put_text(c, "“Amausa Ka Mela”", "serif-semi", 84, INK, 1170, a, dy=dy)
    a, dy = reveal(t, 1.6, 0.7)
    put_text(c, "by Kailash Gautam", "serif-italic", 56, (70, 58, 50), 1272, a, dy=dy)
    a, dy = reveal(t, 2.3)
    put_text(c, "ACRYLIC ON HANDMADE PAPER  ·  DIP NIB  ·  22 × 30 IN", "sans", 22, (110, 96, 84), 1372, a, dy=dy, tracking=3)
    return c


def s_artist(t, d):
    c = paper_canvas()
    # the painting, faint, behind the artist's mark
    ghost = full_painting(1000, 1.0)
    ghost = fade_alpha(ghost.convert("RGBA"), 0.10)
    c.alpha_composite(ghost, (CX - ghost.width // 2, 330))
    sc = back_out(t / 0.6, 1.2)
    ld = int(380 * lerp(0.7, 1.0, sc))
    logo = LOGO.resize((ld, ld), Image.LANCZOS)
    a, _ = reveal(t, 0.0, 0.4)
    c.alpha_composite(fade_alpha(logo, a), (CX - ld // 2, 600 - ld // 2))
    a, dy = reveal(t, 0.35, 0.6)
    put_text(c, "Dr Piyush Kiran Nayak", "serif-semi", 80, INK, 835, a, dy=dy)
    a, dy = reveal(t, 0.6)
    kicker(c, "MITHILA / MADHUBANI ARTIST  ·  BHOPAL", 950, a, dy, size=24)
    a, dy = reveal(t, 0.9)
    c.alpha_composite(fade_alpha(LOTUS, a), (CX - LOTUS.width // 2, 1010))
    if LANG == "hi":
        for j, ln in enumerate(CREDENTIALS_HI):
            a, dy = reveal(t, 1.15 + j * 0.4, 0.6)
            put_text(c, ln, "serif", 54, (54, 44, 38), 1130 + j * 96, a, dy=dy)
        return c
    quote = "“Mithila painting has become not just an artistic practice for me, but a meaningful cultural and spiritual journey.”"
    lines = wrap(quote, "serif-italic", 54, 760)
    for j, ln in enumerate(lines):
        a, dy = reveal(t, 1.15 + j * 0.28, 0.6)
        put_text(c, ln, "serif-italic", 54, (54, 44, 38), 1125 + j * 70, a, dy=dy)
    return c


@lru_cache(1)
def _cta_bg():
    b = view(640, 470, 490).filter(ImageFilter.GaussianBlur(26)).convert("RGBA")
    b.alpha_composite(Image.new("RGBA", (W, H), (10, 18, 48, 175)))
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
    put_text(canvas, "Following" if done else "+  Follow", "sans-semi", 50 if LANG == "en" else 44, col,
             y0 + bh / 2 - (26 if LANG == "en" else 22), a)
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


# Hindi version copy (facts from the artist's portfolio)
HI = {
    "A MITHILA PAINTING  ·  N° 01": "एक मिथिला चित्र  ·  क्रमांक 01",
    "Two childhood friends.": "बचपन की दो सहेलियाँ।",
    "One river.": "एक नदी।",
    "One fair.": "एक मेला।",
    "N° 01  ·  THE PAINTING": "क्रमांक 01  ·  चित्र",
    "FOLK LIFE  ·  FESTIVALS  ·  CONTEMPORARY MITHILA": "लोक जीवन  ·  पर्व-त्योहार  ·  समकालीन मिथिला",
    "THE REUNION": "पुनर्मिलन",
    "Champa & Chameli —": "चंपा और चमेली —",
    "childhood friends, together again": "बचपन की सहेलियाँ, फिर एक साथ",
    "AT A MELA IN PRAYAGRAJ": "प्रयागराज के मेले में",
    "trading stories of families,": "परिवार, ससुराल और घर-आँगन",
    "married lives and homes": "की बातें साझा करती हुईं",
    "THE GANGES BETWEEN THEM": "दोनों के बीच बहती गंगा",
    "a river that has held": "एक नदी, जिसने बरसों से",
    "their conversation": "उनकी बातों को",
    "in trust for years.": "सहेज कर रखा है।",
    "KACHNI": "कचनी",
    "Blue waves, hatched": "नीली लहरें, एक-एक",
    "line by line": "रेखा से उकेरी गईं",
    "patient, rhythmic linework": "धैर्य भरी, लयबद्ध रेखाएँ",
    "BHARNI": "भरनी",
    "Solid colour fills": "ठोस रंगों की भराई,",
    "that warm the figures": "जो आकृतियों में गर्माहट भरती है",
    "acrylic on handmade paper": "हस्तनिर्मित कागज़ पर ऐक्रेलिक",
    "MITHILA ELEMENTS": "मिथिला कला के तत्व",
    "Birds in flight": "उड़ते पंछी",
    "Floral fills": "फूलों की भराई",
    "Geometric patterning": "ज्यामितीय अलंकरण",
    "Ornamental motifs": "पारंपरिक आभूषण-रूपांकन",
    "INSPIRED BY THE POEM": "इस कविता से प्रेरित",
    "“Amausa Ka Mela”": "“अमौसा का मेला”",
    "by Kailash Gautam": "कवि कैलाश गौतम",
    "ACRYLIC ON HANDMADE PAPER  ·  DIP NIB  ·  22 × 30 IN": "हस्तनिर्मित कागज़ पर ऐक्रेलिक  ·  डिप निब  ·  22 × 30 इंच",
    "Dr Piyush Kiran Nayak": "डॉ. पीयूष किरण नायक",
    "MITHILA / MADHUBANI ARTIST  ·  BHOPAL": "मिथिला / मधुबनी कलाकार  ·  भोपाल",
    "Follow for more Mithila stories": "मिथिला की और कहानियों के लिए",
    "Following": "फ़ॉलो कर रहे हैं",
    "+  Follow": "+  फ़ॉलो करें",
    "COMMISSIONS  ·  WORKSHOPS  ·  EXHIBITIONS": "कमीशन  ·  कार्यशालाएँ  ·  प्रदर्शनियाँ",
    "BHOPAL, INDIA": "भोपाल, भारत",
}
CREDENTIALS_HI = [  # replaces the quote in the Hindi version (portfolio, "Recognition")
    "भारतीय लोक कला में 25+ वर्ष",
    "भारत सरकार से लाइसेंस प्राप्त शिल्पी",
    "शिल्प कला विद्यापीठ में अध्ययनरत",
]


SCENES = [
    (0.0, 2 * BAR, s_hook),
    (2 * BAR, 4 * BAR, s_title),
    (4 * BAR, 6 * BAR, s_friends),
    (6 * BAR, 8 * BAR, s_river),
    (8 * BAR, 10 * BAR, s_technique),
    (10 * BAR, 12 * BAR, s_elements),
    (12 * BAR, 14 * BAR, s_reveal),
    (14 * BAR, 16 * BAR, s_artist),
    (16 * BAR, DUR, s_cta),
]
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
def frame_at(t):
    for i, (s, e, fn) in enumerate(SCENES):
        if s <= t < e or i == len(SCENES) - 1:
            img = fn(t - s, e - s)
            # crossfade with the next scene across the cut (not after the hook's flash)
            if i + 1 < len(SCENES) and t > e - XFADE / 2 and fn is not s_hook:
                ns, ne, nfn = SCENES[i + 1]
                k = ease_in_out((t - (e - XFADE / 2)) / XFADE)
                img = Image.blend(img, nfn(t - ns, ne - ns), k)
            if i > 0 and t < s + XFADE / 2 and SCENES[i - 1][2] is not s_hook:
                ps, pe, pfn = SCENES[i - 1]
                k = ease_in_out((t - (s - XFADE / 2)) / XFADE)
                img = Image.blend(pfn(t - ps, pe - ps), img, k)
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
    global LANG
    if "--lang" in args:
        LANG = args[args.index("--lang") + 1]
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
