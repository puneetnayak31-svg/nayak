"""Version B: the same segment told through editorial-illustration animation.

Text lives inside the scenes (the stadium's light-bulb board, a calendar), so it reads as part of the world
rather than as graphics laid over it.
"""
import math
import os

import cairo
import cv2
import numpy as np
from PIL import Image, ImageDraw

import common as C
import illus as I
import version_a as A
from common import H, INK, IVORY, NAVY, SAND, W

lerp, prog, ease = I.lerp, I.prog, I.ease


def finish(a, i):
    a = C.grain(a, i, 3.0)
    return C.apply_bug(C.vignette(a, 0.32))


def with_cam(ctx, cam, cx=960, cy=600):
    ctx.translate(cx, cy)
    ctx.scale(cam, cam)
    ctx.translate(-cx, -cy)


# ------------------------------------------------------------------ B1: the trophy, then the board
def dais_scene(t, i):
    s, ctx = I.surface()
    cam = lerp(1.0, 1.06, ease(prog(t, 1288.12, 1291.6)))
    ctx.save()
    with_cam(ctx, cam, 960, 760)
    I.stadium(ctx, t, cam=1.18, focus=(960, 700), energy=0.45)
    # presentation dais
    ctx.set_source_rgba(0.12, 0.13, 0.2, 1)
    ctx.rectangle(560, 860, 800, 24)
    ctx.fill()
    g = cairo.LinearGradient(0, 884, 0, 1080)
    g.add_color_stop_rgba(0, 0.16, 0.18, 0.3, 1)
    g.add_color_stop_rgba(1, 0.06, 0.07, 0.12, 1)
    ctx.set_source(g)
    ctx.rectangle(580, 884, 760, 200)
    ctx.fill()
    I.figure(ctx, 760, 862, I.blend(I.STAND, dict(armF=40, elbF=60, armB=30, elbB=70), prog(t, 1288.5, 1289.0)),
             I.OFFICIAL, s=1.55, facing=1)
    I.figure(ctx, 640, 862, dict(I.STAND, armF=30, elbF=70), I.OFFICIAL, s=1.5, facing=1, light=0.9)
    lift = ease(prog(t, 1288.25, 1289.0))
    pose = I.blend(dict(I.STAND, armF=40, elbF=20), dict(I.STAND, armF=172, elbF=-6, armB=-150, elbB=-10), lift)
    I.figure(ctx, 1020, 862, pose, I.INDIA_85, s=1.6, facing=-1, holds="trophy")
    ctx.restore()
    # press photographers' flashes from the foreground
    for k, tf in enumerate((1288.6, 1288.75, 1289.1, 1289.5, 1289.9, 1290.4)):
        a = 1 - prog(t, tf, tf + 0.18)
        if 0 < a < 1:
            I.light_glow(ctx, 300 + k * 260, 1040 - (k % 2) * 40, 160, a, (1, 1, 1, 1))
    # press silhouettes
    ctx.set_source_rgba(0.02, 0.02, 0.04, 1)
    for k in range(7):
        x = 200 + k * 250
        ctx.arc(x, 1060, 46, 0, 2 * math.pi)
        ctx.fill()
        ctx.rectangle(x - 70, 1080 - 20, 140, 40)
        ctx.fill()
    return I.to_rgb(s)


BOARD_B1 = [(1291.6, ["CHAMPION OF", "CHAMPIONS", "", ""]), (1296.6, ["CHAMPION OF", "CHAMPIONS", "", "RAVI SHASTRI"])]
BOARD_B7 = [(1375.4, ["", "INDIA V", "PAKISTAN", ""]),
            (1380.1, ["20 FEB LEAGUE", "PAK 183", "IND 184/4", "WON BY 6 WKTS"]),
            (1382.2, ["10 MAR FINAL", "PAK 176/9", "IND 177/2", "WON BY 8 WKTS"])]


