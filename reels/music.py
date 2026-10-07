"""Synthesised, playful folk soundtracks for the reels (no samples, no licensing).

    python3 music.py SLUG OUT.wav

Each painting has its own style (tempo, raga, lead instruments, percussion and sound
effects). Bars line up with the video's scenes (paintings.SCENE_BARS).
"""
import sys
import wave

import numpy as np

from paintings import PAINTINGS, SCENE_BARS

SR = 44100
SWARA = {"S": 0, "r": 1, "R": 2, "g": 3, "G": 4, "M": 5, "m": 6, "P": 7, "d": 8, "D": 9, "n": 10, "N": 11}

# ---------------------------------------------------------------- styles
# Melodies are sargam "note:beats"; lowercase = komal (m = tivra Ma), ' = upper octave, . = lower.
# Percussion lanes: one character per step, '.' = rest, 1-9 = velocity; (pattern, minimum level).
STYLES = {
    # Amausa Ka Mela: a riverside fair. Shehnai and bansuri trade a Bhupali tune over fast keherwa.
    "mela": dict(
        bpm=116, beats=4, steps=16, swing=0.1, sa=293.66,
        lead="shehnai", answer="bansuri", pluck="santoor", pluck_oct=1,
        A="G:.5 G:.5 P:.5 D:.5 S':1 D:.5 P:.5  G:.5 P:.5 D:.5 P:.5 G:1 -:1",
        B="D:.5 S':.5 R':.5 S':.5 D:.5 P:.5 G:1  R:.5 G:.5 P:.5 G:.5 R:.5 S:.5 S:1",
        C="G:.5 R:.5 S:3",
        ostinato="S P S' P G P S' P",
        bass="S...........P...", bass_oct=0.25,
        drums={"dholak_bass": ("9.6.........8...", 1.5), "dholak_tin": ("8...7.4.7.4.8.7.", 1),
               "dholak_ghost": ("..3...3...3...3.", 2), "clap": ("....9.......9...", 2.5),
               "ghungroo": ("3.5.3.5.3.5.3.5.", 2), "ting": ("......6.......6.", 3)},
        accent="bell", fx=[],
    ),
    # Across the Yamuna: Krishna's flute, playful in Raag Khamaj, pakhawaj and manjira, river drops.
    "krishna": dict(
        bpm=112, beats=4, steps=16, swing=0.08, sa=329.63,
        lead="bansuri", answer="santoor", pluck="sitar", pluck_oct=0.5,
        A="G:.5 M:.5 P:1 D:.5 n:.5 D:.5 P:.5  M:.5 G:.5 R:.5 G:.5 M:1 -:1",
        B="N:.5 S':.5 R':.5 S':.5 n:.5 D:.5 P:1  D:.5 M:.5 P:.5 G:.5 M:.5 G:.5 R:.5 S:.5",
        C="G:.5 M:.5 G:.5 R:.5 S:2",
        ostinato="S P G P S' P G P",
        bass="S.......P...S...", bass_oct=0.25,
        drums={"pakhawaj_bass": ("9.......6.5.....", 1.5), "pakhawaj_ta": ("..7.6...7..6.7..", 1),
               "manjira": ("....8.......8...", 2), "ghungroo": ("..4...4...4...4.", 2.5),
               "clap": ("....7.......7...", 3)},
        accent="bell", fx=["conch", "drops"],
    ),
    # Nature in Godna: earthy and tribal, madal drum, clap-sticks, bamboo flute and birdsong.
    "tribal": dict(
        bpm=120, beats=4, steps=16, swing=0.06, sa=261.63,
        lead="bansuri", answer="wood", pluck="wood", pluck_oct=1,
        A="S:.5 g:.5 M:.5 P:.5 n:1 P:1  M:.5 P:.5 g:.5 M:.5 S:1 -:1",
        B="P:.5 n:.5 S':1 n:.5 P:.5 M:1  g:.5 M:.5 P:.5 M:.5 g:.5 S:.5 S:1",
        C="g:.5 M:.5 g:.5 .n:.5 S:2",
        ostinato="S g P g S' P g P",
        bass="S..S......P.S...", bass_oct=0.25,
        drums={"madal_bass": ("9..6..9...6.9...", 1.5), "madal_tin": ("..8..8..7.8..8.7", 1),
               "sticks": ("8.5.8.5.8.5.8.5.", 2), "shaker": ("4343434343434343", 2.5),
               "clap": ("....8.......8...", 3)},
        accent="sticks_roll", fx=["birds"],
    ),
    # Sawan: a kajri swing in 12/8 (Raag Desh), dholak, jingling bangles and monsoon rain.
    "sawan": dict(
        bpm=112 * 3, beats=12, steps=12, swing=0.0, sa=293.66,
        lead="bansuri", answer="santoor", pluck="santoor", pluck_oct=1, harmonium=True,
        A="R:2 M:1 P:2 N:1 S':3 n:1 D:1 P:1  M:2 P:1 D:2 P:1 M:2 G:1 R:3",
        B="M:2 P:1 N:2 S':1 R':3 S':1 n:1 D:1  P:2 M:1 G:2 R:1 G:2 R:1 S:3",
        C="R:2 M:1 G:2 R:1 S:6",
        ostinato="S P S' P M P S P N P S' P",
        bass="S.....P.....", bass_oct=0.25,
        drums={"dholak_bass": ("9....69....6", 1.5), "dholak_tin": ("..7.6...7.66", 1),
               "bangles": ("..8..7..8..9", 1), "shaker": ("434434434434", 2),
               "clap": ("...8.....8..", 3)},
        accent="bangles_big", fx=["thunder", "rain"],
    ),
    # Anvarat: a rowing song that never stops. Steady oar-stroke pulse, splashes and peacock calls.
    "boat": dict(
        bpm=124, beats=4, steps=16, swing=0.0, sa=349.23,
        lead="bansuri", answer="sitar", pluck="sitar", pluck_oct=0.5,
        A="S:.5 R:.5 G:.5 P:.5 G:.5 R:.5 G:1  P:.5 D:.5 P:.5 G:.5 R:1 -:1",
        B="P:.5 D:.5 S':.5 D:.5 P:1 M:.5 G:.5  R:.5 G:.5 R:.5 .D:.5 S:1 -:1",
        C="G:.5 R:.5 .D:.5 R:.5 S:2",
        ostinato="S G P G S G P G",
        bass="S.......P.......", bass_oct=0.25,
        drums={"dholak_bass": ("9.......8.......", 1), "dholak_tin": ("....7.......7..5", 1.5),
               "shaker": ("6.4.6.4.6.4.6.4.", 1), "splash": ("9.......7.......", 1),
               "dholak_ghost": ("..3...3...3...3.", 2.5), "clap": ("....8.......8...", 3)},
        accent="peacock", fx=["peacock"],
    ),
    # Fire Does Not Consume the Faithful: a Holi phag in Raag Kafi, dhol, claps, crackling fire.
    "holi": dict(
        bpm=128, beats=4, steps=16, swing=0.08, sa=293.66,
        lead="shehnai", answer="bansuri", pluck="santoor", pluck_oct=1, harmonium=True,
        A="S:.5 R:.5 g:.5 R:.5 M:.5 P:.5 M:.5 g:.5  R:.5 g:.5 R:.5 S:.5 R:1 -:1",
        B="P:.5 D:.5 n:.5 D:.5 P:.5 M:.5 P:1  M:.5 P:.5 g:.5 M:.5 R:.5 g:.5 S:1",
        C="M:.5 g:.5 R:.5 .n:.5 S:2",
        ostinato="S P g P S' P g P",
        bass="S.....S.P.....S.", bass_oct=0.25,
        drums={"dhol_boom": ("9.....8.9.....8.", 1.5), "dhol_crack": ("..7...7...7.7.7.", 1),
               "clap": ("....9.......9...", 2), "shaker": ("4.4.4.4.4.4.4.4.", 2),
               "ghungroo": ("3.5.3.5.3.5.3.5.", 3)},
        accent="whoosh", fx=["crackle"],
    ),
}

