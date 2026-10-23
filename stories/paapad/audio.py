"""Builds the soundtrack for one style: dialogue + sound effects + a synthesised music bed.

Usage: python3 audio.py STYLE OUT.wav
Everything except the voices is synthesised here (no samples, nothing to license).
"""
import json
import os
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

from script import FAR, SHOUT

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
SR = 48000
TL = json.load(open(os.path.join(BUILD, "timeline.json")))
DUR = TL["duration"]
N = int(DUR * SR) + SR
LINES = {l["id"]: l for l in TL["lines"]}
T = lambda i: LINES[i]["start"]
E = lambda i: LINES[i]["end"]
rs = np.random.RandomState(7)


# ---------- dsp ----------
def filt(x, kind, f, order=2):
    w = [v / (SR / 2) for v in f] if isinstance(f, (list, tuple)) else f / (SR / 2)
    sos = butter(order, w, btype=kind, output="sos")
    return sosfilt(sos, x)


def ir(sec, damp=3000, seed=1):
    r = np.random.RandomState(seed)
    n = int(sec * SR)
    e = np.exp(-np.linspace(0, 7, n))
    return filt(r.randn(n) * e, "low", damp) * 0.1


def reverb(x, sec=1.2, mix=0.25, damp=3000):
    wet = fftconvolve(x, ir(sec, damp))[: len(x)]
    return x * (1 - mix) + wet * mix * 3


def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def put(buf, x, t, g=1.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(x) <= 0:
        return
    j = min(len(buf), i + len(x))
    buf[i:j] += x[: j - i] * g


def mixa(*xs):
    out = np.zeros(max(len(x) for x in xs))
    for x in xs:
        out[: len(x)] += x
    return out


def hz(semi, base=146.83):
    return base * 2 ** (semi / 12)


# ---------- instruments ----------
def pluck(f, dur=1.2, bright=0.5, decay=0.996):
    n = int(dur * SR)
    p = max(2, int(SR / f))
    y = np.zeros(n + p)
    y[:p] = filt(rs.uniform(-1, 1, p), "low", 1000 + bright * 8000)
    for s in range(p, n + p, p):
        prev = y[s - p:s]
        nxt = 0.5 * (prev + np.roll(prev, 1)) * decay
        y[s:s + p] = nxt[: len(y[s:s + p])]
    return y[p:] * env(n, 0.001, dur / 2)


def bell(f, dur=1.5, idx=3, ratio=1.4):
    t = np.arange(int(dur * SR)) / SR
    e = np.exp(-t / (dur / 3))
    return np.sin(2 * np.pi * f * t + idx * e * np.sin(2 * np.pi * f * ratio * t)) * e


def epiano(f, dur=0.9):
    t = np.arange(int(dur * SR)) / SR
    e = np.exp(-t / 0.5)
    return (np.sin(2 * np.pi * f * t + 1.8 * np.exp(-t / 0.15) * np.sin(2 * np.pi * f * t)) * e
            + 0.3 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.2))


def saw(f, dur, det=0.0):
    t = np.arange(int(dur * SR)) / SR
    out = 0
    for d in (-det, 0, det):
        ph = (t * f * (1 + d)) % 1
        out = out + (2 * ph - 1)
    return out / 3


def pad(f, dur, cutoff=1400, det=0.006, a=0.4):
    x = saw(f, dur, det) + 0.5 * saw(f / 2, dur, det)
    x = filt(x, "low", cutoff)
    n = len(x)
    rel = np.minimum(1, (n - np.arange(n)) / (0.4 * SR))
    return x * np.minimum(1, np.arange(n) / (a * SR)) * rel


def drum(f0, f1, dur, noise=0.0, nd=0.02):
    t = np.arange(int(dur * SR)) / SR
    fr = f1 + (f0 - f1) * np.exp(-t / 0.03)
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / (dur / 4))
    if noise:
        x += noise * rs.randn(len(t)) * np.exp(-t / nd)
    return x


