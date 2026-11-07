"""Soft devotional score and final mix: tanpura drone, a slow bansuri alaap in Raag Yaman, sitar
phrases and temple bells at each new form, a warm pad, all ducked under the Hindi narration.
Synthesised, with no samples, so nothing needs licensing.

    python3 audio.py VERSION OUT.wav        # VERSION = reel | full
"""
import sys
import wave

import numpy as np

import timeline as T

SR = T.SR
rng = np.random.default_rng(108)
SA = 293.66  # D4: bansuri Sa
SW = {"S": 0, "R": 2, "G": 4, "m": 6, "P": 7, "D": 9, "N": 11}  # Yaman: tivra Ma


def note(sw, base=SA):
    o = sw.count("'") - sw.count(".")
    return base * 2 ** ((SW[sw.strip("'.")] + 12 * o) / 12)


# ---------------------------------------------------------------- instruments
def bansuri(phrase, beat):
    """Legato flute line: soft breathy attacks, meend between notes, delayed gentle vibrato."""
    seq = [(a, float(b)) for a, b in (tok.split(":") for tok in phrase.split())]
    total = sum(b for _, b in seq) * beat + 1.0
    n = int(total * SR)
    f_tr, a_tr = np.zeros(n), np.zeros(n)
    t, prev = 0.0, None
    for sw, b in seq:
        d = b * beat
        i0, i1 = int(t * SR), int((t + d) * SR)
        t += d
        if sw == "-":
            prev = None
            continue
        f = note(sw)
        seg = i1 - i0
        tt = np.arange(seg) / SR
        ft = np.full(seg, f)
        if prev is not None:  # meend: glide from the previous note
            g = min(int(0.11 * SR), seg)
            ft[:g] = prev * (f / prev) ** ((1 - np.cos(np.linspace(0, np.pi, g))) / 2)
        vib = np.clip((tt - 0.35) / 0.6, 0, 1) * 0.006
        ft *= 1 + vib * np.sin(2 * np.pi * 4.8 * tt)
        f_tr[i0:i1] = ft
        a_tr[i0:i1] = 1.0
        prev = f
    idx = np.where(f_tr > 0, np.arange(n), 0)
    np.maximum.accumulate(idx, out=idx)
    f_tr = f_tr[idx]
    f_tr[f_tr == 0] = SA
    k = int(0.14 * SR)  # slow, breathy swells instead of tongued notes
    a_tr = np.convolve(a_tr, np.hanning(k) / np.hanning(k).sum(), mode="same")
    ph = 2 * np.pi * np.cumsum(f_tr) / SR
    tone = np.sin(ph) + 0.22 * np.sin(2 * ph) + 0.07 * np.sin(3 * ph) + 0.02 * np.sin(4 * ph)
    nz = rng.standard_normal(n)
    nz = np.convolve(nz, np.ones(10) / 10, mode="same") - np.convolve(nz, np.ones(90) / 90, mode="same")
    return (tone + 0.12 * nz) * a_tr * 0.11


_pl = {}


def pluck(f, kind="sitar"):
    """Karplus-Strong string; sitar gets jawari buzz, santoor stays bright and clean."""
    key = (round(f, 2), kind)
    if key not in _pl:
        dur = 2.2 if kind == "sitar" else 2.0
        n = int(dur * SR)
        p = max(2, int(SR / f))
        r = np.random.default_rng(int(f * 10))
        buf = np.convolve(r.uniform(-1, 1, p), [0.75, 0.25], mode="same")
        out = np.zeros(n)
        dec = 0.9975 if kind == "sitar" else 0.997
        for i in range(n):
            j = i % p
            out[i] = buf[j]
            buf[j] = dec * 0.5 * (buf[j] + buf[(j + 1) % p])
        if kind == "sitar":
            out = np.tanh(out * 2.5) / 2.5 + 0.35 * out
        else:
            out = out + 0.5 * np.roll(out, int(0.0012 * SR))
        t = np.arange(n) / SR
        _pl[key] = out * (1 - np.exp(-t / 0.003)) * 0.22
    return _pl[key]