# Section intensity per bar (22 bars): 1 intro, 2 groove, 3 peak, 1.5 the quieter artist scene.
LEVELS = [1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 2, 2, 1.5, 1.5, 2, 3, 3, 3]
# (start bar, phrase, who). Phrase A/B are two bars, C is a one-bar cadence.
MELODY_PLAN = [(0, "A", "intro"), (2, "A", "lead"), (4, "B", "lead"), (6, "A", "answer"),
               (8, "B", "answer"), (10, "A", "both"), (12, "B", "both"), (14, "A", "lead"),
               (16, "B", "soft"), (18, "A1", "lead"), (19, "B", "both"), (21, "C", "both")]
FILL_BARS = (1, 6, 11, 15, 18)

rng = np.random.default_rng(11)


def parse(seq):
    out = []
    for tok in seq.split():
        sw, b = tok.split(":")
        out.append((sw, float(b)))
    return out


def freq(sw, base):
    o = sw.count("'") - sw.count(".")
    return base * 2 ** ((SWARA[sw.strip("'.")] + 12 * o) / 12)


def bandpass(x, lo, hi):
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, n)


def env_exp(n, tau, att=0.002):
    t = np.arange(n) / SR
    return np.exp(-t / tau) * (1 - np.exp(-t / att))


# ---------------------------------------------------------------- melodic instruments
def wind(seq, beat, base, kind, gain=1.0):
    """Bansuri or shehnai line with tongued notes, glides into leaps and delayed vibrato."""
    total = sum(b for _, b in seq) * beat + 0.5
    n = int(total * SR)
    f_tr = np.zeros(n)
    a_tr = np.zeros(n)
    t = 0.0
    prev = None
    for sw, b in seq:
        dur = b * beat
        i0, i1 = int(t * SR), int((t + dur) * SR)
        t += dur
        if sw == "-":
            prev = None
            continue
        f = freq(sw, base)
        seg = i1 - i0
        tt = np.arange(seg) / SR
        ft = np.full(seg, f)
        if prev is not None and abs(np.log2(f / prev)) > 0.2:  # meend into leaps
            g = min(int(0.05 * SR), seg)
            ft[:g] = prev * (f / prev) ** ((1 - np.cos(np.linspace(0, np.pi, g))) / 2)
        vib = np.clip((tt - 0.18) / 0.3, 0, 1) * (0.007 if kind == "shehnai" else 0.005)
        ft *= 1 + vib * np.sin(2 * np.pi * (6.2 if kind == "shehnai" else 5.2) * tt)
        f_tr[i0:i1] = ft
        e = np.ones(seg)
        att, rel = int(0.012 * SR), min(int(0.045 * SR), seg // 3)
        e[:att] = np.linspace(0, 1, att)
        e[seg - rel:] = np.linspace(1, 0.15, rel)
        e *= 1 + 0.25 * np.exp(-tt / 0.06)  # playful accent on each note
        a_tr[i0:i1] = e
        prev = f
    # hold frequency through rests so the phase stays continuous
    idx = np.where(f_tr > 0, np.arange(n), 0)
    np.maximum.accumulate(idx, out=idx)
    f_tr = f_tr[idx]
    f_tr[f_tr == 0] = base
    a_tr = np.convolve(a_tr, np.ones(90) / 90, mode="same")
    ph = 2 * np.pi * np.cumsum(f_tr) / SR
    if kind == "shehnai":
        tone = np.zeros(n)
        for k in range(1, 16):
            fk = f_tr * k
            amp = (1 / k ** 0.7) * (1 + 2.2 * np.exp(-((fk - 1500) / 600) ** 2))
            amp = np.where(fk < SR / 2 - 500, amp, 0)
            tone += amp * np.sin(k * ph)
        tone *= 0.22
        breath = 0.04
    else:
        tone = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.09 * np.sin(3 * ph) + 0.03 * np.sin(4 * ph)
        breath = 0.09
    nz = rng.standard_normal(n)
    nz = np.convolve(nz, np.ones(14) / 14, mode="same") - np.convolve(nz, np.ones(120) / 120, mode="same")
    return (tone + breath * nz) * a_tr * 0.15 * gain


_pluck_cache = {}


def pluck(f, kind):
    key = (round(f, 2), kind)
    if key in _pluck_cache:
        return _pluck_cache[key]
    if kind == "wood":  # bamboo/marimba-like mallet
        n = int(0.6 * SR)
        t = np.arange(n) / SR
        s = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.18) + 0.35 * np.sin(2 * np.pi * f * 3.9 * t) * np.exp(-t / 0.03)
             + 0.15 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t / 0.008))
        s *= (1 - np.exp(-t / 0.001)) * 0.3
    else:
        dur = 1.8 if kind == "santoor" else 1.4
        n = int(dur * SR)
        p = max(2, int(SR / f))
        buf = rng.uniform(-1, 1, p)
        bright = 0.5 if kind == "santoor" else 0.85
        buf = np.convolve(buf, [bright, 1 - bright], mode="same")
        out = np.zeros(n)
        dec = 0.996 if kind == "santoor" else 0.994
        for i in range(n):
            j = i % p
            out[i] = buf[j]
            buf[j] = dec * 0.5 * (buf[j] + buf[(j + 1) % p])
        if kind == "sitar":  # jawari buzz
            out = np.tanh(out * 3.0) / 3.0 + 0.3 * out
        else:
            out = out + 0.5 * np.roll(out, int(0.0012 * SR))
        t = np.arange(n) / SR
        s = out * (1 - np.exp(-t / 0.002)) * (0.26 if kind == "santoor" else 0.34)
    _pluck_cache[key] = s
    return s


