"""GoBrandToday's signature sound, synthesised from scratch (no samples, nothing to license).

    python3 sound.py OUTDIR          # writes every cue below, mastered to -14 LUFS

Cues
  sonic-logo.wav    the four-note sting on its own (dot, diamond, spark, twin)
  bed-loop.wav      8 bars of the signature groove that loop seamlessly, for future videos
  logo-reveal.wav   6 s score for the logo reveal
  announcement.wav  36 s score for the brand announcement

The sting mirrors the logo motion. Each event lands on a beat at 120 BPM:
  dot      a soft round drop on E5
  diamond  a breathing shimmer that rises to B5
  spark    a bell chord on E6 with a shower of E Lydian sparkles (the A# is the "magic" note)
  twin     a small aqua chime on D#7, echoed

The groove is E Lydian too: Emaj9 | F#/E | C#m9 | Amaj9, glass plucks, a warm pad, sub bass,
a light four-on-the-floor and a tabla accent (na, tin, ghe) as a quiet "made in India" signature.
Video timings live in the CUES dicts below; the compositions use the same numbers.
"""
import os
import subprocess
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
BPM = 120
BEAT = 60 / BPM          # 0.5 s
BAR = 4 * BEAT           # 2 s
S16 = BEAT / 4
RNG = np.random.default_rng(31)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def tt(dur):
    return np.arange(int(round(dur * SR))) / SR


def noise(dur):
    return RNG.standard_normal(int(round(dur * SR)))


def filt(x, kind, f):
    nyq = SR / 2
    if kind == "band":
        sos = butter(2, [f[0] / nyq, min(f[1] / nyq, 0.99)], btype="band", output="sos")
    else:
        sos = butter(2, min(f / nyq, 0.99), btype=kind, output="sos")
    return sosfilt(sos, x)


def sweep_lp(x, f0, f1, block=256):
    """Lowpass whose cutoff moves exponentially from f0 to f1 across the signal."""
    out = np.empty_like(x)
    n = len(x)
    zi = None
    for i in range(0, n, block):
        f = f0 * (f1 / f0) ** (i / max(n - 1, 1))
        sos = butter(2, min(f / (SR / 2), 0.99), btype="low", output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[i:i + block], zi = sosfilt(sos, x[i:i + block], zi=zi)
    return out


def adsr(n, a=0.005, d=0.0, s=1.0, r=0.05):
    env = np.full(n, s, dtype=float)
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    env[:na] = np.linspace(0, 1, na, endpoint=False)
    if nd:
        env[na:na + nd] = np.linspace(1, s, min(nd, max(n - na, 0)))[: len(env[na:na + nd])]
    if nr:
        env[-nr:] *= np.linspace(1, 0, min(nr, n))
    return env


# ------------------------------------------------------------------ instruments
def kick(gain=1.0):
    t = tt(0.42)
    f = 46 + 110 * np.exp(-t / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    click = filt(noise(0.42), "high", 3000) * np.exp(-t / 0.0025) * 0.35
    return np.tanh(1.6 * (body + click)) * gain


def clap(gain=1.0):
    t = tt(0.3)
    x = np.zeros_like(t)
    for k, d in enumerate((0.0, 0.009, 0.018)):
        i = int(d * SR)
        seg = noise(0.3)[: len(t) - i] * np.exp(-t[: len(t) - i] / (0.012 if k < 2 else 0.11))
        x[i:] += seg
    snap = np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.01) * 0.3
    return (filt(x, "band", (900, 5200)) * 0.55 + snap) * gain


def hat(open_=False, gain=1.0):
    d = 0.22 if open_ else 0.045
    t = tt(d)
    return filt(noise(d), "high", 7500) * np.exp(-t / (0.07 if open_ else 0.012)) * 0.5 * gain


def shaker(gain=1.0):
    t = tt(0.07)
    env = np.minimum(t / 0.012, 1) * np.exp(-t / 0.025)
    return filt(noise(0.07), "band", (4800, 11000)) * env * 0.35 * gain


def tabla(stroke, gain=1.0):
    """Dayan strokes na / tin tuned to E, bayan ghe with its rising wrist glide, dha = na + ghe."""
    if stroke == "dha":
        a, b = tabla("na"), tabla("ghe")
        n = max(len(a), len(b))
        return (np.pad(a, (0, n - len(a))) + np.pad(b, (0, n - len(b)))) * gain
    if stroke == "ghe":
        t = tt(0.6)
        f = 82 + 38 * (1 - np.exp(-t / 0.09))
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22) * 0.9 * gain
    f0 = midi(64)  # E4
    dec = 0.09 if stroke == "na" else 0.32
    t = tt(dec * 4)
    x = np.zeros_like(t)
    for h, (amp, dk) in enumerate(((1, 1), (0.6, 0.7), (0.45, 0.5), (0.3, 0.35), (0.18, 0.25)), 1):
        x += amp * np.sin(2 * np.pi * f0 * h * (1 + 0.004 * h) * t) * np.exp(-t / (dec * dk))
    att = filt(noise(dec * 4), "band", (2000, 6000)) * np.exp(-t / 0.004) * 0.4
    return (x * 0.45 + att) * gain