def board_scene(t, i, states, t_start):
    s, ctx = I.surface()
    cam = lerp(1.0, 1.07, ease(prog(t, t_start, t_start + 8)))
    ctx.save()
    with_cam(ctx, cam, 960, 470)
    I.night_sky(ctx)
    # the stand the board sits on, and its upper tier
    ctx.set_source_rgba(0.05, 0.06, 0.1, 1)
    ctx.rectangle(0, 760, W, 400)
    ctx.fill()
    pts = I.crowd_points("board", [(960, 1500, 1300, 720, math.pi * 1.2, math.pi * 1.8, 2400, 3.4)], 5)
    for (px, py, sz, r, ph) in pts:
        if py < 760:
            continue
        b = 0.3 + 0.4 * r
        ctx.set_source_rgba(lerp(0.25, 0.95, b), lerp(0.25, 0.84, b), lerp(0.3, 0.66, b), 0.6)
        ctx.rectangle(px, py, sz, sz)
        ctx.fill()
    for x, top, lean in ((120, 60, 14), (1800, 60, -14)):
        I.light_tower(ctx, x, 760, top, 0.85, lean)
    ctx.set_source_rgba(0.04, 0.04, 0.07, 1)        # board frame + legs
    ctx.rectangle(470, 700, 30, 80)
    ctx.rectangle(1420, 700, 30, 80)
    ctx.fill()
    I.scoreboard(ctx, 400, 190, 1120, 504, states, t)
    ctx.restore()
    # foreground heads, out of focus
    for k in range(9):
        x = 60 + k * 230 + 40 * math.sin(k * 3.1)
        ctx.set_source_rgba(0.01, 0.01, 0.03, 1)
        ctx.arc(x, 1110, 120, 0, 2 * math.pi)
        ctx.fill()
    return I.to_rgb(s)


def b1(t, src, i):
    if t < 1291.0:
        return finish(dais_scene(t, i), i)
    if t < 1291.8:
        x = ease(prog(t, 1291.0, 1291.8))
        a = dais_scene(t, i)
        b = board_scene(t, i, BOARD_B1, 1291.0)
        # a slow tilt up: the dais drops away as the board comes in from above
        M = np.float32([[1, 0, 0], [0, 1, 260 * x]])
        a = cv2.warpAffine(a, M, (W, H), borderMode=cv2.BORDER_REPLICATE)
        M2 = np.float32([[1, 0, 0], [0, 1, -260 * (1 - x)]])
        b = cv2.warpAffine(b, M2, (W, H), borderMode=cv2.BORDER_REPLICATE)
        return finish(cv2.addWeighted(a, 1 - x, b, x, 0), i)
    if t < 1297.5:
        return finish(board_scene(t, i, BOARD_B1, 1291.0), i)
    out = interview_scene(t, i)
    if t < 1298.2:
        x = ease(prog(t, 1297.5, 1298.2))
        out = cv2.addWeighted(board_scene(t, i, BOARD_B1, 1291.0), 1 - x, out, x, 0)
    return finish(out, i)


# ------------------------------------------------------------------ B2/B3: the car, the interview, the team piles in
CAR_X, CAR_Y, CAR_S = 1270, 1000, 150


