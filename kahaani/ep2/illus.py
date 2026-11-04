"""Editorial-illustration toolkit for version B (Cairo): figures, the Audi 100, the MCG at night,
a light-bulb scoreboard, line drawing and a tear-off calendar.

The figures are faceless illustrations identified by context (kit, role), not likenesses.
"""
import math
import os
import random

import cairo
import numpy as np
from PIL import Image, ImageDraw

import common as C

W, H = C.W, C.H


def rgb(h, a=1.0):
    h = h.lstrip("#")
    return (int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255, a)


def shade(c, k):
    return (min(1, c[0] * k), min(1, c[1] * k), min(1, c[2] * k), c[3] if len(c) > 3 else 1)


SKY0, SKY1 = rgb("070A18"), rgb("1A2147")
GRASS0, GRASS1 = rgb("2E5B45"), rgb("3E7356")
FLOOD = rgb("FFF1D6")
WARM = rgb("F2D7A6")

INDIA_85 = {"shirt": rgb("A8C9E8"), "band": rgb("E9C24B"), "band2": rgb("27407A"), "trousers": rgb("A3C2E2"),
            "skin": rgb("8A5A3C"), "hair": rgb("1B1512"), "shoes": rgb("EDEDED")}
BLAZER = {"shirt": rgb("1E2A4A"), "band": None, "band2": None, "trousers": rgb("2B2F3C"), "skin": rgb("D8A88A"),
          "hair": rgb("B8742E"), "shoes": rgb("2A2420"), "blazer": True}
OFFICIAL = {"shirt": rgb("5B5E66"), "band": None, "band2": None, "trousers": rgb("4A4C52"), "skin": rgb("D2A58A"),
            "hair": rgb("9A9A9A"), "shoes": rgb("2A2420"), "blazer": True}


def lerp(a, b, x):
    return a + (b - a) * x


def ease(x):
    return C.ease(x)


def prog(t, a, b):
    return C.prog(t, a, b)


# ------------------------------------------------------------------ figure
STAND = dict(lean=0, hipF=3, kneeF=3, hipB=-3, kneeB=3, armF=6, elbF=6, armB=-5, elbB=6, bob=0, headTilt=0)


def walk_pose(ph, amp=1.0):
    s = math.sin(ph)
    return dict(STAND, hipF=17 * s * amp, hipB=-17 * s * amp, kneeF=4 + 16 * max(0, -s) * amp,
                kneeB=4 + 16 * max(0, s) * amp, armF=-12 * s * amp, elbF=10, armB=12 * s * amp, elbB=10,
                bob=2.2 * abs(math.cos(ph)) * amp, lean=2)


def blend(p, q, x):
    return {k: lerp(p[k], q.get(k, p[k]), x) for k in p}


def _v(a, f):
    r = math.radians(a)
    return math.sin(r) * f, math.cos(r)