def harmonium_chord(notes, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in notes:
        for det in (0.998, 1.0, 1.003):
            for k in range(1, 9):
                s += np.sin(2 * np.pi * f * det * k * t + k) / k
    e = np.clip(t / 0.04, 0, 1) * np.clip((dur - t) / 0.08, 0, 1) * (1 + 0.06 * np.sin(2 * np.pi * 4 * t))
    return s * e * 0.012


def bass_note(f):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.1 * np.sin(6 * np.pi * f * t)
    return s * env_exp(n, 0.22, 0.004) * 0.3


def tanpura(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    bloom = 1 - np.exp(-t / 0.35)
    for k in range(1, 14):
        amp = 1.0 if k == 1 else (1 / k ** 1.1) * (0.35 + 0.65 * bloom * (k > 3))
        s += amp * np.sin(2 * np.pi * f * k * t + rng.uniform(0, 6.28))
    return s * np.exp(-t / 2.6) * (1 - np.exp(-t / 0.01)) * 0.06


# ---------------------------------------------------------------- percussion & effects
def drum(name, v=1.0):
    r = rng
    if name in ("dholak_bass", "pakhawaj_bass", "madal_bass"):
        lo, hi, dec = {"dholak_bass": (62, 70, 0.18), "pakhawaj_bass": (55, 50, 0.3), "madal_bass": (80, 90, 0.14)}[name]
        n = int(0.6 * SR)
        t = np.arange(n) / SR
        f = lo + hi * np.exp(-t / 0.04)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / dec) + 0.3 * r.standard_normal(n) * np.exp(-t / 0.005)
        return s * 0.6 * v
    if name in ("dholak_tin", "pakhawaj_ta", "madal_tin", "dholak_ghost"):
        ring = {"dholak_tin": 430, "pakhawaj_ta": 980, "madal_tin": 700, "dholak_ghost": 610}[name]
        n = int(0.3 * SR)
        t = np.arange(n) / SR
        s = 0.6 * np.sin(2 * np.pi * ring * t) * np.exp(-t / 0.05) + 0.3 * np.sin(2 * np.pi * ring * 2.31 * t) * np.exp(-t / 0.025)
        nz = r.standard_normal(n)
        s += 0.5 * (nz - np.convolve(nz, np.ones(8) / 8, mode="same")) * np.exp(-t / 0.01)
        return s * 0.33 * v
    if name == "dhol_boom":
        n = int(0.7 * SR)
        t = np.arange(n) / SR
        f = 48 + 60 * np.exp(-t / 0.05)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.32) + 0.4 * r.standard_normal(n) * np.exp(-t / 0.008)
        return np.tanh(s * 1.5) * 0.55 * v
    if name == "dhol_crack":
        n = int(0.2 * SR)
        t = np.arange(n) / SR
        nz = r.standard_normal(n)
        s = bandpass(nz, 1500, 7000) * np.exp(-t / 0.02) * 2 + 0.5 * np.sin(2 * np.pi * 820 * t) * np.exp(-t / 0.04)
        return s * 0.3 * v
    if name == "clap":
        n = int(0.25 * SR)
        t = np.arange(n) / SR
        s = np.zeros(n)
        for off in (0, 0.011, 0.022):
            i = int(off * SR)
            s[i:] += r.standard_normal(n - i) * np.exp(-t[: n - i] / (0.006 if off < 0.02 else 0.05))
        return bandpass(s, 800, 5000) * 0.35 * v
    if name == "manjira" or name == "ting":
        n = int(1.2 * SR)
        t = np.arange(n) / SR
        s = np.zeros(n)
        parts = [(2650, 1), (3990, .7), (5230, .5), (6870, .35)] if name == "manjira" else [(3520, 1), (8240, .4)]
        for f, a in parts:
            s += a * np.sin(2 * np.pi * f * t + r.uniform(0, 6))
        return s * np.exp(-t / (0.4 if name == "manjira" else 0.15)) * (1 - np.exp(-t / 0.001)) * 0.06 * v
    if name in ("ghungroo", "bangles", "bangles_big"):
        n = int((0.5 if name == "bangles_big" else 0.2) * SR)
        t = np.arange(n) / SR
        s = np.zeros(n)
        count, spread, lo, hi = {"ghungroo": (7, 0.025, 5200, 9500), "bangles": (6, 0.05, 2400, 6200),
                                 "bangles_big": (16, 0.25, 2200, 6600)}[name]
        for _ in range(count):
            off = int(r.uniform(0, spread) * SR)
            f = r.uniform(lo, hi)
            b = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t / (0.06 if "bangles" in name else 0.03))
            s[off:] += b[: n - off] * r.uniform(0.5, 1)
        return s * (0.035 if name == "ghungroo" else 0.05) * v
    if name in ("shaker", "sticks"):
        n = int(0.12 * SR)
        t = np.arange(n) / SR
        if name == "shaker":
            s = bandpass(r.standard_normal(n), 4000, 12000) * np.exp(-t / 0.025) * np.clip(t / 0.008, 0, 1)
            return s * 0.06 * v
        s = np.sin(2 * np.pi * 1850 * t) * np.exp(-t / 0.018) + 0.5 * np.sin(2 * np.pi * 2990 * t) * np.exp(-t / 0.01)
        return s * 0.14 * v
    if name == "splash":
        n = int(0.6 * SR)
        t = np.arange(n) / SR
        s = bandpass(r.standard_normal(n), 300, 5000) * np.exp(-t / 0.13) * np.clip(t / 0.02, 0, 1)
        return s * 0.12 * v
    raise KeyError(name)