def pluck(n, gain=1.0, dur=0.9):
    """Glass pluck: bright attack, soft hollow body."""
    f = midi(n)
    t = tt(dur)
    x = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.42)
         + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.16)
         + 0.16 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t / 0.07)
         + 0.07 * np.sin(2 * np.pi * 4.2 * f * t) * np.exp(-t / 0.03))
    return x * adsr(len(t), a=0.002, r=0.05) * 0.5 * gain


def bell(n, gain=1.0, dur=2.6):
    """FM bell; the modulation index falls as it rings, so it starts bright and settles."""
    f = midi(n)
    t = tt(dur)
    idx = 2.8 * np.exp(-t / 0.35) + 0.4
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * 3.5 * f * t))
    x += 0.25 * np.sin(2 * np.pi * 2.001 * f * t) * np.exp(-t / 0.5)
    return x * np.exp(-t / 0.9) * adsr(len(t), a=0.001, r=0.2) * 0.42 * gain


def ting(n, gain=1.0):
    f = midi(n)
    t = tt(1.4)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / 0.08)
    return x * np.exp(-t / 0.38) * adsr(len(t), a=0.001, r=0.1) * 0.35 * gain


def drop(n, gain=1.0):
    """The dot: a round water-drop pluck that falls a minor third into its note."""
    t = tt(0.55)
    f = midi(n) * (1 + 0.19 * np.exp(-t / 0.018))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
    thump = np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.07) * 0.5
    return (x * 0.6 + thump) * adsr(len(t), a=0.001, r=0.05) * gain


def pad_chord(notes, dur, gain=1.0, bright=1800.0):
    """Warm detuned-saw pad (band-limited additive saws), slow attack, lowpassed."""
    t = tt(dur)
    x = np.zeros_like(t)
    for n in notes:
        for det in (-0.006, 0.0, 0.0065):
            f = midi(n) * (1 + det)
            ph = RNG.uniform(0, 2 * np.pi)
            for k in range(1, int(5000 / f) + 1):
                x += np.sin(2 * np.pi * k * f * t + ph * k) / k
    x = filt(x, "low", bright) / (len(notes) * 3)
    return x * adsr(len(t), a=min(0.35, dur / 3), r=min(0.4, dur / 3)) * gain


def sub(n, dur, gain=1.0):
    t = tt(dur)
    f = midi(n)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    return np.tanh(1.3 * x) * adsr(len(t), a=0.01, r=0.08) * 0.5 * gain


def riser(dur, gain=1.0):
    t = tt(dur)
    x = sweep_lp(noise(dur), 300, 9000) * (t / dur) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2.5 * t / dur)) / SR) * (t / dur) ** 3 * 0.25
    return (x * 0.35 + tone) * gain


