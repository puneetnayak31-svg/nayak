"""Synthesised soundtrack, sound effects and final mix for the jackal reel (no samples).

    python3 music.py LANG          # reads build/vo-LANG.wav/.json, writes build/mix-LANG.wav

A dark, pulsing documentary bed in D minor, forest ambience (birds by day, crickets at
dusk), a synthesised jackal howl in the gap after "a long cry", HUD blips, whooshes on
every cut and a stinger on the end card. Music ducks under the voice.
"""
import json
import sys
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def lp(x, fc):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (f / fc) ** 4), len(x))


def bp(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def tone(f, dur, harm=(1,), tau=None, att=0.005):
    t = np.arange(int(dur * SR)) / SR
    s = sum(a * np.sin(2 * np.pi * f * (k + 1) * t) for k, a in enumerate(harm))
    e = 1 - np.exp(-t / att)
    if tau:
        e *= np.exp(-t / tau)
    return s * e


def pad(freqs, dur):
    t = np.arange(int(dur * SR)) / SR
    s = np.zeros_like(t)
    for f in freqs:
        for det in (0.996, 1.0, 1.004):
            ph = rng.uniform(0, 6.28)
            s += np.sin(2 * np.pi * f * det * t + ph) + 0.3 * np.sin(4 * np.pi * f * det * t + ph)
    e = np.clip(t / 1.2, 0, 1) * np.clip((dur - t) / 1.2, 0, 1)
    return lp(s, 1400) * e * 0.018


def kick():
    t = np.arange(int(0.5 * SR)) / SR
    f = 48 + 70 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22) * 0.55


def shaker():
    n = int(0.08 * SR)
    return bp(rng.standard_normal(n), 5000, 12000) * np.exp(-np.arange(n) / SR / 0.02) * 0.05


def wood(f):
    t = np.arange(int(0.7 * SR)) / SR
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.25) + 0.3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.03)
    return s * (1 - np.exp(-t / 0.001)) * 0.12


def blip(f=1800, dur=0.06):
    return tone(f, dur, (1, 0.2), tau=dur / 3) * 0.08


def whoosh(dur=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    out = np.zeros(n)
    for k in range(6):
        seg = slice(k * n // 6, (k + 1) * n // 6)
        out[seg] = bp(nz, 300 + 700 * k, 1200 + 1400 * k)[seg]
    return out * np.sin(np.pi * t / dur) ** 2 * 0.14


def thump():
    return kick() * 0.8 + bp(rng.standard_normal(int(0.5 * SR)), 80, 600) * np.exp(-np.arange(int(0.5 * SR)) / SR / 0.05) * 0.2


def bird():
    s = np.zeros(int(0.8 * SR))
    t0 = 0
    for _ in range(rng.integers(2, 5)):
        n = int(rng.uniform(0.06, 0.12) * SR)
        t = np.arange(n) / SR
        f = rng.uniform(2600, 3800) + 1100 * np.sin(2 * np.pi * rng.uniform(15, 30) * t)
        s[t0:t0 + n] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1]) ** 2
        t0 += n + int(rng.uniform(0.03, 0.08) * SR)
    return s * 0.025


