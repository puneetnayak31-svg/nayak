"""Shared engine for the episode-2 re-edits (1985 World Championship of Cricket segment).

Both versions use the same restrained grammar: visuals emerge from the studio's own LED screen and fold
back into it, archive photos get a gentle 2.5D parallax, type is formal (serif + Devanagari), and the
sound is a quiet bed under Vikrant's voice.
"""
import math
import os
import subprocess
from functools import lru_cache

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FONTS = os.path.join(ROOT, "assets", "fonts")
EP2 = os.path.join(HERE, "assets")

W, H = 1920, 1080
FPS = 24000 / 1001
SCREEN = (345, 186, 797, 984)          # the studio's portrait LED screen in this camera set-up

# palette: matched to the studio's blue-violet set, warm ivory for type, one green accent from the brand
INK = (10, 12, 26)
NAVY = (22, 26, 58)
IVORY = (244, 238, 224)
SAND = (214, 196, 160)
MUTED = (168, 170, 190)
GREEN = (120, 200, 60)


# ------------------------------------------------------------------ timing
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def prog(t, a, b):
    return clamp((t - a) / (b - a)) if b > a else float(t >= b)


def ease(x):                      # smooth, unhurried (sine in-out)
    return 0.5 - 0.5 * math.cos(math.pi * clamp(x))


def ease_out(x):                  # quart out: settles without overshoot
    return 1 - (1 - clamp(x)) ** 4


def lerp(a, b, x):
    return a + (b - a) * x


def env(t, dur, fin=0.8, fout=0.8):
    return min(ease(prog(t, 0, fin)), 1 - ease(prog(t, dur - fout, dur)))


# ------------------------------------------------------------------ type
FONT_FILES = {
    "serif": "PlayfairDisplay-700.ttf",
    "serif_m": "PlayfairDisplay-600.ttf",
    "serif_i": "PlayfairDisplay-600Italic.ttf",
    "hindi": "TiroDevanagariHindi-400.ttf",
    "sans": "InterTight-500.ttf",
    "sans_b": "InterTight-700.ttf",
}


@lru_cache(maxsize=256)
def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, FONT_FILES[name]), int(size), layout_engine=ImageFont.Layout.RAQM)


