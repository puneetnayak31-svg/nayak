"""Version A: archive, typography and graphics, in a formal register.

Every caption quotes or closely follows what Vikrant says; every number is checked (see ../TREATMENT_EP2.md).
"""
import math
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import common as C
from common import GREEN, H, INK, IVORY, MUTED, NAVY, SAND, W

ARC = os.path.join(C.EP2, "archive")
_cache = {}


def parallax(name, **kw):
    if name not in _cache:
        _cache[name] = C.Parallax(os.path.join(ARC, name + ".png"), **kw)
    return _cache[name]


def finish(a, i, bug=True, archive=True):
    if archive:
        a = C.grain(a, i, 4.5)
    a = C.vignette(a, 0.3)
    return C.apply_bug(a) if bug else a


def bokeh_bg(t, seed_img="audi_lap_colour"):
    """Deep-navy backdrop built from an out-of-focus archive frame: texture without detail."""
    key = ("bokeh", seed_img)
    if key not in _cache:
        im = np.asarray(Image.open(os.path.join(ARC, seed_img + ".png")).convert("RGB")).astype(np.float32)
        im = cv2.GaussianBlur(im, (0, 0), 28)
        lum = im.mean(-1, keepdims=True) / 255
        navy = np.array(NAVY, np.float32)
        ink = np.array(INK, np.float32)
        out = ink * (1 - lum) + navy * 1.6 * lum
        _cache[key] = np.clip(out, 0, 255).astype(np.uint8)
    base = _cache[key]
    z = 1.04 + 0.02 * math.sin(t * 0.15)
    M = np.float32([[z, 0, W / 2 - W / 2 * z], [0, z, H / 2 - H / 2 * z]])
    return cv2.warpAffine(base, M, (W, H), borderMode=cv2.BORDER_REFLECT)


def caption(canvas, t, kick, title, sub=None, x=96, y=None, t_in=0.3, dur=None, title_font="serif", size=58):
    """Lower-left caption: small tracked kicker, serif title, optional Hindi line, hairline rule."""
    a = C.ease(C.prog(t, t_in, t_in + 0.7))
    if dur is not None:
        a *= 1 - C.ease(C.prog(t, dur - 0.6, dur))
    if a <= 0:
        return
    k = C.kicker(kick, C.SAND, 19)
    ti = C.text(title, title_font, size, IVORY)
    su = C.text(sub, "hindi", 34, (226, 222, 210)) if sub else None
    total = k.height + 16 + ti.height + ((su.height + 6) if su else 0)
    y0 = (H - 90 - total) if y is None else y
    # soft scrim behind the type
    scrim = np.zeros((total + 120, 1100), np.float32)
    yy = np.linspace(0, 1, scrim.shape[0])[:, None]
    xx = np.linspace(0, 1, scrim.shape[1])[None, :]
    scrim = (np.clip(1.15 - xx, 0, 1) ** 1.5) * np.sin(np.pi * yy) ** 0.6 * 150 * a
    sim = Image.new("RGBA", (1100, total + 120), INK + (0,))
    sim.putalpha(Image.fromarray(scrim.astype(np.uint8), "L"))
    canvas.alpha_composite(sim, (0, max(0, y0 - 60)))
    C.paste(canvas, k, (x, y0), a)
    rw = int(min(ti.width, 420) * C.ease(C.prog(t, t_in + 0.2, t_in + 1.1)))
    C.paste(canvas, C.hairline(rw, C.SAND, 170), (x + 2, y0 + k.height + 6), a)
    C.paste(canvas, C.reveal(ti, C.ease_out(C.prog(t, t_in + 0.15, t_in + 1.0))), (x - 2, y0 + k.height + 16), 1.0 if a >= 1 else a)
    if su:
        C.paste(canvas, su, (x, y0 + k.height + 16 + ti.height + 6), a * C.ease(C.prog(t, t_in + 0.6, t_in + 1.3)))


def to_canvas(a):
    return Image.fromarray(a).convert("RGBA")


def from_canvas(c):
    return np.asarray(c.convert("RGB"))


