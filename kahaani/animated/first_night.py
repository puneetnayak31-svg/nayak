"""Animated sequence: "IPL की पहली रात" (master 7:51.4 – 8:46.5), told with characters instead of text.

Vikrant's voice runs underneath, unchanged. He shrinks into a circular narrator window as the animation
opens and grows back to full frame at the end, just before the Nova Ghee L-band (8:44.88) — which stays untouched.

Beats (source seconds → what we see):
  472.2  "चिन्नास्वामी स्टेडियम…"      the stadium in the dark; floodlights clunk on, tower by tower
  475.3  "बैंगलोर और कोलकाता"          red-gold flags rise on one side, black-gold on the other
  477.5  "कप्तान राहुल द्रविड़… सौरव गांगुली" two captains walk to the pitch; the coin goes up
  483.8  "सौरव गांगुली और ब्रेंडन मैकलम ओपन…" the openers walk out — a spotlight follows Ganguly, McCullum walks in shadow
  492.8  "नंबर तीन… रिकी पोंटिंग"         a second spotlight finds Ponting waiting at the boundary
  495.6  "ध्यान सौरव और रिकी पर"         broadcast cameras swing to the two stars; McCullum stays dark
  501.6  "सौरव गांगुली ने 10 रन बनाए"     Ganguly drives, gets his 10, walks off; the light leaves with him
  504.7  "लेकिन ब्रेंडन मैकलम…"          the light slams onto McCullum
  505.4  "आगाज़ इस तरह से किया…"         he swings — the ball climbs into the night and bursts into fireworks
  508.0  "बस पटाखे ही फोड़ते रहे"         more swings, more fireworks over the crowd
  510.7  "222 रन… 158 अकेले मैकलम"       the sparks gather into 222; 158 worth of them turn gold
  515.3  "10 दादा के… 20 पोंटिंग… "        three players on columns of their runs: 10, 20 — and McCullum's 158 towers
  519.0  "10 चौके… 13 छक्के"              ten balls race to the rope, thirteen sail into the night
  520.6  "रोंगटे खड़े हो जाते हैं"          the whole stadium under fireworks; back to Vikrant
"""
import math
import os
import random
import subprocess
import sys

import cairo
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import gfx  # noqa: E402  (video io + matte)
from rig import (BACKLIFT, BASE, CELEBRATE, FOLLOW, FPS, GOLD, GRASS_A, GRASS_B, H, IMPACT, KKR, KKR2, LIME, PAD,  # noqa: E402
                 PITCH, RCB, STANCE, W, Burst, Crowd, clamp, ease, ease_out, figure, flood_tower, glow, hexc,
                 keyframes, kf, lerp, new_surface, prog, sky, stars, swing_pose, tag, to_rgb, walk)

T0, T1 = 472.2, 524.85          # animation window on the source timeline
PIP_OUT = (471.6, 472.6)        # Vikrant shrinks into the narrator window
PIP_IN = (523.85, 524.85)       # …and grows back
INSERT = (504.8, 508.76)        # the master cuts to a photo here: hide the narrator window
RCB_FLAG, KKR_FLAG = hexc("C8102E"), hexc("D9B44A")
RCB_CAP = hexc("B3122C")
KKR_CAP = hexc("17151C")
BALL = hexc("F4F1EA")

# ------------------------------------------------------------------ world: stadium (wide)
_wide_crowd = None


def wide_crowd():
    global _wide_crowd
    if _wide_crowd is None:
        rows = []
        for i in range(9):
            y = 520 + i * 26
            half = 980 + i * 40
            rows.append((960 - half, 960 + half, y, 9 + i * 1.6))
        _wide_crowd = Crowd(rows, seed=4, flag_cols=(RCB_FLAG, KKR_FLAG, 960), density=0.85)
    return _wide_crowd


