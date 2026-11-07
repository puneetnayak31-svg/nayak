"""Renders the Ashta Lakshmi Diwali reel (1080x1920, 30 fps).

    python3 render.py VERSION OUT.mp4 AUDIO.wav       # VERSION = reel | full
    python3 render.py VERSION OUTPREFIX --frames 3,12  # still frames for checking the design
    python3 render.py VERSION OUT.jpg --cover          # cover image

The eight paintings are the artist's own studio photographs, shown whole and unaltered: they are
only scaled (never cropped into, filtered or retouched). Only the empty black backdrop around each
framed painting and the gold mantra caption below it are trimmed, because the reel sets its own title.
"""
import math
import os
import subprocess
import sys
from functools import lru_cache
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

import timeline as T
from script import GODDESSES

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "..", "assets", "fonts", "TiroDevanagariHindi_400Regular.ttf")
W, H, FPS = 1080, 1920, 30

BG = (9, 8, 12)
GOLD_HI, GOLD, GOLD_LO = (250, 226, 158), (226, 182, 92), (168, 118, 48)
IVORY = (244, 236, 220)

TL = None  # timeline of the version being rendered
LAYOUT = None


# ------------------------------------------------------------------ helpers
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def fade_in(t, t0, d=0.6):
    return ease((t - t0) / d)


@lru_cache(None)
def font(size):
    return ImageFont.truetype(FONT, size)


def put(img, layer, x, y, alpha=1.0):
    """Paste an RGBA layer onto an RGB image at (x, y) with extra opacity."""
    if alpha <= 0.003:
        return
    a = layer.getchannel("A")
    if alpha < 0.997:
        a = a.point(lambda v: int(v * alpha))
    img.paste(layer.convert("RGB"), (int(round(x)), int(round(y))), a)


def radial(w, h, cx, cy, r, color, power=2.0):
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
    k = np.clip(1 - d, 0, 1) ** power
    return k[..., None] * np.array(color, np.float32)


def add_sprite(arr, spr, cx, cy, k):
    """Additive blend of a float sprite (h, w, 3) centred at (cx, cy)."""
    h, w = spr.shape[:2]
    x0, y0 = int(cx - w / 2), int(cy - h / 2)
    xa, ya, xb, yb = max(0, x0), max(0, y0), min(arr.shape[1], x0 + w), min(arr.shape[0], y0 + h)
    if xa >= xb or ya >= yb:
        return
    arr[ya:yb, xa:xb] += spr[ya - y0:yb - y0, xa - x0:xb - x0] * k


@lru_cache(None)
def glow_sprite(r, color=(255, 214, 140), power=2.2):
    s = int(r * 2) + 1
    return radial(s, s, s / 2, s / 2, r, color, power)


# ------------------------------------------------------------------ text
@lru_cache(None)
def text_layer(text, size, kind="gold", glow=True):
    """Text as an RGBA layer: gold gradient (with a soft glow) or ivory."""
    f = font(size)
    l, t, r, b = f.getbbox(text)
    pad = int(size * 0.5)
    w, h = r - l + 2 * pad, b - t + 2 * pad
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).text((pad - l, pad - t), text, font=f, fill=255)
    if kind == "gold":
        g = np.zeros((h, w, 3), np.float32)
        yy = (np.arange(h)[:, None] - pad) / max(1, (b - t))
        top, mid, bot = (np.array(c, np.float32) for c in (GOLD_HI, GOLD, GOLD_LO))
        y1 = np.clip(yy * 2, 0, 1)[..., None]
        y2 = np.clip(yy * 2 - 1, 0, 1)[..., None]
        g[:] = np.where(yy[..., None] < 0.5, top + (mid - top) * y1, mid + (bot - mid) * y2)
        fill = Image.fromarray(g.astype(np.uint8))
    else:
        fill = Image.new("RGB", (w, h), IVORY)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    if glow:
        gl = mask.filter(ImageFilter.GaussianBlur(size * 0.18)).point(lambda v: int(v * 0.45))
        out.paste(Image.new("RGB", (w, h), (150, 96, 30)), (0, 0), gl)
    out.paste(fill, (0, 0), mask)
    out.info["anchor"] = (pad - l, pad - t, r - l, b - t)  # offset to text box, text size
    return out


def put_text(img, text, size, cx, cy, alpha=1.0, kind="gold", glow=True, dy=0.0):
    """Centre text on (cx, cy) (vertical centre of the ink box)."""
    lay = text_layer(text, size, kind, glow)
    ox, oy, tw, th = lay.info["anchor"]
    put(img, lay, cx - tw / 2 - ox, cy - th / 2 - oy + dy, alpha)