def tanpura(f, dur=4.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    bloom = 1 - np.exp(-t / 0.5)
    for k in range(1, 14):
        amp = 1.0 if k == 1 else (1 / k ** 1.1) * (0.35 + 0.65 * bloom * (k > 3))
        s += amp * np.sin(2 * np.pi * f * k * (1 + 0.0004 * k) * t + rng.uniform(0, 6.28))
    return s * np.exp(-t / 3.2) * (1 - np.exp(-t / 0.015)) * 0.05


def temple_bell(f=880.0, gain=1.0):
    n = int(5.0 * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for ratio, a, dec in [(0.5, 0.45, 3.2), (1, 1, 2.2), (1.19, 0.35, 1.6), (2.0, 0.4, 1.2),
                          (2.74, 0.3, 0.8), (3.76, 0.15, 0.45), (5.1, 0.08, 0.3)]:
        beat = 1 + 0.004 * np.sin(2 * np.pi * 1.7 * t)  # slow shimmer
        s += a * np.sin(2 * np.pi * f * ratio * t * beat) * np.exp(-t / dec)
    return s * (1 - np.exp(-t / 0.002)) * 0.045 * gain


def pad(dur, freqs):
    """Warm string pad (detuned, rolled-off harmonics) with a slow swell."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for det in (0.997, 1.0, 1.0035):
            ph = rng.uniform(0, 6.28)
            for k in range(1, 7):
                s += np.sin(2 * np.pi * f * det * k * t + ph * k) / k ** 1.6
    lfo = 1 + 0.12 * np.sin(2 * np.pi * 0.07 * t)
    return s * lfo * 0.0045


def glissando(rising=True):
    """Swarmandal-like sweep across Yaman."""
    scale = [".N", "S", "R", "G", "m", "P", "D", "N", "S'", "R'", "G'", "m'", "P'"]
    if not rising:
        scale = scale[::-1]
    out = np.zeros(int(3.2 * SR))
    for i, sw in enumerate(scale):
        s = pluck(note(sw), "santoor") * (0.55 + 0.03 * i)
        k = int(i * 0.075 * SR)
        out[k:k + len(s)] += s[: len(out) - k]
    return out


def reverb(x, seed, rt=2.4, wet=0.24):
    r = np.random.default_rng(seed)
    n = int(rt * SR)
    tt = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-tt * 6.9 / rt)
    ir = np.convolve(ir, np.ones(7) / 7, mode="same")
    ir[: int(0.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    m = len(x) + n
    nfft = 1 << (m - 1).bit_length()
    return x + wet * np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


# ---------------------------------------------------------------- score
ALAAP = [  # Yaman phrases, slow
    ".N:1 R:1 G:2.5 R:.5 G:.5 R:.5 S:3",
    ".N:1 R:1 G:1 m:1 P:3 m:.5 G:.5 R:.5 G:3.5",
    "G:1 m:1 D:1.5 N:1.5 S':3 N:.5 D:.5 P:3",
    "m:1 G:1 R:1.5 G:.5 R:.5 S:4",
    "P:1 D:1 N:1 R':1.5 S':3 N:.5 D:.5 P:1.5 m:1 G:3",
    "G:1 R:1 .N:1.5 R:.5 S:4.5",
]
SITAR_FIGS = [["S", "G", "P", "S'"], ["P", "m", "G", "R", "S"], ["G", "m", "D", "N", "S'"],
              ["N", "D", "P", "m", "G"], [".N", "R", "G", "R", "S"], ["P", "D", "N", "R'", "S'"],
              ["S'", "N", "D", "P"], ["G", "m", "P", "D", "P"]]


def score(tl):
    dur = tl["dur"]
    N = int((dur + 0.5) * SR)
    L, R = np.zeros(N), np.zeros(N)

    def add(sig, t0, pan=0.0, gain=1.0):
        i = int(max(0.0, t0) * SR)
        if i >= N:
            return
        s = sig[: N - i] * gain
        L[i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan))
        R[i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan))

    # tanpura: Pa Sa' Sa' Sa, endlessly
    cyc = [note(".P", SA / 2), note("S", SA / 2) * 2, note("S", SA / 2) * 2, note("S", SA / 2)]
    t, k = 0.15, 0
    while t < dur:
        add(tanpura(cyc[k % 4]), t, pan=(-0.35, 0.2, 0.3, -0.15)[k % 4], gain=0.9)
        t += 1.15
        k += 1
    # pad: Sa + Pa underneath, swelling in and out
    p = pad(dur + 0.5, [SA / 4, SA * 1.5 / 4, SA / 2])
    tt = np.arange(len(p)) / SR
    p *= np.clip(tt / 4.0, 0, 1)
    add(p, 0.0, gain=1.0)
    # bansuri alaap: phrases with breathing space between them
    t, k = 1.2, 0
    while t < dur - 6:
        sig = bansuri(ALAAP[k % len(ALAAP)], beat=0.62)
        add(sig, t, pan=0.18, gain=0.9)
        t += len(sig) / SR + 1.6
        k += 1
    # bells and sitar figures mark each new scene
    for i, b in enumerate(tl["bells"]):
        add(temple_bell(880.0 if i % 2 else 783.99, gain=0.9 if 0 < i < len(tl["bells"]) - 1 else 1.2), b, pan=-0.1)
    for i, s in enumerate(tl["scenes"]):
        if s["kind"] == "goddess":
            for j, sw in enumerate(SITAR_FIGS[s["idx"]]):
                add(pluck(note(sw, SA / 2)), s["start"] + 0.05 + j * 0.24, pan=-0.3, gain=0.8)
    add(glissando(True), 0.15, pan=0.25, gain=0.8)
    last = tl["scenes"][-1]["start"]
    add(glissando(False), last + 0.0, pan=0.25, gain=0.65)

    L, R = reverb(L, 1), reverb(R, 2)
    return L[:int(dur * SR)], R[:int(dur * SR)]


def mix(tl):
    dur = tl["dur"]
    n = int(dur * SR)
    vo = np.zeros(n)
    for t0, key in tl["speech"]:
        x = T.voice(key)
        i = int(t0 * SR)
        vo[i:i + len(x)] += x[: n - i]
    vo /= np.sqrt(np.mean(vo[np.abs(vo) > 0.01] ** 2))  # speech RMS = 1
    vo *= 10 ** (-18 / 20)
    vrev = reverb(vo, 7, rt=0.9, wet=0.07)  # a touch of room, no echo

    # ducking: music dips ~11 dB under the voice, with a little look-ahead
    act = np.zeros(n)
    for t0, key in tl["speech"]:
        a, b = int((t0 - 0.25) * SR), int((t0 + T.dur(key) + 0.35) * SR)
        act[max(0, a):b] = 1
    k = int(0.3 * SR)
    act = np.convolve(act, np.hanning(k) / np.hanning(k).sum(), mode="same")
    duck = 1 - 0.72 * act

    mL, mR = score(tl)
    rms = np.sqrt(np.mean(((mL + mR) / 2) ** 2))
    g = 10 ** (-23 / 20) / rms
    t = np.arange(n) / SR
    fade = np.clip(t / 0.6, 0, 1) * np.clip((dur - t) / 1.4, 0, 1)
    L = (mL * g * duck + vrev) * fade
    R = (mR * g * duck + vrev) * fade
    peak = max(np.abs(L).max(), np.abs(R).max())
    if peak > 0.89:
        L, R = L / peak * 0.89, R / peak * 0.89
    return L, R


def write(path, L, R):
    data = (np.clip(np.stack([L, R], 1), -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


if __name__ == "__main__":
    tl = T.build(sys.argv[1])
    L, R = mix(tl)
    write(sys.argv[2], L, R)
    print("wrote", sys.argv[2], f"{tl['dur']:.2f} s")