def stadium_wide(ctx, t, lights, energy, flags, flash, cam=1.0, fireworks=()):
    ctx.save()
    ctx.translate(960, 640)
    ctx.scale(cam, cam)
    ctx.translate(-960, -640)
    sky(ctx, lights)
    stars(ctx, t, 1 - 0.7 * lights)
    for b in fireworks:
        b.draw(ctx, t)
    # far stand / roof line
    ctx.set_source_rgba(0.04, 0.05, 0.08, 1)
    ctx.move_to(-200, 560)
    ctx.curve_to(400, 470, 1520, 470, 2120, 560)
    ctx.line_to(2120, 1200)
    ctx.line_to(-200, 1200)
    ctx.fill()
    towers = []
    for x, top, base in ((330, 170, 560), (1590, 170, 560)):
        on = clamp((lights - (0 if x < 960 else 0.25)) * 2.2)
        towers.append(flood_tower(ctx, x, base, top, on, t))
    wide_crowd().draw(ctx, t, energy=energy, lit=0.25 + 0.6 * lights, flash=flash, flag_on=flags)
    # field
    ctx.save()
    ctx.translate(960, 980)
    ctx.scale(1, 0.30)
    g = cairo.RadialGradient(0, 0, 50, 0, 0, 900)
    lit = 0.25 + 0.75 * lights
    g.add_color_stop_rgba(0, GRASS_B[0] * lit * 1.4, GRASS_B[1] * lit * 1.4, GRASS_B[2] * lit * 1.4, 1)
    g.add_color_stop_rgba(1, GRASS_A[0] * lit, GRASS_A[1] * lit, GRASS_A[2] * lit, 1)
    ctx.set_source(g)
    ctx.arc(0, 0, 900, 0, 2 * math.pi)
    ctx.fill()
    ctx.arc(0, 0, 900, 0, 2 * math.pi)
    ctx.clip()
    for i in range(-9, 10, 2):           # mowing stripes
        ctx.set_source_rgba(1, 1, 1, 0.035 * lit)
        ctx.rectangle(i * 100, -900, 100, 1800)
        ctx.fill()
    ctx.restore()
    ctx.set_source_rgba(PITCH[0] * lit, PITCH[1] * lit, PITCH[2] * lit, 1)   # pitch
    ctx.move_to(930, 900)
    ctx.line_to(990, 900)
    ctx.line_to(1000, 1060)
    ctx.line_to(920, 1060)
    ctx.fill()
    for x, y in towers:              # light spill on the field
        if lights > 0:
            glow(ctx, 960, 980, 700, (1, 0.97, 0.88, 1), 0.18 * lights)
    ctx.restore()


# ------------------------------------------------------------------ world: field level (side-on)
_side_crowd = None


def side_crowd():
    global _side_crowd
    if _side_crowd is None:
        rows = [(-300, 2300, 330 + i * 40, 14 + i * 3.2) for i in range(7)]
        _side_crowd = Crowd(rows, seed=9, flag_cols=(RCB_FLAG, KKR_FLAG, 900), density=0.9)
    return _side_crowd


def field_side(ctx, t, energy=0.4, flash=0.0, lights=1.0, dim=0.0):
    sky(ctx, 0.8)
    stars(ctx, t, 0.3)
    for x in (260, 1660):
        flood_tower(ctx, x, 330, 40, 1.0, t)
    ctx.set_source_rgba(0.05, 0.06, 0.09, 1)              # stand
    ctx.rectangle(-300, 300, 2600, 330)
    ctx.fill()
    side_crowd().draw(ctx, t, energy=energy, lit=0.55, flash=flash)
    # advertising boards: blank lit panels (no brands)
    for i in range(-2, 16):
        c = (0.10, 0.14, 0.12) if i % 2 else (0.13, 0.11, 0.16)
        ctx.set_source_rgba(*c, 1)
        ctx.rectangle(i * 160, 618, 156, 44)
        ctx.fill()
        ctx.set_source_rgba(*LIME[:3], 0.18)
        ctx.rectangle(i * 160, 618, 156, 3)
        ctx.fill()
    # grass with perspective bands
    g = cairo.LinearGradient(0, 662, 0, H)
    g.add_color_stop_rgba(0, *GRASS_A[:3], 1)
    g.add_color_stop_rgba(1, GRASS_B[0] * 1.15, GRASS_B[1] * 1.15, GRASS_B[2] * 1.15, 1)
    ctx.set_source(g)
    ctx.rectangle(-300, 662, 2600, H)
    ctx.fill()
    y = 662
    k = 0
    while y < H + 200:
        h = 14 + (y - 662) * 0.22
        if k % 2:
            ctx.set_source_rgba(1, 1, 1, 0.035)
            ctx.rectangle(-300, y, 2600, h)
            ctx.fill()
        y += h
        k += 1
    # boundary rope
    ctx.set_source_rgba(0.9, 0.9, 0.9, 0.55)
    ctx.set_line_width(3)
    ctx.move_to(-300, 690)
    ctx.line_to(2300, 690)
    ctx.stroke()
    # pitch strip with creases and stumps
    ctx.set_source_rgba(*PITCH[:3], 1)
    ctx.move_to(250, 905)
    ctx.line_to(1670, 905)
    ctx.line_to(1700, 975)
    ctx.line_to(220, 975)
    ctx.fill()
    ctx.set_source_rgba(1, 1, 1, 0.7)
    ctx.set_line_width(3)
    for x in (430, 1490):
        ctx.move_to(x, 905)
        ctx.line_to(x - 8, 975)
    ctx.stroke()
    for x in (360, 1560):
        stumps(ctx, x, 940)
    glow(ctx, 960, 900, 1000, (1, 0.97, 0.88, 1), 0.10)
    if dim > 0:
        ctx.set_source_rgba(0, 0, 0.02, dim)
        ctx.paint()


def stumps(ctx, x, y):
    ctx.set_source_rgba(0.93, 0.9, 0.82, 1)
    for i in range(3):
        ctx.rectangle(x - 9 + i * 8, y - 86, 4, 86)
    ctx.fill()
    ctx.set_source_rgba(0.85, 0.7, 0.3, 1)
    ctx.rectangle(x - 11, y - 90, 24, 4)
    ctx.fill()