def interview_scene(t, i, team_t=None):
    s, ctx = I.surface()
    cam = lerp(1.22, 1.3, ease(prog(t, 1297.5, 1307.0))) if team_t is None else lerp(1.3, 1.2, ease(prog(t, 1316, 1322)))
    ctx.save()
    with_cam(ctx, cam, 930, 960)
    I.stadium(ctx, t, energy=0.35 if team_t is None else 0.55)
    breathe = math.sin(t * 1.7) * 2
    # the interviewer and the Champion of Champions
    talk = 0.5 + 0.5 * math.sin(t * 2.3)
    I.figure(ctx, 470, 1012, dict(I.STAND, armF=58, elbF=48, headTilt=1), I.BLAZER, s=1.62, facing=1, holds="mic")
    shastri_x = 640
    if team_t is not None and t > 1331.1:          # he walks to the driver's door
        shastri_x = lerp(640, 1000, ease(prog(t, 1331.1, 1332.5)))
    if team_t is None or t < 1331.1:
        I.figure(ctx, shastri_x, 1012, dict(I.STAND, armF=lerp(25, 40, talk), elbF=80, armB=-8, headTilt=-1), I.INDIA_85,
                 s=1.66, facing=-1, holds="trophy")
    elif t < 1332.5:
        I.figure(ctx, shastri_x, 1012, I.walk_pose((t - 1331.1) * 7), I.INDIA_85, s=1.66, facing=1)
    # the team: occupants appear in the windows as each one gets in
    occ = 0
    riders = []
    if team_t is not None:
        enter = [1317.7, 1318.6, 1319.6, 1320.7, 1321.4, 1329.7]
        occ = sum(1 for e in enter if t >= e + 0.6)
        if t >= 1332.6:
            occ += 1
    roll = 0.0
    if team_t is not None and t > 1333.2:
        roll = ease(prog(t, 1333.2, 1335.0)) * 220
    I.car(ctx, CAR_X - roll, CAR_Y, CAR_S, facing=-1, occupants=occ)
    if team_t is not None:
        L = 4.79 * CAR_S
        sway = math.sin(t * 6) * 2 * (roll > 0)
        if t > 1324.3:      # on the bonnet
            I.sitter(ctx, CAR_X - roll - 0.36 * L, CAR_Y - 0.86 * CAR_S + sway, 1.2, I.INDIA_85, facing=-1,
                     wave=0.5 + 0.5 * math.sin(t * 3), alpha=ease(prog(t, 1324.3, 1324.8)))
        if t > 1328.4:      # a second one up front
            I.sitter(ctx, CAR_X - roll - 0.25 * L, CAR_Y - 0.9 * CAR_S + sway, 1.15, I.INDIA_85, facing=-1,
                     wave=0.3, alpha=ease(prog(t, 1328.4, 1328.9)))
        if t > 1327.1:      # on the boot
            I.sitter(ctx, CAR_X - roll + 0.38 * L, CAR_Y - 0.84 * CAR_S + sway, 1.15, I.INDIA_85, facing=-1,
                     wave=0.6 + 0.4 * math.sin(t * 2.5), alpha=ease(prog(t, 1327.1, 1327.6)))
        # players walking in from the right
        for k, e in enumerate([1316.6, 1317.2, 1317.9, 1318.8, 1319.6, 1320.3, 1322.8, 1325.8, 1327.0, 1328.6]):
            if t < e - 2.4 or t > e + 0.6:
                continue
            x = lerp(2050, CAR_X + 120 - k * 25, ease(prog(t, e - 2.4, e)))
            a = 1 - prog(t, e, e + 0.6)
            I.figure(ctx, x, 1012 + (k % 3) * 6, I.walk_pose((t - e) * 7.5 + k), I.INDIA_85, s=1.55, facing=-1, alpha=a)
    ctx.restore()
    return I.to_rgb(s)


def b2(t, src, i):
    return finish(interview_scene(t, i), i)


def b3(t, src, i):
    if t < 1334.6:
        return finish(interview_scene(t, i, team_t=t), i)
    out = lap_scene(t, i)
    if t < 1335.2:
        x = ease(prog(t, 1334.6, 1335.2))
        out = cv2.addWeighted(interview_scene(t, i, team_t=t), 1 - x, out, x, 0)
    return finish(out, i)


def lap_scene(t, i):
    """The lap of honour, seen from the stand: the camera follows the car round the boundary."""
    u = ease(prog(t, 1334.8, 1341.0)) * 0.55 + 0.62
    a = 2 * math.pi * u
    cx, cy, rx, ry = 960, 840, 780, 165
    x, y = cx + rx * math.cos(a), cy + ry * math.sin(a)
    dx = -math.sin(a)
    depth = (y - (cy - ry)) / (2 * ry)
    sc = lerp(46, 92, depth)
    s, ctx = I.surface()
    cam = lerp(1.25, 1.32, ease(prog(t, 1334.6, 1341.3)))
    fx = lerp(960, x, 0.85)
    ctx.save()
    with_cam(ctx, cam, fx, 820)
    I.stadium(ctx, t, energy=0.85)
    I.car(ctx, x, y + 6, sc, facing=1 if dx > 0 else -1, occupants=4)
    f = 1 if dx > 0 else -1
    for k, uu in enumerate((-0.33, -0.22, 0.28, 0.38)):
        hx = x + uu * 4.79 * sc * f
        hy = y - 0.95 * sc - (0.25 * sc if abs(uu) > 0.3 else 0.5 * sc)
        ctx.set_source_rgba(0.66, 0.79, 0.92, 1)
        ctx.rectangle(hx - 0.17 * sc, hy, 0.34 * sc, 0.4 * sc)
        ctx.fill()
        ctx.set_source_rgba(0.91, 0.76, 0.3, 1)
        ctx.rectangle(hx - 0.17 * sc, hy + 0.08 * sc, 0.34 * sc, 0.06 * sc)
        ctx.fill()
        ctx.set_source_rgba(0.1, 0.07, 0.06, 1)
        ctx.arc(hx, hy - 0.11 * sc, 0.15 * sc, 0, 2 * math.pi)
        ctx.fill()
        if k % 2 == 0:
            ctx.set_source_rgba(0.55, 0.36, 0.24, 1)
            ctx.set_line_width(max(1.5, 0.08 * sc))
            ctx.set_line_cap(cairo.LINE_CAP_ROUND)
            ctx.move_to(hx, hy + 0.05 * sc)
            ctx.line_to(hx + 0.12 * sc, hy - (0.45 + 0.08 * math.sin(t * 6 + k)) * sc)
            ctx.stroke()
    ctx.restore()
    return I.to_rgb(s)


