"""Motion-graphics toolkit for the KAHAANI re-edit.

Everything is drawn in code (PIL + numpy + OpenCV) on top of the original 1920x1080 / 25 fps
footage. Nothing here invents footage: graphics only typeset facts, re-frame the real
camera feed, or animate imagery we have the right to use.
"""
import json
import math
import os
import subprocess
from functools import lru_cache

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
FONTS = os.path.join(ASSETS, "fonts")

W, H, FPS = 1920, 1080, 25

# ---------------------------------------------------------------- design tokens
INK = (9, 13, 11)            # near-black with a green cast
INK2 = (20, 28, 24)
PAPER = (240, 236, 226)       # archival paper
WHITE = (255, 255, 255)
LIME = (120, 214, 40)         # Sports Tak / Kahaani green, slightly calmed
LIME_DEEP = (34, 120, 52)
AMBER = (245, 178, 62)        # 2008 / archival accent, used sparingly
MUTED = (160, 170, 164)


# ---------------------------------------------------------------- timing helpers
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def prog(t, a, b):
    """0..1 progress of t through [a, b]."""
    if b <= a:
        return 1.0 if t >= b else 0.0
    return clamp((t - a) / (b - a))


def ease_out(x):
    return 1 - (1 - x) ** 3


def ease_in_out(x):
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_out_expo(x):
    return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)


def ease_out_back(x, s=1.4):
    x -= 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2


def lerp(a, b, x):
    return a + (b - a) * x


def inout(t, dur, fin=0.5, fout=0.5):
    """Envelope that rises over fin seconds and falls over the last fout seconds."""
    return min(ease_out(prog(t, 0, fin)), 1 - ease_in_out(prog(t, dur - fout, dur)))


# ---------------------------------------------------------------- type
FONT_FILES = {
    "display": "Anton-400.ttf",          # numerals, English headlines
    "cond": "Oswald-700.ttf",
    "cond_m": "Oswald-500.ttf",
    "sans": "InterTight-700.ttf",
    "sans_m": "InterTight-500.ttf",
    "sans_x": "InterTight-800.ttf",
    "mono": "JetBrainsMono-500.ttf",     # data kickers, file stamps
    "hindi": "Mukta-800.ttf",            # Devanagari headlines
    "hindi_b": "Mukta-700.ttf",
    "hindi_m": "Mukta-500.ttf",
}


@lru_cache(maxsize=256)
def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, FONT_FILES[name]), int(size),
                              layout_engine=ImageFont.Layout.RAQM)


@lru_cache(maxsize=1024)
def text_img(text, fname, size, fill=WHITE, tracking=0, stroke=0, stroke_fill=None):
    """Tightly cropped RGBA image of a line of text (cached)."""
    f = font(fname, size)
    if tracking == 0:
        l, t, r, b = f.getbbox(text, stroke_width=stroke)
        im = Image.new("RGBA", (r - l + 4, b - t + 4), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((-l + 2, -t + 2), text, font=f, fill=fill,
                                stroke_width=stroke, stroke_fill=stroke_fill)
        return im
    glyphs = [text_img(c, fname, size, fill, 0, stroke, stroke_fill) for c in text]
    asc = f.getbbox("H")[1]
    widths = [f.getlength(c) for c in text]
    total = int(sum(widths) + tracking * (len(text) - 1)) + 8
    hgt = max(g.height for g in glyphs) + int(size * 0.4)
    im = Image.new("RGBA", (total, hgt), (0, 0, 0, 0))
    x = 2
    for c, g, w in zip(text, glyphs, widths):
        if c != " ":
            l, t, _, _ = f.getbbox(c)
            im.alpha_composite(g, (int(x + l), int(t - asc + 2)))
        x += w + tracking
    return im.crop(im.getbbox()) if im.getbbox() else im


def paste(canvas, im, xy, alpha=1.0):
    """Alpha-composite an RGBA image onto an RGBA canvas at integer xy, with global opacity."""
    if im is None or alpha <= 0.002:
        return
    if alpha < 0.999:
        im = im.copy()
        a = im.getchannel("A").point(lambda v: int(v * alpha))
        im.putalpha(a)
    x, y = int(round(xy[0])), int(round(xy[1]))
    canvas.alpha_composite(im, (max(x, 0), max(y, 0)),
                           (max(-x, 0), max(-y, 0)))


def wipe(im, p, direction="up"):
    """Mask-reveal an RGBA image (p 0..1). 'up' = rises from a baseline, like broadcast type."""
    if p >= 1:
        return im
    if p <= 0:
        return None
    w, h = im.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    if direction == "up":
        off = int(h * (1 - p))
        out.alpha_composite(im.crop((0, 0, w, h - off)), (0, off))
    elif direction == "right":
        out.alpha_composite(im.crop((0, 0, max(1, int(w * p)), h)), (0, 0))
    elif direction == "down":
        off = int(h * (1 - p))
        out.alpha_composite(im.crop((0, off, w, h)), (0, 0))
    return out


def rounded_mask(w, h, r):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255)
    return m


