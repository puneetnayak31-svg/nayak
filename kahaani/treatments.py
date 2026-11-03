"""Visual treatments for the KAHAANI re-edit.

Each treatment is active over [start, end) on the source timeline and transforms the frame:
    apply(arr, t, ctx) -> arr        (t is seconds since the treatment started)
ctx gives lazy access to the presenter matte, the frame index and shared assets.
Treatments animate their own entrance and exit, so the EDL stays a plain list of beats.
"""
import math
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import gfx
from gfx import (AMBER, H, INK, INK2, LIME, MUTED, PAPER, W, WHITE, clamp, cover, ease_in_out, ease_out,
                 ease_out_back, ease_out_expo, from_np, inout, lerp, paste, prog, text_img, to_np, wipe)

ASSETS = gfx.ASSETS


def load_image(rel):
    return Image.open(os.path.join(ASSETS, rel)).convert("RGB")


# ------------------------------------------------------------------ shared pieces
def reframe(arr, scale=1.0, cx=0.5, cy=0.5, out_w=W, out_h=H):
    """Virtual camera move on the presenter shot: zoom by `scale` about focal point (cx, cy)."""
    M = np.float32([[scale, 0, out_w / 2 - cx * W * scale], [0, scale, out_h / 2 - cy * H * scale]])
    return cv2.warpAffine(arr, M, (out_w, out_h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def mix(a, b, x):
    if x <= 0:
        return a
    if x >= 1:
        return b
    return cv2.addWeighted(a, 1 - x, b, x, 0)


def composite(base, layer, xy=(0, 0)):
    """Composite an RGBA PIL layer over a numpy RGB frame."""
    im = from_np(base).convert("RGBA")
    im.alpha_composite(layer, (int(xy[0]), int(xy[1])))
    return to_np(im)


def brand_bug(canvas, alpha=1.0):
    """Placeholder channel bug used while the burned-in logos are covered by a full-screen visual.
    Swap for the official Kahaani / Sports Tak PNGs (assets/brand/) when supplied."""
    logo = os.path.join(ASSETS, "brand", "kahaani_logo.png")
    if os.path.exists(logo):
        im = Image.open(logo).convert("RGBA")
        im.thumbnail((300, 150))
        paste(canvas, im, (40, 22), alpha)
        return
    k = text_img("KAHAANI", "display", 40, WHITE, tracking=6)
    paste(canvas, k, (56, 44), alpha * 0.92)
    s = text_img("SPORTS TAK", "mono", 17, LIME, tracking=4)
    paste(canvas, s, (58, 44 + k.height + 8), alpha * 0.92)


def credit_line(canvas, text, alpha=1.0, right=True):
    """Small licence/credit line for sourced photos (required by CC BY / BY-SA)."""
    if not text:
        return
    t = text_img(text, "sans_m", 17, (220, 222, 218))
    x = W - t.width - 40 if right else 40
    paste(canvas, t, (x, H - t.height - 26), alpha * 0.75)


def recreation_tag(canvas, alpha=1.0):
    """On-screen label for any AI-generated/illustrative recreation — never passed off as archive."""
    t = text_img("ILLUSTRATIVE RECREATION", "mono", 16, (230, 230, 230), tracking=2)
    pad = 10
    box = Image.new("RGBA", (t.width + pad * 2, t.height + pad * 2), (0, 0, 0, 150))
    box.alpha_composite(t, (pad, pad))
    paste(canvas, box, (40, H - box.height - 24), alpha)


def kicker(text, color=LIME, size=22):
    """Mono uppercase kicker with a leading bar: '▍ FILE · 18.04.2008'."""
    t = text_img(text, "mono", size, color, tracking=3)
    im = Image.new("RGBA", (t.width + 26, max(t.height, size) + 4), (0, 0, 0, 0))
    ImageDraw.Draw(im).rectangle((0, 2, 6, im.height - 2), fill=color)
    im.alpha_composite(t, (20, (im.height - t.height) // 2))
    return im


def kenburns(img, t, dur, z0=1.04, z1=1.14, c0=(0.5, 0.5), c1=(0.5, 0.5)):
    x = ease_in_out(prog(t, 0, dur))
    return cover(img, W, H, lerp(z0, z1, x), lerp(c0[0], c1[0], x), lerp(c0[1], c1[1], x))


def archival(arr, frame_idx, warm=True):
    a = gfx.grade(arr, sat=0.55, contrast=1.12, lift=-0.02, tint=(1.04, 1.0, 0.92) if warm else (1, 1, 1))
    return gfx.vignette(gfx.grain(a, frame_idx, 9), 0.6)


def portrait_mode(frame, mask, dim=0.5, blur=61):
    """Presenter stays sharp; the room (and the burned-in logos with it) falls into a deep blur."""
    bg = gfx.blur_np(gfx.grade(frame, sat=0.7, gain=dim), blur)
    m = mask[..., None]
    return (bg * (1 - m) + frame * m).astype(np.uint8)


def reframe_mask(mask, scale, cx, cy):
    M = np.float32([[scale, 0, W / 2 - cx * W * scale], [0, scale, H / 2 - cy * H * scale]])
    return cv2.warpAffine(mask, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)


class Ctx:
    def __init__(self, segmenter=None):
        self.segmenter = segmenter
        self.frame_idx = 0
        self.src = None
        self._mask = None

    def new_frame(self, arr, idx):
        self.src, self.frame_idx, self._mask = arr, idx, None

    def mask(self):
        if self._mask is None:
            self._mask = self.segmenter(self.src, self.frame_idx)
        return self._mask


class Treatment:
    needs_mask = False
    layer = 0

    def __init__(self, start, end, **kw):
        self.start, self.end = start, end
        self.dur = end - start
        self.__dict__.update(kw)

    def apply(self, arr, t, ctx):
        return arr


# ------------------------------------------------------------------ 1. depth title (type behind presenter)
class DepthTitle(Treatment):
    """Huge type set *behind* Vikrant: the room falls away to ink, he stays in front of the words.
    lines: list of (text, font, size, color, appear_at_seconds)."""
    needs_mask = True
    layer = 1

    def apply(self, arr, t, ctx):
        env = inout(t, self.dur, 0.35, getattr(self, "fout", 0.45))
        m = ctx.mask().copy()
        # the original edit's burned-in name super (bottom-left) must not read as 'presenter'
        r = arr[740:910, 0:760].astype(int)
        lt = ((r[..., 2] > 140) & (r[..., 0] < 120)) | (r.mean(-1) > 200)
        lt = cv2.dilate(lt.astype(np.uint8), np.ones((15, 15), np.uint8)).astype(bool)
        m[740:910, 0:760][lt] = 0
        m = m[..., None]
        bg = gfx.radial_bg(INK2, INK, 0.62, 0.35)
        canvas = from_np(bg).convert("RGBA")
        y = self.y
        for text, fname, size, color, at in self.lines:
            p = ease_out_expo(prog(t, at, at + 0.5))
            im = text_img(text, fname, size, color, tracking=self.tracking)
            im2 = wipe(im, p, "up")
            if im2 is not None:
                x = (W - im.width) // 2 if self.align == "center" else self.x
                paste(canvas, im2, (x, y + (1 - p) * 20), 1.0)
            y += im.height + self.gap
        if getattr(self, "kicker", None):
            kp = ease_out(prog(t, self.kicker_at, self.kicker_at + 0.4))
            k = kicker(self.kicker, LIME, 24)
            kx = (W - k.width) // 2 if self.align == "center" else self.x + 6
            paste(canvas, k, (kx, y + 10 + (1 - kp) * 10), kp)
        styled = to_np(canvas)
        # presenter back on top, lightly graded so he sits in the new world
        fg = gfx.grade(arr, sat=0.85, contrast=1.06)
        out = (styled * (1 - m) + fg * m).astype(np.uint8)
        out = gfx.vignette(gfx.grain(out, ctx.frame_idx, 6), 0.45)
        return mix(arr, out, env)


# ------------------------------------------------------------------ 2. full-bleed visual
class FullBleed(Treatment):
    """Full-screen photograph with a slow camera move, documentary grade, title and credit.
    Enters with a quick push-dissolve, exits back to Vikrant."""
    layer = 2

    def setup(self):
        if not hasattr(self, "_img"):
            self._img = load_image(self.image)

    def apply(self, arr, t, ctx):
        self.setup()
        env = inout(t, self.dur, getattr(self, "fin", 0.4), getattr(self, "fout", 0.4))
        if env <= 0:
            return arr
        kb = kenburns(self._img, t, self.dur, *getattr(self, "move", (1.04, 1.14, (0.5, 0.5), (0.5, 0.5))))
        a = to_np(kb)
        a = archival(a, ctx.frame_idx) if getattr(self, "archive", True) else gfx.vignette(a, 0.5)
        canvas = from_np(a).convert("RGBA")
        # bottom gradient for type
        if getattr(self, "title", None) or getattr(self, "kick", None):
            grad = np.linspace(0, 1, 420)[:, None] ** 1.6
            g = Image.fromarray((grad * 215).astype(np.uint8).repeat(W, 1), "L")
            shade = Image.new("RGBA", (W, 420), INK + (0,))
            shade.putalpha(g)
            canvas.alpha_composite(shade, (0, H - 420))
        y = H - 150
        if getattr(self, "title", None):
            ta = getattr(self, "title_at", 0.35)
            p = ease_out_expo(prog(t, ta, ta + 0.6))
            ti = text_img(self.title, self.title_font, self.title_size, WHITE)
            y = H - 120 - ti.height - (60 if getattr(self, "sub", None) else 0)
            r = wipe(ti, p, "up")
            if r is not None:
                paste(canvas, r, (100, y + (1 - p) * 16))
            if getattr(self, "sub", None):
                sp = ease_out(prog(t, self.sub_at, self.sub_at + 0.5))
                si = text_img(self.sub, "mono", 26, (230, 230, 225), tracking=3)
                paste(canvas, si, (104, y + ti.height + 18 + (1 - sp) * 8), sp)
        if getattr(self, "kick", None):
            kp = ease_out(prog(t, 0.2, 0.6))
            k = kicker(self.kick, getattr(self, "kick_color", LIME), 22)
            paste(canvas, k, (100, y - k.height - 22), kp)
        brand_bug(canvas, 1.0)
        credit_line(canvas, getattr(self, "credit", ""), 1.0)
        if getattr(self, "recreation", False):
            recreation_tag(canvas)
        out = to_np(canvas)
        # push-dissolve: incoming image starts slightly scaled
        if env < 1:
            s = lerp(1.06, 1.0, env)
            out = reframe(out, s, 0.5, 0.5)
        return mix(arr, out, env)


# ------------------------------------------------------------------ 3. chapter questions
class QuestionStack(Treatment):
    """Vikrant drifts right (virtual dolly) while the questions he asks stack up on the left.
    These questions become the chapter cards later in the film."""
    layer = 1
    needs_mask = True

    def apply(self, arr, t, ctx):
        env = inout(t, self.dur, 0.6, getattr(self, "fout", 0.5))
        sc, cx, cy = lerp(1.0, 1.12, env), lerp(0.5, 0.40, env), lerp(0.5, 0.47, env)
        pres = reframe(arr, sc, cx, cy)
        soft = portrait_mode(pres, reframe_mask(ctx.mask(), sc, cx, cy))
        pres = mix(pres, soft, ease_in_out(env))
        canvas = from_np(pres).convert("RGBA")
        brand_bug(canvas, env)
        # left ink panel with soft edge
        pw = int(lerp(0, 860, ease_in_out(env)))
        if pw > 4:
            panel = np.zeros((H, pw), np.float32)
            edge = min(260, pw)
            panel[:] = 0.88
            panel[:, pw - edge:] *= np.linspace(1, 0, edge)[None, :] ** 1.3
            sh = Image.new("RGBA", (pw, H), INK + (0,))
            sh.putalpha(Image.fromarray((panel * 255).astype(np.uint8), "L"))
            canvas.alpha_composite(sh, (0, 0))
        y = self.y
        for i, (text, at) in enumerate(self.questions):
            p = ease_out_expo(prog(t, at, at + 0.55))
            if p <= 0:
                continue
            num = text_img(f"{i + 1:02d}", "mono", 22, LIME, tracking=2)
            q = text_img(text, "hindi", self.size, WHITE)
            # earlier questions dim as new ones arrive
            later = [a for _, a in self.questions[i + 1:] if t >= a]
            dim = 0.45 if later else 1.0
            paste(canvas, num, (100, y + 14), p * env * dim)
            r = wipe(q, p, "up")
            if r is not None:
                paste(canvas, r, (150, y + (1 - p) * 18), env * dim)
            y += q.height + 26
        return to_np(canvas)


# ------------------------------------------------------------------ 4. episode title card
class TitleCard(Treatment):
    """Full-screen episode title over a graded archival image. Text stays inside 16:9 title-safe."""
    layer = 3

    def apply(self, arr, t, ctx):
        env = inout(t, self.dur, getattr(self, "fin", 0.35), getattr(self, "fout", 0.5))
        if not hasattr(self, "_img"):
            self._img = load_image(self.image)
        a = to_np(kenburns(self._img, t, self.dur, 1.12, 1.02, self.focus, self.focus))
        a = gfx.grade(a, sat=0.25, contrast=1.2, gain=0.42, tint=(0.92, 1.02, 0.95))
        a = gfx.vignette(gfx.grain(a, ctx.frame_idx, 10), 0.7)
        canvas = from_np(a).convert("RGBA")
        k = kicker(self.kick, LIME, 24)
        kp = ease_out(prog(t, 0.2, 0.6))
        title = text_img(self.title, "hindi", 150, WHITE)
        sub = text_img(self.sub, "display", 64, PAPER, tracking=8)
        block_h = k.height + 30 + title.height + 18 + sub.height
        y0 = (H - block_h) // 2
        paste(canvas, k, ((W - k.width) // 2, y0), kp)
        tp = ease_out_expo(prog(t, 0.45, 1.1))
        r = wipe(title, tp, "up")
        if r is not None:
            paste(canvas, r, ((W - title.width) // 2, y0 + k.height + 30 + (1 - tp) * 20))
        sp = ease_out(prog(t, 0.9, 1.4))
        paste(canvas, sub, ((W - sub.width) // 2, y0 + k.height + 30 + title.height + 18), sp)
        # thin lime rule that draws across
        rp = ease_in_out(prog(t, 0.7, 1.5))
        rw = int(520 * rp)
        if rw > 2:
            rule = Image.new("RGBA", (rw, 4), LIME + (255,))
            paste(canvas, rule, ((W - rw) // 2, y0 + block_h + 36))
        brand_bug(canvas)
        credit_line(canvas, getattr(self, "credit", ""))
        out = to_np(canvas)
        return mix(arr, out, env)


# ------------------------------------------------------------------ 5. kinetic phrase (lower area)
class KineticPhrase(Treatment):
    """A short Hindi phrase from what he just said, set big in the lower third with a lime underline.
    Used sparingly to land a line, not as subtitles."""
    layer = 4

    def apply(self, arr, t, ctx):
        env = inout(t, self.dur, 0.3, 0.35)
        canvas = from_np(arr).convert("RGBA")
        grad = np.linspace(0, 1, 380)[:, None] ** 1.8
        g = Image.fromarray((grad * 170 * env).astype(np.uint8).repeat(W, 1), "L")
        shade = Image.new("RGBA", (W, 380), INK + (0,))
        shade.putalpha(g)
        canvas.alpha_composite(shade, (0, H - 380))
        x, y = self.x, H - 230
        for i, (word, at) in enumerate(self.words):
            p = ease_out_back(prog(t, at, at + 0.4)) if t >= at else 0
            im = text_img(word, "hindi", self.size, WHITE if i != self.accent else LIME)
            if p > 0:
                paste(canvas, im, (x, y + (1 - min(p, 1)) * 24), env * min(1, p * 1.5))
            x += im.width + 22
        up = ease_in_out(prog(t, self.words[-1][1] + 0.2, self.words[-1][1] + 0.7))
        if up > 0:
            uw = int((x - self.x - 22) * up)
            paste(canvas, Image.new("RGBA", (max(uw, 1), 6), LIME + (255,)), (self.x, y + self.size + 26), env)
        return to_np(canvas)


# ------------------------------------------------------------------ 6. split screen
class SplitScreen(Treatment):
    """Vikrant on the left (re-framed live feed), a visual card on the right. Keeps him present while
    the photo/graphic carries the information."""
    layer = 2

    def apply(self, arr, t, ctx):
        env = ease_in_out(min(prog(t, 0, 0.55), 1 - prog(t, self.dur - 0.5, self.dur)))
        if env <= 0:
            return arr
        bg = gfx.radial_bg(INK2, INK, 0.3, 0.4)
        # presenter panel
        pw, ph = int(lerp(W, 900, env)), int(lerp(H, 900, env))
        px, py = int(lerp(0, 80, env)), int(lerp(0, 90, env))
        crop_w = int(lerp(W, 1000, env))
        x0 = int(lerp(0, 470, env))
        pres = arr[:, x0:x0 + crop_w]
        pres = cv2.resize(pres, (pw, ph), interpolation=cv2.INTER_AREA)
        canvas = from_np(bg).convert("RGBA")
        r = int(lerp(0, 22, env))
        sh, pad = gfx.shadow(pw, ph, r, 30, int(160 * env))
        canvas.alpha_composite(sh, (px - pad, py - pad + 12))
        pim = Image.fromarray(pres).convert("RGBA")
        pim.putalpha(gfx.rounded_mask(pw, ph, max(r, 1)))
        canvas.alpha_composite(pim, (px, py))
        # visual card
        if not hasattr(self, "_img"):
            self._img = load_image(self.image)
        cw, ch = 820, 900
        cx, cy = 1020, 90
        cp = ease_out_expo(prog(t, 0.25, 0.85)) * (1 - prog(t, self.dur - 0.45, self.dur))
        if cp > 0:
            card = cover(self._img, cw, ch, lerp(1.02, 1.1, prog(t, 0, self.dur)), *self.focus)
            card = Image.fromarray(gfx.grade(to_np(card), sat=0.9, contrast=1.04)).convert("RGBA")
            # caption band
            band_h = 170
            band = Image.new("RGBA", (cw, band_h), INK + (225,))
            k = kicker(self.kick, LIME, 18)
            band.alpha_composite(k, (30, 26))
            cap = text_img(self.caption, self.cap_font, self.cap_size, WHITE)
            band.alpha_composite(cap, (30, 26 + k.height + 16))
            card.alpha_composite(band, (0, ch - band_h))
            card.putalpha(gfx.rounded_mask(cw, ch, 22))
            sh2, pad2 = gfx.shadow(cw, ch, 22, 30, 160)
            off = (1 - cp) * 60
            canvas.alpha_composite(sh2, (int(cx - pad2 + off), cy - pad2 + 12))
            paste(canvas, card, (cx + off, cy), cp)
            credit_line(canvas, getattr(self, "credit", ""), cp)
        brand_bug(canvas, env)
        return to_np(canvas)


# ------------------------------------------------------------------ 7. scoreboard
class Scoreboard(Treatment):
    """Broadcast-style match card: KKR 222/3 v RCB 82, McCullum 158* (73) with counting numerals."""
    layer = 3

    def apply(self, arr, t, ctx):
        env = inout(t, self.dur, 0.45, 0.45)
        if env <= 0:
            return arr
        base = gfx.grade(arr, sat=0.2, gain=0.22)
        base = gfx.blur_np(base, 81)
        canvas = from_np(base).convert("RGBA")
        k = kicker("MATCH 1 · 18.04.2008 · M. CHINNASWAMY STADIUM, BENGALURU", LIME, 22)
        paste(canvas, k, ((W - k.width) // 2, 150), env)
        rows = self.rows
        y = 260
        for i, (team, runs, wk, overs, at) in enumerate(rows):
            p = ease_out_expo(prog(t, at, at + 0.6))
            if p <= 0:
                continue
            row = Image.new("RGBA", (1300, 170), (255, 255, 255, 18))
            ImageDraw.Draw(row).rectangle((0, 0, 8, 170), fill=LIME if i == 0 else MUTED)
            name = text_img(team, "display", getattr(self, "name_size", 74), WHITE, tracking=2)
            ov = text_img(overs, "mono", 24, MUTED, tracking=2)
            ny = (170 - name.height - ov.height - 14) // 2
            row.alpha_composite(name, (50, ny))
            row.alpha_composite(ov, (52, ny + name.height + 14))
            cnt = int(round(runs * ease_out(prog(t, at + 0.1, at + 1.3))))
            score = text_img(f"{cnt}{'/' + str(wk) if wk is not None else ''}", "display", 110,
                             WHITE if i == 0 else (215, 215, 215))
            row.alpha_composite(score, (1300 - score.width - 50, (170 - score.height) // 2))
            paste(canvas, row, ((W - 1300) // 2 + (1 - p) * 80, y), p * env)
            y += 200
        # hero stat
        hero_at = getattr(self, "hero_at", None)
        hp = ease_out_expo(prog(t, hero_at, hero_at + 0.7)) if hero_at is not None else 0
        if hp > 0:
            n = int(round(158 * ease_out(prog(t, self.hero_at, self.hero_at + 1.6))))
            big = text_img(f"{n}*", "display", 190, LIME)
            lab = text_img("BRENDON McCULLUM", "cond", 46, WHITE, tracking=3)
            det = text_img("73 BALLS · 10 FOURS · 13 SIXES", "mono", 26, (225, 225, 225), tracking=2)
            bx = (W - 1300) // 2
            yy = y + 10
            paste(canvas, big, (bx, yy + (1 - hp) * 30), hp * env)
            paste(canvas, lab, (bx + big.width + 50, yy + 40), hp * env)
            paste(canvas, det, (bx + big.width + 52, yy + 40 + lab.height + 22), hp * env)
        foot = text_img("KKR WON BY 140 RUNS", "mono", 24, AMBER, tracking=4)
        fp = ease_out(prog(t, self.foot_at, self.foot_at + 0.5))
        paste(canvas, foot, ((W - foot.width) // 2, H - 90), fp * env)
        brand_bug(canvas, env)
        out = to_np(canvas)
        return mix(arr, out, env)


# ------------------------------------------------------------------ shared: presenter panel for split layouts
def presenter_panel(canvas, arr, env, x=80, y=90, w=900, h=900, src_x=470, src_w=1000):
    """Shrinks the live presenter shot from full-frame into a rounded panel (env 0..1)."""
    pw, ph = int(lerp(W, w, env)), int(lerp(H, h, env))
    px, py = int(lerp(0, x, env)), int(lerp(0, y, env))
    crop_w = int(lerp(W, src_w, env))
    x0 = int(lerp(0, src_x, env))
    pres = cv2.resize(arr[:, x0:x0 + crop_w], (pw, ph), interpolation=cv2.INTER_AREA)
    r = int(lerp(0, 22, env))
    sh, pad = gfx.shadow(pw, ph, r, 30, int(160 * env))
    canvas.alpha_composite(sh, (px - pad, py - pad + 12))
    pim = Image.fromarray(pres).convert("RGBA")
    pim.putalpha(gfx.rounded_mask(pw, ph, max(r, 1)))
    canvas.alpha_composite(pim, (px, py))


def dark_side_panel(canvas, env, side="left", width=860):
    pw = int(lerp(0, width, ease_in_out(env)))
    if pw <= 4:
        return
    panel = np.full((H, pw), 0.88, np.float32)
    edge = min(260, pw)
    ramp = np.linspace(1, 0, edge) ** 1.3
    if side == "left":
        panel[:, pw - edge:] *= ramp[None, :]
    else:
        panel[:, :edge] *= ramp[::-1][None, :]
    sh = Image.new("RGBA", (pw, H), INK + (0,))
    sh.putalpha(Image.fromarray((panel * 255).astype(np.uint8), "L"))
    canvas.alpha_composite(sh, (0 if side == "left" else W - pw, 0))


# ------------------------------------------------------------------ 8. name super (rebuilt)
class NameSuper(Treatment):
    """Vikrant's name super in the new graphic language. Sits exactly over the original edit's
    burned-in super so the old one never shows while this one is up."""
    layer = 4

    def apply(self, arr, t, ctx):
        env = 1 - ease_in_out(prog(t, self.dur - 0.45, self.dur))
        canvas = from_np(arr).convert("RGBA")
        name = text_img("VIKRANT GUPTA", "display", 64, WHITE, tracking=3)
        role = text_img(self.role, "mono", 22, LIME, tracking=3)
        bw, bh = max(name.width, role.width, 600) + 90, max(name.height + role.height + 64, 180)
        box = Image.new("RGBA", (bw, bh), INK + (255,))
        ImageDraw.Draw(box).rectangle((0, 0, 7, bh), fill=LIME)
        box.alpha_composite(name, (40, 24))
        box.alpha_composite(role, (42, 24 + name.height + 16))
        wp = ease_out_expo(prog(t, 0, 0.5)) if self.animate_in else 1
        r = wipe(box, min(wp, 1), "right")
        if r is not None:
            paste(canvas, r, (36, 752), env)
        return to_np(canvas)


# ------------------------------------------------------------------ 9. info card (stateful, bottom-left)
class InfoCard(Treatment):
    """Compact glass card that updates in place: states = [(at, kicker, line1, line2)]."""
    layer = 4

    def apply(self, arr, t, ctx):
        env = inout(t, self.dur, 0.4, 0.4)
        canvas = from_np(arr).convert("RGBA")
        cur = [s for s in self.states if t >= s[0]]
        if not cur:
            return arr
        at, kick, l1, l2 = cur[-1]
        sp = ease_out_expo(prog(t, at, at + 0.45))
        k = kicker(kick, self.color if hasattr(self, "color") else LIME, 20)
        a = text_img(l1, self.font1, self.size1, WHITE)
        b = text_img(l2, "sans_m", 28, (215, 218, 214)) if l2 else None
        bw = max(k.width, a.width, b.width if b else 0) + 70
        bh = k.height + a.height + (b.height + 14 if b else 0) + 72
        box = Image.new("RGBA", (bw, bh), INK + (220,))
        box.alpha_composite(k, (34, 26))
        box.alpha_composite(a, (34, 26 + k.height + 14))
        if b:
            box.alpha_composite(b, (36, 26 + k.height + 14 + a.height + 14))
        box.putalpha(Image.fromarray(np.minimum(np.asarray(box.getchannel("A")),
                                                np.asarray(gfx.rounded_mask(bw, bh, 14))), "L"))
        paste(canvas, box, (self.x, H - bh - self.bottom + (1 - sp) * 14), env * sp)
        return to_np(canvas)


# ------------------------------------------------------------------ 10. match-up (presenter cut out between the teams)
class Matchup(Treatment):
    needs_mask = True
    layer = 2

    def apply(self, arr, t, ctx):
        env = inout(t, self.dur, 0.45, 0.45)
        m = ctx.mask()[..., None]
        bg = gfx.radial_bg(INK2, INK, 0.5, 0.35).astype(np.float32)
        # faint pitch-line texture
        canvas = from_np(bg.astype(np.uint8)).convert("RGBA")
        k = kicker(self.kick, LIME, 22)
        paste(canvas, k, (112, 250), ease_out(prog(t, 0.2, 0.6)))
        for side, (team, cap, at_t, at_c) in zip(("L", "R"), self.teams):
            p = ease_out_expo(prog(t, at_t, at_t + 0.6))
            ti = text_img(team, "display", 92, WHITE if side == "L" else WHITE, tracking=2)
            lines = team.split("\n")
            y = 330
            for ln in lines:
                im = text_img(ln, "display", 92, WHITE, tracking=2)
                x = 110 if side == "L" else W - 110 - im.width
                r = wipe(im, p, "up")
                if r is not None:
                    paste(canvas, r, (x + (1 - p) * (-40 if side == "L" else 40), y))
                y += im.height + 8
            cp = ease_out(prog(t, at_c, at_c + 0.5))
            lab = text_img("CAPTAIN", "mono", 20, LIME, tracking=4)
            nm = text_img(cap, "cond", 46, (230, 232, 228), tracking=2)
            x1 = 112 if side == "L" else W - 112 - max(lab.width, nm.width)
            if side == "R":
                paste(canvas, lab, (W - 112 - lab.width, y + 30), cp)
                paste(canvas, nm, (W - 112 - nm.width, y + 30 + lab.height + 10), cp)
            else:
                paste(canvas, lab, (x1, y + 30), cp)
                paste(canvas, nm, (x1, y + 30 + lab.height + 10), cp)
        vs = text_img("VS", "display", 60, LIME)
        styled = to_np(canvas).astype(np.float32)
        fg = gfx.grade(arr, sat=0.9, contrast=1.05).astype(np.float32)
        out = styled * (1 - m) + fg * m
        out = to_np(Image.fromarray(out.astype(np.uint8)))
        out = gfx.vignette(gfx.grain(out, ctx.frame_idx, 5), 0.4)
        c2 = from_np(out).convert("RGBA")
        brand_bug(c2, 1)
        return mix(arr, to_np(c2), env)


# ------------------------------------------------------------------ 11. side list (batting order / squad names)
class SideList(Treatment):
    """Vikrant dollies left; a numbered list builds on the right as he names people.
    items: [(label, appear_at)], highlight: [(at, set_of_indices)], notes: [(at, index, text)]."""
    layer = 1
    needs_mask = True

    def apply(self, arr, t, ctx):
        env = inout(t, self.dur, 0.6, getattr(self, "fout", 0.5))
        sc, cx, cy = lerp(1.0, 1.1, env), lerp(0.5, 0.62, env), lerp(0.5, 0.47, env)
        pres = reframe(arr, sc, cx, cy)
        soft = portrait_mode(pres, reframe_mask(ctx.mask(), sc, cx, cy))
        pres = mix(pres, soft, ease_in_out(env))
        canvas = from_np(pres).convert("RGBA")
        brand_bug(canvas, env)
        dark_side_panel(canvas, env, "right", 900)
        k = kicker(self.kick, LIME, 22)
        x0 = W - 820
        paste(canvas, k, (x0, self.y - 70), env * ease_out(prog(t, 0.3, 0.7)))
        hl = None
        for at, idx in getattr(self, "highlight", []):
            if t >= at:
                hl = idx
        y = self.y
        for i, (label, at) in enumerate(self.items):
            p = ease_out_expo(prog(t, at, at + 0.5))
            if p <= 0:
                y += self.size + self.gap
                continue
            on = hl is None or i in hl
            col = WHITE if on else (120, 128, 124)
            if hl is not None and i in hl and getattr(self, "hl_color", None):
                col = self.hl_color
            num = text_img(str(i + 1) if self.numbered else "·", "mono", 24, LIME if on else (90, 98, 94))
            im = text_img(label, self.font, self.size, col, tracking=2)
            paste(canvas, num, (x0, y + self.size * 0.35), env * p)
            r = wipe(im, p, "up")
            if r is not None:
                paste(canvas, r, (x0 + 50, y + (1 - p) * 14), env)
            for nat, nidx, ntext in getattr(self, "notes", []):
                if nidx == i and t >= nat:
                    np_ = ease_out_back(prog(t, nat, nat + 0.4))
                    nt = text_img(ntext, "display", int(self.size * 0.9), AMBER)
                    paste(canvas, nt, (x0 + 50 + im.width + 28, y + (1 - min(np_, 1)) * 10),
                          env * min(1, np_))
            y += self.size + self.gap
        return to_np(canvas)


# ------------------------------------------------------------------ 12. run share (158 of 222)
class RunShare(Treatment):
    """Split layout: Vikrant left, right side builds KKR's 222 and shows how much of it was McCullum's."""
    layer = 2

    def apply(self, arr, t, ctx):
        env = ease_in_out(min(prog(t, 0, 0.55), 1 - prog(t, self.dur - 0.5, self.dur)))
        if env <= 0:
            return arr
        canvas = from_np(gfx.radial_bg(INK2, INK, 0.3, 0.4)).convert("RGBA")
        presenter_panel(canvas, arr, env, x=80, y=90, w=760, h=900, src_x=520, src_w=845)
        X = 940
        cp = env
        k = kicker("KOLKATA KNIGHT RIDERS · 20 OVERS", LIME, 20)
        paste(canvas, k, (X, 120), cp * ease_out(prog(t, 0.3, 0.7)))
        tot = int(round(222 * ease_out(prog(t, self.at_total, self.at_total + 1.2))))
        big = text_img(f"{tot}/3" if t >= self.at_total else "", "display", 210, WHITE) if t >= self.at_total else None
        if big:
            paste(canvas, big, (X - 6, 170), cp)
        # stacked bar
        bx, by, bw, bh = X, 470, 900, 64
        parts = [(158, LIME, "McCULLUM", self.at_mc), (10, (200, 205, 200), "GANGULY", self.at_sg),
                 (20, (150, 158, 152), "PONTING", self.at_rp), (34, (80, 88, 84), "OTHERS + EXTRAS", self.at_rp + 0.6)]
        d = ImageDraw.Draw(canvas)
        d.rounded_rectangle((bx, by, bx + bw, by + bh), 10, fill=(255, 255, 255, int(16 * cp)))
        x = bx
        for i, (v, col, name, at) in enumerate(parts):
            p = ease_out_expo(prog(t, at, at + 0.8))
            w = int(bw * v / 222)
            if p > 0:
                ww = max(1, int(w * p))
                seg = Image.new("RGBA", (ww, bh), col + (255,))
                paste(canvas, seg, (x, by), cp)
                lab_v = text_img(str(v), "display", 64 if i == 0 else 40, col)
                lab_n = text_img(name, "mono", 18, (210, 214, 210), tracking=2)
                if i == 0:
                    paste(canvas, lab_v, (x, by + bh + 18), cp * p)
                    paste(canvas, lab_n, (x + lab_v.width + 16, by + bh + 50), cp * p)
                else:
                    ly = by + bh + 18 + (i - 1) * 0 
                    lx = bx + bw - 520 + (i - 1) * 175
                    paste(canvas, lab_v, (lx, by + bh + 120), cp * p)
                    paste(canvas, lab_n, (lx, by + bh + 120 + lab_v.height + 8), cp * p)
            x += w
        # percentage callout
        pp = ease_out(prog(t, self.at_mc + 1.0, self.at_mc + 1.6))
        pc = text_img("71% OF THE TEAM'S RUNS", "mono", 24, LIME, tracking=3)
        paste(canvas, pc, (bx, by - 50), cp * pp)
        # boundaries tiles
        for j, (label, val, at) in enumerate([("FOURS", 10, self.at_4), ("SIXES", 13, self.at_6)]):
            p = ease_out_back(prog(t, at, at + 0.45))
            if p <= 0:
                continue
            tx, ty = bx + j * 300, 830
            tile = Image.new("RGBA", (270, 170), (255, 255, 255, 20))
            ImageDraw.Draw(tile).rectangle((0, 0, 270, 6), fill=LIME + (255,))
            v = text_img(str(val), "display", 96, WHITE)
            l = text_img(label, "mono", 22, (210, 214, 210), tracking=3)
            tile.alpha_composite(v, (24, 20))
            tile.alpha_composite(l, (28, 20 + v.height + 10))
            paste(canvas, tile, (tx, ty + (1 - min(p, 1)) * 20), cp * min(1, p))
        brand_bug(canvas, env)
        return to_np(canvas)
