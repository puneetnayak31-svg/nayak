"""Stylised 2D cricket characters and stadium environments, drawn with Cairo.

The characters are deliberately faceless flat illustrations. They stand for the people in Vikrant's story
(team colours, helmet or cap, a small name tag), but they are not likenesses of real players.
"""
import math
import random

import cairo
import numpy as np

W, H, FPS = 1920, 1080, 25


def hexc(h, a=1.0):
    h = h.lstrip("#")
    return (int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255, a)


# ---------------------------------------------------------------- palette
SKY_TOP = hexc("05070F")
SKY_LOW = hexc("16203A")
GRASS_A = hexc("1F5A30")
GRASS_B = hexc("23673A")
PITCH = hexc("B79F6A")
FLOOD = hexc("FFF3D2")
KKR = {"jersey": hexc("17151C"), "trim": hexc("D9B44A"), "helmet": hexc("C9A645"), "skin": hexc("C4906C")}
KKR2 = {"jersey": hexc("17151C"), "trim": hexc("D9B44A"), "helmet": hexc("C9A645"), "skin": hexc("8E5B3E")}
RCB = {"jersey": hexc("B3122C"), "trim": hexc("E8BE45"), "helmet": hexc("1B1B1F"), "skin": hexc("7E4E33")}
PAD = hexc("ECEAE4")
GOLD = hexc("F2C14E")
LIME = hexc("78D628")


# ---------------------------------------------------------------- easing / keyframes
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def prog(t, a, b):
    return clamp((t - a) / (b - a)) if b > a else float(t >= b)


def ease(x):
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_out(x):
    return 1 - (1 - x) ** 3


def lerp(a, b, x):
    return a + (b - a) * x


def lerp_pose(p, q, x):
    return {k: (lerp(p[k], q[k], x) if isinstance(p[k], (int, float)) and k in q else p[k]) for k in p}


def keyframes(t, frames):
    """frames: [(time, pose), ...] sorted; eased interpolation between neighbours."""
    if t <= frames[0][0]:
        return dict(frames[0][1])
    for (t0, p0), (t1, p1) in zip(frames, frames[1:]):
        if t <= t1:
            return lerp_pose(p0, p1, ease(prog(t, t0, t1)))
    return dict(frames[-1][1])


def kf(t, frames):
    """Scalar keyframes: [(time, value), ...] with eased interpolation."""
    if t <= frames[0][0]:
        return frames[0][1]
    for (t0, v0), (t1, v1) in zip(frames, frames[1:]):
        if t <= t1:
            return lerp(v0, v1, ease(prog(t, t0, t1)))
    return frames[-1][1]


# ---------------------------------------------------------------- poses (angles in degrees; 0 = straight down,
# positive = rotated toward the direction the figure faces)
BASE = dict(lean=0, hipF=4, kneeF=4, hipB=-4, kneeB=4, armF=8, elbF=8, armB=-6, elbB=8, bat=8, bob=0,
            head=0, batOn=1)

STANCE = dict(BASE, lean=16, hipF=16, kneeF=22, hipB=-10, kneeB=16, armF=22, elbF=26, armB=16, elbB=34,
              bat=-14)
BACKLIFT = dict(STANCE, lean=8, armF=-150, elbF=-28, armB=-140, elbB=-36, bat=-140)
IMPACT = dict(STANCE, lean=22, hipF=24, kneeF=10, armF=40, elbF=8, armB=46, elbB=12, bat=70)
FOLLOW = dict(STANCE, lean=4, hipF=26, kneeF=6, hipB=-16, armF=168, elbF=30, armB=160, elbB=34, bat=230)
CELEBRATE = dict(BASE, lean=-6, armF=172, elbF=6, armB=-150, elbB=-20, bat=180)


