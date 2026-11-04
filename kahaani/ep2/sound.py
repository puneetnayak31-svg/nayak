"""Quiet, formal sound bed for the 1985 segment (synthesised: nothing to license).

    python3 sound.py a|b OUT.wav

Layers, all well under the voice:
  * a slow ambient pad (sustained chords, no melody or beat)
  * distant stadium ambience, only while a cutaway shows the stadium / archive
  * a soft 'air' swell as each cutaway opens and closes
  * version B only: diegetic touches (bulb relays on the scoreboard, a faint engine for the lap, paper for the calendar)
"""
import math
import sys
import wave

import numpy as np

SR = 48000
T0, T1 = 1286.5, 1424.5
rng = np.random.default_rng(11)
N = int((T1 - T0) * SR)


def band(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / (1 + (lo / np.maximum(f, 1)) ** 4)) * (1 / (1 + (f / hi) ** 4))
    return np.fft.irfft(X, len(x))


def norm(x):
    return x / (np.abs(x).max() + 1e-9)


def env_curve(points):
    tt = T0 + np.arange(N) / SR
    return np.interp(tt, [p[0] for p in points], [p[1] for p in points])


def add(buf, sig, at, gain=1.0):
    i = int((at - T0) * SR)
    if i < 0:
        sig, i = sig[-i:], 0
    n = min(len(sig), len(buf) - i)
    if n > 0:
        buf[i:i + n] += sig[:n] * gain


def pad():
    """Dmaj9 → Bm9 → Gmaj7 → A(add9), 8 s each, soft sine/triangle voices, slow swells."""
    chords = [[146.83, 220.0, 277.18, 329.63, 369.99], [123.47, 185.0, 220.0, 293.66, 277.18],
              [98.0, 196.0, 246.94, 293.66, 369.99], [110.0, 164.81, 220.0, 246.94, 277.18]]
    tt = np.arange(N) / SR
    out = np.zeros(N)
    dur = 8.0
    for k in range(int((T1 - T0) / dur) + 2):
        ch = chords[k % 4]
        t0 = k * dur - 1.5
        e = np.clip((tt - t0) / 2.5, 0, 1) * np.clip((t0 + dur + 3.0 - tt) / 2.5, 0, 1)
        e = np.sin(e * np.pi / 2) ** 2
        for j, f in enumerate(ch):
            det = 1 + 0.0015 * (j - 2)
            v = np.sin(2 * np.pi * f * det * tt + j) + 0.25 * np.sin(2 * np.pi * 2 * f * det * tt)
            out += v * e * (0.9 if j == 0 else 0.55)
    out = band(out, 60, 1400)
    slow = 0.85 + 0.15 * np.sin(2 * np.pi * tt / 23)
    return norm(out * slow)


def crowd():
    x = band(rng.normal(0, 1, N), 220, 2400)
    tt = np.arange(N) / SR
    mod = 0.8 + 0.2 * np.sin(2 * np.pi * 0.31 * tt) * np.sin(2 * np.pi * 0.07 * tt + 1)
    return norm(x * mod)


def air(dur=1.0):
    n = int(dur * SR)
    x = norm(band(rng.normal(0, 1, n), 400, 6000))
    e = np.sin(np.linspace(0, np.pi, n)) ** 2
    return x * e


def relay_ticks(dur=0.9, count=26):
    n = int(dur * SR)
    out = np.zeros(n)
    for k in range(count):
        i = int(k / count * n + rng.uniform(0, 300))
        m = 240
        if i + m < n:
            out[i:i + m] += rng.normal(0, 1, m) * np.exp(-np.arange(m) / 40) * rng.uniform(0.4, 1)
    return norm(band(out, 1500, 7000))


def engine(dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = 46 + 6 * np.clip(tt / 2, 0, 1)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * band(rng.normal(0, 1, n), 60, 300)
    e = np.clip(tt / 0.8, 0, 1) * np.clip((dur - tt) / 1.2, 0, 1)
    return norm(x) * e


def paper(dur=0.5):
    n = int(dur * SR)
    x = norm(band(rng.normal(0, 1, n), 1200, 9000))
    e = np.sin(np.linspace(0, np.pi, n)) ** 3
    return x * e


def build(version):
    if version == "a":
        cuts = [(1288.12, 1307.35), (1320.6, 1341.3), (1355.85, 1358.98), (1375.0, 1384.8), (1395.31, 1400.94),
                (1412.6, 1423.1)]
        stadium = [(1288.12, 1307.35), (1320.6, 1331.6), (1355.85, 1358.98), (1395.31, 1400.94)]
    else:
        cuts = [(1288.12, 1307.35), (1316.0, 1341.3), (1355.85, 1358.98), (1368.0, 1384.8), (1395.31, 1400.94),
                (1412.6, 1423.1)]
        stadium = [(1288.12, 1307.35), (1316.0, 1341.3), (1355.85, 1358.98), (1375.0, 1384.8), (1395.31, 1400.94)]
    out = np.zeros(N)
    # pad: present throughout, a little fuller during cutaways
    pts = [(T0, 0.0), (T0 + 2, 0.55)]
    for a, b in cuts:
        pts += [(a - 0.5, 0.55), (a + 0.8, 1.0), (b - 0.8, 1.0), (b + 0.5, 0.55)]
    pts += [(T1 - 2, 0.55), (T1, 0.0)]
    pts.sort()
    out += pad() * env_curve(pts) * 0.5
    # stadium ambience
    pts = [(T0, 0)]
    for a, b in stadium:
        pts += [(a - 0.2, 0), (a + 0.8, 1), (b - 0.6, 1), (b + 0.4, 0)]
    pts += [(T1, 0)]
    pts.sort()
    amb = crowd() * env_curve(pts) * 0.45
    if version == "b":     # the lap of honour: the crowd rises a little
        amb *= env_curve([(T0, 1), (1333.0, 1), (1335.5, 1.6), (1340.0, 1.6), (1341.3, 1), (T1, 1)])
    out += amb
    # transitions
    for a, b in cuts:
        add(out, air(1.0), a - 0.2, 0.22)
        add(out, air(1.0), b - 1.0, 0.18)
    if version == "b":
        for at in (1291.6, 1296.6, 1375.4, 1380.1, 1382.2):
            add(out, relay_ticks(), at, 0.12)
        add(out, engine(7.5), 1333.2, 0.22)
        for at in (1416.0, 1418.4):
            add(out, paper(), at, 0.25)
    return out


if __name__ == "__main__":
    version, path = sys.argv[1], sys.argv[2]
    x = build(version)
    x = x / (np.abs(x).max() + 1e-9) * 0.5          # −6 dBFS peak before the mix gain
    st = np.stack([x, np.roll(x, int(0.013 * SR))], 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype(np.int16).tobytes())
    print("wrote", path)