def tabla_na(f=520):
    x = drum(f * 1.02, f, 0.35, 0.4, 0.01) * 0.7
    x[: int(0.2 * SR)] += bell(f * 2.7, 0.2, 1, 1.5) * 0.15
    return x


def tabla_ge(f=110):
    t = np.arange(int(0.6 * SR)) / SR
    fr = f * (1 + 0.35 * (1 - np.exp(-t / 0.12)))   # pitch bend up
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.18)


def shaker(dur=0.08):
    return filt(rs.randn(int(dur * SR)), "high", 5000) * env(int(dur * SR), 0.003, dur / 3)


def clap():
    x = np.zeros(int(0.25 * SR))
    for k in range(3):
        put(x, filt(rs.randn(int(0.02 * SR)), "band", [900, 3000]), k * 0.01)
    put(x, filt(rs.randn(int(0.2 * SR)), "band", [900, 3000]) * env(int(0.2 * SR), 0.001, 0.05), 0.03)
    return x


def woodblock(f=900):
    return drum(f, f * 0.98, 0.12, 0.2, 0.004)


def tick():
    return filt(rs.randn(int(0.01 * SR)), "high", 3000) * env(int(0.01 * SR), 0.0005, 0.002)


def drone(base, dur, cutoff=900):
    x = 0
    for s, g in ((0, 1), (7, 0.6), (12, 0.7), (19, 0.25)):
        x = x + saw(hz(s, base), dur, 0.003) * g
    x = filt(x, "low", cutoff)
    t = np.arange(len(x)) / SR
    return x * (0.75 + 0.25 * np.sin(2 * np.pi * 0.23 * t))


def tanpura(base, dur):
    out = np.zeros(int(dur * SR) + SR)
    step = 0.7
    seq = [7 - 12, 0, 0, -12]
    k = 0
    t = 0.0
    while t < dur:
        put(out, pluck(hz(seq[k % 4], base), 2.6, 0.9, 0.9995) * 0.5, t)
        t += step
        k += 1
    return filt(out[: int(dur * SR)], "low", 4000)


# ---------- sound effects ----------
def sfx_track(style):
    fx = np.zeros(N)
    # kitchen room tone (fridge hum) under the story
    t = np.arange(N) / SR
    hum = (np.sin(2 * np.pi * 50 * t) * 0.3 + np.sin(2 * np.pi * 100 * t) * 0.2 + filt(rs.randn(N), "low", 300) * 0.4)
    room = np.clip((t - TL["lead_in"] + 0.5) / 1.0, 0, 1) * np.clip((TL["end_card"] - t) / 0.8, 0, 1)
    fx += hum * room * 0.012
    # chopping on the board
    tc = 1.1
    while tc < T("k02") - 0.2:
        put(fx, mixa(drum(220, 140, 0.12, 1.0, 0.006) * 0.35, woodblock(700) * 0.15), tc)
        tc += 0.42 + rs.uniform(-0.03, 0.03)
    # rain from the balcony as Jyotsna walks in
    a, b = T("j01") - 2.0, T("k04") + 0.5
    n = int((b - a) * SR)
    rain = filt(rs.randn(n), "band", [800, 7000]) * 0.5
    drops = np.zeros(n)
    for _ in range(int((b - a) * 40)):
        put(drops, tick() * rs.uniform(0.3, 1), rs.uniform(0, b - a))
    shape = np.minimum(1, np.minimum(np.arange(n) / (1.2 * SR), (n - np.arange(n)) / (1.5 * SR)))
    put(fx, (rain + drops * 0.6) * shape * 0.11, a)
    # footsteps in
    for k in range(5):
        put(fx, drum(160, 90, 0.15, 0.3, 0.01) * 0.25, a + 1.0 + k * 0.38)
    # fridge door: latch pop, rubber seal, louder hum
    td = E("j09") + 0.1
    put(fx, drum(120, 60, 0.3, 0.8, 0.02) * 0.5, td)
    put(fx, filt(rs.randn(int(0.5 * SR)), "band", [200, 1200]) * env(int(0.5 * SR), 0.05, 0.12) * 0.25, td + 0.05)
    n = int(5.0 * SR)
    put(fx, (np.sin(2 * np.pi * 120 * np.arange(n) / SR) * 0.4 + filt(rs.randn(n), "low", 500)) * env(n, 0.3, 3) * 0.05, td)
    # door closes before Sunday
    put(fx, drum(100, 50, 0.3, 0.8, 0.02) * 0.4, T("j11") - 0.3)
    # the yell rattles the kitchen: utensils
    for k in range(6):
        put(fx, bell(rs.uniform(1800, 3200), 0.5, 2, 1.41) * 0.06, T("j14") + 0.05 + k * 0.05)
    return fx