def reverse_whoosh(dur, gain=1.0):
    t = tt(dur)
    x = sweep_lp(noise(dur), 400, 12000) * (t / dur) ** 3
    return x * 0.5 * adsr(len(t), a=0.0, r=0.01) * gain


def whoosh(dur=0.45, gain=1.0):
    t = tt(dur)
    env = np.sin(np.pi * t / dur) ** 2
    x = sweep_lp(noise(dur), 600, 5000) * env
    return filt(x, "high", 250) * 0.4 * gain


def impact(gain=1.0):
    t = tt(1.8)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 40 * np.exp(-t / 0.06)) / SR) * np.exp(-t / 0.6)
    air = filt(noise(1.8), "low", 2500) * np.exp(-t / 0.15) * 0.3
    return np.tanh(1.4 * (boom + air)) * 0.8 * gain


def key_click(gain=1.0):
    t = tt(0.05)
    x = filt(noise(0.05), "band", (1800, 6500)) * np.exp(-t / 0.004)
    thock = np.sin(2 * np.pi * RNG.uniform(180, 260) * t) * np.exp(-t / 0.012) * 0.5
    return (x * 0.55 + thock) * gain * RNG.uniform(0.7, 1.0)


def pop(f0=700, gain=1.0):
    t = tt(0.09)
    f = f0 * (1 + 0.9 * (1 - np.exp(-t / 0.02)))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.03) * 0.45 * gain


def glitch(gain=1.0):
    d = RNG.uniform(0.02, 0.06)
    t = tt(d)
    f = RNG.choice([1400, 2100, 3300, 4700])
    return np.sign(np.sin(2 * np.pi * f * t)) * 0.12 * gain * (t < d * 0.8)


def sparkles(dur=0.9, count=14, gain=1.0):
    """A shower of high E Lydian pings, returned as (offset, signal, pan) events."""
    scale = [88, 90, 92, 94, 95, 97, 99, 100, 102, 104]  # E6 F#6 G#6 A#6 B6 C#7 D#7 E7 F#7 G#7
    ev = []
    for i in range(count):
        off = dur * (i / count) ** 1.4 + RNG.uniform(0, 0.02)
        n = scale[int(RNG.integers(0, len(scale)))]
        ev.append((off, ting(n, gain * RNG.uniform(0.25, 0.55) * (1 - 0.6 * i / count)),
                   float(RNG.uniform(-0.8, 0.8))))
    return ev


# ------------------------------------------------------------------ mixer
class Mix:
    def __init__(self, dur):
        n = int(round(dur * SR)) + SR * 4
        self.n = n
        self.dur = dur
        self.dry = np.zeros((2, n))
        self.duck = np.zeros((2, n))
        self.rev = np.zeros((2, n))
        self.delay = np.zeros((2, n))
        self.side = np.ones(n)

    def add(self, sig, t0, pan=0.0, gain=1.0, rev=0.12, bus="dry", dly=0.0):
        i = int(round(t0 * SR))
        if i >= self.n:
            return
        sig = sig[: self.n - i] * gain
        th = (pan + 1) * np.pi / 4
        lr = np.array([np.cos(th), np.sin(th)])[:, None] * sig[None, :] * 1.4142
        (self.duck if bus == "duck" else self.dry)[:, i:i + len(sig)] += lr
        self.rev[:, i:i + len(sig)] += lr * rev
        if dly:
            self.delay[:, i:i + len(sig)] += lr * dly

    def kick(self, t0, gain=1.0, depth=0.55):
        self.add(kick(gain), t0, rev=0.03)
        i = int(round(t0 * SR))
        t = tt(0.4)
        env = 1 - depth * np.exp(-t / 0.11)
        seg = self.side[i:i + len(env)]
        seg *= env[: len(seg)]

    def render(self, fade=True):
        n = self.n
        dur = 2.4
        t = tt(dur)
        ir = np.stack([filt(noise(dur), "low", 5500) * np.exp(-t / 0.55) for _ in range(2)])
        ir[:, : int(0.012 * SR)] = 0
        send = np.stack([filt(self.rev[c], "high", 320) for c in range(2)])  # no boomy low reverb
        wet = np.stack([fftconvolve(send[c], ir[c])[:n] for c in range(2)]) * 0.13
        d = int(BEAT * 0.75 * SR)
        dl = np.zeros((2, n))
        src = self.delay.copy()
        for k in range(1, 5):
            g = 0.45 ** k
            ch = k % 2
            dl[ch, d * k:] += (src[0, : n - d * k] + src[1, : n - d * k]) * 0.5 * g
        dl = np.stack([filt(dl[c], "low", 6000) for c in range(2)])
        out = self.dry + self.duck * self.side[None, :] + wet + dl
        out = filt(out[0], "high", 32), filt(out[1], "high", 32)
        out = np.stack(out)
        peak = np.max(np.abs(out)) + 1e-9
        out = np.tanh(1.2 * out / peak) / np.tanh(1.2)
        end = int(round(self.dur * SR))
        fade_n = int(0.08 * SR)
        out = out[:, :end]
        if fade:
            out[:, -fade_n:] *= np.linspace(1, 0, fade_n)
        return out