def figure(ctx, x, y, pose, o, s=1.0, facing=1, alpha=1.0, light=1.0, holds=None):
    """Standing figure on (x, y). ~7.5 heads tall. `holds`: 'trophy' | 'mic' | None."""
    ctx.save()
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    P = pose
    A = lambda c, k=1.0: (*shade(c, k * light)[:3], (c[3] if len(c) > 3 else 1) * alpha)
    head_r = 13 * s
    thigh, shin, torso, up, lo = 52 * s, 50 * s, 74 * s, 38 * s, 36 * s
    hip = (x, y - thigh - shin + 4 * s - P["bob"] * s)
    tv = _v(180 + P["lean"], facing)
    sh = (hip[0] + tv[0] * torso, hip[1] + tv[1] * torso)

    # contact shadow
    g = cairo.RadialGradient(x, y, 0, x, y, 48 * s)
    g.add_color_stop_rgba(0, 0, 0, 0, 0.35 * alpha)
    g.add_color_stop_rgba(1, 0, 0, 0, 0)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(1, 0.16)
    ctx.translate(-x, -y)
    ctx.set_source(g)
    ctx.arc(x, y, 48 * s, 0, 2 * math.pi)
    ctx.fill()
    ctx.restore()

    def seg(p0, p1, w0, w1, col):
        dx, dy = p1[0] - p0[0], p1[1] - p0[1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        ctx.move_to(p0[0] + nx * w0 / 2, p0[1] + ny * w0 / 2)
        ctx.line_to(p1[0] + nx * w1 / 2, p1[1] + ny * w1 / 2)
        ctx.line_to(p1[0] - nx * w1 / 2, p1[1] - ny * w1 / 2)
        ctx.line_to(p0[0] - nx * w0 / 2, p0[1] - ny * w0 / 2)
        ctx.close_path()
        ctx.set_source_rgba(*col)
        ctx.fill()
        for p, w in ((p0, w0), (p1, w1)):
            ctx.arc(p[0], p[1], w / 2, 0, 2 * math.pi)
            ctx.fill()

    def leg(ah, ak, front):
        k = _v(ah, facing)
        knee = (hip[0] + k[0] * thigh, hip[1] + k[1] * thigh)
        f = _v(ah - ak, facing)
        foot = (knee[0] + f[0] * shin, knee[1] + f[1] * shin)
        sh_ = 1.0 if front else 0.78
        seg(hip, knee, 21 * s, 16 * s, A(o["trousers"], sh_))
        seg(knee, foot, 16 * s, 12 * s, A(o["trousers"], sh_ * 0.97))
        ctx.set_source_rgba(*A(o["shoes"], sh_))
        ctx.save()
        ctx.translate(foot[0] + 6 * s * facing, foot[1] + 2 * s)
        ctx.scale(1, 0.5)
        ctx.arc(0, 0, 11 * s, 0, 2 * math.pi)
        ctx.restore()
        ctx.fill()

    def arm(au, ae, front):
        e = _v(au, facing)
        el = (sh[0] + e[0] * up, sh[1] + e[1] * up)
        hh = _v(au + ae, facing)
        hand = (el[0] + hh[0] * lo, el[1] + hh[1] * lo)
        sh_ = 1.0 if front else 0.8
        sleeve = o["shirt"]
        long_sleeve = o.get("blazer")
        mid = (lerp(sh[0], el[0], 0.55), lerp(sh[1], el[1], 0.55))
        seg(sh, mid if not long_sleeve else el, 15 * s, 12 * s, A(sleeve, sh_))
        if not long_sleeve:
            seg(mid, el, 10 * s, 9 * s, A(o["skin"], sh_))
            seg(el, hand, 9 * s, 7.5 * s, A(o["skin"], sh_))
        else:
            seg(el, hand, 11 * s, 9 * s, A(sleeve, sh_ * 0.95))
        ctx.set_source_rgba(*A(o["skin"], sh_))
        ctx.arc(hand[0], hand[1], 5.2 * s, 0, 2 * math.pi)
        ctx.fill()
        return hand

    leg(P["hipB"], P["kneeB"], False)
    arm(P["armB"], P["elbB"], False)
    # torso: tapered, slightly rounded
    nx, ny = -tv[1], tv[0]
    wh, ws = 17 * s, 23 * s
    pts = [(hip[0] + nx * wh, hip[1] + ny * wh), (sh[0] + nx * ws, sh[1] + ny * ws),
           (sh[0] - nx * ws, sh[1] - ny * ws), (hip[0] - nx * wh, hip[1] - ny * wh)]
    ctx.move_to(*pts[0])
    ctx.curve_to(pts[0][0] + tv[0] * 30 * s + nx * 4 * s, pts[0][1] + tv[1] * 30 * s, pts[1][0], pts[1][1] - tv[1] * -8 * s,
                 *pts[1])
    ctx.line_to(*pts[2])
    ctx.curve_to(pts[2][0], pts[2][1], pts[3][0] + tv[0] * 30 * s - nx * 4 * s, pts[3][1] + tv[1] * 30 * s, *pts[3])
    ctx.close_path()
    lg = cairo.LinearGradient(sh[0] - nx * ws * facing, 0, sh[0] + nx * ws * facing, 0)
    lg.add_color_stop_rgba(0, *A(o["shirt"], 0.82))
    lg.add_color_stop_rgba(1, *A(o["shirt"], 1.06))
    ctx.set_source(lg)
    ctx.fill_preserve()
    ctx.save()
    ctx.clip()
    if o.get("band"):          # India 1985: yellow and navy bands across the chest
        by = lerp(sh[1], hip[1], 0.22)
        ctx.set_source_rgba(*A(o["band"]))
        ctx.rectangle(sh[0] - 60 * s, by, 120 * s, 11 * s)
        ctx.fill()
        ctx.set_source_rgba(*A(o["band2"]))
        ctx.rectangle(sh[0] - 60 * s, by + 11 * s, 120 * s, 3.5 * s)
        ctx.fill()
    if o.get("blazer"):        # open blazer: shirt + tie line
        ctx.set_source_rgba(*A(rgb("E8E6E0")))
        ctx.move_to(sh[0] - 6 * s, sh[1] + 4 * s)
        ctx.line_to(sh[0] + 6 * s, sh[1] + 4 * s)
        ctx.line_to(sh[0] + 1 * s, sh[1] + 38 * s)
        ctx.close_path()
        ctx.fill()
        ctx.set_source_rgba(*A(rgb("7A2430")))
        ctx.rectangle(sh[0] - 1.5 * s, sh[1] + 6 * s, 3 * s, 26 * s)
        ctx.fill()
    ctx.restore()
    # neck + head (faceless), hair
    hc = (sh[0] + tv[0] * 22 * s + P["headTilt"] * s * facing, sh[1] + tv[1] * 22 * s)
    seg(sh, (sh[0] + tv[0] * 10 * s, sh[1] + tv[1] * 10 * s), 9 * s, 9 * s, A(o["skin"], 0.9))
    ctx.save()
    ctx.translate(*hc)
    ctx.scale(0.86, 1.0)
    rg = cairo.RadialGradient(4 * s * facing, -4 * s, 2, 0, 0, head_r * 1.2)
    rg.add_color_stop_rgba(0, *A(o["skin"], 1.12))
    rg.add_color_stop_rgba(1, *A(o["skin"], 0.85))
    ctx.set_source(rg)
    ctx.arc(0, 0, head_r, 0, 2 * math.pi)
    ctx.fill()
    ctx.set_source_rgba(*A(o["hair"]))
    ctx.arc(-1.5 * s * facing, -2.5 * s, head_r * 1.02, math.pi * 1.02, math.pi * 1.98)
    ctx.fill()
    ctx.restore()
    leg(P["hipF"], P["kneeF"], True)
    hand = arm(P["armF"], P["elbF"], True)
    if holds == "trophy":
        trophy(ctx, hand[0], hand[1] - 4 * s, 0.9 * s, alpha)
    elif holds == "mic":
        ctx.set_source_rgba(0.1, 0.1, 0.12, alpha)
        ctx.set_line_width(4 * s)
        ctx.move_to(hand[0], hand[1])
        ctx.line_to(hand[0] + 10 * s * facing, hand[1] - 14 * s)
        ctx.stroke()
        ctx.arc(hand[0] + 12 * s * facing, hand[1] - 17 * s, 5 * s, 0, 2 * math.pi)
        ctx.fill()
    ctx.restore()
    return {"head": hc, "hand": hand, "shoulder": sh, "hip": hip}


def trophy(ctx, x, y, s=1.0, alpha=1.0):
    """A generic cup (not a replica of the real trophy)."""
    g = cairo.LinearGradient(x - 14 * s, 0, x + 14 * s, 0)
    g.add_color_stop_rgba(0, 0.62, 0.48, 0.2, alpha)
    g.add_color_stop_rgba(0.45, 1.0, 0.9, 0.6, alpha)
    g.add_color_stop_rgba(1, 0.55, 0.42, 0.18, alpha)
    ctx.set_source(g)
    ctx.move_to(x - 14 * s, y - 40 * s)
    ctx.curve_to(x - 14 * s, y - 18 * s, x - 6 * s, y - 12 * s, x - 3 * s, y - 10 * s)
    ctx.line_to(x - 3 * s, y)
    ctx.line_to(x - 9 * s, y + 6 * s)
    ctx.line_to(x + 9 * s, y + 6 * s)
    ctx.line_to(x + 3 * s, y)
    ctx.line_to(x + 3 * s, y - 10 * s)
    ctx.curve_to(x + 6 * s, y - 12 * s, x + 14 * s, y - 18 * s, x + 14 * s, y - 40 * s)
    ctx.close_path()
    ctx.fill()


# ------------------------------------------------------------------ the car (Audi 100, C3 body: side view)
def car_path(ctx, x, y, s, facing=1):
    """Side profile; (x, y) = ground point under the centre; s = px per metre."""
    f = facing
    L = 4.79 * s
    def P(u, v):                       # u along length (-0.5..0.5 of L), v height in metres
        return (x + u * L * f, y - v * s)
    ctx.move_to(*P(-0.5, 0.36))
    ctx.curve_to(*P(-0.51, 0.55), *P(-0.5, 0.72), *P(-0.47, 0.78))          # rear bumper → boot lid
    ctx.line_to(*P(-0.34, 0.86))                                              # boot
    ctx.curve_to(*P(-0.27, 0.9), *P(-0.2, 1.3), *P(-0.15, 1.38))              # rear screen
    ctx.curve_to(*P(-0.1, 1.42), *P(0.08, 1.42), *P(0.13, 1.39))              # roof
    ctx.curve_to(*P(0.2, 1.3), *P(0.26, 1.06), *P(0.29, 0.98))                # windscreen
    ctx.line_to(*P(0.47, 0.84))                                               # bonnet
    ctx.curve_to(*P(0.51, 0.8), *P(0.51, 0.55), *P(0.5, 0.36))                # nose
    ctx.curve_to(*P(0.49, 0.28), *P(0.46, 0.26), *P(0.42, 0.26))
    ctx.line_to(*P(0.39, 0.26))
    ctx.line_to(*P(-0.42, 0.26))
    ctx.curve_to(*P(-0.47, 0.26), *P(-0.5, 0.3), *P(-0.5, 0.36))
    ctx.close_path()


def car(ctx, x, y, s, facing=1, alpha=1.0, light=1.0, plate=None, occupants=0, riders=()):
    """Silver saloon on the ground at (x, y). riders: list of (u, kind) people sitting on bonnet/boot/roof."""
    ctx.save()
    f = facing
    L = 4.79 * s
    P = lambda u, v: (x + u * L * f, y - v * s)
    # ground shadow
    ctx.save()
    ctx.translate(x, y + 2)
    ctx.scale(1, 0.12)
    g = cairo.RadialGradient(0, 0, 0, 0, 0, L * 0.62)
    g.add_color_stop_rgba(0, 0, 0, 0, 0.55 * alpha)
    g.add_color_stop_rgba(1, 0, 0, 0, 0)
    ctx.set_source(g)
    ctx.arc(0, 0, L * 0.62, 0, 2 * math.pi)
    ctx.fill()
    ctx.restore()
    # body
    car_path(ctx, x, y, s, f)
    bg = cairo.LinearGradient(0, y - 1.42 * s, 0, y - 0.26 * s)
    bg.add_color_stop_rgba(0, 0.86 * light, 0.88 * light, 0.9 * light, alpha)
    bg.add_color_stop_rgba(0.45, 0.72 * light, 0.74 * light, 0.77 * light, alpha)
    bg.add_color_stop_rgba(0.5, 0.92 * light, 0.93 * light, 0.95 * light, alpha)
    bg.add_color_stop_rgba(1, 0.42 * light, 0.44 * light, 0.47 * light, alpha)
    ctx.set_source(bg)
    ctx.fill()
    # glasshouse (flush windows, the C3's signature)
    ctx.move_to(*P(-0.29, 0.92))
    ctx.curve_to(*P(-0.24, 0.98), *P(-0.19, 1.27), *P(-0.145, 1.33))
    ctx.curve_to(*P(-0.1, 1.36), *P(0.07, 1.36), *P(0.115, 1.33))
    ctx.curve_to(*P(0.18, 1.25), *P(0.23, 1.06), *P(0.255, 0.98))
    ctx.line_to(*P(-0.29, 0.92))
    ctx.close_path()
    wg = cairo.LinearGradient(*P(-0.25, 1.3), *P(0.2, 0.95))
    wg.add_color_stop_rgba(0, 0.16, 0.2, 0.28, alpha)
    wg.add_color_stop_rgba(0.55, 0.32, 0.38, 0.5, alpha)
    wg.add_color_stop_rgba(1, 0.12, 0.15, 0.22, alpha)
    ctx.set_source(wg)
    ctx.fill()
    # pillars
    ctx.set_source_rgba(0.55 * light, 0.57 * light, 0.6 * light, alpha)
    for u in (-0.17, 0.03):
        ctx.rectangle(*P(u, 1.34), 0.05 * s * f, 0.42 * s)
    ctx.fill()
    # occupants: heads visible through the windows
    R = random.Random(7)
    for k in range(occupants):
        u = lerp(-0.22, 0.2, (k + 0.5) / max(occupants, 1)) + R.uniform(-0.02, 0.02)
        hx, hy = P(u, 1.1 + R.uniform(-0.02, 0.04))
        ctx.set_source_rgba(0.08, 0.06, 0.06, alpha)
        ctx.arc(hx, hy, 0.12 * s, 0, 2 * math.pi)
        ctx.fill()
        ctx.set_source_rgba(0.62, 0.76, 0.9, alpha)
        ctx.rectangle(hx - 0.14 * s, hy + 0.1 * s, 0.28 * s, 0.14 * s)
        ctx.fill()
    # rubbing strip, sill, door shut lines
    ctx.set_source_rgba(0.12, 0.12, 0.14, alpha)
    ctx.rectangle(*P(-0.49, 0.55), L * 0.98 * f, 0.07 * s)
    ctx.fill()
    ctx.set_source_rgba(0.3, 0.31, 0.34, 0.8 * alpha)
    ctx.set_line_width(1.2)
    for u in (-0.15, 0.06, 0.26):
        ctx.move_to(*P(u, 0.92))
        ctx.line_to(*P(u + 0.005, 0.32))
    ctx.stroke()
    # lamps
    ctx.set_source_rgba(0.95, 0.93, 0.85, alpha)
    ctx.rectangle(*P(0.485, 0.72), 0.05 * s * f, 0.14 * s)
    ctx.fill()
    ctx.set_source_rgba(0.7, 0.12, 0.1, alpha)
    ctx.rectangle(*P(-0.505, 0.72), 0.05 * s * f, 0.14 * s)
    ctx.fill()
    # wheels
    for u in (0.31, -0.3):
        cx, cy = P(u, 0.31)
        r = 0.31 * s
        ctx.set_source_rgba(0.07, 0.07, 0.08, alpha)
        ctx.arc(cx, cy, r, 0, 2 * math.pi)
        ctx.fill()
        hg = cairo.RadialGradient(cx - r * 0.2, cy - r * 0.2, 1, cx, cy, r * 0.62)
        hg.add_color_stop_rgba(0, 0.92, 0.93, 0.95, alpha)
        hg.add_color_stop_rgba(1, 0.48, 0.5, 0.54, alpha)
        ctx.set_source(hg)
        ctx.arc(cx, cy, r * 0.62, 0, 2 * math.pi)
        ctx.fill()
        ctx.set_source_rgba(0.3, 0.32, 0.36, alpha)
        for k in range(10):
            a = k * math.pi / 5
            ctx.move_to(cx + math.cos(a) * r * 0.2, cy + math.sin(a) * r * 0.2)
            ctx.line_to(cx + math.cos(a) * r * 0.55, cy + math.sin(a) * r * 0.55)
        ctx.set_line_width(1.4)
        ctx.stroke()
    if plate:
        px, py = P(0.495 if f > 0 else -0.495, 0.42)
        ctx.set_source_rgba(0.96, 0.95, 0.9, alpha)
        ctx.rectangle(px - 0.03 * s, py - 0.06 * s, 0.06 * s, 0.12 * s)
        ctx.fill()
    ctx.restore()
    return P


def sitter(ctx, x, y, s, o, facing=1, wave=0.0, alpha=1.0):
    """A player sitting (on the bonnet or the boot), legs hanging forward, one arm maybe raised."""
    pose = dict(STAND, hipF=80, kneeF=80, hipB=74, kneeB=70, armF=lerp(10, 160, wave), elbF=lerp(10, -10, wave),
                armB=20, elbB=30, lean=-4)
    # draw with feet at y + legs: hip should sit at (x, y)
    leg_len = (50 + 52) * s
    return figure(ctx, x, y + 52 * s + 50 * s - 4 * s, pose, o, s, facing, alpha)


# ------------------------------------------------------------------ the MCG at night
_crowd = {}


def crowd_points(key, rows, seed):
    if key not in _crowd:
        R = random.Random(seed)
        pts = []
        for (cx, cy, rx, ry, a0, a1, n, size) in rows:
            for _ in range(n):
                a = R.uniform(a0, a1)
                rr = R.uniform(0.0, 1.0)
                pts.append((cx + (rx + rr * 30) * math.cos(a), cy + (ry + rr * 18) * math.sin(a), size * R.uniform(0.7, 1.2),
                            R.random(), R.random() * 6.28))
        _crowd[key] = pts
    return _crowd[key]


def night_sky(ctx, glow=1.0):
    g = cairo.LinearGradient(0, 0, 0, H)
    g.add_color_stop_rgba(0, *SKY0)
    g.add_color_stop_rgba(0.7, *SKY1)
    g.add_color_stop_rgba(1, *shade(SKY1, 1.2))
    ctx.set_source(g)
    ctx.paint()


def light_glow(ctx, x, y, r, a=1.0, col=FLOOD):
    ctx.save()
    ctx.set_operator(cairo.OPERATOR_ADD)
    g = cairo.RadialGradient(x, y, 0, x, y, r)
    g.add_color_stop_rgba(0, *col[:3], 0.7 * a)
    g.add_color_stop_rgba(0.1, *col[:3], 0.28 * a)
    g.add_color_stop_rgba(1, *col[:3], 0)
    ctx.set_source(g)
    ctx.arc(x, y, r, 0, 2 * math.pi)
    ctx.fill()
    ctx.restore()


def light_tower(ctx, x, base, top, s=1.0, lean=0.0):
    ctx.save()
    ctx.set_source_rgba(0.05, 0.06, 0.1, 1)
    ctx.move_to(x - 14 * s, base)
    ctx.line_to(x - 4 * s + lean, top + 30 * s)
    ctx.line_to(x + 4 * s + lean, top + 30 * s)
    ctx.line_to(x + 14 * s, base)
    ctx.close_path()
    ctx.fill()
    # angled head with lamp rows
    hx, hy = x + lean, top
    ctx.save()
    ctx.translate(hx, hy)
    ctx.rotate(math.radians(-8 if lean >= 0 else 8))
    ctx.set_source_rgba(0.07, 0.08, 0.12, 1)
    ctx.rectangle(-46 * s, -18 * s, 92 * s, 40 * s)
    ctx.fill()
    for r in range(3):
        for c in range(8):
            ctx.set_source_rgba(1, 0.96, 0.86, 1)
            ctx.rectangle(-42 * s + c * 11 * s, -14 * s + r * 12 * s, 8 * s, 8 * s)
            ctx.fill()
    ctx.restore()
    light_glow(ctx, hx, hy, 240 * s, 0.9)
    ctx.restore()


def stadium(ctx, t, cam=1.0, focus=(960, 600), energy=0.3, field=True):
    """Elevated view across the MCG bowl at night."""
    ctx.save()
    ctx.translate(focus[0], focus[1])
    ctx.scale(cam, cam)
    ctx.translate(-960, -600)
    night_sky(ctx)
    # far stands: tiered arcs
    for i, (ry, col) in enumerate(((330, 0.06), (300, 0.08), (272, 0.1))):
        ctx.save()
        ctx.translate(960, 760)
        ctx.scale(1, ry / 1000)
        ctx.arc(0, 0, 1000 - i * 40, math.pi, 2 * math.pi)
        ctx.restore()
        ctx.line_to(2200, 900)
        ctx.line_to(-300, 900)
        ctx.close_path()
        ctx.set_source_rgba(col, col * 1.1, col * 1.8, 1)
        ctx.fill()
    pts = crowd_points("far", [(960, 760, 980, 318, math.pi * 1.04, math.pi * 1.96, 2600, 3.2),
                               (960, 760, 900, 282, math.pi * 1.06, math.pi * 1.94, 2200, 2.8)], 3)
    for (px, py, sz, r, ph) in pts:
        b = 0.35 + 0.35 * r + energy * 0.25 * math.sin(t * 5 + ph)
        ctx.set_source_rgba(lerp(0.3, WARM[0], b), lerp(0.3, WARM[1], b) * 0.95, lerp(0.38, WARM[2], b) * 0.85, 0.55 + 0.3 * r)
        ctx.rectangle(px, py - energy * 1.5 * max(0, math.sin(t * 6 + ph)), sz * 0.8, sz)
        ctx.fill()
    for x, top, lean in ((140, 120, 20), (520, 70, 8), (1400, 70, -8), (1780, 120, -20)):
        light_tower(ctx, x, 560, top, 0.9, lean)
    if field:
        ctx.save()
        ctx.translate(960, 930)
        ctx.scale(1, 0.26)
        g = cairo.RadialGradient(0, -100, 100, 0, 0, 1100)
        g.add_color_stop_rgba(0, *shade(GRASS1, 1.25))
        g.add_color_stop_rgba(1, *GRASS0)
        ctx.set_source(g)
        ctx.arc(0, 0, 1100, 0, 2 * math.pi)
        ctx.fill()
        ctx.arc(0, 0, 1100, 0, 2 * math.pi)
        ctx.clip()
        for k in range(-11, 12, 2):
            ctx.set_source_rgba(1, 1, 1, 0.03)
            ctx.rectangle(k * 100, -1100, 100, 2200)
            ctx.fill()
        ctx.restore()
        ctx.set_source_rgba(0.62, 0.55, 0.4, 0.85)    # pitch
        ctx.move_to(940, 880)
        ctx.line_to(980, 880)
        ctx.line_to(986, 960)
        ctx.line_to(934, 960)
        ctx.fill()
    ctx.restore()


# ------------------------------------------------------------------ light-bulb scoreboard
_bulb_cache = {}


def bulb_grid(lines, cols=72, rows=36):
    key = (tuple(lines), cols, rows)
    if key not in _bulb_cache:
        import dotfont
        g = dotfont.render_lines(lines, cols, rows // max(1, len(lines)) if len(lines) * 9 > rows else 9)
        out = np.zeros((rows, cols), np.float32)
        off = (rows - g.shape[0]) // 2
        out[max(0, off):max(0, off) + min(rows, g.shape[0])] = g[:rows]
        _bulb_cache[key] = out
    return _bulb_cache[key]


def scoreboard(ctx, x, y, w, h, states, t, cols=80):
    """states: [(t_on, [lines])]. Bulbs switch on in a sweep when the text changes."""
    ctx.save()
    ctx.set_source_rgba(0.03, 0.03, 0.05, 1)
    ctx.rectangle(x - 14, y - 14, w + 28, h + 28)
    ctx.fill()
    ctx.set_source_rgba(0.12, 0.12, 0.16, 1)
    ctx.set_line_width(3)
    ctx.rectangle(x - 14, y - 14, w + 28, h + 28)
    ctx.stroke()
    cur, prev, t_on = None, None, 0
    for ts, ln in states:
        if t >= ts:
            prev, cur, t_on = cur, ln, ts
    rows = 36
    grid = bulb_grid(cur, cols, rows) if cur else np.zeros((rows, cols), np.float32)
    old = bulb_grid(prev, cols, rows) if prev else np.zeros((rows, cols), np.float32)
    sweep = prog(t, t_on, t_on + 0.9)
    cw, ch = w / cols, h / rows
    rr = min(cw, ch) * 0.36
    for r in range(rows):
        for c in range(cols):
            if grid[r, c] == old[r, c]:
                v = grid[r, c]
            else:
                passed = (c / cols) <= sweep * 1.15 - 0.15 * (r / rows)
                v = grid[r, c] if passed else old[r, c]
            px, py = x + (c + 0.5) * cw, y + (r + 0.5) * ch
            if v > 0:
                ctx.set_source_rgba(1.0, 0.82, 0.42, 1)
            else:
                ctx.set_source_rgba(0.13, 0.11, 0.08, 1)
            ctx.arc(px, py, rr, 0, 2 * math.pi)
            ctx.fill()
    # bloom
    ctx.save()
    ctx.set_operator(cairo.OPERATOR_ADD)
    g = cairo.RadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, w * 0.7)
    g.add_color_stop_rgba(0, 1, 0.8, 0.4, 0.08 if cur else 0)
    g.add_color_stop_rgba(1, 1, 0.8, 0.4, 0)
    ctx.set_source(g)
    ctx.rectangle(x - 200, y - 200, w + 400, h + 400)
    ctx.fill()
    ctx.restore()
    ctx.restore()


# ------------------------------------------------------------------ surface helpers
def surface():
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    return s, cairo.Context(s)


def to_rgb(s):
    s.flush()
    return np.ndarray((H, W, 4), np.uint8, s.get_data())[..., [2, 1, 0]].copy()