def spotlight_layer(ctx, spots, darkness):
    """Darken everything except soft pools of light; spots = [(x, y, r, a)]. Also draws beams from above."""
    if darkness <= 0:
        return
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    c = cairo.Context(surf)
    c.set_source_rgba(0.0, 0.01, 0.03, darkness)
    c.paint()
    c.set_operator(cairo.OPERATOR_DEST_OUT)
    for (x, y, r, a) in spots:
        if a <= 0:
            continue
        c.save()
        c.translate(x, y)
        c.scale(1, 1.6)
        g = cairo.RadialGradient(0, 0, r * 0.15, 0, 0, r)
        g.add_color_stop_rgba(0, 0, 0, 0, a)
        g.add_color_stop_rgba(1, 0, 0, 0, 0)
        c.set_source(g)
        c.arc(0, 0, r, 0, 2 * math.pi)
        c.fill()
        c.restore()
    ctx.set_source_surface(surf, 0, 0)
    ctx.paint()
    ctx.save()
    ctx.set_operator(cairo.OPERATOR_ADD)
    for (x, y, r, a) in spots:
        if a <= 0:
            continue
        g = cairo.LinearGradient(x, -100, x, y + 80)
        g.add_color_stop_rgba(0, 1, 0.96, 0.85, 0.0)
        g.add_color_stop_rgba(0.8, 1, 0.96, 0.85, 0.10 * a)
        g.add_color_stop_rgba(1, 1, 0.96, 0.85, 0.0)
        ctx.set_source(g)
        ctx.move_to(x - 30, -100)
        ctx.line_to(x + 30, -100)
        ctx.line_to(x + r * 0.8, y + 80)
        ctx.line_to(x - r * 0.8, y + 80)
        ctx.fill()
    ctx.restore()


def tv_camera(ctx, x, y, aim, s=1.0, tally=False):
    """Silhouette of a broadcast camera on a tripod, rotated to aim (degrees, 0 = facing right)."""
    ctx.save()
    ctx.translate(x, y)
    ctx.set_source_rgba(0.02, 0.02, 0.03, 1)
    ctx.set_line_width(7 * s)
    for dx in (-60, 0, 60):
        ctx.move_to(0, 0)
        ctx.line_to(dx * s, 200 * s)
    ctx.stroke()
    ctx.rotate(math.radians(aim))
    ctx.rectangle(-70 * s, -55 * s, 130 * s, 70 * s)
    ctx.fill()
    ctx.rectangle(60 * s, -45 * s, 120 * s, 50 * s)   # lens
    ctx.fill()
    ctx.arc(185 * s, -20 * s, 30 * s, 0, 2 * math.pi)
    ctx.fill()
    if tally:
        ctx.set_source_rgba(1, 0.1, 0.1, 1)
        ctx.arc(-50 * s, -70 * s, 9 * s, 0, 2 * math.pi)
        ctx.fill()
        glow(ctx, -50 * s, -70 * s, 40 * s, (1, 0.1, 0.1, 1), 0.8)
    ctx.restore()


def ball(ctx, x, y, r=9, trail=None):
    if trail:
        ctx.save()
        ctx.set_operator(cairo.OPERATOR_ADD)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        for i, (px, py) in enumerate(trail):
            a = (i + 1) / len(trail)
            ctx.set_source_rgba(1, 0.95, 0.8, 0.35 * a)
            ctx.set_line_width(r * 1.6 * a)
            if i:
                ctx.move_to(*trail[i - 1])
                ctx.line_to(px, py)
                ctx.stroke()
        ctx.restore()
    ctx.set_source_rgba(*BALL[:3], 1)
    ctx.arc(x, y, r, 0, 2 * math.pi)
    ctx.fill()
    glow(ctx, x, y, r * 4, (1, 1, 1, 1), 0.5)