# ------------------------------------------------------------------ music
CHORDS = [  # (pad notes, bass note, arpeggio pool)
    ([52, 56, 59, 63, 66], 28, [64, 68, 71, 75, 78, 80]),   # Emaj9
    ([52, 58, 61, 66, 70], 28, [66, 70, 73, 76, 78, 82]),   # F#/E  (the Lydian lift)
    ([49, 52, 56, 59, 63], 37, [61, 64, 68, 71, 75, 76]),   # C#m9
    ([45, 49, 52, 56, 59], 33, [61, 64, 69, 71, 73, 76]),   # Amaj9
]
ARP = [0, 2, 4, 2, 5, 3, 1, 3, 0, 4, 2, 5, 3, 1, 4, 2]


def sting(m, t0, big=False):
    """The signature. Dot at t0, diamond at +1 beat, spark at +2, twin at +3."""
    m.add(drop(76, 1.0), t0, pan=0.0, rev=0.25, dly=0.12)                  # dot: E5
    sw = pad_chord([71, 76, 83], BEAT * 1.15, 0.5, bright=2600)            # diamond: breathing B5 shimmer
    sw *= np.linspace(0.2, 1, len(sw)) * (1 + 0.25 * np.sin(2 * np.pi * 9 * tt(len(sw) / SR)))
    m.add(sw, t0 + BEAT * 0.9, rev=0.35)
    m.add(riser(BEAT, 0.35), t0 + BEAT, rev=0.2)
    m.add(pluck(83, 0.9), t0 + BEAT, pan=0.2, rev=0.25)
    for n, p in ((88, 0.0), (92, -0.3), (95, 0.3)):                         # spark: E6 G#6 B6 bell chord
        m.add(bell(n, 0.75 if n == 88 else 0.45), t0 + 2 * BEAT, pan=p, rev=0.4, dly=0.15)
    m.add(bell(76, 0.35), t0 + 2 * BEAT, rev=0.3)
    for off, s, p in sparkles(1.2 if big else 0.9, 18 if big else 13):
        m.add(s, t0 + 2 * BEAT + off, pan=p, rev=0.5)
    m.add(impact(0.35 if big else 0.22), t0 + 2 * BEAT, rev=0.05)
    m.add(ting(99, 0.9), t0 + 3 * BEAT, pan=0.45, rev=0.45, dly=0.35)       # twin: D#7, aqua
    m.add(ting(92, 0.35), t0 + 3 * BEAT + 0.01, pan=-0.3, rev=0.4)