def wrap(text, size, width):
    """Balanced line breaks (minimum raggedness) for a sentence."""
    f = font(size)
    words = text.split()
    n = len(words)
    sp = f.getlength(" ")
    lens = [f.getlength(w) for w in words]
    best = [0.0] + [math.inf] * n
    prev = [0] * (n + 1)
    for j in range(1, n + 1):
        for i in range(j - 1, -1, -1):
            lw = sum(lens[i:j]) + sp * (j - i - 1)
            if lw > width:
                break
            cost = best[i] + (width - lw) ** 2 if j < n else best[i] + 0.25 * (width - lw) ** 2
            if cost < best[j]:
                best[j], prev[j] = cost, i
    lines, j = [], n
    while j > 0:
        lines.append(" ".join(words[prev[j]:j]))
        j = prev[j]
    lines = lines[::-1]
    # avoid a lone short last line
    if len(lines) >= 2 and f.getlength(lines[-1]) < 0.3 * width:
        return wrap_n(words, size, len(lines))
    return lines


def wrap_n(words, size, k):
    f = font(size)
    best, bl = math.inf, None

    def rec(start, k, acc):
        nonlocal best, bl
        if k == 1:
            ls = acc + [" ".join(words[start:])]
            m = max(f.getlength(x) for x in ls)
            if m < best:
                best, bl = m, ls
            return
        for e in range(start + 1, len(words) - k + 2):
            rec(e, k - 1, acc + [" ".join(words[start:e])])

    rec(0, k, [])
    return bl