def walk(phase, carry=True):
    s = math.sin(phase)
    p = dict(BASE)
    p.update(hipF=22 * s, hipB=-22 * s, kneeF=6 + 22 * max(0, -s), kneeB=6 + 22 * max(0, s),
             armB=18 * s, elbB=14, bob=3.5 * abs(math.cos(phase)), lean=4)
    if carry:
        p.update(armF=-6 - 6 * s, elbF=12, bat=-24)
    else:
        p.update(armF=-18 * s, elbF=14)
    return p


def swing_pose(t, t0):
    """Lofted drive starting at t0 (backlift 0.35 s before contact at t0+0.45)."""
    return keyframes(t, [(t0, STANCE), (t0 + 0.3, BACKLIFT), (t0 + 0.45, IMPACT), (t0 + 0.75, FOLLOW),
                         (t0 + 1.6, FOLLOW)])


# ---------------------------------------------------------------- drawing helpers
def vec(a, facing):
    r = math.radians(a)
    return math.sin(r) * facing, math.cos(r)


def limb(ctx, p0, p1, width, color, outline=None):
    if outline:
        ctx.set_source_rgba(*outline)
        ctx.set_line_width(width + 4)
        ctx.move_to(*p0)
        ctx.line_to(*p1)
        ctx.stroke()
    ctx.set_source_rgba(*color)
    ctx.set_line_width(width)
    ctx.move_to(*p0)
    ctx.line_to(*p1)
    ctx.stroke()