def groove_bar(m, t0, ci, level=1.0, drums=True, arp=True, bass=True, pad=True, fill=False):
    pad_n, bass_n, pool = CHORDS[ci % 4]
    if pad:
        m.add(pad_chord(pad_n, BAR + 0.15, 0.55 * level), t0, rev=0.3, bus="duck")
    if bass:
        for b in range(4):
            m.add(sub(bass_n + 12, BEAT * 0.9, 0.85 * level), t0 + b * BEAT, bus="duck", rev=0.0)
    if arp:
        for s in range(16):
            if s in (7, 15) and not fill:
                continue
            acc = 1.0 if s % 4 == 0 else 0.62
            m.add(pluck(pool[ARP[s]], 0.42 * acc * level), t0 + s * S16,
                  pan=0.35 * np.sin(s * 0.9), rev=0.22, bus="duck", dly=0.06)
    if drums:
        for b in range(4):
            m.kick(t0 + b * BEAT, 0.95 * level)
            m.add(hat(True, 0.5 * level), t0 + b * BEAT + BEAT / 2, pan=0.25, rev=0.05)
        for b in (1, 3):
            m.add(clap(0.7 * level), t0 + b * BEAT, pan=-0.05, rev=0.18)
        for s in range(16):
            m.add(shaker((0.9 if s % 2 else 0.55) * level), t0 + s * S16, pan=-0.35, rev=0.02)
        if fill:  # tabla turnaround in the last beat: na na tin dha
            for k, st in enumerate(("na", "na", "tin", "dha")):
                m.add(tabla(st, 0.8 * level), t0 + 3 * BEAT + k * S16, pan=0.15, rev=0.15)
        else:
            m.add(tabla("tin", 0.45 * level), t0 + 2 * BEAT + 3 * S16, pan=0.2, rev=0.15)


def motif(m, t0, gain=0.6):
    """The sting's four notes as a melodic hook (E5 B5 E6 G#6 + twin)."""
    for k, n in enumerate((76, 83, 88, 92)):
        m.add(bell(n, gain * (0.8 if k < 3 else 1.0), dur=1.6), t0 + k * BEAT, pan=0.1 * k - 0.15,
              rev=0.3, dly=0.12)
    m.add(ting(99, gain * 0.7), t0 + 3 * BEAT + S16 * 2, pan=0.4, rev=0.4, dly=0.3)


def type_clicks(m, t0, count, step, gain=0.6):
    for i in range(count):
        m.add(key_click(gain), t0 + i * step, pan=float(RNG.uniform(-0.25, 0.25)), rev=0.04)


# ------------------------------------------------------------------ cues (seconds; the videos use these)
ANN = dict(
    dur=36.0,
    type_start=0.5, type_step=S16 / 2, idea="A chai subscription for remote teams.",
    tabs=[4.0 + i * 0.25 for i in range(9)],
    vacuum=7.5, implode=8.0,
    sting=8.5,                      # dot 8.5, diamond 9.0, spark 9.5, twin 10.0 (the drop)
    names=[10.5, 11.0, 11.5], domains=[14.5, 14.75, 15.0, 15.25], handles=[16.0 + i * 0.25 for i in range(6)],
    ring=[18.5 + i * 0.125 for i in range(8)], looks=[22.0, 22.5, 23.0, 23.5], pick=24.5,
    book=[26.5, 27.0, 27.5, 28.0, 28.5], scenes=[14.0, 18.0, 22.0, 26.0, 30.0],
    close_type=30.25, close_text="Your idea deserves a brand", close_sting=32.0,
)
LOGO = dict(dur=6.0, type_start=0.4, type_step=S16, word="gobrandtoday", sting=2.0)