# ------------------------------------------------------------------ ornaments
def lotus(size, color=GOLD):
    """Minimal lotus motif (RGBA), drawn at 4x and reduced."""
    s = 4
    w, h = int(size * 1.6) * s, int(size) * s
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, base = w / 2, h * 0.92

    def petal(angle, length, width):
        pts = []
        for k in range(41):
            u = k / 40
            y = -length * u
            x = width * math.sin(math.pi * u) ** 0.9 * (1 - 0.25 * u)
            pts.append((x, y))
        pts = pts + [(-x, y) for x, y in pts[::-1]]
        ca, sa = math.cos(angle), math.sin(angle)
        return [(cx + x * ca - y * sa, base + x * sa + y * ca) for x, y in pts]

    for ang, ln, wd in [(-1.05, 0.55, 0.13), (1.05, 0.55, 0.13), (-0.55, 0.75, 0.16), (0.55, 0.75, 0.16), (0, 0.9, 0.2)]:
        d.polygon(petal(ang, ln * h, wd * h), fill=color + (255,))
    for ang, ln, wd in [(-0.55, 0.75, 0.16), (0.55, 0.75, 0.16), (0, 0.9, 0.2)]:  # dark vein lines
        pts = petal(ang, ln * h * 0.55, wd * h * 0.25)
        d.polygon(pts, fill=(40, 26, 10, 160))
    d.ellipse((cx - h * 0.42, base - h * 0.05, cx + h * 0.42, base + h * 0.06), fill=color + (255,))
    return im.resize((w // s, h // s), Image.LANCZOS)


@lru_cache(None)
def divider(width, lotus_size=34):
    """Fine gold lines fading outwards with a lotus at the centre."""
    h = lotus_size + 10
    im = Image.new("RGBA", (width, h), (0, 0, 0, 0))
    lo = lotus(lotus_size, GOLD)
    gap = lo.width // 2 + 14
    line = np.zeros((h, width, 4), np.uint8)
    y = h - 12
    x = np.arange(width)
    dist = np.abs(x - width / 2)
    a = np.where(dist > gap, np.clip(1 - (dist - gap) / (width / 2 - gap), 0, 1) ** 0.8, 0)
    for yy, k in ((y, 1.0), (y + 1, 0.35)):
        line[yy, :, :3] = GOLD
        line[yy, :, 3] = (a * 255 * k).astype(np.uint8)
    # small dots at the line ends of the lotus
    im = Image.fromarray(line, "RGBA")
    d = ImageDraw.Draw(im)
    for sx in (-1, 1):
        px = width / 2 + sx * (gap - 6)
        d.ellipse((px - 3, y - 3, px + 3, y + 3), fill=GOLD + (255,))
    im.alpha_composite(lo, (width // 2 - lo.width // 2, h - lo.height - 8))
    return im


def put_divider(img, cx, cy, width, reveal=1.0, alpha=1.0):
    dv = divider(width)
    if reveal < 1:
        keep = int(dv.width * ease_out(reveal))
        if keep < 2:
            return
        x0 = (dv.width - keep) // 2
        dv = dv.crop((x0, 0, x0 + keep, dv.height))
    put(img, dv, cx - dv.width / 2, cy - dv.height / 2, alpha)


@lru_cache(None)
def corner(size=26):
    s = 4
    im = Image.new("RGBA", (size * s, size * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = size * s / 2
    r = size * s * 0.42
    d.polygon([(c, c - r), (c + r * 0.55, c), (c, c + r), (c - r * 0.55, c)], fill=GOLD + (255,))
    d.polygon([(c - r, c), (c, c - r * 0.55), (c + r, c), (c, c + r * 0.55)], fill=GOLD + (255,))
    d.ellipse((c - r * 0.22, c - r * 0.22, c + r * 0.22, c + r * 0.22), fill=(30, 20, 8, 255))
    return im.resize((size, size), Image.LANCZOS)


# ------------------------------------------------------------------ particles
class Particles:
    def __init__(self, n, seed, area=(0, 0, W, H), rise=(18, 46), size=(1.4, 3.6), bright=1.0):
        r = np.random.default_rng(seed)
        self.x = r.uniform(area[0], area[2], n)
        self.y = r.uniform(area[1], area[3], n)
        self.v = r.uniform(*rise, n)
        self.s = r.uniform(*size, n)
        self.ph = r.uniform(0, 6.28, n)
        self.tw = r.uniform(0.6, 1.8, n)
        self.area = area
        self.bright = bright

    def draw(self, arr, t, alpha=1.0, avoid=None):
        x0, y0, x1, y1 = self.area
        hh = y1 - y0
        for i in range(len(self.x)):
            y = y0 + (self.y[i] - y0 - self.v[i] * t) % hh
            x = self.x[i] + 14 * math.sin(0.35 * t + self.ph[i])
            if avoid and avoid[0] < x < avoid[2] and avoid[1] < y < avoid[3]:
                continue
            tw = 0.35 + 0.65 * math.sin(self.tw[i] * t + self.ph[i]) ** 2
            edge = min(1.0, (y - y0) / 160, (y1 - y) / 160)
            k = tw * edge * alpha * self.bright
            if k <= 0.01:
                continue
            r = self.s[i]
            add_sprite(arr, glow_sprite(round(r * 4, 1), (255, 200, 110)), x, y, 0.55 * k)
            add_sprite(arr, glow_sprite(round(r, 1), (255, 246, 214), 1.2), x, y, k)


# ------------------------------------------------------------------ paintings
def load_painting(slug):
    """The studio photograph, trimmed only to the framed painting plus a margin of its own backdrop."""
    im = Image.open(os.path.join(HERE, "assets", "paintings", slug + ".png")).convert("RGB")
    a = np.asarray(im).astype(int)
    gold = (a[..., 0] > 120) & (a[..., 2] < 120) & (a[..., 0] - a[..., 2] > 60)
    rows = np.flatnonzero(gold[1205:].sum(1) > 3) + 1205  # the gold mantra under the frame
    return im.crop((100, 40, 986, int(rows[0]) - 14))


PAINT = {slug: load_painting(slug) for slug, _, _ in GODDESSES}


# ------------------------------------------------------------------ backgrounds
def gallery_bg():
    arr = np.zeros((H, W, 3), np.float32) + np.array(BG, np.float32)
    arr += radial(W, H, W / 2, 700, 900, (34, 24, 10), 1.6)  # soft studio light behind the painting
    arr += radial(W, H, W / 2, 1450, 700, (14, 9, 4), 1.5)
    return arr


GALLERY = gallery_bg()
GAL_PARTICLES = Particles(70, 5, rise=(10, 26), size=(1.0, 2.6), bright=0.8)


# ------------------------------------------------------------------ diya scene
def marigold(r, color, seed):
    """A marigold flower head (RGBA) with ruffled petals."""
    rnd = np.random.default_rng(seed)
    s = 4
    R = int(r * s)
    im = Image.new("RGBA", (2 * R + 8, 2 * R + 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = R + 4
    dark = tuple(int(v * 0.62) for v in color)
    mid = tuple(int(v * 0.82) for v in color)
    hl = tuple(min(255, int(v * 1.1) + 10) for v in color)
    d.ellipse((c - R * 0.8, c - R * 0.8, c + R * 0.8, c + R * 0.8), fill=dark + (255,))
    for k in range(int(R * 1.6)):  # scattered ruffled petals, lighter towards the top
        a = rnd.uniform(0, 2 * math.pi)
        pr = R * 0.78 * math.sqrt(rnd.uniform(0, 1))
        px, py = c + math.cos(a) * pr, c + math.sin(a) * pr
        pw = R * rnd.uniform(0.12, 0.22)
        lit = (c - py) / R
        col = hl if lit > 0.35 and rnd.uniform() < 0.6 else (color if rnd.uniform() < 0.65 else mid)
        d.ellipse((px - pw, py - pw * 0.8, px + pw, py + pw * 0.8), fill=col + (255,))
    return im.resize((im.width // s, im.height // s), Image.LANCZOS)


def leaf(length, angle):
    s = 4
    L = int(length * s)
    im = Image.new("RGBA", (L * 2, L * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pts = []
    for k in range(31):
        u = k / 30
        pts.append((u * L, 0.22 * L * math.sin(math.pi * u) ** 0.8))
    pts += [(x, -y) for x, y in pts[::-1]]
    ca, sa = math.cos(angle), math.sin(angle)
    pts = [(L + x * ca - y * sa, L + x * sa + y * ca) for x, y in pts]
    d.polygon(pts, fill=(46, 104, 38, 255))
    d.line([(L, L), (L + L * ca * 0.95, L + L * sa * 0.95)], fill=(90, 150, 60, 255), width=s)
    return im.resize((L * 2 // s, L * 2 // s), Image.LANCZOS)


def garland_points(x0, y0, x1, y1, sag, n):
    pts = []
    for k in range(n):
        u = k / (n - 1)
        pts.append((x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + sag * 4 * u * (1 - u)))
    return pts


def diya_body(scale):
    """Clay diya (RGBA) with Mithila-style dots and triangles; returns image and wick point."""
    s = 4
    w, h = int(240 * scale) * s, int(130 * scale) * s
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = w / 2
    rim_y = h * 0.28
    rw, bh = w * 0.44, h * 0.55
    body = [(cx + rw * math.cos(a), rim_y + bh * math.sin(a)) for a in np.linspace(0, math.pi, 80)]
    d.polygon(body, fill=(150, 62, 30, 255))
    # foot
    d.polygon([(cx - rw * 0.32, rim_y + bh * 0.92), (cx + rw * 0.32, rim_y + bh * 0.92),
               (cx + rw * 0.4, rim_y + bh * 1.12), (cx - rw * 0.4, rim_y + bh * 1.12)], fill=(120, 46, 22, 255))
    # shading: darker towards the edges and bottom
    arr = np.asarray(im).astype(np.float32)
    yy, xx = np.mgrid[0:h, 0:w]
    shade = 1 - 0.45 * (np.abs(xx - cx) / rw) ** 2 - 0.25 * np.clip((yy - rim_y) / bh, 0, 1)
    arr[..., :3] *= np.clip(shade, 0.35, 1.1)[..., None]
    im = Image.fromarray(arr.clip(0, 255).astype(np.uint8), "RGBA")
    d = ImageDraw.Draw(im)
    # decorative band: yellow triangles, white dots
    band_y = rim_y + bh * 0.3
    n = 9
    for k in range(n):
        a = math.pi * (0.12 + 0.76 * (k + 0.5) / n)
        x = cx + rw * 0.93 * math.cos(math.pi - a)
        tri = 10 * scale * s
        d.polygon([(x - tri, band_y), (x + tri, band_y), (x, band_y + tri * 1.6)], fill=(236, 178, 46, 255))
        d.ellipse((x - 3.2 * scale * s, band_y + tri * 2.1, x + 3.2 * scale * s, band_y + tri * 2.1 + 6.4 * scale * s),
                  fill=(246, 236, 214, 255))
    # rim and oil
    d.ellipse((cx - rw, rim_y - h * 0.1, cx + rw, rim_y + h * 0.1), fill=(176, 80, 38, 255))
    d.ellipse((cx - rw * 0.86, rim_y - h * 0.07, cx + rw * 0.86, rim_y + h * 0.07), fill=(70, 34, 14, 255))
    d.ellipse((cx - rw * 0.6, rim_y - h * 0.045, cx + rw * 0.2, rim_y + h * 0.02), fill=(150, 104, 40, 255))
    # wick
    d.line([(cx - 2 * s, rim_y), (cx + 3 * s * scale, rim_y - 14 * scale * s)], fill=(40, 24, 14, 255), width=int(3 * s * scale))
    out = im.resize((w // s, h // s), Image.LANCZOS)
    return out, (out.width / 2 + 3 * scale, rim_y / s - 14 * scale)


@lru_cache(None)
def flame_sprite(hpx):
    """Teardrop flame (RGBA) with a smooth gradient: white core, yellow body, orange edge, blue root."""
    w, h = int(hpx * 0.62) + 8, int(hpx) + 8
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx = w / 2
    v = (yy - 4) / hpx                      # 0 at the tip, 1 at the base
    vc = np.clip(v, 0, 1)
    half = hpx * 0.27 * np.where(v < 0.68, (vc / 0.68) ** 0.62, np.sqrt(np.clip(1 - ((vc - 0.68) / 0.32) ** 2, 0, 1)))
    d = np.abs(xx - cx) / np.maximum(half, 1e-3)
    d = np.where((v < 0) | (v > 1), 9, d)
    inside = np.clip(1 - d, 0, 1)
    core = np.clip(1 - np.hypot((xx - cx) / (hpx * 0.1), (v - 0.66) / 0.24), 0, 1)
    body = inside ** 0.6
    col = np.zeros((h, w, 3), np.float32)
    orange, yellow, white = (np.array(c, np.float32) for c in ((255, 112, 18), (255, 206, 72), (255, 250, 228)))
    k = np.clip(inside * 1.8, 0, 1)[..., None]
    col[:] = orange + (yellow - orange) * k
    col += (white - col) * np.clip(core * 1.6, 0, 1)[..., None]
    blue = np.clip(1 - np.hypot((xx - cx) / (hpx * 0.09), (v - 0.97) / 0.06), 0, 1)
    col += (np.array((90, 130, 255), np.float32) - col) * (blue * 0.55)[..., None]
    a = np.clip(body * 1.25, 0, 1) * np.clip((1 - v) * 0.4 + 0.75, 0, 1)
    im = Image.fromarray(np.dstack([col, a * 255]).clip(0, 255).astype(np.uint8), "RGBA")
    return im.filter(ImageFilter.GaussianBlur(0.9))


def noise(t, ph):
    return (math.sin(7.1 * t + ph) * 0.5 + math.sin(11.3 * t + ph * 1.7) * 0.3 + math.sin(17.9 * t + ph * 2.3) * 0.2)


class DiyaScene:
    """Rows of clay diyas under marigold torans, warm bokeh and rising gold sparks."""

    def __init__(self):
        r = np.random.default_rng(21)
        arr = np.zeros((H, W, 3), np.float32)
        yy = np.linspace(0, 1, H)[:, None, None]
        arr += np.array(BG, np.float32) * (1 - yy) + np.array((34, 16, 6), np.float32) * yy
        arr += radial(W, H, W / 2, 1380, 900, (70, 34, 8), 1.4)
        # out-of-focus lamps far away (bokeh)
        bok = np.zeros_like(arr)
        for _ in range(34):
            x, y = r.uniform(-50, W + 50), r.uniform(380, 1250)
            rad = r.uniform(26, 80)
            col = (255, r.uniform(150, 200), r.uniform(60, 110))
            k = r.uniform(0.05, 0.16)
            add_sprite(bok, radial(int(rad * 2) + 1, int(rad * 2) + 1, rad, rad, rad, col, 0.35), x, y, k)
        arr += bok
        img = Image.fromarray(arr.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))
        # floor sheen
        fl = Image.new("L", (W, H), 0)
        ImageDraw.Draw(fl).rectangle((0, 1470, W, H), fill=90)
        fl = fl.filter(ImageFilter.GaussianBlur(40))
        img.paste(Image.new("RGB", (W, H), (20, 10, 5)), (0, 0), fl)
        base = img.convert("RGBA")

        # marigold torans: three swags across the top and strands hanging at the sides
        flowers = {c: [marigold(rr, col, i) for i, rr in enumerate((19, 21, 23))]
                   for c, col in (("o", (240, 120, 18)), ("y", (250, 190, 32)))}
        swags = [(-40, 40, 380, 60, 150), (360, 60, 720, 60, 170), (700, 60, 1120, 40, 150)]
        k = 0
        for x0, y0, x1, y1, sag in swags:
            pts = garland_points(x0, y0, x1, y1, sag, 22)
            for i, (x, y) in enumerate(pts):
                if i % 7 == 0:
                    lf = leaf(34, math.pi / 2 + r.uniform(-0.9, 0.9))
                    base.alpha_composite(lf, (int(x - lf.width / 2), int(y - lf.height / 2 + 14)))
            for i, (x, y) in enumerate(pts):
                fl_ = flowers["o" if (i // 2) % 2 == 0 else "y"][k % 3]
                k += 1
                base.alpha_composite(fl_, (int(x - fl_.width / 2), int(y - fl_.height / 2)))
        for x in (34, W - 34):
            for i in range(19):
                y = 40 + i * 36
                fl_ = flowers["y" if (i // 2) % 2 == 0 else "o"][i % 3]
                base.alpha_composite(fl_, (int(x - fl_.width / 2), int(y - fl_.height / 2)))
            lf = leaf(30, math.pi / 2)
            base.alpha_composite(lf, (int(x - lf.width / 2), 40 + 19 * 36 - 10))
        # a slight vignette
        vg = np.asarray(base).astype(np.float32)
        vy, vx = np.mgrid[0:H, 0:W]
        v = 1 - 0.45 * np.clip(((vx - W / 2) / (W * 0.75)) ** 2 + ((vy - H * 0.55) / (H * 0.7)) ** 2, 0, 1)
        vg[..., :3] *= v[..., None]

        # diyas: a back row (smaller) and a front row; flames are animated separately
        self.lamps = []
        layer = Image.fromarray(vg.clip(0, 255).astype(np.uint8), "RGBA")
        rows = [([(250, 1300, 0.55), (430, 1290, 0.58), (650, 1290, 0.58), (830, 1300, 0.55)]),
                ([(150, 1475, 0.82), (345, 1440, 0.92), (540, 1425, 1.04), (735, 1440, 0.92), (930, 1475, 0.82)])]
        petals = [marigold(14, (240, 120, 18), 40 + i) for i in range(3)] + [marigold(13, (250, 190, 32), 50 + i) for i in range(3)]
        for row in rows:
            for x, y, sc in row:
                body, (wx, wy) = diya_body(sc)
                ox, oy = int(x - body.width / 2), int(y - body.height * 0.28)
                # warm pool of light on the floor
                pool = Image.new("L", (W, H), 0)
                ImageDraw.Draw(pool).ellipse((x - 150 * sc, y + 30 * sc, x + 150 * sc, y + 95 * sc), fill=int(120 * sc))
                pool = pool.filter(ImageFilter.GaussianBlur(26 * sc))
                layer.paste(Image.new("RGB", (W, H), (190, 104, 34)), (0, 0), pool)
                layer.alpha_composite(body, (ox, oy))
                self.lamps.append((ox + wx, oy + wy, sc))
        for i, (x, y) in enumerate([(70, 1560), (250, 1575), (445, 1545), (640, 1550), (830, 1572), (1010, 1555), (110, 1395), (970, 1395)]):
            p = petals[i % 6]
            layer.alpha_composite(p, (int(x - p.width / 2), int(y - p.height / 2)))
        self.base = np.asarray(layer.convert("RGB")).astype(np.float32)
        self.glows = {round(sc, 2): (glow_sprite(int(330 * sc), (255, 150, 50), 2.0), glow_sprite(int(110 * sc), (255, 210, 120), 1.6))
                      for _, _, sc in self.lamps}
        self.sparks = Particles(80, 9, area=(0, 300, W, 1500), rise=(22, 60), size=(1.2, 3.2))
        self.ph = [i * 1.37 for i in range(len(self.lamps))]

    def frame(self, t, push):
        arr = self.base.copy()
        for (x, y, sc), ph in zip(self.lamps, self.ph):
            n = noise(t, ph)
            big, small = self.glows[round(sc, 2)]
            add_sprite(arr, big, x, y - 40 * sc, 0.36 + 0.05 * n)
            add_sprite(arr, small, x, y - 44 * sc, 0.34 + 0.08 * n)
        self.sparks.draw(arr, t, 1.0)
        img = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
        for (x, y, sc), ph in zip(self.lamps, self.ph):
            n, n2 = noise(t * 1.3, ph + 2), noise(t * 0.9, ph + 5)
            fl = flame_sprite(int(round(96 * sc / 2)) * 2)
            fh = int(fl.height * (1 + 0.07 * n))
            fw = int(fl.width * (1 - 0.03 * n))
            f2 = fl.resize((fw, fh), Image.BICUBIC)
            f2 = f2.transform(f2.size, Image.AFFINE, (1, 0.06 * n2, -0.06 * n2 * fh, 0, 1, 0), Image.BICUBIC)
            img.paste(f2.convert("RGB"), (int(x - fw / 2), int(y - fh + 10 * sc)), f2.getchannel("A"))
        if push != 1.0:
            cw, ch = W / push, H / push
            x0, y0 = (W - cw) / 2, (H - ch) * 0.62
            img = img.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch))
        return img


DIYA = None


# ------------------------------------------------------------------ layout per version
def make_layout(version):
    """Painting box and text positions, sized so the longest description fits under the painting."""
    size = 44 if version == "reel" else 40
    lh = int(size * 1.6)
    width = 840
    blocks = {}
    nmax = 0
    for slug, title, desc in GODDESSES:
        groups = [wrap(s, size, width) for s in T.sentences(desc)[: T.VERSIONS[version]["sentences"]]]
        blocks[slug] = groups
        nmax = max(nmax, sum(len(g) for g in groups))
    text_bottom = 1600 if version == "reel" else 1640
    desc_top = text_bottom - nmax * lh
    div_y = desc_top - 46
    title_y = div_y - 74
    paint_bottom = title_y - 96
    paint_top = 150
    ph = int((paint_bottom - paint_top) / 1.03)  # leaves room for the slow push-in
    return dict(size=size, lh=lh, blocks=blocks, desc_top=desc_top, div_y=div_y, title_y=title_y,
                paint_box=(paint_top, ph), nmax=nmax)


# ------------------------------------------------------------------ scenes
def scene_goddess(s, t):
    L = LAYOUT
    u = t - s["start"]
    D = s["end"] - s["start"]
    arr = GALLERY.copy()
    top, ph = L["paint_box"]
    p = PAINT[s["slug"]]
    base_h = ph
    base_w = base_h * p.width / p.height
    z = (0.975 + 0.025 * ease_out((u + T.XF / 2) / 1.6)) * (1 + 0.028 * clamp(u / D))
    w, h = base_w * z, base_h * z
    cx, cy = W / 2, top + ph * 1.015 / 2
    GAL_PARTICLES.draw(arr, t, 0.9, avoid=(cx - w / 2 - 10, cy - h / 2 - 10, cx + w / 2 + 10, cy + h / 2 + 10))
    img = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
    # gallery framing: soft shadow, then the photograph, then fine gold lines and corner jewels
    x0, y0 = cx - w / 2, cy - h / 2
    pi = p.resize((int(round(w)), int(round(h))), Image.LANCZOS if z < 1 else Image.BICUBIC)
    img.paste(pi, (int(round(x0)), int(round(y0))))
    d = ImageDraw.Draw(img)
    for off, col, wd in ((7, GOLD, 2), (15, GOLD_LO, 1)):
        d.rectangle((x0 - off, y0 - off, x0 + pi.width + off - 1, y0 + pi.height + off - 1), outline=col, width=wd)
    cn = corner(26)
    for qx, qy in ((x0 - 15, y0 - 15), (x0 + pi.width + 14, y0 - 15), (x0 - 15, y0 + pi.height + 14),
                   (x0 + pi.width + 14, y0 + pi.height + 14)):
        put(img, cn, qx - cn.width / 2, qy - cn.height / 2)
    # title, divider and the description, sentence by sentence as it is spoken
    ev = s["events"]
    a = fade_in(t, ev["title"], 0.7)
    put_text(img, s["title"], 84, W / 2, L["title_y"], a, dy=14 * (1 - a))
    put_divider(img, W / 2, L["div_y"], 560, reveal=(t - ev["title"] - 0.15) / 0.9, alpha=a)
    y = L["desc_top"] + L["lh"] / 2
    lines_all = L["blocks"][s["slug"]]
    total = sum(len(g) for g in lines_all)
    y += (L["nmax"] - total) * L["lh"] / 2  # centre shorter descriptions in the same block
    for g, on in zip(lines_all, ev["lines"]):
        b = fade_in(t, on - 0.1, 0.6)
        for line in g:
            put_text(img, line, L["size"], W / 2, y, b, kind="ivory", glow=False, dy=10 * (1 - b))
            y += L["lh"]
    return img


def scene_diya(s, t):
    u = t - s["start"]
    D = s["end"] - s["start"]
    img = DIYA.frame(t, 1.0 + 0.045 * clamp(u / max(D, 1)))
    ev = s["events"]
    full = TL["version"] == "full"
    if s["kind"] == "open":
        g = fade_in(t, ev["greet"], 0.9)
        ti = fade_in(t, ev["title"], 0.9)
        if full:  # greeting alone, then it gives way to the अष्टलक्ष्मी card
            g *= 1 - ti
            gy, ty = 760, 700
        else:
            gy, ty = 610, 840
        put_text(img, "॥ शुभ दीपावली ॥", 100, W / 2, gy, g, dy=16 * (1 - g))
        put_divider(img, W / 2, gy + 92, 520, reveal=(t - ev["greet"] - 0.3) / 1.0, alpha=g)
        put_text(img, "अष्टलक्ष्मी", 128, W / 2, ty, ti, dy=16 * (1 - ti))
        put_text(img, "माँ लक्ष्मी के आठ दिव्य स्वरूप", 46, W / 2, ty + 118, ti, kind="ivory", glow=False)
        if full:
            put_divider(img, W / 2, ty + 196, 420, reveal=(t - ev["title"] - 0.3) / 1.0, alpha=ti)
    else:
        g = fade_in(t, ev["greet"], 0.9)
        put_text(img, "॥ शुभ दीपावली ॥", 104, W / 2, 600, g, dy=16 * (1 - g))
        put_divider(img, W / 2, 700, 540, reveal=(t - ev["greet"] - 0.3) / 1.0, alpha=g)
        j1, j2 = (fade_in(t, x - 0.1, 0.7) for x in ev["jai"])
        put_text(img, "॥ जय माता लक्ष्मी ॥", 72, W / 2, 810, j1, dy=12 * (1 - j1))
        put_text(img, "॥ जय अष्टलक्ष्मी ॥", 72, W / 2, 915, j2, dy=12 * (1 - j2))
    return img


GRID_NAMES = ["आदि", "धन", "धान्य", "गज", "संतान", "वीर", "विजय", "विद्या"]


def scene_grid(s, t):
    u = t - s["start"]
    D = s["end"] - s["start"]
    arr = GALLERY.copy()
    GAL_PARTICLES.draw(arr, t, 0.9)
    img = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
    tw = 286
    z = 1 + 0.02 * clamp(u / D)
    put_text(img, "अष्टलक्ष्मी", 76, W / 2, 175, fade_in(t, s["start"], 0.8))
    for i, (slug, _, _) in enumerate(GODDESSES):
        row, col = divmod(i, 3)
        ncol = 3 if row < 2 else 2
        cx = W / 2 + (col - (ncol - 1) / 2) * (tw + 40)
        p = PAINT[slug]
        w = tw * z
        h = w * p.height / p.width
        cy = 470 + row * 470
        a = fade_in(t, s["start"] + 0.2 + 0.32 * i, 0.6)
        if a <= 0:
            continue
        pi = p.resize((int(w), int(h)), Image.LANCZOS)
        x0, y0 = cx - w / 2, cy - h / 2 + 10 * (1 - a)
        tile = Image.new("RGB", (pi.width + 12, pi.height + 12), GOLD)
        tile.paste(Image.new("RGB", (pi.width + 8, pi.height + 8), BG), (2, 2))
        tile.paste(pi, (6, 6))
        mask = Image.new("L", tile.size, int(255 * a))
        img.paste(tile, (int(x0 - 6), int(y0 - 6)), mask)
        put_text(img, GRID_NAMES[i], 46, cx, cy + h / 2 + 40, a)
    return img


SCENES = {"goddess": scene_goddess, "open": scene_diya, "close": scene_diya, "grid": scene_grid}


def frame(t):
    sc = TL["scenes"]
    img = None
    for i, s in enumerate(sc):
        a0 = s["start"] - (T.XF / 2 if i else 0)
        a1 = s["end"] + (T.XF / 2 if i < len(sc) - 1 else 0)
        if not (a0 <= t < a1):
            continue
        cur = SCENES[s["kind"]](s, t)
        if i and t < s["start"] + T.XF / 2:
            prev = SCENES[sc[i - 1]["kind"]](sc[i - 1], t)
            k = ease((t - (s["start"] - T.XF / 2)) / T.XF)
            cur = Image.blend(prev, cur, k)
        img = cur
        break
    if img is None:
        img = Image.new("RGB", (W, H), BG)
    # fade from and to black
    k = min(1.0, ease(t / 0.7), ease((TL["dur"] - t) / 1.1))
    if k < 1:
        img = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), img, k)
    return img


def render_frame(i):
    return frame(i / FPS).tobytes()


def setup(version):
    global TL, LAYOUT, DIYA
    TL = T.build(version)
    LAYOUT = make_layout(version)
    DIYA = DiyaScene()


if __name__ == "__main__":
    version, out = sys.argv[1], sys.argv[2]
    setup(version)
    if "--frames" in sys.argv:
        for ts in sys.argv[sys.argv.index("--frames") + 1].split(","):
            frame(float(ts)).save(f"{out}-{float(ts):06.2f}.png")
        sys.exit()
    if "--cover" in sys.argv:
        s0 = TL["scenes"][0]
        frame(s0["end"] - 0.5).convert("RGB").save(out, quality=94)
        sys.exit()
    audio = sys.argv[3]
    n = int(round(TL["dur"] * FPS))
    cmd = ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-i", audio, "-map", "0:v", "-map", "1:a",
           "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-maxrate", "9M", "-bufsize", "18M",
           "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.1", "-r", str(FPS),
           "-af", "volume=2.6dB,alimiter=limit=0.84:attack=4:release=60:level=disabled",
           "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with Pool(4) as pool:
        for k, buf in enumerate(pool.imap(render_frame, range(n), chunksize=8)):
            p.stdin.write(buf)
            if k % 300 == 0:
                print(f"  frame {k}/{n}", flush=True)
    p.stdin.close()
    p.wait()
    print("wrote", out, f"{TL['dur']:.2f} s")