def number(ctx, x, y, text, size, color, alpha=1.0, anchor="center"):
    if alpha <= 0:
        return
    ctx.save()
    ctx.select_font_face("DejaVu Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(size)
    e = ctx.text_extents(text)
    px = x - e.width / 2 - e.x_bearing if anchor == "center" else x
    ctx.move_to(px, y)
    ctx.text_path(text)
    ctx.set_source_rgba(0, 0, 0, 0.5 * alpha)
    ctx.set_line_width(6)
    ctx.stroke_preserve()
    ctx.set_source_rgba(*color[:3], alpha)
    ctx.fill()
    ctx.restore()


# ------------------------------------------------------------------ scenes
def sc_establish(ctx, t):
    """472.2–477.5: lights come on; the two halves of the crowd show their colours."""
    lt = t - 472.2
    lights = ease(prog(lt, 0.2, 2.2))
    flags = ease_out(prog(t, 475.2, 476.2))
    cam = lerp(1.0, 1.12, ease(prog(lt, 0, 5.3)))
    stadium_wide(ctx, t, lights, energy=0.25 + 0.35 * flags, flags=flags, flash=0.4 * lights, cam=cam)


def sc_toss(ctx, t):
    """477.5–483.8: the captains walk out, the coin goes up, RCB choose to field."""
    lt = t - 477.5
    field_side(ctx, t, energy=0.35, flash=0.3)
    ctx.save()
    ctx.translate(960, 980)
    ctx.scale(1.25, 1.25)
    ctx.translate(-960, -980)
    meet = ease(prog(lt, 0, 1.8))
    xa = lerp(300, 840, meet)          # Dravid (RCB) from the left
    xb = lerp(1620, 1080, meet)        # Ganguly (KKR) from the right
    pa = walk(lt * 7.5, carry=False) if meet < 1 else dict(BASE)
    pb = walk(lt * 7.5 + 1.5, carry=False) if meet < 1 else dict(BASE)
    if t > 482.0:                       # Dravid gestures: "we'll bowl"
        pa = keyframes(t, [(482.0, dict(BASE)), (482.35, dict(BASE, armF=120, elbF=10)), (483.2, dict(BASE, armF=120, elbF=10)),
                           (483.6, dict(BASE))])
    kitA = dict(RCB, bat=False)
    kitB = dict(KKR2, bat=False)
    figure(ctx, xa, 940, dict(pa, batOn=0), kitA, s=0.95, facing=1, helmet=False, cap=RCB_CAP, pads=False)
    fb = figure(ctx, xb, 940, dict(pb, batOn=0, armF=kf(t, [(480.6, 8), (480.8, 120), (481.1, 30)]) if t > 480.5 else pb["armF"]),
                kitB, s=0.95, facing=-1, helmet=False, cap=KKR_CAP, pads=False)
    tag(ctx, xa, 640, "DRAVID", ease_out(prog(t, 479.3, 479.6)))
    tag(ctx, xb, 640, "GANGULY", ease_out(prog(t, 480.2, 480.5)))
    # the coin
    if 480.8 <= t < 481.9:
        c = prog(t, 480.8, 481.9)
        cx = lerp(fb["hand"][0], 960, c)
        cy = fb["hand"][1] - math.sin(c * math.pi) * 330
        spin = abs(math.cos(t * 40))
        ctx.save()
        ctx.translate(cx, cy)
        ctx.scale(1, max(0.08, spin))
        ctx.set_source_rgba(*GOLD[:3], 1)
        ctx.arc(0, 0, 13, 0, 2 * math.pi)
        ctx.fill()
        ctx.restore()
        glow(ctx, cx, cy, 50, GOLD, 0.6)
    elif t >= 481.9:
        ctx.save()
        ctx.translate(960, 955)
        ctx.scale(1, 0.35)
        ctx.set_source_rgba(*GOLD[:3], 1)
        ctx.arc(0, 0, 13, 0, 2 * math.pi)
        ctx.fill()
        ctx.restore()
    ctx.restore()


GANGULY_POS, MAC_POS, PONTING_POS = (1420, 960), (470, 960), (150, 700)


def sc_openers(ctx, t):
    """483.8–501.5: the openers walk out; light on Ganguly (and then Ponting), McCullum in the dark."""
    lt = t - 483.8
    cams = ease(prog(t, 494.6, 496.2))
    field_side(ctx, t, energy=0.3, flash=0.0)
    # walk in from the left gate, then take positions
    wg = prog(t, 483.8, 487.6)
    wm = prog(t, 484.6, 488.6)
    gx = lerp(-80, GANGULY_POS[0], ease(wg))
    mx = lerp(-160, MAC_POS[0], ease(wm))
    gp = walk(lt * 7.2) if wg < 1 else (STANCE if t > 489.0 else dict(BASE))
    mp = walk(lt * 7.2 + 2) if wm < 1 else keyframes(t, [(498.4, dict(BASE)), (498.8, dict(BASE, armF=60, elbF=30, bat=90)),
                                                         (499.3, dict(BASE, armF=-20, elbF=10, bat=-30)), (499.8, dict(BASE))])
    gfacing = 1 if wg < 1 else -1
    # Ponting waits at the boundary, padded up
    pp = keyframes(t, [(492.6, dict(BASE)), (493.2, dict(BASE, armF=30, bat=40)), (493.8, dict(BASE))])
    figure(ctx, PONTING_POS[0], PONTING_POS[1], pp, KKR, s=0.58, facing=1)
    figure(ctx, mx, MAC_POS[1], mp, KKR, s=1.0, facing=1)
    figure(ctx, gx, GANGULY_POS[1], gp, KKR2, s=1.0, facing=gfacing)
    # broadcast cameras swing to the two stars
    if t > 494.4:
        tv_camera(ctx, 1760, 860, lerp(-30, -170, cams), s=0.9, tally=cams > 0.95)
        tv_camera(ctx, 470, 860, lerp(10, -60, cams), s=0.8, tally=cams > 0.95)
    darkness = 0.72
    spots = [(gx, GANGULY_POS[1] - 130, 230, 1.0),
             (PONTING_POS[0], PONTING_POS[1] - 80, 140, ease_out(prog(t, 492.8, 493.3))),
             (mx, MAC_POS[1] - 130, 200, 0.12)]
    spotlight_layer(ctx, spots, darkness)
    side_crowd()  # flashes aimed at Ganguly from the stands
    if t > 495.6:
        for i in range(6):
            ph = (t * 3.1 + i * 0.37) % 1
            if ph < 0.08:
                glow(ctx, 600 + i * 230, 360 + (i % 3) * 60, 60, (1, 1, 1, 1), 1 - ph / 0.08)
    tag(ctx, gx, GANGULY_POS[1] - 330, "GANGULY", ease_out(prog(t, 484.0, 484.4)) * (1 - prog(t, 500.8, 501.3)))
    tag(ctx, mx, MAC_POS[1] - 330, "McCULLUM", 0.55 * ease_out(prog(t, 484.7, 485.1)) * (1 - prog(t, 500.8, 501.3)),
        color=(0.75, 0.75, 0.75))
    tag(ctx, PONTING_POS[0] + 20, PONTING_POS[1] - 200, "PONTING", ease_out(prog(t, 492.8, 493.2)) * (1 - prog(t, 500.8, 501.3)),
        size=18)


def sc_ganguly(ctx, t):
    """501.5–504.6: Ganguly gets his 10 and walks off; the light goes with him."""
    field_side(ctx, t, energy=0.4)
    ctx.save()
    ctx.translate(1300, 980)
    ctx.scale(1.35, 1.35)
    ctx.translate(-1300, -980)
    leave = prog(t, 503.8, 504.6)
    if t < 503.8:
        pose = keyframes(t, [(501.5, STANCE), (502.0, STANCE), (502.25, BACKLIFT), (502.45, IMPACT), (502.9, IMPACT),
                             (503.4, STANCE)])
        gx, facing = GANGULY_POS[0], -1
    else:
        pose = walk((t - 503.8) * 7.5)
        gx, facing = lerp(GANGULY_POS[0], 1900, ease(leave)), 1
    figure(ctx, gx, 960, pose, KKR2, s=1.0, facing=facing)
    if 501.8 < t < 502.45:                       # ball arrives
        b = prog(t, 501.8, 502.45)
        ball(ctx, lerp(500, GANGULY_POS[0] - 100, b), 900 + math.sin(b * math.pi) * -60 + b * 20, 8)
    if 502.45 <= t < 503.2:                      # driven along the ground
        b = ease_out(prog(t, 502.45, 503.2))
        ball(ctx, lerp(GANGULY_POS[0] - 100, 200, b), 925, 8, trail=[(lerp(GANGULY_POS[0] - 100, 200, max(0, b - k * 0.03)), 925) for k in range(6, 0, -1)])
    ctx.restore()
    spotlight_layer(ctx, [(lerp(1300, 1300 + (1900 - GANGULY_POS[0]) * 1.35, ease(leave)), 860, 260, 1 - leave * 0.6)],
                    0.72 + 0.2 * leave)
    number(ctx, 1300, 420, "10", 120, GOLD, ease_out(prog(t, 503.2, 503.45)) * (1 - prog(t, 504.1, 504.5)))


_bursts = None


def bursts():
    global _bursts
    if _bursts is None:
        R = random.Random(11)
        cols = [GOLD, hexc("FFFFFF"), hexc("D9B44A"), hexc("F7E7B0"), hexc("9FE35A")]
        b = [Burst(980, 300, 506.75, GOLD, n=150, speed=520, seed=1, rise_from=(1200, 1100), rise=0.45)]
        for i, tt in enumerate((508.05, 508.35, 508.7, 509.0, 509.35, 509.75, 510.1)):
            b.append(Burst(R.uniform(350, 1570), R.uniform(170, 420), tt, cols[i % len(cols)], n=120,
                           speed=R.uniform(380, 520), seed=10 + i, rise_from=(R.uniform(500, 1400), 1100), rise=0.4))
        _bursts = b
    return _bursts


def sc_mccullum(ctx, t):
    """504.6–510.5: the light slams onto McCullum; every lofted hit becomes fireworks."""
    if t < 506.3 or 507.2 <= t < 507.9:
        # batter close-up, side-on, facing left
        field_side(ctx, t, energy=0.5 + 0.5 * (t > 507.2), flash=0.6)
        ctx.save()
        ctx.translate(1100, 980)
        ctx.scale(1.6, 1.6)
        ctx.translate(-1100, -980)
        t_sw = 505.4 if t < 506.3 else 507.2
        pose = STANCE if t < t_sw else swing_pose(t, t_sw)
        figure(ctx, 1100, 960, pose, KKR, s=1.0, facing=-1, glow=(1, 0.92, 0.7, 0.35))
        contact = t_sw + 0.45
        if t_sw - 0.4 < t < contact:
            b = prog(t, t_sw - 0.4, contact)
            ball(ctx, lerp(300, 1010, b), lerp(860, 880, b), 7)
        if t >= contact:
            b = prog(t, contact, contact + 0.5)
            pts = [(lerp(1010, 300, max(0, b - k * 0.04)), lerp(870, -200, max(0, b - k * 0.04))) for k in range(8, 0, -1)]
            ball(ctx, lerp(1010, 300, b), lerp(870, -200, b), 8, trail=pts)
        ctx.restore()
        snap = prog(t, 504.65, 504.75)
        spotlight_layer(ctx, [(1100, 760, 380, 1.0)], lerp(0.95, 0.55, snap) if t < 506.3 else 0.45)
        if 504.7 <= t < 504.9:
            ctx.set_source_rgba(1, 1, 0.95, 0.6 * (1 - prog(t, 504.7, 504.9)))
            ctx.paint()
        tag(ctx, 1100, 360, "McCULLUM", ease_out(prog(t, 504.75, 505.1)) * (1 - prog(t, 506.0, 506.3)))
        return
    # the sky over the stadium: fireworks
    energy = 0.6 + 0.4 * prog(t, 507.9, 509.0)
    stadium_wide(ctx, t, 1.0, energy=energy, flags=1.0, flash=0.9, cam=1.18, fireworks=bursts())


_spark_targets = None


def spark_targets():
    """Points inside the glyphs '222' — the sparks gather into the score."""
    global _spark_targets
    if _spark_targets is None:
        from PIL import Image, ImageDraw, ImageFont
        f = ImageFont.truetype(os.path.join(gfx.FONTS, "Anton-400.ttf"), 420)
        im = Image.new("L", (W, H), 0)
        d = ImageDraw.Draw(im)
        l, tp, r, b = d.textbbox((0, 0), "222", font=f)
        d.text(((W - (r - l)) // 2 - l, 300 - tp), "222", font=f, fill=255)
        ys, xs = np.nonzero(np.asarray(im)[::7, ::7])
        R = random.Random(5)
        pts = [(x * 7 + R.uniform(-2, 2), y * 7 + R.uniform(-2, 2)) for x, y in zip(xs, ys)]
        R.shuffle(pts)
        _spark_targets = pts[:900]
    return _spark_targets


def sc_score(ctx, t):
    """510.5–515.0: sparks fall into 222; 158 runs' worth of them turn gold (71%)."""
    stadium_wide(ctx, t, 1.0, energy=0.6, flags=1.0, flash=0.4, cam=1.18)
    ctx.set_source_rgba(0, 0.01, 0.03, 0.55)
    ctx.paint()
    pts = spark_targets()
    R = random.Random(8)
    n = len(pts)
    gold_n = int(n * 158 / 222)
    gather = ease(prog(t, 510.55, 511.5))
    goldify = ease_out(prog(t, 512.7, 513.3))
    ctx.save()
    ctx.set_operator(cairo.OPERATOR_ADD)
    for i, (tx, ty) in enumerate(pts):
        sx, sy = R.uniform(200, 1720), R.uniform(80, 500)
        d = clamp(gather * 1.3 - (i / n) * 0.3)
        x, y = lerp(sx, tx, ease(d)), lerp(sy, ty, ease(d))
        tw = 0.65 + 0.35 * math.sin(t * 9 + i)
        is_gold = i < gold_n
        if is_gold:
            col = (lerp(0.95, GOLD[0], goldify), lerp(0.95, GOLD[1], goldify), lerp(0.92, GOLD[2], goldify))
            a = tw * (0.85 + 0.15 * goldify)
        else:
            col = (0.85, 0.87, 0.9)
            a = tw * lerp(0.85, 0.35, goldify)
        ctx.set_source_rgba(*col, a)
        ctx.arc(x, y, 3.4 if is_gold and goldify > 0 else 3.0, 0, 2 * math.pi)
        ctx.fill()
    ctx.restore()
    if goldify > 0:
        glow(ctx, 960, 470, 700, GOLD, 0.15 * goldify)
    # McCullum, small, raising the bat beneath his score
    if t > 514.0:
        pose = keyframes(t, [(514.0, dict(BASE)), (514.5, CELEBRATE)])
        figure(ctx, 960, 1040, pose, KKR, s=0.55, facing=1, glow=(1, 0.85, 0.4, 0.5))


def sc_columns(ctx, t):
    """515.0–518.9: three players on columns as tall as their runs — 10, 20, 158."""
    g = cairo.LinearGradient(0, 0, 0, H)
    g.add_color_stop_rgba(0, 0.02, 0.03, 0.06, 1)
    g.add_color_stop_rgba(1, 0.06, 0.08, 0.12, 1)
    ctx.set_source(g)
    ctx.paint()
    stars(ctx, t, 0.5)
    base = 1010
    k = 3.6                                  # px per run
    cols = [(560, 10, 515.3, KKR2, "GANGULY"), (960, 20, 516.3, KKR, "PONTING"), (1360, 158, 518.1, KKR, "McCULLUM")]
    for x, runs, at, kit, name in cols:
        p = ease_out(prog(t, at, at + (0.4 if runs < 100 else 0.75)))
        h = runs * k * p
        # column
        gcol = cairo.LinearGradient(x - 90, 0, x + 90, 0)
        c = GOLD if runs > 100 else (0.75, 0.78, 0.8, 1)
        gcol.add_color_stop_rgba(0, c[0] * 0.55, c[1] * 0.55, c[2] * 0.55, 1)
        gcol.add_color_stop_rgba(0.5, c[0], c[1], c[2], 1)
        gcol.add_color_stop_rgba(1, c[0] * 0.45, c[1] * 0.45, c[2] * 0.45, 1)
        ctx.set_source(gcol)
        ctx.rectangle(x - 90, base - h, 180, h)
        ctx.fill()
        if p > 0:
            figure(ctx, x, base - h, CELEBRATE if (runs > 100 and p >= 1) else dict(BASE), kit, s=0.62, facing=1,
                   alpha=min(1, p * 3), glow=(1, 0.9, 0.6, 0.35) if runs > 100 else None)
            number(ctx, x, base + 0 - 12 if h < 70 else base - 18, str(int(round(runs * p))), 46 if h < 70 else 60,
                   (0.08, 0.08, 0.08, 1) if h >= 70 else (1, 1, 1, 1), alpha=min(1, p * 2), )
            if h < 70:
                number(ctx, x, base - h - 260, "", 1, (1, 1, 1, 1))
        tag(ctx, x, 1066, name, min(1, p * 2), size=18)


def sc_boundaries(ctx, t):
    """518.9–520.6: ten fours race to the rope, thirteen sixes sail into the night."""
    field_side(ctx, t, energy=0.9, flash=0.8)
    for i in range(10):                     # fours along the ground
        t0 = 519.0 + i * 0.06
        b = prog(t, t0, t0 + 0.35)
        if 0 < b < 1:
            y = 760 + i * 22
            x = lerp(1500, -60, ease_out(b))
            ball(ctx, x, y, 8, trail=[(lerp(1500, -60, ease_out(max(0, b - k * 0.05))), y) for k in range(6, 0, -1)])
    for i in range(13):                     # sixes into the sky
        t0 = 519.8 + i * 0.045
        b = prog(t, t0, t0 + 0.6)
        if 0 < b < 1:
            sx = 1450
            ex = 100 + i * 120
            x = lerp(sx, ex, b)
            y = 900 - math.sin(b * math.pi * 0.9) * (700 + i * 15) - b * 200
            ball(ctx, x, y, 7, trail=[(lerp(sx, ex, max(0, b - k * 0.03)),
                                       900 - math.sin(max(0, b - k * 0.03) * math.pi * 0.9) * (700 + i * 15) - max(0, b - k * 0.03) * 200)
                                      for k in range(6, 0, -1)])
    figure(ctx, 1500, 960, FOLLOW, KKR, s=1.0, facing=-1, glow=(1, 0.9, 0.7, 0.3))
    # tally pips: ten white, thirteen gold
    for i in range(10):
        a = ease_out(prog(t, 519.0 + i * 0.06, 519.1 + i * 0.06))
        ctx.set_source_rgba(1, 1, 1, a)
        ctx.arc(120 + i * 30, 120, 9, 0, 2 * math.pi)
        ctx.fill()
    for i in range(13):
        a = ease_out(prog(t, 519.8 + i * 0.045, 519.9 + i * 0.045))
        ctx.set_source_rgba(*GOLD[:3], a)
        ctx.arc(120 + i * 30, 160, 9, 0, 2 * math.pi)
        ctx.fill()
    number(ctx, 120 + 10 * 30 + 10, 130, "4s", 30, (1, 1, 1, 1), ease_out(prog(t, 519.0, 519.3)), anchor="left")
    number(ctx, 120 + 13 * 30 + 10, 170, "6s", 30, GOLD, ease_out(prog(t, 519.8, 520.1)), anchor="left")


_finale = None


def sc_finale(ctx, t):
    """520.6–524.85: the whole stadium under fireworks — goosebumps."""
    global _finale
    if _finale is None:
        R = random.Random(21)
        cols = [GOLD, hexc("FFFFFF"), hexc("F7E7B0"), hexc("D9B44A")]
        _finale = [Burst(R.uniform(250, 1670), R.uniform(140, 420), 520.4 + i * 0.32, cols[i % 4], n=100,
                         speed=R.uniform(360, 500), seed=40 + i, rise_from=(R.uniform(400, 1500), 1100), rise=0.45)
                   for i in range(13)]
    cam = lerp(1.0, 1.15, ease(prog(t, 520.6, 524.85)))
    stadium_wide(ctx, t, 1.0, energy=1.0, flags=1.0, flash=1.0, cam=cam, fireworks=_finale)
    ctx.save()
    ctx.translate(960, 640)
    ctx.scale(cam, cam)
    ctx.translate(-960, -640)
    figure(ctx, 960, 1000, CELEBRATE, KKR, s=0.32, facing=1, glow=(1, 0.85, 0.4, 0.7))
    ctx.restore()


SCENES = [(472.2, 477.5, sc_establish), (477.5, 483.8, sc_toss), (483.8, 501.5, sc_openers),
          (501.5, 504.6, sc_ganguly), (504.6, 510.5, sc_mccullum), (510.5, 515.0, sc_score),
          (515.0, 518.9, sc_columns), (518.9, 520.6, sc_boundaries), (520.6, 524.9, sc_finale)]


def draw_animation(t):
    s, ctx = new_surface()
    for a, b, fn in SCENES:
        if a <= t < b:
            fn(ctx, t)
            break
    arr = to_rgb(s)
    arr = gfx.grain(arr, int(t * FPS), 5)
    return gfx.vignette(arr, 0.35)


# ------------------------------------------------------------------ narrator window (Vikrant)
PIP_C, PIP_R = (190, H - 190), 135


def pip_amount(t):
    """0 = Vikrant full frame, 1 = small narrator window."""
    if t < PIP_OUT[0]:
        return 0.0
    if t < PIP_OUT[1]:
        return ease(prog(t, *PIP_OUT))
    if t < PIP_IN[0]:
        return 1.0
    return 1 - ease(prog(t, *PIP_IN))


def composite(src, anim, t):
    """Circle-iris between the presenter and the animation; the circle becomes the narrator window."""
    import cv2
    k = pip_amount(t)
    if k <= 0:
        return src
    hide = 0.0
    if INSERT[0] - 0.3 < t < INSERT[1] + 0.3:
        hide = min(prog(t, INSERT[0] - 0.3, INSERT[0]), 1 - prog(t, INSERT[1], INSERT[1] + 0.3))
    # source crop morphs from the full frame to a square around his head and shoulders
    sx, sy = lerp(0, 640, k), lerp(0, 10, k)
    sw, sh = lerp(W, 640, k), lerp(H, 640, k)
    scale = lerp(1.0, (PIP_R * 2) / 640, k)
    dw, dh = max(2, int(sw * scale)), max(2, int(sh * scale))
    cx, cy = lerp(W / 2, PIP_C[0], k), lerp(H / 2, PIP_C[1], k)
    crop = src[int(sy):int(sy + sh), int(sx):int(sx + sw)]
    pres = cv2.resize(crop, (dw, dh), interpolation=cv2.INTER_AREA)
    x0, y0 = int(cx - dw / 2), int(cy - dh / 2)
    layer = np.zeros_like(anim)
    lm = np.zeros((H, W), np.float32)
    X0, Y0, X1, Y1 = max(x0, 0), max(y0, 0), min(x0 + dw, W), min(y0 + dh, H)
    if X1 > X0 and Y1 > Y0:
        layer[Y0:Y1, X0:X1] = pres[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]
        lm[Y0:Y1, X0:X1] = 1
    r = lerp(math.hypot(dw, dh) / 2 + 2, min(dw, dh) / 2, ease(k))
    yy, xx = np.ogrid[:H, :W]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    m = (np.clip(r - d + 1, 0, 1) * lm * (1 - hide)).astype(np.float32)
    ring = (np.clip(1 - np.abs(d - r - 3) / 3, 0, 1) * prog(k, 0.6, 1.0) * (1 - hide)).astype(np.float32)
    out = anim.astype(np.float32) * (1 - m[..., None]) + layer.astype(np.float32) * m[..., None]
    lime = np.array(LIME[:3], np.float32) * 255
    out = out * (1 - ring[..., None]) + lime * ring[..., None]
    return out.astype(np.uint8)


# ------------------------------------------------------------------ render
def main():
    src, out = sys.argv[1], sys.argv[2]
    t0 = float(sys.argv[3]) if len(sys.argv) > 3 else 471.0
    t1 = float(sys.argv[4]) if len(sys.argv) > 4 else 526.5
    sfx = sys.argv[5] if len(sys.argv) > 5 else None
    stills = os.environ.get("STILLS")
    if stills:
        from PIL import Image
        for s in [float(x) for x in stills.split(",")]:
            fr = next(iter(gfx.Reader(src, s, s + 0.05)))
            anim = draw_animation(min(max(s, T0), T1 - 0.01))
            Image.fromarray(composite(fr, anim, s)).save(f"{out}_{s:07.2f}.png")
            print("still", s, flush=True)
        return
    tmp = out + ".video.mp4"
    w = gfx.Writer(tmp, None)
    for i, fr in enumerate(gfx.Reader(src, t0, t1)):
        t = t0 + i / FPS
        anim = draw_animation(min(max(t, T0), T1 - 0.01)) if PIP_OUT[0] <= t < PIP_IN[1] else None
        w.write(composite(fr, anim, t) if anim is not None else fr)
        if i % 100 == 0:
            print(f"{t:.1f}", flush=True)
    w.close()
    # audio: the master's voice, plus a quiet effects bed under it
    a_in = ["-ss", f"{t0:.3f}", "-t", f"{t1 - t0:.3f}", "-i", src]
    if sfx:
        cmd = ["ffmpeg", "-v", "error", "-y", "-i", tmp] + a_in + ["-i", sfx, "-filter_complex",
               "[1:a]aresample=48000[v];[2:a]aresample=48000,volume=0.42[f];[v][f]amix=inputs=2:duration=first:normalize=0[a]",
               "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]
    else:
        cmd = ["ffmpeg", "-v", "error", "-y", "-i", tmp] + a_in + ["-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a",
                                                                   "aac", "-b:a", "192k", "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True)
    os.remove(tmp)
    print("done", out)


if __name__ == "__main__":
    main()