def announcement():
    a = ANN
    m = Mix(a["dur"])
    # 0-4  the idea is typed over a filtered pad
    for b in range(2):
        p = pad_chord(CHORDS[b][0], BAR + 0.2, 0.5)
        m.add(sweep_lp(p, 500, 900 + 500 * b), b * BAR, rev=0.35, bus="duck")
    n = len(a["idea"]) - 1
    type_clicks(m, a["type_start"], n, a["type_step"], 0.75)
    m.add(drop(76, 0.45), a["type_start"] + n * a["type_step"] + S16, rev=0.3, dly=0.1)  # the full stop
    m.add(pluck(64, 0.35), 2.0, rev=0.4)
    m.add(pluck(71, 0.3), 3.0, rev=0.4)
    # 4-8  nine tabs: build, filter opening, glitches, then the vacuum
    for b, t0 in enumerate((4.0, 6.0)):
        m.add(sweep_lp(pad_chord(CHORDS[2 + b][0], BAR + 0.1, 0.5), 900 + 600 * b, 2000 + 2500 * b),
              t0, rev=0.3, bus="duck")
        for k in range(4):
            m.kick(t0 + k * BEAT, 0.55 + 0.25 * b, depth=0.35)
            m.add(sub(CHORDS[2 + b][1] + 12, BEAT * 0.8, 0.6), t0 + k * BEAT, bus="duck", rev=0)
    for i, t in enumerate(a["tabs"]):
        m.add(pop(520 + 60 * i, 0.9), t, pan=-0.6 + 0.15 * i, rev=0.12)
        m.add(tabla("na" if i % 2 else "tin", 0.35), t, pan=0.3, rev=0.1)
    for s in range(16):
        m.add(hat(False, 0.35 + 0.03 * s), 6.0 + s * S16 / 1.0 * 0.5 + 0.0, pan=0.3)
        m.add(hat(False, 0.3), 4.0 + s * S16 * 2, pan=0.3)
    for s in range(12):
        m.add(glitch(0.8), 6.0 + s * 0.125 + float(RNG.uniform(0, 0.05)), pan=float(RNG.uniform(-0.7, 0.7)), rev=0.05)
    for s in range(8):
        m.add(clap(0.25 + 0.06 * s), 7.0 + s * S16 / 2, rev=0.1)
    m.add(riser(1.5, 0.8), 6.0, rev=0.2)
    m.add(reverse_whoosh(a["implode"] - a["vacuum"], 0.9), a["vacuum"], rev=0.1)
    # 8-10  implosion, a breath of silence, then the sting; the twin lands on the drop
    m.add(impact(0.9), a["implode"], rev=0.15)
    m.add(pad_chord(CHORDS[0][0], BAR, 0.3, bright=1200), a["implode"] + 0.3, rev=0.4)
    sting(m, a["sting"], big=True)
    # 10-30  the groove; scene changes get a whoosh, every second phrase a tabla turnaround
    for b in range(10):
        t0 = 10.0 + b * BAR
        groove_bar(m, t0, b, level=1.0, fill=(b % 2 == 1))
    for t in a["scenes"]:
        m.add(whoosh(0.5, 0.8), t - 0.3, rev=0.1)
    motif(m, 18.0, 0.45)
    motif(m, 26.0, 0.45)
    for i, t in enumerate(a["names"]):
        m.add(pop(760 + 120 * i, 0.7), t, pan=-0.3 + 0.3 * i)
    for i, t in enumerate(a["domains"]):
        m.add(pop(900 if i else 500, 0.55), t, pan=0.2)
    for i, t in enumerate(a["handles"]):
        m.add(pop(1000 + 40 * i, 0.4), t, pan=-0.4 + 0.16 * i)
    for i, t in enumerate(a["ring"]):
        m.add(pluck(76 + [0, 4, 7, 11, 12, 16, 19, 23][i], 0.35), t, pan=-0.5 + 0.14 * i, rev=0.2)
    for i, t in enumerate(a["looks"]):
        m.add(whoosh(0.25, 0.5), t - 0.08)
        m.add(tabla("na", 0.5), t, pan=-0.4 + 0.27 * i)
    m.add(bell(88, 0.5), a["pick"], rev=0.35, dly=0.15)
    m.add(tabla("tin", 0.6), a["pick"], rev=0.2)
    for i, t in enumerate(a["book"]):
        m.add(pop(640 + 90 * i, 0.5), t, pan=-0.4 + 0.2 * i)
    # 30-36  breakdown, the closing line, the final sting and a long Emaj9
    m.add(pad_chord(CHORDS[3][0], BAR, 0.55), 30.0, rev=0.4, bus="duck")
    m.add(sub(CHORDS[3][1] + 12, BAR, 0.6), 30.0, bus="duck")
    type_clicks(m, a["close_type"], len(a["close_text"]), S16 / 2, 0.55)
    sting(m, a["close_sting"], big=True)
    m.kick(a["close_sting"] + 2 * BEAT, 1.0, depth=0.3)
    m.add(clap(0.6), a["close_sting"] + 2 * BEAT, rev=0.3)
    m.add(pad_chord(CHORDS[0][0] + [71, 75], 36.0 - 33.0 + 0.3, 0.65, bright=2400),
          a["close_sting"] + 2 * BEAT, rev=0.5)
    m.add(sub(40, 2.8, 0.7), a["close_sting"] + 2 * BEAT)
    return m.render()


