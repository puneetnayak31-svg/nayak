"""Synthesised effects bed for the animated sequence (no samples, nothing to license).

python3 sfx.py OUT.wav T0 T1    — times are on the source timeline; mixed under Vikrant's voice by first_night.py
"""
import math
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(17)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def lowpass(x, fc):
    a = math.exp(-2 * math.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):          # one-pole; only used on short buffers
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def lp_fast(x, fc):
    """FFT brick-ish low-pass for long buffers."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x))


def bp_fast(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / (1 + (lo / np.maximum(f, 1)) ** 4)) * (1 / (1 + (f / hi) ** 4))
    return np.fft.irfft(X, len(x))


def add(buf, t0, sig, at, gain=1.0):
    i = int((at - t0) * SR)
    if i >= len(buf) or i + len(sig) <= 0:
        return
    s0 = max(0, -i)
    i = max(i, 0)
    n = min(len(sig) - s0, len(buf) - i)
    buf[i:i + n] += sig[s0:s0 + n] * gain


def crack():
    n = int(0.18 * SR)
    click = np.zeros(n)
    click[:60] = rng.normal(0, 1, 60)
    body = bp_fast(rng.normal(0, 1, n), 1200, 4200) * env_exp(n, 0.025)
    knock = np.sin(2 * math.pi * 520 * np.arange(n) / SR) * env_exp(n, 0.03)
    return 0.9 * click + 1.2 * body / (np.abs(body).max() + 1e-9) + 0.5 * knock


def boom(dur=1.4, f=55):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    thump = np.sin(2 * math.pi * f * tt * (1 - 0.3 * tt)) * env_exp(n, 0.35)
    rumble = lp_fast(rng.normal(0, 1, n), 180) * env_exp(n, 0.5)
    rumble /= np.abs(rumble).max() + 1e-9
    crackle = np.zeros(n)
    for _ in range(80):
        k = int(rng.uniform(0.15, dur * 0.9) * SR)
        m = int(0.004 * SR)
        if k + m < n:
            crackle[k:k + m] += rng.normal(0, 1, m) * rng.uniform(0.2, 0.7) * math.exp(-k / SR / 0.9)
    return 0.9 * thump + 0.6 * rumble + 0.5 * crackle


def whistle(dur=0.45):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = 900 + 1700 * (tt / dur)
    ph = 2 * math.pi * np.cumsum(f) / SR
    return 0.25 * np.sin(ph) * np.minimum(1, tt / 0.05) + 0.15 * bp_fast(rng.normal(0, 1, n), 2000, 6000)


def clunk():
    n = int(1.2 * SR)
    tt = np.arange(n) / SR
    thud = np.sin(2 * math.pi * 70 * tt) * env_exp(n, 0.12)
    hum = 0.25 * np.sin(2 * math.pi * 100 * tt) * np.minimum(1, tt / 0.3) * env_exp(n, 0.9)
    clk = np.zeros(n)
    clk[:200] = rng.normal(0, 1, 200) * env_exp(200, 0.001)
    return thud + hum + 0.6 * clk


def ting():
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    return (np.sin(2 * math.pi * 2600 * tt) + 0.6 * np.sin(2 * math.pi * 3900 * tt)) * env_exp(n, 0.12) * 0.4


def whoosh(dur=0.5, up=True):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = bp_fast(rng.normal(0, 1, n), 300, 3000)
    x /= np.abs(x).max() + 1e-9
    e = np.sin(np.pi * tt / dur) ** 2
    return x * e * 0.5


def shutter():
    n = int(0.08 * SR)
    x = bp_fast(rng.normal(0, 1, n), 2000, 8000)
    x /= np.abs(x).max() + 1e-9
    e = np.zeros(n)
    e[: n // 4] = 1
    e[n // 2: n // 2 + n // 5] = 0.7
    return x * e * 0.4


def shimmer(dur):
    n = int(dur * SR)
    x = np.zeros(n)
    for _ in range(int(dur * 90)):
        k = int(rng.uniform(0, dur) * SR)
        m = int(0.25 * SR)
        f = rng.uniform(2500, 6000)
        seg = np.sin(2 * math.pi * f * np.arange(m) / SR) * env_exp(m, 0.06) * 0.12
        x[k:k + m] += seg[: max(0, min(m, n - k))]
    return x


def crowd_bed(t0, t1, level):
    n = int((t1 - t0) * SR)
    noise = rng.normal(0, 1, n)
    x = bp_fast(noise, 250, 2200)
    x /= np.abs(x).max() + 1e-9
    tt = t0 + np.arange(n) / SR
    lv = np.interp(tt, [p[0] for p in level], [p[1] for p in level])
    # slow 'swell' texture
    mod = 0.85 + 0.15 * np.sin(2 * math.pi * 0.7 * tt) * np.sin(2 * math.pi * 0.23 * tt + 1)
    return x * lv * mod


def build(t0, t1):
    n = int((t1 - t0) * SR)
    L = np.zeros(n)
    level = [(t0, 0), (472.2, 0), (473.0, 0.10), (475.3, 0.14), (476.2, 0.2), (484.0, 0.16), (496.0, 0.2),
             (501.5, 0.18), (504.6, 0.22), (505.9, 0.5), (507.0, 0.4), (508.0, 0.6), (510.5, 0.45), (513.0, 0.4),
             (518.9, 0.6), (520.6, 0.7), (523.6, 0.6), (524.85, 0.0), (t1, 0)]
    L += crowd_bed(t0, t1, level)
    for at in (472.45, 473.15):
        add(L, t0, clunk(), at, 0.55)
    add(L, t0, ting(), 480.8, 0.6)
    add(L, t0, ting(), 481.9, 0.3)
    for at in (495.7, 496.3, 497.1, 497.9, 498.6, 499.6, 500.4):
        add(L, t0, shutter(), at, 0.5)
    add(L, t0, crack(), 502.45, 0.5)
    add(L, t0, boom(0.9, 45), 504.68, 0.55)          # the spotlight slams on
    for at in (505.85, 507.65):
        add(L, t0, crack(), at, 0.75)
        add(L, t0, whoosh(0.45), at + 0.02, 0.5)
    fw = [506.75, 508.05, 508.35, 508.7, 509.0, 509.35, 509.75, 510.1] + [520.4 + i * 0.32 for i in range(13)]
    for i, at in enumerate(fw):
        add(L, t0, whistle(0.42), at - 0.42, 0.35)
        add(L, t0, boom(1.3, 50 + (i % 4) * 6), at, 0.5 if at < 520 else 0.4)
    add(L, t0, shimmer(1.2), 510.55, 0.6)
    add(L, t0, ting(), 512.7, 0.45)
    add(L, t0, whoosh(0.4), 515.3, 0.4)
    add(L, t0, whoosh(0.4), 516.3, 0.4)
    add(L, t0, whoosh(0.8), 518.1, 0.6)
    for i in range(10):
        add(L, t0, crack() * 0.4, 519.0 + i * 0.06, 0.25)
    for i in range(13):
        add(L, t0, whoosh(0.3), 519.8 + i * 0.045, 0.15)
    # gentle stereo: decorrelate with a tiny delay
    R = np.roll(L, int(0.011 * SR))
    peak = max(np.abs(L).max(), 1e-9)
    st = np.stack([L, R], 1) / peak * 0.5            # −6 dBFS peak; mixed under the voice
    return st


if __name__ == "__main__":
    out, t0, t1 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
    st = build(t0, t1)
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype(np.int16).tobytes())
    print("wrote", out, f"{len(st) / SR:.1f}s")