# ------------------------------------------------------------------ cutaway 1: trophy → name → Channel 9
def cut1(t, src, i):
    if t < 1295.30:
        lt = t - 1288.12
        a = parallax("trophy_bw").render(lt, 7.2, 1.02, 1.13, (0.45, 0.42), (0.47, 0.34), depth=0.03)
        c = to_canvas(finish(a, i))
        caption(c, lt, "Melbourne Cricket Ground · 10 March 1985", "The trophy", "कप्तान के तौर पर गावस्कर का आख़िरी टूर्नामेंट",
                t_in=0.6, dur=6.6, size=54)
        out = from_canvas(c)
        if t > 1294.7:   # dissolve into the name card
            x = C.ease(C.prog(t, 1294.7, 1295.3))
            out = cv2.addWeighted(out, 1 - x, name_card(t, i), x, 0)
        return out
    if t < 1297.50:
        return name_card(t, i)
    out = channel9(t, src, i)
    if t < 1298.1:
        x = C.ease(C.prog(t, 1297.5, 1298.1))
        out = cv2.addWeighted(name_card(t, i), 1 - x, out, x, 0)
    return out


def name_card(t, i):
    lt = t - 1294.7
    bg = bokeh_bg(t)
    c = to_canvas(C.vignette(C.grain(bg, i, 3), 0.4))
    k = C.kicker("Champion of Champions · 1985", C.SAND, 22)
    hi = C.text("मैन ऑफ़ द टूर्नामेंट", "hindi", 46, (224, 220, 208))
    nm = C.text("Ravi Shastri", "serif", 132, IVORY)
    cy = H // 2 - 40
    C.paste(c, k, ((W - k.width) // 2, cy - 150), C.ease(C.prog(lt, 0.3, 1.1)))
    C.paste(c, hi, ((W - hi.width) // 2, cy - 100), C.ease(C.prog(t, 1295.4, 1296.1)))
    C.paste(c, C.reveal(nm, C.ease_out(C.prog(t, 1296.5, 1297.6))), ((W - nm.width) // 2, cy - 20))
    rw = int(560 * C.ease(C.prog(t, 1296.9, 1298.0)))
    C.paste(c, C.hairline(rw, C.SAND, 160), ((W - rw) // 2, cy + nm.height + 10))
    return C.apply_bug(from_canvas(c))


def channel9(t, src, i):
    """The master's own Channel 9 footage, re-finished and captioned (it is the real moment)."""
    lt = t - 1297.5
    a = C.grain(src, i, 3.5)
    a = C.vignette(a, 0.32)
    c = to_canvas(a)
    caption(c, lt, "Channel 9 · MCG, 10 March 1985", "Ian Chappell with Ravi Shastri", None, t_in=2.6, dur=8.9, size=46)
    return C.apply_bug(from_canvas(c))


# ------------------------------------------------------------------ cutaway 2: the car, then the lap
PH = {"bonnet": (930, 760, 210), "back": (1560, 610, 200), "front": (1170, 600, 190), "inside": (1330, 650, 260)}


def guided_light(a, t, keys):
    """Darkens the photo except a soft pool of light that travels to what he is describing."""
    pts = [(1320.6, None)] + keys + [(1331.2, None)]
    # find current target (eased between consecutive targets)
    cur = None
    for (ta, pa), (tb, pb) in zip(pts, pts[1:]):
        if ta <= t < tb:
            x = C.ease(C.prog(t, tb - 0.7, tb)) if pb else 0.0
            if pa and pb:
                cur = tuple(C.lerp(pa[j], pb[j], x) for j in range(3)) + (1.0,)
            elif pa and not pb:
                cur = pa + (1 - x,)
            elif pb and not pa:
                cur = pb + (x,)
            break
    if not cur:
        return a
    cx, cy, r, s = cur
    yy, xx = np.ogrid[:H, :W]
    d = np.sqrt(((xx - cx) / 1.25) ** 2 + (yy - cy) ** 2)
    pool = np.clip(1 - (d - r) / (r * 1.4), 0, 1)
    shade = 1 - 0.5 * s * (1 - pool)
    return (a.astype(np.float32) * shade[..., None]).astype(np.uint8)


def cut2(t, src, i):
    if t < 1331.6:
        lt = t - 1320.6
        a = parallax("audi_lap_colour", fg_rect=(740, 300, 1720, 1000)).render(lt, 11.0, 1.0, 1.06, (0.5, 0.5), (0.52, 0.52),
                                                                            depth=0.025)
        # the parallax zoom is gentle, so the photo coordinates of the 'pools' hold closely enough
        a = guided_light(a, t, [(1324.3, PH["bonnet"]), (1327.1, PH["back"]), (1328.4, PH["front"]), (1329.7, PH["inside"])])
        out = finish(a, i)
        if t > 1331.0:
            out = cv2.addWeighted(out, 1 - C.ease(C.prog(t, 1331.0, 1331.6)), lap(t, i), C.ease(C.prog(t, 1331.0, 1331.6)), 0)
        return out
    return lap(t, i)


def oval_point(u, cx=960, cy=560, rx=640, ry=330):
    a = 2 * math.pi * u + math.pi / 2
    return cx + rx * math.cos(a), cy + ry * math.sin(a)


def lap(t, i):
    """A plan of the MCG: the car's lap of honour traced along the boundary."""
    import cairo
    lt = t - 1331.0
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(s)
    g = cairo.RadialGradient(960, 540, 100, 960, 540, 1100)
    g.add_color_stop_rgb(0, NAVY[0] / 255 * 1.2, NAVY[1] / 255 * 1.2, NAVY[2] / 255 * 1.2)
    g.add_color_stop_rgb(1, INK[0] / 255, INK[1] / 255, INK[2] / 255)
    ctx.set_source(g)
    ctx.paint()
    draw = C.ease(C.prog(lt, 0.0, 1.6))
    iv = tuple(v / 255 for v in IVORY)
    sd = tuple(v / 255 for v in SAND)
    # stands (outer rings), boundary, 30-yard circle, pitch
    for rx, ry, a_, w_ in ((800, 430, 0.18, 26), (740, 395, 0.12, 14), (640, 330, 0.55, 2.2), (420, 215, 0.22, 1.4)):
        ctx.save()
        ctx.translate(960, 560)
        ctx.scale(rx, ry)
        ctx.arc(0, 0, 1, -math.pi / 2, -math.pi / 2 + 2 * math.pi * draw)
        ctx.restore()
        ctx.set_source_rgba(*iv, a_)
        ctx.set_line_width(w_)
        ctx.stroke()
    ctx.set_source_rgba(*sd, 0.55 * draw)
    ctx.rectangle(946, 500, 28, 120)
    ctx.fill()
    import random
    R = random.Random(4)                     # the crowd: a fine stipple in the stands
    for _ in range(1400):
        a_ = R.uniform(0, 2 * math.pi)
        rr = R.uniform(0.0, 1.0)
        x_ = 960 + (745 + 60 * rr) * math.cos(a_)
        y_ = 560 + (398 + 36 * rr) * math.sin(a_)
        if R.random() < draw:
            ctx.set_source_rgba(*iv, 0.10 + 0.12 * R.random() + 0.08 * C.prog(t, 1333.2, 1338.2) * (0.5 + 0.5 * math.sin(t * 8 + _)))
            ctx.arc(x_, y_, 1.3, 0, 2 * math.pi)
            ctx.fill()
    # the lap: starts at 'कार को' (1333.2), one circuit by 1338.0
    u = C.ease(C.prog(t, 1333.2, 1338.2))
    if u > 0:
        ctx.set_source_rgba(*sd, 0.95)
        ctx.set_line_width(4)
        n = 120
        ctx.move_to(*oval_point(0))
        for k in range(1, int(n * u) + 1):
            ctx.line_to(*oval_point(k / n))
        ctx.line_to(*oval_point(u))
        ctx.stroke()
        x, y = oval_point(u)
        x2, y2 = oval_point(min(1, u + 0.002))
        ang = math.atan2(y2 - y, x2 - x)
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(ang)
        ctx.set_source_rgba(0.86, 0.87, 0.9, 1)       # the car, seen from above
        ctx.rectangle(-34, -15, 68, 30)
        ctx.fill()
        ctx.set_source_rgba(0.18, 0.22, 0.3, 1)
        ctx.rectangle(-10, -12, 26, 24)
        ctx.fill()
        ctx.set_source_rgba(0.95, 0.85, 0.6, 1)       # people on the bonnet and roof
        for px_, py_ in ((22, -6), (22, 6), (-2, -4), (-2, 5), (-24, 0)):
            ctx.arc(px_, py_, 4, 0, 2 * math.pi)
            ctx.fill()
        ctx.restore()
        for r_, a_ in ((40, 0.25), (20, 0.4)):
            gg = cairo.RadialGradient(x, y, 0, x, y, r_)
            gg.add_color_stop_rgba(0, *sd, a_)
            gg.add_color_stop_rgba(1, *sd, 0)
            ctx.set_source(gg)
            ctx.arc(x, y, r_, 0, 2 * math.pi)
            ctx.fill()
    s.flush()
    a = np.ndarray((H, W, 4), np.uint8, s.get_data())[..., [2, 1, 0]].copy()
    c = to_canvas(C.grain(a, i, 3))
    k = C.kicker("Melbourne Cricket Ground · the lap of honour", C.SAND, 20)
    C.paste(c, k, ((W - k.width) // 2, 70), C.ease(C.prog(lt, 0.6, 1.4)))
    q = C.text("“आउडी की इससे बड़ी advertisement दुनिया में कहीं नहीं थी”", "hindi", 40, (230, 226, 214))
    C.paste(c, q, ((W - q.width) // 2, H - 130), C.ease(C.prog(t, 1338.6, 1339.6)))
    return C.apply_bug(from_canvas(c))


# ------------------------------------------------------------------ archive inserts already in the master (hard cuts)
def bw_insert(name, t0, dur, crop_c=(0.5, 0.5)):
    def fn(t, src, i):
        a = parallax(name).render(t - t0, dur, 1.02, 1.08, crop_c, (crop_c[0], crop_c[1] - 0.02), depth=0.03)
        return finish(a, i)
    return fn


# ------------------------------------------------------------------ cutaway 3: twice over Pakistan
def results(t, src, i):
    lt = t - 1375.0
    c = to_canvas(C.vignette(C.grain(bokeh_bg(t, "audi_bw_2"), i, 3), 0.4))
    k = C.kicker("India v Pakistan · Benson & Hedges World Championship of Cricket", C.SAND, 20)
    C.paste(c, k, ((W - k.width) // 2, 200), C.ease(C.prog(lt, 0.8, 1.6)))
    cards = [(1380.1, "20 February 1985", "League match · MCG", "Pakistan 183", "India 184/4", "India won by 6 wickets"),
             (1381.0, "10 March 1985", "Final · MCG", "Pakistan 176/9", "India 177/2", "India won by 8 wickets")]
    for j, (ta, date, stage, p, ind, res) in enumerate(cards):
        a = C.ease(C.prog(t, ta, ta + 0.9))
        if a <= 0:
            continue
        x0 = 330 + j * 660
        y0 = 330 + (1 - a) * 18
        card = Image.new("RGBA", (600, 420), INK + (150,))
        d = ImageDraw.Draw(card)
        d.rectangle((0, 0, 599, 419), outline=SAND + (90,), width=1)
        card.alpha_composite(C.text(date, "serif", 48, IVORY), (40, 36))
        card.alpha_composite(C.kicker(stage, C.SAND, 18), (42, 110))
        card.alpha_composite(C.hairline(520, C.SAND, 90), (40, 150))
        card.alpha_composite(C.text(p, "sans", 34, MUTED), (40, 180))
        card.alpha_composite(C.text(ind, "sans_b", 40, IVORY), (40, 236))
        card.alpha_composite(C.text(res, "serif_i", 34, (236, 224, 196)), (40, 320))
        C.paste(c, card, (x0, y0), a)
    return C.apply_bug(from_canvas(c))


# ------------------------------------------------------------------ cutaway 4: victory week
def dates(t, src, i):
    lt = t - 1412.6
    c = to_canvas(C.vignette(C.grain(bokeh_bg(t), i, 3), 0.45))
    items = [(1413.9, "8 मार्च 2026", "T20 वर्ल्ड कप"), (1416.0, "9 मार्च 2025", "चैंपियंस ट्रॉफ़ी"),
             (1418.4, "10 मार्च 1985", "वर्ल्ड चैंपियनशिप ऑफ़ क्रिकेट")]
    k = C.kicker("India's victory week", C.SAND, 22)
    C.paste(c, k, ((W - k.width) // 2, 250), C.ease(C.prog(lt, 0.6, 1.4)))
    for j, (ta, d, what) in enumerate(items):
        a = C.ease(C.prog(t, ta, ta + 0.9))
        if a <= 0:
            continue
        cx = 400 + j * 560
        dt = C.text(d, "hindi", 64, IVORY if j < 2 else (246, 226, 180))
        wt = C.text(what, "hindi", 34, (210, 206, 196))
        C.paste(c, dt, (cx - dt.width // 2, 470 + (1 - a) * 16), a)
        C.paste(c, C.hairline(int(200 * a), C.SAND, 140), (cx - 100, 470 + dt.height + 14), a)
        C.paste(c, wt, (cx - wt.width // 2, 470 + dt.height + 34), a)
    return C.apply_bug(from_canvas(c))


# ------------------------------------------------------------------ overlays on the studio picture
def lower_third(kick, title, sub=None, title_font="serif", size=44):
    """Compact studio lower third: title and one Hindi line, set low so it clears the sponsor screen."""
    def fn(frame, t, dur, i):
        c = to_canvas(frame)
        a = C.ease(C.prog(t, 0.0, 0.7)) * (1 - C.ease(C.prog(t, dur - 0.6, dur)))
        ti = C.text(title, title_font, size, IVORY)
        su = C.text(sub, "hindi", 28, (228, 224, 212)) if sub else None
        k = C.kicker(kick, C.SAND, 15)
        x = 820
        y = H - 34 - ti.height - (su.height + 2 if su else 0)
        sw = max(ti.width, su.width if su else 0, k.width) + 120
        sa = np.zeros((H - y + 50, sw), np.float32)
        ramp = np.linspace(0, 1, sw)
        sa[:] = (np.clip(1.25 - ramp, 0, 1) ** 1.3 * np.clip(ramp * 6, 0, 1))[None, :] * 160 * a
        sa *= np.clip(np.linspace(0, 1, sa.shape[0]) * 3, 0, 1)[:, None]
        scrim = Image.new("RGBA", (sw, H - y + 50), INK + (0,))
        scrim.putalpha(Image.fromarray(sa.astype(np.uint8), "L"))
        c.alpha_composite(scrim, (x - 30, y - 50))
        C.paste(c, k, (x + 2, y - 28), a)
        C.paste(c, C.reveal(ti, C.ease_out(C.prog(t, 0.1, 1.0))), (x - 2, y), 1.0 if a >= 1 else a)
        if su:
            C.paste(c, su, (x, y + ti.height + 2), a * C.ease(C.prog(t, 0.5, 1.2)))
        return from_canvas(c)
    return fn


def pull_quote(frame, t, dur, i):
    c = to_canvas(frame)
    a = C.ease(C.prog(t, 0.0, 0.8)) * (1 - C.ease(C.prog(t, dur - 0.7, dur)))
    q = C.text("“One of the best one-day teams”", "serif_i", 46, IVORY)
    s = C.text("— because of the all-rounders", "serif_i", 30, SAND)
    x, y = 820, H - 150
    scrim = Image.new("RGBA", (q.width + 160, 220), INK + (0,))
    sa = np.zeros((220, q.width + 160), np.float32)
    ramp = np.linspace(0, 1, q.width + 160)
    sa[:] = (np.clip(1.1 - ramp, 0, 1) * np.clip(ramp * 6, 0, 1))[None, :] * 150 * a
    sa *= np.clip(np.linspace(0, 1, 220) * 3, 0, 1)[:, None]
    scrim.putalpha(Image.fromarray(sa.astype(np.uint8), "L"))
    c.alpha_composite(scrim, (x - 60, y - 40))
    C.paste(c, C.reveal(q, C.ease_out(C.prog(t, 0.1, 1.2))), (x, y), 1.0 if a >= 1 else a)
    C.paste(c, s, (x + 4, y + q.height + 14), a * C.ease(C.prog(t, 0.8, 1.5)))
    return from_canvas(c)


def cutaways(Cut):
    return [
        Cut(1288.12, 1307.35, cut1, False, True),                                     # trophy → name → Channel 9 (hard cut in, as the master)
        Cut(1320.60, 1341.30, cut2),                                                  # the car, then the lap
        Cut(1355.85, 1358.98, bw_insert("audi_bw_1", 1355.85, 3.13), False, False),   # master's own insert
        Cut(1375.00, 1384.80, results),                                               # twice over Pakistan
        Cut(1395.31, 1400.94, bw_insert("audi_bw_2", 1395.31, 5.63), False, False),   # master's own insert
        Cut(1412.60, 1423.10, dates),                                                 # victory week
    ]


def overlays(Ov):
    return [
        Ov(1307.5, 1313.4, lower_third("The all-rounder of 1985", "Ravi Shastri", "उस ज़माने के हरफ़नमौला ऑलराउंडर")),
        Ov(1368.3, 1374.6, lower_third("Since 10 March 1985", "Shastri & Audi", "एक रिश्ता जो आज भी चल रहा है")),
        Ov(1385.0, 1394.2, lower_third("1985 → 1987", "लगभग यही टीम", "1987 वर्ल्ड कप में भी खेली", title_font="hindi", size=54)),
        Ov(1404.6, 1411.4, pull_quote),
    ]