def crickets(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f, rate, ph in ((4300, 28, 0), (4700, 31, 1.3), (5100, 25, 2.1)):
        gate = (np.sin(2 * np.pi * rate * t + ph) > 0.3) * (np.sin(2 * np.pi * 0.7 * t + ph) > -0.2)
        s += np.sin(2 * np.pi * f * t) * np.convolve(gate.astype(float), np.ones(60) / 60, mode="same")
    return s * 0.012


def howl_voice(f0, dur, delay):
    n = int((dur + delay) * SR)
    t = np.arange(n) / SR - delay
    tt = np.clip(t, 0, dur)
    rise = np.clip(tt / 0.55, 0, 1)
    f = f0 * (0.55 + 0.45 * (1 - (1 - rise) ** 2))
    f *= 1 + 0.03 * np.sin(2 * np.pi * 6 * tt) * np.clip((tt - 0.6) / 0.3, 0, 1)
    f *= 1 - 0.25 * np.clip((tt - dur + 0.5) / 0.5, 0, 1) ** 2  # falls away at the end
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.28 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    e = np.clip(tt / 0.25, 0, 1) * np.clip((dur - tt) / 0.35, 0, 1) * (t >= 0) * (t <= dur)
    breath = bp(rng.standard_normal(n), 600, 3000) * 0.06
    return (s + breath) * e


def howl():
    s = np.zeros(int(3.4 * SR))
    for f0, d, dl, g in ((820, 2.4, 0.0, 1.0), (980, 2.0, 0.35, 0.7), (720, 1.6, 0.8, 0.5)):
        v = howl_voice(f0, d, dl)
        s[:len(v)] += v * g
    # yips at the end
    for k in range(5):
        y = howl_voice(rng.uniform(900, 1200), 0.16, 0)
        i = int((2.3 + k * 0.17) * SR)
        if i + len(y) > len(s):
            s = np.concatenate([s, np.zeros(i + len(y) - len(s))])
        s[i:i + len(y)] += y * 0.6
    return lp(s, 3500) * 0.09


def reverb(x, rt=1.6, wet=0.25, seed=1):
    r = np.random.default_rng(seed)
    n = int(rt * SR)
    tt = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-tt * 6.9 / rt)
    ir[: int(0.015 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    m = len(x) + n
    nfft = 1 << (m - 1).bit_length()
    return x + wet * np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


def main(lang):
    tl = json.load(open(f"build/vo-{lang}.json"))
    dur = tl["duration"]
    N = int(dur * SR)
    sc = {s["name"]: s for s in tl["scenes"]}
    lines = tl["lines"]
    mus = np.zeros(N + 3 * SR)
    sfx = np.zeros(N + 3 * SR)

    def add(buf, sig, t, g=1.0):
        i = int(t * SR)
        if i >= len(buf):
            return
        sig = sig[: len(buf) - i]
        buf[i:i + len(sig)] += sig * g

    # --- bed: D minor, 84 bpm, chords every 2 bars
    beat = 60 / 84
    bar = 4 * beat
    D = 146.83
    chords = [[D, D * 1.189, D * 1.498, D * 2.245], [D * 0.794, D * 0.944, D * 1.189, D * 1.5],
              [D * 0.891, D * 1.122, D * 1.335, D * 1.682], [D * 1.0, D * 1.189, D * 1.498, D * 1.782]]
    t, k = 0.0, 0
    while t < dur:
        add(mus, pad(chords[k % 4], 2 * bar + 1.2), t)
        t += 2 * bar
        k += 1
    groove_on = [(sc["lock"]["start"], sc["howl"]["start"]), (sc["hunter"]["start"], sc["salute"]["start"])]
    arp_on = [(sc["location"]["start"], sc["howl"]["start"]), (sc["hunter"]["start"], sc["cta"]["start"])]
    arp = [D * 2, D * 2 * 1.189, D * 2 * 1.498, D * 2 * 1.782, D * 2 * 1.498, D * 2 * 1.189]
    i = 0
    t = 0.0
    while t < dur:
        if any(a <= t < b for a, b in groove_on):
            if i % 8 in (0, 3):
                add(mus, kick(), t, 0.9)
            if i % 2 == 1 and t > sc["hunter"]["start"]:
                add(mus, shaker(), t)
        if any(a <= t < b for a, b in arp_on) and i % 2 == 0:
            add(mus, wood(arp[(i // 2) % len(arp)] * (1 if (i // 16) % 2 == 0 else 1.122)), t, 0.8)
        t += beat / 2
        i += 1
    # salute swell + cta resolve
    add(mus, pad([D, D * 1.5, D * 2, D * 2.378], sc["salute"]["end"] - sc["salute"]["start"] + 3), sc["salute"]["start"], 1.8)
    add(mus, pad([D * 0.5, D, D * 1.5, D * 2.0, D * 2.52], dur - sc["cta"]["start"] + 1), sc["cta"]["start"], 2.0)
    for j in range(6):
        add(mus, wood([D * 2, D * 2.52, D * 3, D * 4, D * 3, D * 4][j]), sc["cta"]["start"] + 0.15 + j * 0.12, 1.2)

    # --- ambience
    amb = bp(rng.standard_normal(N + 3 * SR), 200, 2500) * 0.006
    sfx += amb
    t = 0.3
    while t < sc["howl"]["start"]:
        add(sfx, bird(), t)
        t += rng.uniform(1.2, 2.6)
    h0, h1 = sc["howl"]["start"], sc["howl"]["end"]
    add(sfx, crickets(h1 - h0 + 1.0), h0, 1.0)

    # --- effects
    hk = sc["hook"]
    t = 0.5
    while t < hk["end"] - 0.2:
        add(sfx, blip(2200 if int(t * 4) % 2 else 1700, 0.04), t, 0.8)
        t += 0.32
    lk = sc["lock"]["start"]
    add(sfx, blip(1400, 0.08), lk + 0.05)
    add(sfx, blip(2100, 0.12), lk + 0.16)
    for s in tl["scenes"][1:]:
        add(sfx, whoosh(), s["start"] - 0.3, 0.9)
    howl_line = [l for l in lines if l["scene"] == "howl"][1]
    add(sfx, reverb(howl(), 2.4, 0.5), howl_line["end"] - 0.15, 1.0)
    for name in ("hunter", "cleaner", "salute"):
        hl = [l for l in lines if l["scene"] == name]
        t = hl[1]["start"] if name != "salute" else hl[0]["start"] + 0.2
        add(sfx, thump(), t, 0.8)
    for l in [l for l in lines if l["scene"] == "hunter"][2:3]:
        for q in range(4):
            add(sfx, blip(2600, 0.05), l["start"] + (l["end"] - l["start"]) * (q + 0.3) / 4)
    cl = [l for l in lines if l["scene"] == "cleaner"]
    t = cl[0]["start"]
    while t < cl[1]["end"]:
        add(sfx, kick() * 0.25, t)
        t += 0.42
    cta = sc["cta"]["start"]
    add(sfx, thump(), cta + 0.1, 0.9)
    tap = [l for l in lines if l["scene"] == "cta"][0]["end"] - 0.6
    add(sfx, blip(3000, 0.03), tap, 1.2)
    add(sfx, tone(1318.5, 1.5, (1, 0.3, 0.1), tau=0.5) * 0.06, tap + 0.08)

    # --- voice + ducking
    w = wave.open(f"build/vo-{lang}.wav")
    vo = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768.0
    vo = np.concatenate([vo, np.zeros(len(mus) - len(vo))])
    env = np.convolve(np.abs(vo), np.ones(4410) / 4410, mode="same")
    env = np.clip(env / (np.percentile(env[env > 1e-4], 60) + 1e-9), 0, 1)
    env = np.convolve(env, np.ones(8820) / 8820, mode="same")
    mus = reverb(mus, 1.8, 0.3)
    mus *= 1 - 0.6 * env
    sfx *= 1 - 0.3 * env
    music = mus / (np.abs(mus).max() + 1e-9) * 0.32
    mix = vo / (np.abs(vo).max() + 1e-9) * 0.85 + music + sfx * 1.6
    L = mix + np.roll(sfx, 220) * 0.15
    R = mix - np.roll(sfx, 220) * 0.15
    t = np.arange(len(L)) / SR
    fade = np.clip((dur - t) / 1.2, 0, 1)
    L, R = (L * fade)[:N], (R * fade)[:N]
    peak = max(np.abs(L).max(), np.abs(R).max())
    L, R = np.tanh(L / peak * 1.2) / np.tanh(1.2), np.tanh(R / peak * 1.2) / np.tanh(1.2)
    with wave.open(f"build/mix-{lang}.wav", "wb") as o:
        o.setnchannels(2)
        o.setsampwidth(2)
        o.setframerate(SR)
        o.writeframes((np.stack([L, R], 1) * 32767 * 0.9).astype(np.int16).tobytes())
    print("mix", lang, round(dur, 2))


if __name__ == "__main__":
    main(sys.argv[1])