def shadow(w, h, r=18, blur=30, opacity=150, spread=0):
    pad = blur * 2
    im = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((pad - spread, pad - spread, pad + w + spread, pad + h + spread), r,
                                         fill=(0, 0, 0, opacity))
    return im.filter(ImageFilter.GaussianBlur(blur)), pad


# ---------------------------------------------------------------- image ops
def to_np(im):
    return np.asarray(im.convert("RGB"), dtype=np.uint8)


def from_np(a):
    return Image.fromarray(a.astype(np.uint8), "RGB")


def cover(img, w, h, zoom=1.0, cx=0.5, cy=0.5):
    """Scale+crop an RGB/RGBA PIL image to w x h ('object-fit: cover'), with zoom and focal point."""
    iw, ih = img.size
    s = max(w / iw, h / ih) * zoom
    cw, ch = w / s, h / s
    x0 = clamp(cx * iw - cw / 2, 0, iw - cw)
    y0 = clamp(cy * ih - ch / 2, 0, ih - ch)
    return img.transform((w, h), Image.Transform.AFFINE, (cw / w, 0, x0, 0, ch / h, y0),
                         resample=Image.Resampling.BICUBIC)


def grade(arr, sat=1.0, contrast=1.0, lift=0.0, gain=1.0, tint=(1, 1, 1)):
    a = arr.astype(np.float32) / 255
    if sat != 1:
        g = a @ np.array([0.299, 0.587, 0.114], np.float32)
        a = g[..., None] + (a - g[..., None]) * sat
    a = (a - 0.5) * contrast + 0.5
    a = a * gain + lift
    a = a * np.array(tint, np.float32)
    return (np.clip(a, 0, 1) * 255).astype(np.uint8)


def blur_np(arr, k):
    k = int(k) | 1
    return cv2.GaussianBlur(arr, (k, k), 0) if k > 1 else arr


_grain_tiles = None


def grain(arr, frame_idx, amount=10):
    """Animated film grain (luma), cheap: 4 precomputed tiles offset per frame."""
    global _grain_tiles
    if _grain_tiles is None:
        rng = np.random.default_rng(7)
        _grain_tiles = [cv2.GaussianBlur(rng.normal(0, 1, (H + 64, W + 64)).astype(np.float32), (3, 3), 0)
                        for _ in range(4)]
    t = _grain_tiles[frame_idx % 4]
    ox, oy = (frame_idx * 17) % 64, (frame_idx * 29) % 64
    n = t[oy:oy + arr.shape[0], ox:ox + arr.shape[1]] * amount
    return np.clip(arr.astype(np.float32) + n[..., None], 0, 255).astype(np.uint8)