def fx(name):
    r = rng
    if name == "bell":
        n = int(3.5 * SR)
        t = np.arange(n) / SR
        s = np.zeros(n)
        f = 1174.7
        for ratio, a, dec in [(1, 1, 1.4), (2.76, .5, .8), (5.4, .25, .45), (8.93, .12, .3), (.5, .3, 2)]:
            s += a * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / dec)
        return s * (1 - np.exp(-t / 0.002)) * 0.07
    if name == "conch":
        n = int(2.6 * SR)
        t = np.arange(n) / SR
        f = 233 * (1 + 0.012 * np.sin(2 * np.pi * 4.5 * t) * np.clip(t - 0.4, 0, 1))
        ph = 2 * np.pi * np.cumsum(f) / SR
        s = sum(np.sin(k * ph) / k ** 0.8 for k in range(1, 10))
        return s * np.clip(t / 0.6, 0, 1) * np.clip((2.6 - t) / 0.7, 0, 1) * 0.05
    if name == "drop":
        n = int(0.12 * SR)
        t = np.arange(n) / SR
        f = 700 + 1300 * (t / 0.12) ** 0.6
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.03) * 0.08
    if name == "bird":
        s = np.zeros(int(0.7 * SR))
        t0 = 0
        for _ in range(r.integers(2, 5)):
            n = int(r.uniform(0.06, 0.11) * SR)
            t = np.arange(n) / SR
            f = r.uniform(2800, 3600) + 1200 * np.sin(2 * np.pi * r.uniform(18, 30) * t)
            c = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1]) ** 2
            s[t0:t0 + n] += c
            t0 += n + int(r.uniform(0.02, 0.06) * SR)
        return s * 0.035
    if name == "peacock":  # the "may-awe" call
        n = int(0.75 * SR)
        t = np.arange(n) / SR
        f = 620 + 520 * np.sin(np.pi * np.clip(t / 0.5, 0, 1)) ** 1.5
        ph = 2 * np.pi * np.cumsum(f) / SR
        s = sum(np.sin(k * ph) / k ** 0.6 for k in range(1, 8))
        return s * np.sin(np.pi * t / t[-1]) ** 0.6 * 0.04
    if name == "whoosh":
        n = int(0.9 * SR)
        t = np.arange(n) / SR
        nz = r.standard_normal(n)
        out = np.zeros(n)
        for k in range(6):  # rising band sweep
            seg = slice(k * n // 6, (k + 1) * n // 6)
            out[seg] = bandpass(nz, 400 + 900 * k, 1400 + 1600 * k)[seg]
        return out * np.sin(np.pi * t / t[-1]) ** 2 * 0.12
    if name == "thunder":
        n = int(3.5 * SR)
        t = np.arange(n) / SR
        s = bandpass(r.standard_normal(n), 25, 220) * (np.exp(-t / 1.1) * (1 - np.exp(-t / 0.15)))
        return s * 0.5
    if name == "sticks_roll":
        out = np.zeros(int(0.5 * SR))
        for k in range(6):
            sn = drum("sticks", 0.5 + 0.1 * k)
            i = int(k * 0.06 * SR)
            out[i:i + len(sn)] += sn[: len(out) - i]
        return out
    if name == "bangles_big":
        return drum("bangles_big", 1.2)
    raise KeyError(name)


def swell(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    nz = bandpass(rng.standard_normal(n), 800, 12000)
    return nz * (t / dur) ** 2.5 * 0.05


# ---------------------------------------------------------------- render
def render(slug, out):
    style = STYLES[PAINTINGS[slug]["music"]]
    beat = 60 / style["bpm"]  # a quarter note, or an eighth in 12/8
    bar = beat * style["beats"]
    bars = sum(b for _, b in SCENE_BARS)
    assert bars == len(LEVELS)
    dur = bars * bar
    N = int(dur * SR)
    L = np.zeros(N)
    R = np.zeros(N)

    def add(sig, t0, pan=0.0, gain=1.0):
        i0 = int(t0 * SR)
        if i0 >= N or i0 < 0:
            return
        sig = sig[: N - i0] * gain
        L[i0:i0 + len(sig)] += sig * np.cos((pan + 1) * np.pi / 4)
        R[i0:i0 + len(sig)] += sig * np.sin((pan + 1) * np.pi / 4)

    sa = style["sa"]
    steps = style["steps"]
    step = bar / steps

    def step_time(b, i):
        t = b * bar + i * step
        if i % 2 == 1:
            t += style["swing"] * step
        return t + rng.uniform(-0.003, 0.003)

    # melody
    phrases = {k: parse(style[k]) for k in ("A", "B", "C")}
    per_bar = style["beats"]
    a1, acc = [], 0.0
    for sw, b in phrases["A"]:
        if acc >= per_bar:
            break
        a1.append((sw, b))
        acc += b
    phrases["A1"] = a1
    for start, ph, who in MELODY_PLAN:
        seq = phrases[ph]
        t0 = start * bar
        players = {"intro": [("answer", 0.55)], "lead": [("lead", 1.0)], "answer": [("answer", 1.0)],
                   "both": [("lead", 0.9), ("answer", 0.7)], "soft": [("answer", 0.6)]}[who]
        for role, g in players:
            inst = style[role]
            if inst in ("bansuri", "shehnai"):
                add(wind(seq, beat, sa, inst, g), t0, 0.05 if role == "lead" else -0.15)
            else:
                t = t0
                for sw, b in seq:
                    if sw != "-":
                        add(pluck(freq(sw, sa), inst), t, -0.25, g * 1.1)
                    t += b * beat

    # ostinato plucks (eighth notes; 12/8 already in eighths)
    ost = style["ostinato"].split()
    per = bar / len(ost)
    for b in range(bars - 1):
        g = {1: 0.5, 1.5: 0.45, 2: 0.6, 3: 0.75}[LEVELS[b]]
        for i, sw in enumerate(ost):
            add(pluck(freq(sw, sa * style["pluck_oct"]), style["pluck"]), b * bar + i * per, 0.4 if i % 2 else 0.2, g)
    for i, sw in enumerate(["S", "G" if "G" in style["A"] else "g", "P", "S'"]):
        add(pluck(freq(sw, sa * style["pluck_oct"]), style["pluck"]), (bars - 1) * bar + i * 0.09, 0.3, 0.8)

    # bass, harmonium, drone
    for b in range(2, bars - 1):
        for i, ch in enumerate(style["bass"]):
            if ch != ".":
                add(bass_note(freq(ch, sa * style["bass_oct"])), step_time(b, i), 0, 0.9 if LEVELS[b] >= 2 else 0.6)
        if style.get("harmonium") and LEVELS[b] >= 2:
            add(harmonium_chord([sa / 2, sa / 2 * 1.5, sa], bar), b * bar, -0.3)
    add(bass_note(sa * style["bass_oct"]), (bars - 1) * bar, 0, 1.2)
    t = 0.0
    k = 0
    while t < dur - 1:
        f = [sa / 2 * 1.5 / 2, sa / 2, sa / 2, sa / 4][k % 4]
        add(tanpura(f, 4.0), t, [-0.3, -0.1, 0.1, 0.3][k % 4])
        t += bar / 2
        k += 1

    # percussion
    for b in range(bars - 1):
        lvl = LEVELS[b]
        for name, (pat, need) in style["drums"].items():
            if lvl < need:
                continue
            for i, ch in enumerate(pat):
                if ch == ".":
                    continue
                if name == "splash":
                    add(drum(name, int(ch) / 9), step_time(b, i), rng.uniform(-0.5, 0.5))
                else:
                    pan = {"clap": 0.0, "shaker": 0.45, "ghungroo": 0.5, "bangles": -0.4, "manjira": -0.4,
                           "ting": 0.35, "sticks": -0.3}.get(name, 0.05)
                    add(drum(name, int(ch) / 9), step_time(b, i), pan)
        if b in FILL_BARS:  # playful roll into the next section
            roll = [k for k in style["drums"] if k.endswith(("tin", "ta", "crack"))][0]
            n_hits = 6 if steps == 12 else 8
            for j in range(n_hits):
                add(drum(roll, 0.45 + 0.07 * j), b * bar + bar * (1 - n_hits / (2 * steps)) + j * step / 2, 0.1)
    # final hit
    bass_drum = [k for k in style["drums"] if k.endswith(("bass", "boom"))][0]
    add(drum(bass_drum, 1.3), (bars - 1) * bar)
    add(drum("clap", 0.8), (bars - 1) * bar)

    # accents on scene starts + risers into the title, elements and CTA
    t = 0
    for name, nb in SCENE_BARS:
        add(fx(style["accent"]), t * bar, -0.2, 0.9)
        if name in ("title", "elements", "cta"):
            add(swell(bar * 0.9), t * bar - bar * 0.9)
        t += nb
    add(fx("bell"), (bars - 1) * bar, 0.2, 1.1)

    # painting-specific atmosphere
    for f in style["fx"]:
        if f == "conch":
            add(fx("conch"), 0.0, 0, 1.0)
            add(fx("conch"), 19 * bar - 0.4, 0, 0.7)
        elif f == "drops":
            for _ in range(int(dur * 1.2)):
                add(fx("drop"), rng.uniform(0, dur - 1), rng.uniform(-0.7, 0.7), rng.uniform(0.4, 1))
        elif f == "birds":
            for _ in range(int(dur / 2.2)):
                add(fx("bird"), rng.uniform(0, dur - 1), rng.uniform(-0.8, 0.8), rng.uniform(0.5, 1))
        elif f == "peacock":
            for b in (0, 7, 12, 19):
                add(fx("peacock"), b * bar + bar * 0.5, 0.5, 1.0)
        elif f == "thunder":
            add(fx("thunder"), 0.0, 0, 1.0)
            add(fx("thunder"), 16 * bar, 0, 0.5)
        elif f == "rain":
            n = N
            nz = bandpass(rng.standard_normal(n), 2500, 9000)
            env = 0.006 * (1 + 0.3 * np.sin(2 * np.pi * np.arange(n) / SR / 7))
            L[:] += nz * env
            R[:] += np.roll(nz, 2000) * env
            for _ in range(int(dur * 3)):
                add(fx("drop"), rng.uniform(0, dur - 1), rng.uniform(-0.8, 0.8), rng.uniform(0.2, 0.5))
        elif f == "crackle":
            cr = np.zeros(N)
            for _ in range(int(dur * 15)):
                i = int(rng.uniform(0, N - 2000))
                m = int(rng.uniform(80, 900))
                cr[i:i + m] += rng.standard_normal(m) * np.exp(-np.arange(m) / (m / 4)) * rng.uniform(0.01, 0.07)
            rumble = bandpass(rng.standard_normal(N), 40, 300) * 0.03
            L[:] += cr + rumble
            R[:] += np.roll(cr, 300) + rumble

    # reverb + master
    def reverb(x, seed, rt=1.4, wet=0.18):
        r = np.random.default_rng(seed)
        n = int(rt * SR)
        tt = np.arange(n) / SR
        ir = r.standard_normal(n) * np.exp(-tt * 6.9 / rt)
        ir = np.convolve(ir, np.ones(5) / 5, mode="same")
        ir[: int(0.012 * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2))
        m = len(x) + n
        nfft = 1 << (m - 1).bit_length()
        return x + wet * np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]

    L = reverb(L, 1)
    R = reverb(R, 2)
    t = np.arange(N) / SR
    env = np.clip(t / 0.05, 0, 1) * np.clip((dur - t) / 1.6, 0, 1) ** 1.3
    L *= env
    R *= env
    peak = max(np.abs(L).max(), np.abs(R).max())
    L, R = np.tanh(L / peak * 1.1) / np.tanh(1.1), np.tanh(R / peak * 1.1) / np.tanh(1.1)
    data = (np.stack([L, R], 1) * 32767 * 0.9).astype(np.int16)
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    return dur


def bar_seconds(slug):
    style = STYLES[PAINTINGS[slug]["music"]]
    return 60 / style["bpm"] * style["beats"]


if __name__ == "__main__":
    print("wrote", sys.argv[2], render(sys.argv[1], sys.argv[2]), "s")