def figure(ctx, x, y, pose, kit, s=1.0, facing=1, helmet=True, cap=None, pads=True, alpha=1.0, glow=None):
    """Draw a cricketer standing on (x, y). Returns key points (head, hands, bat tip)."""
    ctx.save()
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    P = pose
    out = (*kit["trim"][:3], 0.55 * alpha)
    A = lambda c: (*c[:3], c[3] * alpha)
    thigh, shin, torso, up, lo = 68 * s, 66 * s, 92 * s, 50 * s, 48 * s
    hip = (x, y - (thigh + shin) - P["bob"] * s + 6 * s)
    tv = vec(180 + P["lean"], facing)
    sh = (hip[0] + tv[0] * torso, hip[1] + tv[1] * torso)

    # ground shadow
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(1, 0.18)
    g = cairo.RadialGradient(0, 0, 0, 0, 0, 70 * s)
    g.add_color_stop_rgba(0, 0, 0, 0, 0.45 * alpha)
    g.add_color_stop_rgba(1, 0, 0, 0, 0)
    ctx.set_source(g)
    ctx.arc(0, 0, 70 * s, 0, 2 * math.pi)
    ctx.fill()
    ctx.restore()

    if glow:   # rim/spot glow behind the figure
        g = cairo.RadialGradient(sh[0], sh[1] + 40 * s, 10 * s, sh[0], sh[1] + 40 * s, 230 * s)
        g.add_color_stop_rgba(0, *glow[:3], glow[3] * alpha)
        g.add_color_stop_rgba(1, *glow[:3], 0)
        ctx.set_source(g)
        ctx.arc(sh[0], sh[1] + 40 * s, 230 * s, 0, 2 * math.pi)
        ctx.fill()

    def leg(a_hip, a_knee, front):
        k = vec(a_hip, facing)
        knee = (hip[0] + k[0] * thigh, hip[1] + k[1] * thigh)
        f = vec(a_hip - a_knee, facing)
        foot = (knee[0] + f[0] * shin, knee[1] + f[1] * shin)
        shade = 1.0 if front else 0.72
        trouser = A((kit["jersey"][0] * shade + 0.02, kit["jersey"][1] * shade + 0.02, kit["jersey"][2] * shade + 0.02, 1))
        limb(ctx, hip, knee, 27 * s, trouser, out)
        padc = A((PAD[0] * shade, PAD[1] * shade, PAD[2] * shade, 1)) if pads else trouser
        limb(ctx, knee, foot, (29 if pads else 24) * s, padc, out if not pads else None)
        # shoe
        ctx.set_source_rgba(*A((0.95 * shade, 0.95 * shade, 0.95 * shade, 1)))
        ctx.save()
        ctx.translate(foot[0] + 8 * s * facing, foot[1])
        ctx.scale(1, 0.55)
        ctx.arc(0, 0, 15 * s, 0, 2 * math.pi)
        ctx.fill()
        ctx.restore()
        return foot

    def arm(a_up, a_el, front):
        e = vec(a_up, facing)
        elbow = (sh[0] + e[0] * up, sh[1] + e[1] * up)
        h = vec(a_up + a_el, facing)
        hand = (elbow[0] + h[0] * lo, elbow[1] + h[1] * lo)
        shade = 1.0 if front else 0.75
        sleeve = A((kit["jersey"][0] * shade + 0.03, kit["jersey"][1] * shade + 0.03, kit["jersey"][2] * shade + 0.03, 1))
        skin = A((kit["skin"][0] * shade, kit["skin"][1] * shade, kit["skin"][2] * shade, 1))
        mid = ((sh[0] + elbow[0]) / 2, (sh[1] + elbow[1]) / 2)
        limb(ctx, sh, mid, 21 * s, sleeve, out)
        limb(ctx, mid, elbow, 17 * s, skin)
        limb(ctx, elbow, hand, 16 * s, skin)
        ctx.set_source_rgba(*A((0.93, 0.93, 0.9, 1)))     # glove
        ctx.arc(hand[0], hand[1], 10 * s, 0, 2 * math.pi)
        ctx.fill()
        return hand

    leg(P["hipB"], P["kneeB"], False)
    arm(P["armB"], P["elbB"], False)
    # torso
    nx, ny = -tv[1], tv[0]
    wid_h, wid_s = 22 * s, 33 * s
    ctx.move_to(hip[0] + nx * wid_h, hip[1] + ny * wid_h)
    ctx.line_to(sh[0] + nx * wid_s, sh[1] + ny * wid_s)
    ctx.line_to(sh[0] - nx * wid_s, sh[1] - ny * wid_s)
    ctx.line_to(hip[0] - nx * wid_h, hip[1] - ny * wid_h)
    ctx.close_path()
    ctx.set_source_rgba(*out)
    ctx.set_line_width(4)
    ctx.stroke_preserve()
    ctx.set_source_rgba(*A(kit["jersey"]))
    ctx.fill()
    # trim stripe down the side
    limb(ctx, (hip[0] + nx * 4 * s, hip[1] + ny * 4 * s), (sh[0] + nx * 6 * s, sh[1] + ny * 6 * s), 5 * s, A(kit["trim"]))
    # head
    hc = (sh[0] + tv[0] * 30 * s, sh[1] + tv[1] * 30 * s)
    ctx.set_source_rgba(*A(kit["skin"]))
    ctx.arc(hc[0], hc[1], 21 * s, 0, 2 * math.pi)
    ctx.fill()
    if helmet:
        ctx.set_source_rgba(*A(kit["helmet"]))
        ctx.arc(hc[0] - 2 * s * facing, hc[1] - 3 * s, 24 * s, math.pi * 0.95, math.pi * 2.05)
        ctx.fill()
        # peak
        ctx.move_to(hc[0] + 4 * s * facing, hc[1] - 6 * s)
        ctx.line_to(hc[0] + 34 * s * facing, hc[1] - 2 * s)
        ctx.line_to(hc[0] + 4 * s * facing, hc[1] + 2 * s)
        ctx.fill()
        # grille
        ctx.set_source_rgba(*A((0.85, 0.85, 0.85, 0.9)))
        ctx.set_line_width(2.4 * s)
        for i in range(3):
            yy = hc[1] + (2 + i * 7) * s
            ctx.move_to(hc[0] + 6 * s * facing, yy)
            ctx.line_to(hc[0] + 25 * s * facing, yy - 2 * s)
        ctx.stroke()
    elif cap:
        ctx.set_source_rgba(*A(cap))
        ctx.arc(hc[0], hc[1] - 4 * s, 22 * s, math.pi, 2 * math.pi)
        ctx.fill()
        ctx.move_to(hc[0], hc[1] - 6 * s)
        ctx.line_to(hc[0] + 30 * s * facing, hc[1] - 3 * s)
        ctx.line_to(hc[0], hc[1])
        ctx.fill()
    leg(P["hipF"], P["kneeF"], True)
    hand = arm(P["armF"], P["elbF"], True)
    tip = hand
    if P.get("batOn", 1) and kit.get("bat", True):
        b = vec(P["bat"], facing)
        hd = (hand[0] + b[0] * 26 * s, hand[1] + b[1] * 26 * s)
        tip = (hand[0] + b[0] * 118 * s, hand[1] + b[1] * 118 * s)
        limb(ctx, hand, hd, 7 * s, A(hexc("2A2622")))
        limb(ctx, hd, tip, 17 * s, A(hexc("E9D9B0")), A((0.3, 0.25, 0.18, 0.6)))
    ctx.restore()
    return {"head": hc, "hand": hand, "tip": tip, "shoulder": sh}