@lru_cache(maxsize=512)
def text(s, name, size, fill=IVORY, tracking=0):
    f = font(name, size)
    if not tracking:
        l, t, r, b = f.getbbox(s)
        im = Image.new("RGBA", (r - l + 6, b - t + 6), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((-l + 3, -t + 3), s, font=f, fill=fill)
        return im
    widths = [f.getlength(c) for c in s]
    w = int(sum(widths) + tracking * (len(s) - 1)) + 8
    l, t, r, b = f.getbbox("Hg")
    im = Image.new("RGBA", (w, b - t + 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x = 3
    for c, cw in zip(s, widths):
        d.text((x, -t + 3), c, font=f, fill=fill)
        x += cw + tracking
    return im


def kicker(s, color=SAND, size=20):
    return text(s.upper(), "sans_b", size, color, tracking=4)


def paste(canvas, im, xy, alpha=1.0):
    if im is None or alpha <= 0.003:
        return
    if alpha < 0.997:
        im = im.copy()
        im.putalpha(im.getchannel("A").point(lambda v: int(v * alpha)))
    x, y = int(round(xy[0])), int(round(xy[1]))
    canvas.alpha_composite(im, (max(x, 0), max(y, 0)), (max(-x, 0), max(-y, 0)))


def reveal(im, p):
    """Soft left-to-right reveal with a feathered edge (no hard wipes)."""
    if p >= 1:
        return im
    if p <= 0:
        return None
    w, h = im.size
    edge = 80
    x = np.arange(w)[None, :]
    m = np.clip(((p * (w + edge)) - x) / edge, 0, 1)
    a = (np.asarray(im.getchannel("A")).astype(np.float32) * m).astype(np.uint8)
    out = im.copy()
    out.putalpha(Image.fromarray(a, "L"))
    return out


def hairline(w, color=SAND, alpha=200, h=2):
    return Image.new("RGBA", (max(1, int(w)), h), color + (alpha,))


# ------------------------------------------------------------------ image finishing
_grain = None


def grain(a, i, amt=5.0):
    global _grain
    if _grain is None:
        rng = np.random.default_rng(3)
        _grain = [cv2.GaussianBlur(rng.normal(0, 1, (H + 32, W + 32)).astype(np.float32), (3, 3), 0) for _ in range(4)]
    g = _grain[i % 4][(i * 7) % 32:(i * 7) % 32 + H, (i * 13) % 32:(i * 13) % 32 + W]
    return np.clip(a.astype(np.float32) + g[..., None] * amt, 0, 255).astype(np.uint8)


@lru_cache(maxsize=2)
def _vig(strength):
    y, x = np.ogrid[:H, :W]
    d = np.sqrt(((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2) / math.sqrt(2)
    return (1 - strength * np.clip(d, 0, 1) ** 2.4).astype(np.float32)


def vignette(a, s=0.35):
    return (a.astype(np.float32) * _vig(s)[..., None]).astype(np.uint8)


def cover(img, w, h, zoom=1.0, cx=0.5, cy=0.5):
    iw, ih = img.size
    s = max(w / iw, h / ih) * zoom
    cw, ch = w / s, h / s
    x0 = clamp(cx * iw - cw / 2, 0, iw - cw)
    y0 = clamp(cy * ih - ch / 2, 0, ih - ch)
    return img.transform((w, h), Image.Transform.AFFINE, (cw / w, 0, x0, 0, ch / h, y0), resample=Image.Resampling.BICUBIC)


# ------------------------------------------------------------------ archive parallax (2.5D)
class Parallax:
    """Splits an archive photo into people (foreground) and the rest (background, holes inpainted),
    then drifts them at slightly different rates so the still gains depth without looking manipulated."""

    def __init__(self, path, crop=None, fg_rect=None):
        img = Image.open(path).convert("RGB")
        arr = remove_bug(np.asarray(img))
        if crop:
            arr = arr[crop[1]:crop[3], crop[0]:crop[2]]
        else:                                   # trim pillar/letterbox bars baked into the master
            cols = np.where(arr.mean((0, 2)) > 10)[0]
            rows = np.where(arr.mean((1, 2)) > 10)[0]
            arr = arr[rows[0]:rows[-1] + 1, cols[0] + 2:cols[-1] - 1]
        img = Image.fromarray(arr)
        self.img = img
        m = grabcut_mask(arr, fg_rect) if fg_rect else person_mask(arr)
        self.mask = m
        hole = cv2.dilate((m > 0.3).astype(np.uint8) * 255, np.ones((25, 25), np.uint8))
        small = cv2.resize(arr, (arr.shape[1] // 2, arr.shape[0] // 2))
        hs = cv2.resize(hole, (small.shape[1], small.shape[0]))
        bg = cv2.inpaint(small, hs, 9, cv2.INPAINT_TELEA)
        bg = cv2.resize(bg, (arr.shape[1], arr.shape[0]))
        bg = np.where(hole[..., None] > 0, bg, arr)
        self.bg = Image.fromarray(bg)
        fg = np.dstack([arr, (cv2.GaussianBlur(m, (5, 5), 0) * 255).astype(np.uint8)])
        self.fg = Image.fromarray(fg, "RGBA")

    def render(self, t, dur, z0=1.04, z1=1.12, c0=(0.5, 0.5), c1=(0.5, 0.48), depth=0.035):
        x = ease(prog(t, 0, dur))
        z = lerp(z0, z1, x)
        cx, cy = lerp(c0[0], c1[0], x), lerp(c0[1], c1[1], x)
        bg = cover(self.bg, W, H, z, cx, cy)
        fg = cover(self.fg, W, H, z * (1 + depth * x), cx, cy)
        out = bg.convert("RGBA")
        out.alpha_composite(fg)
        return np.asarray(out.convert("RGB"))


def remove_bug(arr):
    """Inpaint the burned-in channel bug out of an archive frame (the clean bug is re-applied on top)."""
    rgb, a, x, y = bug()
    h, w = a.shape[:2]
    m = np.zeros(arr.shape[:2], np.uint8)
    m[y:y + h, x:x + w] = (a[..., 0] > 0.05).astype(np.uint8) * 255
    m = cv2.dilate(m, np.ones((7, 7), np.uint8))
    return cv2.inpaint(np.ascontiguousarray(arr), m, 7, cv2.INPAINT_TELEA)


def remove_bug_fast(arr):
    """Per-frame version of remove_bug: inpaints only the bug's bounding box."""
    rgb, a, x, y = bug()
    h, w = a.shape[:2]
    pad = 10
    box = np.ascontiguousarray(arr[y - pad:y + h + pad, x - pad:x + w + pad])
    m = np.zeros(box.shape[:2], np.uint8)
    m[pad:pad + h, pad:pad + w] = (a[..., 0] > 0.05).astype(np.uint8) * 255
    m = cv2.dilate(m, np.ones((7, 7), np.uint8))
    out = arr.copy()
    out[y - pad:y + h + pad, x - pad:x + w + pad] = cv2.inpaint(box, m, 5, cv2.INPAINT_TELEA)
    return out


def grabcut_mask(arr, rect):
    """Foreground (e.g. the car and the players on it) from a hand-placed box, refined by GrabCut."""
    small = cv2.resize(arr, (arr.shape[1] // 2, arr.shape[0] // 2))
    r = tuple(int(v / 2) for v in (rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]))
    mask = np.zeros(small.shape[:2], np.uint8)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(small, cv2.COLOR_RGB2BGR), mask, r, bgd, fgd, 6, cv2.GC_INIT_WITH_RECT)
    m = np.where((mask == 1) | (mask == 3), 1.0, 0.0).astype(np.float32)
    m = cv2.resize(m, (arr.shape[1], arr.shape[0]))
    return cv2.GaussianBlur(m, (9, 9), 0)


_seg_img = None


def person_mask(arr):
    """Still-image person matte (MediaPipe selfie multiclass)."""
    global _seg_img
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions, vision
    if _seg_img is None:
        opt = vision.ImageSegmenterOptions(
            base_options=BaseOptions(model_asset_path=os.path.join(ROOT, "assets", "selfie_multiclass.tflite")),
            output_confidence_masks=True, running_mode=vision.RunningMode.IMAGE)
        _seg_img = vision.ImageSegmenter.create_from_options(opt)
    r = _seg_img.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(arr)))
    m = 1 - r.confidence_masks[0].numpy_view()
    m = cv2.resize(m, (arr.shape[1], arr.shape[0]))
    return np.clip((m - 0.4) / 0.35, 0, 1).astype(np.float32)


# ------------------------------------------------------------------ the studio-screen portal
def _rounded(w, h, r):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255)
    return np.asarray(m).astype(np.float32) / 255


def portal(studio, visual, k):
    """k = 0: the studio as shot. k rises: the visual appears *on the LED screen* (0–0.3), then the screen
    opens out to fill the frame while the studio drifts forward and softens behind it (0.3–1)."""
    if k <= 0:
        return studio
    if k >= 1:
        return visual
    a = ease(prog(k, 0.0, 0.3))           # visual fades in on the screen surface
    e = ease(prog(k, 0.25, 1.0))          # screen expands to full frame
    x0, y0, x1, y1 = SCREEN
    rx0, ry0 = lerp(x0, 0, e), lerp(y0, 0, e)
    rx1, ry1 = lerp(x1, W, e), lerp(y1, H, e)
    # studio pushes in slightly toward the screen and softens
    s = lerp(1.0, 1.08, e)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    M = np.float32([[s, 0, cx - cx * s], [0, s, cy - cy * s]])
    studio = remove_bug_fast(studio) if e > 0 else studio   # the clean bug goes back on top of the final frame
    st = cv2.warpAffine(studio, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    if e > 0:
        st = cv2.GaussianBlur(st, (0, 0), 0.1 + 6 * e)
        st = (st.astype(np.float32) * (1 - 0.35 * e)).astype(np.uint8)
    ix0, iy0, ix1, iy1 = int(rx0), int(ry0), int(math.ceil(rx1)), int(math.ceil(ry1))
    w, h = ix1 - ix0, iy1 - iy0
    # the visual is framed by the window (cover-crop of the full visual into the window's aspect)
    vis = cv2.resize(visual, (W, H)) if visual.shape[:2] != (H, W) else visual
    sc = max(w / W, h / H)
    vw, vh = int(W * sc) + 2, int(H * sc) + 2
    v = cv2.resize(vis, (vw, vh), interpolation=cv2.INTER_AREA)
    ox, oy = (vw - w) // 2, (vh - h) // 2
    v = v[oy:oy + h, ox:ox + w]
    m = _rounded(w, h, int(lerp(6, 0, e)))[..., None] * a
    out = st.astype(np.float32)
    region = out[iy0:iy1, ix0:ix1]
    out[iy0:iy1, ix0:ix1] = region * (1 - m) + v.astype(np.float32) * m
    return out.astype(np.uint8)


# ------------------------------------------------------------------ channel bug (re-applied on full-frame visuals)
@lru_cache(maxsize=1)
def bug():
    im = Image.open(os.path.join(EP2, "sports_tak_bug.png")).convert("RGBA")
    x, y = map(int, open(os.path.join(EP2, "sports_tak_bug_pos.txt")).read().split())
    a = np.asarray(im).astype(np.float32)
    return a[..., :3], a[..., 3:] / 255, x, y


def apply_bug(arr, alpha=1.0):
    if alpha <= 0:
        return arr
    rgb, a, x, y = bug()
    h, w = rgb.shape[:2]
    out = arr.copy()
    reg = out[y:y + h, x:x + w].astype(np.float32)
    out[y:y + h, x:x + w] = (reg * (1 - a * alpha) + rgb * a * alpha).astype(np.uint8)
    return out


# ------------------------------------------------------------------ video io at the master's native rate
class Reader:
    def __init__(self, path, t0, t1):
        self.p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{t0:.4f}", "-i", path, "-t", f"{t1 - t0:.4f}",
                                   "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE,
                                  bufsize=W * H * 3 * 4)

    def __iter__(self):
        n = W * H * 3
        while True:
            b = self.p.stdout.read(n)
            if len(b) < n:
                break
            yield np.frombuffer(b, np.uint8).reshape(H, W, 3)
        self.p.wait()


class Writer:
    def __init__(self, path, crf=17):
        self.p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s",
                                   f"{W}x{H}", "-r", "24000/1001", "-i", "-", "-c:v", "libx264", "-preset", "medium",
                                   "-crf", str(crf), "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)

    def write(self, a):
        self.p.stdin.write(np.ascontiguousarray(a, np.uint8).tobytes())

    def close(self):
        self.p.stdin.close()
        self.p.wait()


def mux(video, src, t0, t1, out, bed=None, bed_gain=1.0):
    a_in = ["-ss", f"{t0:.4f}", "-t", f"{t1 - t0:.4f}", "-i", src]
    if bed:
        cmd = ["ffmpeg", "-v", "error", "-y", "-i", video] + a_in + ["-i", bed, "-filter_complex",
               f"[1:a]aresample=48000[v];[2:a]aresample=48000,volume={bed_gain}[b];[v][b]amix=inputs=2:duration=first:normalize=0[a]",
               "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]
    else:
        cmd = ["ffmpeg", "-v", "error", "-y", "-i", video] + a_in + ["-map", "0:v", "-map", "1:a", "-c:v", "copy",
                                                                     "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True)