# ---------- dialogue ----------
def dialogue(style):
    d = np.zeros(N)
    for l in TL["lines"]:
        x, sr = sf.read(os.path.join(BUILD, "voice", l["id"] + ".wav"), dtype="float32")
        x = x.astype(np.float64)
        if l["id"] in FAR:
            x = reverb(filt(x, "band", [300, 3000]), 1.4, 0.5) * 0.55
        if l["id"] in SHOUT:
            x = np.tanh(x * 4) * 0.6
            x = reverb(x, 1.8, 0.35)
        if style == "07-doordarshan":
            x = filt(x, "band", [250, 4500]) * 1.2
        elif style == "04-shadow-theatre":
            x = reverb(x, 0.9, 0.12, 4000)
        put(d, x, l["start"], 1.0)
    return d


# ---------- music per style ----------
def music(style):
    m = np.zeros(N)
    end = DUR

    def every(step, start=0.0, stop=end):
        t = start
        while t < stop:
            yield t
            t += step

    if style == "01-paper-desk":
        bpm = 112; b = 60 / bpm; base = 196.0  # G major pentatonic, pizzicato + woodblock
        mel = [0, 4, 7, 9, 7, 4, 2, 4, 0, 2, 4, 7, 12, 9, 7, 4]
        bass = [0, 0, 7, 7, 5, 5, 7, 7]
        for k, t in enumerate(every(b / 2)):
            if k % 2 == 0:
                put(m, pluck(hz(bass[(k // 4) % 8] - 12, base), 0.5, 0.3) * 0.5, t)
            if k % 3 != 2:
                put(m, pluck(hz(mel[k % 16], base), 0.35, 0.7) * 0.28, t)
            if k % 4 == 2:
                put(m, woodblock(1200) * 0.12, t)
            put(m, tick() * 0.05, t + b / 4)
        stings = [(TL["lead_in"] - 0.4, [0, 4, 7, 12]), (T("j10") + 0.5, [12, 6, 0, -6]), (T("j14"), [-12, -11, -12])]
        for t0, notes in stings:
            for i, s in enumerate(notes):
                put(m, pluck(hz(s, base), 0.6, 1.0) * 0.5, t0 + i * 0.07)
        # stamp thumps
        for t0 in (T("k05") + 0.6, T("j10") + 0.5, T("j12"), T("j13") + 1.2):
            put(m, drum(90, 50, 0.25, 0.6, 0.02) * 0.6, t0)

    elif style == "02-kalighat":
        bpm = 96; b = 60 / bpm; base = 146.83  # D Kafi: harmonium drone + dholak keherwa
        m += np.pad(drone(base / 2, end, 1100), (0, N - int(end * SR)))[:N] * 0.10
        kw = "ge na ti na na ka dhi na".split()
        for k, t in enumerate(every(b / 2)):
            s = kw[k % 8]
            if s in ("ge", "dhi"):
                put(m, tabla_ge(98) * 0.45, t)
            if s in ("na", "dhi"):
                put(m, tabla_na(470) * 0.25, t)
            if s in ("ti", "ka"):
                put(m, drum(700, 650, 0.08, 0.6, 0.006) * 0.15, t)
        phr = [0, 2, 3, 5, 7, 5, 3, 2, 0, -2, 0, 3]
        for k, t in enumerate(every(b * 2, 0, end)):
            if (k // 6) % 2 == 0:
                put(m, pad(hz(phr[k % 12] + 12, base), b * 1.9, 2200, 0.004, 0.05) * 0.06, t)
        for t0 in (0.2, T("j10") + 0.5, T("j14")):
            put(m, mixa(tabla_ge(80) * 0.8, drum(300, 120, 0.4, 0.5, 0.03) * 0.3), t0)

    elif style == "03-hoarding":
        bpm = 120; b = 60 / bpm; base = 130.81  # filmi melodrama: string swells, timpani, tabla rolls
        chords = [[0, 3, 7], [8, 12, 15], [5, 8, 12], [7, 11, 14]]
        for k, t in enumerate(every(b * 4)):
            ch = chords[k % 4]
            for s in ch:
                put(m, pad(hz(s, base), b * 4.2, 1800, 0.008, 0.6) * 0.045, t)
            put(m, drum(80, 55, 0.6, 0.2, 0.05) * 0.5, t)
        for k, t in enumerate(every(b / 2)):
            if k % 8 in (0, 3, 6):
                put(m, tabla_ge(105) * 0.25, t)
            if k % 8 in (2, 4, 5, 7):
                put(m, tabla_na(520) * 0.14, t)
        for t0 in (0.15, T("j07"), E("j09") + 0.1, T("j10") + 0.5, T("j12"), T("j14")):
            put(m, drum(70, 40, 1.2, 0.8, 0.1) * 0.9, t0)          # dhishoom
            for s in (0, 1, 0, -1):
                put(m, pad(hz(s + 12, base), 1.2, 3000, 0.01, 0.01) * 0.08, t0)
        # tremolo strings under the expiry reveal
        a = E("j09") + 0.1
        n = int(3.5 * SR)
        trem = pad(hz(1, base), 3.5, 2500, 0.01, 0.2)[:n] * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 14 * np.arange(n) / SR)))
        put(m, trem * 0.12, a)
        m *= 0.6

    elif style == "04-shadow-theatre":
        bpm = 80; b = 60 / bpm; base = 138.59  # tanpura, soft mridangam, temple bells
        m += np.pad(tanpura(base, end), (0, N))[:N] * 0.16
        for k, t in enumerate(every(b)):
            if k % 4 == 0:
                put(m, tabla_ge(90) * 0.3, t)
            if k % 4 == 2:
                put(m, tabla_na(380) * 0.12, t)
            if k % 8 == 7:
                put(m, bell(hz(24, base), 2.5, 2, 2.76) * 0.04, t)
        for t0 in (0.2, E("j09") + 0.1, T("j14"), TL["end_card"]):
            put(m, mixa(bell(hz(12, base), 3.5, 4, 2.76) * 0.14, bell(hz(19, base), 3, 3, 3.1) * 0.06), t0)

    elif style == "05-object-witness":
        bpm = 100; b = 60 / bpm; base = 110.0  # clock tick, sub pulse, glassy plucks
        for k, t in enumerate(every(b / 2)):
            put(m, tick() * (0.18 if k % 2 == 0 else 0.1), t)
            if k % 4 == 0:
                put(m, drum(55, 45, 0.5, 0, 0.01) * 0.5, t)
        gl = [12, 19, 15, 24, 22, 15]
        for k, t in enumerate(every(b * 2, 0, end)):
            put(m, bell(hz(gl[k % 6], base), 1.6, 1.2, 2.0) * 0.05, t + b * 0.5)
        for t0 in (E("j09") + 0.1, T("j10") + 0.5, T("j14")):
            put(m, drum(50, 30, 1.5, 0.3, 0.1) * 0.8, t0)
            put(m, bell(hz(13, base), 2.5, 5, 1.41) * 0.1, t0)

    elif style == "06-riso-comic":
        bpm = 124; b = 60 / bpm; base = 174.61  # bouncy marimba + bass + claps
        bassl = [0, 0, 12, 0, 5, 5, 17, 5, 7, 7, 19, 7, 5, 5, 3, 2]
        mar = [12, 16, 19, 16, 21, 19, 16, 12]
        for k, t in enumerate(every(b / 2)):
            put(m, drum(hz(bassl[k % 16] - 24, base) * 1.0, hz(bassl[k % 16] - 24, base), 0.25, 0, 0.01) * 0.35, t)
            if k % 4 == 2:
                put(m, clap() * 0.22, t)
            if k % 2 == 1:
                put(m, shaker() * 0.06, t)
            if k % 8 in (0, 3, 5):
                put(m, bell(hz(mar[k % 8], base), 0.4, 0.8, 4.0) * 0.12, t)
        for t0 in (0.2, E("j09") + 0.1, T("j10") + 0.5, T("j13") + 0.6, T("j14")):
            for i, s in enumerate((0, 7, 12, 19)):
                put(m, bell(hz(s + 12, base), 0.5, 0.8, 4.0) * 0.2, t0 + i * 0.05)
            put(m, clap() * 0.3, t0)

    elif style == "07-doordarshan":
        bpm = 100; b = 60 / bpm; base = 220.0  # FM e-piano serial theme, casio drums, tape hiss
        prog = [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]]
        for k, t in enumerate(every(b * 2)):
            for s in prog[(k // 2) % 4]:
                put(m, epiano(hz(s - 12, base), b * 2) * 0.05, t)
        for k, t in enumerate(every(b / 2)):
            if k % 4 == 0:
                put(m, drum(150, 55, 0.25, 0.1, 0.01) * 0.35, t)
            if k % 4 == 2:
                put(m, filt(rs.randn(int(0.12 * SR)), "band", [1500, 6000]) * env(int(0.12 * SR), 0.001, 0.04) * 0.2, t)
            put(m, shaker(0.04) * 0.05, t)
        theme = [7, 9, 12, 16, 14, 12, 9, 12]
        for i, s in enumerate(theme):
            put(m, epiano(hz(s, base), 0.6) * 0.18, 0.1 + i * b / 2)
            put(m, epiano(hz(s, base), 0.6) * 0.14, TL["end_card"] + 0.1 + i * b / 2)
        hiss = filt(rs.randn(N), "high", 4000) * 0.012
        m += hiss
        # signal dropout + 1 kHz tone on the yell ("rukawat ke liye khed hai")
        t0 = T("j14") + 0.95
        n = int(2.2 * SR)
        put(m, np.sin(2 * np.pi * 1000 * np.arange(n) / SR) * 0.08, t0)
    return m


def main():
    style, out = sys.argv[1], sys.argv[2]
    d = dialogue(style)
    fx = sfx_track(style)
    mu = music(style)
    # duck music under speech
    act = np.zeros(N)
    for l in TL["lines"]:
        a, b = int((l["start"] - 0.15) * SR), int((l["end"] + 0.25) * SR)
        act[max(0, a):b] = 1
    k = int(0.12 * SR)
    act = np.convolve(act, np.ones(k) / k, mode="same")
    mix = d * 1.0 + fx * 2.0 + mu * (1 - 0.55 * act) * 0.9
    # fade out the tail
    n = int(DUR * SR)
    mix = mix[:n]
    fade = int(1.5 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.9
    st = np.stack([mix, mix], 1).astype(np.float32)
    tmp = out + ".raw.wav"
    sf.write(tmp, st, SR)
    os.system(f'ffmpeg -y -loglevel error -i "{tmp}" -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 "{out}"')
    os.remove(tmp)
    print("wrote", out)


if __name__ == "__main__":
    main()