def logo_reveal():
    a = LOGO
    m = Mix(a["dur"])
    m.add(sweep_lp(pad_chord(CHORDS[0][0], 2.4, 0.45), 400, 1400), 0.0, rev=0.4)
    type_clicks(m, a["type_start"], len(a["word"]), a["type_step"], 0.7)
    sting(m, a["sting"], big=True)
    s = a["sting"] + 2 * BEAT
    m.kick(s, 0.9, depth=0.3)
    m.add(pad_chord(CHORDS[0][0] + [71, 75], a["dur"] - s + 0.2, 0.6, bright=2400), s, rev=0.5)
    m.add(sub(40, 2.6, 0.6), s)
    m.add(tabla("dha", 0.5), s, rev=0.2)
    m.add(tabla("tin", 0.35), s + 3 * BEAT, rev=0.3)
    return m.render()


def sonic_logo():
    m = Mix(3.6)
    sting(m, 0.2, big=False)
    m.add(pad_chord(CHORDS[0][0] + [71], 2.6, 0.45, bright=2200), 0.2 + 2 * BEAT, rev=0.5)
    m.add(sub(40, 1.8, 0.5), 0.2 + 2 * BEAT)
    return m.render()


def bed_loop():
    """8 bars that loop seamlessly: render 16 and keep the second 8, so tails wrap round."""
    bars = 8
    m = Mix(2 * bars * BAR)
    for b in range(2 * bars):
        groove_bar(m, b * BAR, b, fill=(b % 4 == 3))
    motif(m, bars * BAR, 0.4)
    return m.render(fade=False)[:, int(bars * BAR * SR):]


# ------------------------------------------------------------------ output
def write_wav(path, x):
    x = np.clip(x, -1, 1)
    pcm = (x.T * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def master(raw, out, lufs=-14):
    """Two-pass ffmpeg loudnorm to the social-video standard (-14 LUFS, -1 dBTP)."""
    import json
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af",
                            f"loudnorm=I={lufs}:TP=-1:LRA=11:print_format=json", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
    js = json.loads(probe[probe.rindex("{"):probe.rindex("}") + 1])
    af = (f"loudnorm=I={lufs}:TP=-1:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
          f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:"
          "linear=true")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", raw, "-af", af,
                    "-ar", str(SR), out], check=True)
    os.remove(raw)


def main(outdir):
    os.makedirs(outdir, exist_ok=True)
    for name, fn in (("sonic-logo", sonic_logo), ("bed-loop", bed_loop),
                     ("logo-reveal", logo_reveal), ("announcement", announcement)):
        raw = os.path.join(outdir, name + ".raw.wav")
        write_wav(raw, fn())
        master(raw, os.path.join(outdir, name + ".wav"))
        print("wrote", name)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "out")