@lru_cache(maxsize=4)
def _vignette(w, h, strength):
    y, x = np.ogrid[:h, :w]
    d = np.sqrt(((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2) / math.sqrt(2)
    return (1 - strength * np.clip(d, 0, 1) ** 2.2).astype(np.float32)


def vignette(arr, strength=0.55):
    v = _vignette(arr.shape[1], arr.shape[0], strength)
    return (arr.astype(np.float32) * v[..., None]).astype(np.uint8)


def radial_bg(c_in=INK2, c_out=INK, cx=0.5, cy=0.45):
    y, x = np.ogrid[:H, :W]
    d = np.clip(np.sqrt(((x - cx * W) / W) ** 2 + ((y - cy * H) / H) ** 2) / 0.75, 0, 1)[..., None]
    a = np.array(c_in, np.float32) * (1 - d) + np.array(c_out, np.float32) * d
    return a.astype(np.uint8)


# ---------------------------------------------------------------- presenter segmentation
class Segmenter:
    """MediaPipe person matte for the presenter (so graphics can sit *behind* him)."""

    def __init__(self):
        import mediapipe as mp
        from mediapipe.tasks.python import BaseOptions, vision
        self.mp = mp
        opt = vision.ImageSegmenterOptions(
            base_options=BaseOptions(model_asset_path=os.path.join(ASSETS, "selfie_multiclass.tflite")),
            output_confidence_masks=True, running_mode=vision.RunningMode.VIDEO)
        self.seg = vision.ImageSegmenter.create_from_options(opt)
        self.prev = None
        self.ts = 0

    def __call__(self, arr, frame_idx):
        r = self.seg.segment_for_video(self.mp.Image(image_format=self.mp.ImageFormat.SRGB,
                                                     data=np.ascontiguousarray(arr)),
                                       self._tick())
        m = 1.0 - r.confidence_masks[0].numpy_view()          # class 0 = background
        m = cv2.resize(m, (arr.shape[1], arr.shape[0]), interpolation=cv2.INTER_LINEAR)
        m = np.clip((m - 0.35) / 0.4, 0, 1)                    # tighten the soft edge
        m = cv2.GaussianBlur(m, (5, 5), 0)
        if self.prev is not None:                               # temporal smoothing kills edge flicker
            m = 0.55 * m + 0.45 * self.prev
        self.prev = m
        return m.astype(np.float32)

    def _tick(self):
        self.ts += 40          # strictly increasing ms, independent of seeks
        return self.ts

    def reset(self):
        self.prev = None


# ---------------------------------------------------------------- video io
def probe_duration(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                   "-of", "default=nw=1:nk=1", path])
    return float(out)


class Reader:
    """Sequential RGB frame reader for [t0, t1)."""

    def __init__(self, path, t0=0.0, t1=None):
        args = ["ffmpeg", "-v", "error", "-ss", f"{t0:.3f}", "-i", path]
        if t1 is not None:
            args += ["-t", f"{t1 - t0:.3f}"]
        args += ["-f", "rawvideo", "-pix_fmt", "rgb24", "-vf", f"scale={W}:{H},fps={FPS}", "-"]
        self.p = subprocess.Popen(args, stdout=subprocess.PIPE, bufsize=W * H * 3 * 4)

    def __iter__(self):
        n = W * H * 3
        while True:
            b = self.p.stdout.read(n)
            if len(b) < n:
                break
            yield np.frombuffer(b, np.uint8).reshape(H, W, 3)
        self.p.wait()


class Writer:
    def __init__(self, path, audio_src=None, t0=0.0, t1=None, audio_filter=None, crf=17):
        args = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
        if audio_src:
            args += ["-ss", f"{t0:.3f}"]
            if t1 is not None:
                args += ["-t", f"{t1 - t0:.3f}"]
            args += ["-i", audio_src, "-map", "0:v", "-map", "1:a"]
            if audio_filter:
                args += ["-af", audio_filter]
            args += ["-c:a", "aac", "-b:a", "192k"]
        args += ["-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-pix_fmt", "yuv420p",
                 "-movflags", "+faststart", "-shortest", path]
        self.p = subprocess.Popen(args, stdin=subprocess.PIPE)

    def write(self, arr):
        self.p.stdin.write(np.ascontiguousarray(arr, dtype=np.uint8).tobytes())

    def close(self):
        self.p.stdin.close()
        self.p.wait()


# ---------------------------------------------------------------- map
@lru_cache(maxsize=1)
def india_polygons():
    return json.load(open(os.path.join(ASSETS, "geo", "india_official.json")))["polygons"]


def project(lon, lat, box):
    """Equirectangular with cos(lat) correction into a pixel box (x0, y0, x1, y1) fitted to India."""
    lon0, lon1, lat0, lat1 = 68.0, 97.5, 6.5, 37.2
    k = math.cos(math.radians(22))
    bw, bh = box[2] - box[0], box[3] - box[1]
    s = min(bw / ((lon1 - lon0) * k), bh / (lat1 - lat0))
    ox = box[0] + (bw - (lon1 - lon0) * k * s) / 2
    oy = box[1] + (bh - (lat1 - lat0) * s) / 2
    return ox + (lon - lon0) * k * s, oy + (lat1 - lat) * s