def tag(ctx, x, y, text, alpha=1.0, size=22, color=(1, 1, 1)):
    """Small name tag above a character (the only text used in the animated sequence)."""
    if alpha <= 0:
        return
    ctx.save()
    ctx.select_font_face("DejaVu Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(size)
    ext = ctx.text_extents(text)
    pw, ph = ext.width + 26, size + 16
    ctx.set_source_rgba(0.03, 0.05, 0.04, 0.78 * alpha)
    ctx.rectangle(x - pw / 2, y - ph, pw, ph)
    ctx.fill()
    ctx.set_source_rgba(*LIME[:3], alpha)
    ctx.rectangle(x - pw / 2, y - ph, 4, ph)
    ctx.fill()
    ctx.set_source_rgba(*color, alpha)
    ctx.move_to(x - ext.width / 2 - ext.x_bearing + 2, y - 8)
    ctx.show_text(text)
    ctx.restore()


# ---------------------------------------------------------------- environment
def sky(ctx, bright=0.0):
    g = cairo.LinearGradient(0, 0, 0, H)
    g.add_color_stop_rgba(0, *SKY_TOP[:3], 1)
    g.add_color_stop_rgba(1, *(lerp(SKY_LOW[i], 0.25, bright * 0.3) for i in range(3)), 1)
    ctx.set_source(g)
    ctx.paint()


_stars = [(random.Random(3).random() * W, random.Random(i).random() * H * 0.5, random.Random(i + 99).random())
          for i in range(140)]


def stars(ctx, t, alpha=1.0):
    for i, (x, y, r) in enumerate(_stars):
        tw = 0.5 + 0.5 * math.sin(t * (1 + r * 2) + i)
        ctx.set_source_rgba(1, 1, 1, (0.15 + 0.35 * tw) * r * alpha)
        ctx.arc((x * (i + 7)) % W, y, 1.1 + r, 0, 2 * math.pi)
        ctx.fill()


def glow(ctx, x, y, r, color=FLOOD, a=1.0):
    ctx.save()
    ctx.set_operator(cairo.OPERATOR_ADD)
    g = cairo.RadialGradient(x, y, 0, x, y, r)
    g.add_color_stop_rgba(0, *color[:3], 0.9 * a)
    g.add_color_stop_rgba(0.12, *color[:3], 0.45 * a)
    g.add_color_stop_rgba(1, *color[:3], 0)
    ctx.set_source(g)
    ctx.arc(x, y, r, 0, 2 * math.pi)
    ctx.fill()
    ctx.restore()


def flood_tower(ctx, x, base_y, top_y, on, t, lean=0):
    """Lattice tower with a lamp bank; `on` 0..1 brightness."""
    ctx.save()
    ctx.set_source_rgba(0.05, 0.06, 0.09, 1)
    ctx.set_line_width(5)
    ctx.move_to(x - 26, base_y)
    ctx.line_to(x - 8 + lean, top_y + 40)
    ctx.move_to(x + 26, base_y)
    ctx.line_to(x + 8 + lean, top_y + 40)
    ctx.stroke()
    ctx.set_line_width(2)
    n = 9
    for i in range(n):
        y0 = base_y - (base_y - top_y - 40) * i / n
        y1 = base_y - (base_y - top_y - 40) * (i + 1) / n
        w0 = lerp(26, 8, i / n)
        w1 = lerp(26, 8, (i + 1) / n)
        ctx.move_to(x - w0, y0)
        ctx.line_to(x + w1, y1)
        ctx.move_to(x + w0, y0)
        ctx.line_to(x - w1, y1)
    ctx.stroke()
    # lamp bank
    bx, by, bw, bh = x - 60 + lean, top_y - 10, 120, 54
    ctx.set_source_rgba(0.08, 0.08, 0.1, 1)
    ctx.rectangle(bx - 6, by - 6, bw + 12, bh + 12)
    ctx.fill()
    for r in range(3):
        for c in range(6):
            flick = 1.0 if on >= 1 else on * (0.6 + 0.4 * math.sin(t * 60 + r * 3 + c))
            ctx.set_source_rgba(*(lerp(0.15, FLOOD[i], flick) for i in range(3)), 1)
            ctx.rectangle(bx + 4 + c * 19, by + 3 + r * 17, 15, 13)
            ctx.fill()
    if on > 0:
        glow(ctx, x + lean, by + bh / 2, 260 * (0.6 + 0.4 * on), FLOOD, on)
    ctx.restore()
    return x + lean, by + bh / 2


class Crowd:
    """Rows of seated/standing silhouettes with team flags, bobbing and camera flashes."""

    def __init__(self, rows, seed=1, flag_cols=None, density=1.0):
        rnd = random.Random(seed)
        self.people = []
        for (x0, x1, y, size) in rows:
            n = int((x1 - x0) / (size * 1.25) * density)
            for i in range(n):
                x = lerp(x0, x1, (i + rnd.random() * 0.6) / n)
                tone = rnd.uniform(0.08, 0.22)
                flag = None
                if flag_cols and rnd.random() < 0.13:
                    flag = flag_cols[0] if x < (flag_cols[2] if len(flag_cols) > 2 else W / 2) else flag_cols[1]
                self.people.append((x, y + rnd.uniform(-2, 2), size * rnd.uniform(0.85, 1.15), tone,
                                    rnd.random() * 6.28, flag, rnd.random()))

    def draw(self, ctx, t, energy=0.3, lit=0.6, flash=0.0, flag_on=1.0):
        for (x, y, s, tone, ph, flag, r) in self.people:
            jump = max(0, math.sin(t * (3 + 3 * energy) + ph)) * s * 0.35 * energy
            yy = y - jump
            c = tone + 0.25 * lit
            ctx.set_source_rgba(c * 0.9, c * 0.92, c * 1.05, 1)
            ctx.save()
            ctx.translate(x, yy + s * 0.9)
            ctx.scale(1, 0.75)
            ctx.arc(0, 0, s * 0.62, math.pi, 2 * math.pi)
            ctx.restore()
            ctx.fill()
            ctx.arc(x, yy, s * 0.36, 0, 2 * math.pi)
            ctx.fill()
            if flag and flag_on > 0:
                wave = math.sin(t * 6 + ph) * 0.35
                fx, fy = x + s * 0.3, yy - s * 0.9
                ctx.set_source_rgba(0.1, 0.1, 0.1, flag_on)
                ctx.set_line_width(max(1, s * 0.08))
                ctx.move_to(x + s * 0.3, yy + s * 0.2)
                ctx.line_to(fx, fy - s * 0.6)
                ctx.stroke()
                ctx.set_source_rgba(*flag[:3], flag_on)
                ctx.move_to(fx, fy - s * 0.6)
                ctx.curve_to(fx + s * 0.5, fy - s * (0.6 + wave), fx + s * 0.9, fy - s * (0.4 - wave), fx + s * 1.3, fy - s * 0.5)
                ctx.line_to(fx + s * 1.3, fy + s * 0.1)
                ctx.curve_to(fx + s * 0.9, fy + s * (0.2 - wave), fx + s * 0.5, fy + s * wave, fx, fy)
                ctx.close_path()
                ctx.fill()
            if flash > 0 and (math.sin(t * 13.7 + ph * 7) > 0.985 - 0.02 * flash) and r < 0.5 + 0.5 * flash:
                glow(ctx, x, yy, s * 2.2, (1, 1, 1, 1), 0.9)


# ---------------------------------------------------------------- fireworks
class Burst:
    def __init__(self, x, y, t0, color, n=110, speed=420, seed=0, rise_from=None, rise=0.7):
        rnd = random.Random(seed)
        self.x, self.y, self.t0, self.color = x, y, t0, color
        self.rise_from, self.rise = rise_from, rise
        self.parts = []
        for i in range(n):
            a = rnd.random() * 2 * math.pi
            v = speed * (0.55 + 0.45 * rnd.random() ** 0.5)
            self.parts.append((math.cos(a) * v, math.sin(a) * v, rnd.random()))

    def pos(self, vx, vy, dt):
        k = 2.2                        # drag
        f = (1 - math.exp(-k * dt)) / k
        return self.x + vx * f, self.y + vy * f + 140 * dt * dt

    def draw(self, ctx, t):
        dt = t - self.t0
        if self.rise_from is not None and -self.rise <= dt < 0:
            p = ease_out(1 + dt / self.rise)
            x = lerp(self.rise_from[0], self.x, p)
            y = lerp(self.rise_from[1], self.y, p)
            glow(ctx, x, y, 28, self.color, 1.0)
            ctx.set_source_rgba(*self.color[:3], 0.6)
            ctx.set_line_width(3)
            px = lerp(self.rise_from[0], self.x, max(0, p - 0.08))
            py = lerp(self.rise_from[1], self.y, max(0, p - 0.08))
            ctx.move_to(px, py)
            ctx.line_to(x, y)
            ctx.stroke()
            return
        if dt < 0 or dt > 2.4:
            return
        life = 1 - dt / 2.4
        if dt < 0.25:
            glow(ctx, self.x, self.y, 260 * (1 - dt / 0.25) + 40, self.color, 1.0)
        ctx.save()
        ctx.set_operator(cairo.OPERATOR_ADD)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        for vx, vy, r in self.parts:
            x1, y1 = self.pos(vx, vy, dt)
            x0, y0 = self.pos(vx, vy, max(0, dt - 0.09))
            tw = 0.6 + 0.4 * math.sin(dt * 30 + r * 50)
            a = life ** 1.5 * tw
            ctx.set_source_rgba(*self.color[:3], a)
            ctx.set_line_width(2.6)
            ctx.move_to(x0, y0)
            ctx.line_to(x1, y1)
            ctx.stroke()
            ctx.set_source_rgba(1, 1, 0.92, a * 0.8)
            ctx.arc(x1, y1, 1.8, 0, 2 * math.pi)
            ctx.fill()
        ctx.restore()


# ---------------------------------------------------------------- surface <-> numpy
def new_surface():
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    return s, cairo.Context(s)


def to_rgb(surface):
    surface.flush()
    a = np.ndarray(shape=(H, W, 4), dtype=np.uint8, buffer=surface.get_data())
    return a[..., [2, 1, 0]].copy()