# ------------------------------------------------------------------ B6: the car in line, since 10 March 1985
def line_car(t, src, i):
    lt = t - 1368.0
    s, ctx = I.surface()
    g = cairo.RadialGradient(960, 540, 80, 960, 540, 1100)
    g.add_color_stop_rgb(0, NAVY[0] / 255 * 1.3, NAVY[1] / 255 * 1.3, NAVY[2] / 255 * 1.3)
    g.add_color_stop_rgb(1, INK[0] / 255, INK[1] / 255, INK[2] / 255)
    ctx.set_source(g)
    ctx.paint()
    # collect the outline as polylines, then draw a growing fraction of their length
    I.car_path(ctx, 960, 760, 260, -1)
    flat = ctx.copy_path_flat()
    ctx.new_path()
    pts, polys = [], []
    for kind, p in flat:
        if kind == cairo.PATH_MOVE_TO:
            if pts:
                polys.append(pts)
            pts = [p]
        elif kind == cairo.PATH_LINE_TO:
            pts.append(p)
        elif kind == cairo.PATH_CLOSE_PATH and pts:
            pts.append(pts[0])
    if pts:
        polys.append(pts)
    for u in (0.31, -0.3):                      # wheels
        cx, cy = 960 + u * 4.79 * 260 * -1, 760 - 0.31 * 260
        polys.append([(cx + 0.31 * 260 * math.cos(a), cy + 0.31 * 260 * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 60)])
    total = sum(sum(math.dist(p[k], p[k + 1]) for k in range(len(p) - 1)) for p in polys)
    budget = total * ease(prog(t, 1368.3, 1371.3))
    ctx.set_source_rgba(IVORY[0] / 255, IVORY[1] / 255, IVORY[2] / 255, 0.95)
    ctx.set_line_width(2.4)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    for p in polys:
        if budget <= 0:
            break
        ctx.move_to(*p[0])
        for k in range(len(p) - 1):
            d = math.dist(p[k], p[k + 1])
            if budget < d:
                f = budget / d
                ctx.line_to(p[k][0] + (p[k + 1][0] - p[k][0]) * f, p[k][1] + (p[k + 1][1] - p[k][1]) * f)
                budget = 0
                break
            ctx.line_to(*p[k + 1])
            budget -= d
        ctx.stroke()
    # a ground line
    gl = ease(prog(t, 1370.6, 1371.6))
    ctx.set_source_rgba(SAND[0] / 255, SAND[1] / 255, SAND[2] / 255, 0.5)
    ctx.set_line_width(1.2)
    ctx.move_to(960 - 820 * gl, 762)
    ctx.line_to(960 + 820 * gl, 762)
    ctx.stroke()
    a = I.to_rgb(s)
    c = Image.fromarray(a).convert("RGBA")
    d = C.text("10 · 3 · 1985", "serif", 64, IVORY)
    C.paste(c, d, ((W - d.width) // 2, 830), ease(prog(t, 1371.4, 1372.2)))
    return finish(np.asarray(c.convert("RGB")), i)


# ------------------------------------------------------------------ B7: the board again: twice over Pakistan
def b7(t, src, i):
    return finish(board_scene(t, i, BOARD_B7, 1375.0), i)


# ------------------------------------------------------------------ B8: victory week, a tear-off calendar
PAGES = [(None, "MARCH", "8", "2026", "T20 WORLD CUP"), (1416.0, "MARCH", "9", "2025", "CHAMPIONS TROPHY"),
         (1418.4, "MARCH", "10", "1985", "WORLD CHAMPIONSHIP OF CRICKET")]


def page_img(month, day, year, what, w=520, h=640):
    im = Image.new("RGBA", (w, h), (246, 241, 230, 255))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w, 120), fill=(150, 34, 40, 255))
    m = C.text(month, "sans_b", 46, (250, 246, 236), tracking=10)
    im.alpha_composite(m, ((w - m.width) // 2, 36))
    dn = C.text(day, "serif", 300, (30, 28, 34))
    im.alpha_composite(dn, ((w - dn.width) // 2, 150))
    yr = C.text(year, "serif_m", 64, (60, 56, 64))
    im.alpha_composite(yr, ((w - yr.width) // 2, 470))
    wt = C.text(what, "sans_b", 20, (120, 112, 100), tracking=3)
    im.alpha_composite(wt, ((w - wt.width) // 2, 570))
    for k in range(9):                      # binding holes
        d.ellipse((60 + k * 50, 8, 72 + k * 50, 20), fill=(90, 20, 26, 255))
    return im


_pages = None


def b8(t, src, i):
    global _pages
    if _pages is None:
        _pages = [page_img(*p[1:]) for p in PAGES]
    lt = t - 1412.6
    bg = A.bokeh_bg(t)
    c = Image.fromarray(C.vignette(bg, 0.45)).convert("RGBA")
    pw, ph = _pages[0].size
    x0, y0 = (W - pw) // 2, 200
    # pad edge (the stack beneath)
    for k in range(5, 0, -1):
        c.alpha_composite(Image.new("RGBA", (pw, ph), (200 - k * 8, 194 - k * 8, 182 - k * 8, 255)), (x0 + k, y0 + k * 3))
    # which page is on top, and which is flipping away
    top = 0
    for j, p in enumerate(PAGES):
        if p[0] is not None and t >= p[0] + 0.7:
            top = j
    c.alpha_composite(_pages[top], (x0, y0))
    for j, p in enumerate(PAGES):
        if p[0] is None or not (p[0] <= t < p[0] + 0.7):
            continue
        c.alpha_composite(_pages[j], (x0, y0))      # the next page is already underneath
        f = ease(prog(t, p[0], p[0] + 0.7))         # previous page lifts on its top hinge
        prev = _pages[j - 1]
        hh = max(2, int(ph * abs(math.cos(f * math.pi / 2 * 1.15))))
        flip = prev.resize((pw, hh)).copy()
        shade_a = int(110 * f)
        flip.alpha_composite(Image.new("RGBA", flip.size, (0, 0, 0, shade_a)))
        c.alpha_composite(flip, (x0, y0))
    a = ease(prog(lt, 0.4, 1.2))
    out = np.asarray(c.convert("RGB"))
    return finish(out, i)


def cutaways(Cut):
    return [
        Cut(1288.12, 1307.35, b1_b2, False, True),                                          # trophy → board → interview
        Cut(1316.00, 1341.30, b3),                                                          # the team piles in → the lap
        Cut(1355.85, 1358.98, A.bw_insert("audi_bw_1", 1355.85, 3.13), False, False),       # master's own insert
        Cut(1368.00, 1384.80, b67),                                                         # since 1985 → twice over Pakistan
        Cut(1395.31, 1400.94, A.bw_insert("audi_bw_2", 1395.31, 5.63), False, False),       # master's own insert
        Cut(1412.60, 1423.10, b8),                                                          # victory week
    ]


def b67(t, src, i):
    if t < 1374.6:
        return line_car(t, src, i)
    out = b7(t, src, i)
    if t < 1375.3:
        x = ease(prog(t, 1374.6, 1375.3))
        out = cv2.addWeighted(line_car(t, src, i), 1 - x, out, x, 0)
    return out


def b1_b2(t, src, i):
    return b1(t, src, i) if t < 1298.2 else b2(t, src, i)


def overlays(Ov):
    return [Ov(1307.5, 1313.4, A.lower_third("The all-rounder of 1985", "Ravi Shastri", "उस ज़माने के हरफ़नमौला ऑलराउंडर"))]
