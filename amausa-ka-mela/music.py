"""Synthesised folk soundtrack for the 'Amausa Ka Mela' reel.

Tanpura drone + bansuri melody in a Bhupali-style pentatonic (S R G P D),
santoor-like plucked arpeggios, dholak in keherwa, manjira and ghungroo.
96 bpm, 4/4, 18 bars = 45 s. Bars line up with the video's scene cuts (2.5 s).
"""
import sys
import wave

import numpy as np

SR = 44100
BPM = 96
BEAT = 60 / BPM            # 0.625 s
BAR = 4 * BEAT             # 2.5 s
BARS = 18
DUR = BARS * BAR + 0.0     # 45 s
N = int(DUR * SR)
SA = 146.83                # D3
rng = np.random.default_rng(7)

SWARA = {"S": 0, "R": 2, "G": 4, "M": 5, "P": 7, "D": 9, "N": 11}


def freq(sw, base=SA * 2):
    """'G' -> G of middle octave; "S'" upper; ".D" lower."""
    oct_ = sw.count("'") - sw.count(".")
    s = sw.strip("'.")
    return base * 2 ** ((SWARA[s] + 12 * oct_) / 12)


L = np.zeros(N)
R = np.zeros(N)


def add(sig, t0, pan=0.0, gain=1.0):
    i0 = int(t0 * SR)
    if i0 >= N:
        return
    sig = sig[: N - i0] * gain
    lg = np.cos((pan + 1) * np.pi / 4)
    rg = np.sin((pan + 1) * np.pi / 4)
    L[i0:i0 + len(sig)] += sig * lg
    R[i0:i0 + len(sig)] += sig * rg


def env_adsr(n, a, d, s, r):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    e = np.full(n, s)
    a = min(a, n)
    e[:a] = np.linspace(0, 1, a, endpoint=False)
    dd = min(d, n - a)
    e[a:a + dd] = np.linspace(1, s, dd, endpoint=False)
    if r > 0:
        rr = min(r, n)
        e[n - rr:] *= np.linspace(1, 0, rr)
    return e


# ---------------------------------------------------------------- tanpura
def tanpura_note(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    # jawari: rich harmonics whose brightness slowly blooms after the pluck
    bloom = 1 - np.exp(-t / 0.35)
    for k in range(1, 16):
        amp = (1 / k ** 1.1) * (0.35 + 0.65 * bloom * (k > 3)) if k > 1 else 1.0
        det = 1 + rng.uniform(-0.0006, 0.0006)
        sig += amp * np.sin(2 * np.pi * f * k * det * t + rng.uniform(0, 6.28))
    e = np.exp(-t / 2.6) * (1 - np.exp(-t / 0.01))
    return sig * e * 0.12


TANPURA_CYCLE = [(".P", 0), ("S", 1), ("S", 2), (".S", 3)]
cycle = 2 * BAR / 2  # one full Pa-Sa-Sa-Sa cycle every 2.5 s
t = 0.0
k = 0
while t < DUR - 0.5:
    sw, idx = TANPURA_CYCLE[k % 4]
    f = freq(sw, SA)
    pan = [-0.35, -0.1, 0.1, 0.35][idx]
    add(tanpura_note(f, 4.5), t, pan, 0.9)
    t += cycle / 4
    k += 1


# ---------------------------------------------------------------- bansuri
def bansuri(seq, start, gain=1.0, octave_base=SA * 2):
    """seq: list of (swara or '-', beats). Continuous phase with meend glides."""
    total = sum(b for _, b in seq) * BEAT + 0.6
    n = int(total * SR)
    f_track = np.zeros(n)
    a_track = np.zeros(n)
    t = 0.0
    prev_f = None
    for sw, b in seq:
        dur = b * BEAT
        i0, i1 = int(t * SR), int((t + dur) * SR)
        if sw == "-":
            prev_f = None
            t += dur
            continue
        f = freq(sw, octave_base)
        seg = i1 - i0
        ft = np.full(seg, f)
        if prev_f is not None:
            g = min(int(0.06 * SR), seg)
            ft[:g] = prev_f + (f - prev_f) * (1 - np.cos(np.linspace(0, np.pi, g))) / 2
        # delayed vibrato on longer notes
        tt = np.arange(seg) / SR
        vib_depth = np.clip((tt - 0.25) / 0.4, 0, 1) * 0.006 * (dur > 0.5)
        ft *= 1 + vib_depth * np.sin(2 * np.pi * 5.2 * tt)
        f_track[i0:i1] = ft
        # amplitude: soft attack, slight swell, release into the next note
        e = env_adsr(seg, 0.04 if prev_f is None else 0.015, 0.1, 0.85, min(0.08, dur * 0.3))
        e *= 1 + 0.08 * np.sin(np.pi * np.arange(seg) / max(seg, 1))
        a_track[i0:i1] = e
        prev_f = f
        t += dur
    # fill frequency gaps so phase stays defined
    last = SA * 2
    for i in range(n):
        if f_track[i] == 0:
            f_track[i] = last
        else:
            last = f_track[i]
    # smooth amplitude to avoid clicks
    k = np.ones(220) / 220
    a_track = np.convolve(a_track, k, mode="same")
    ph = 2 * np.pi * np.cumsum(f_track) / SR
    tone = np.sin(ph) + 0.22 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph) + 0.03 * np.sin(4 * ph)
    # breath noise, band-limited around the fundamental region
    noise = rng.standard_normal(n)
    noise = np.convolve(noise, np.ones(14) / 14, mode="same") - np.convolve(noise, np.ones(120) / 120, mode="same")
    sig = (tone * 0.85 + noise * 0.1) * a_track
    add(sig * 0.16 * gain, start, 0.05)


# ---------------------------------------------------------------- santoor (Karplus-Strong)
def pluck(f, dur=1.6, bright=0.5):
    n = int(dur * SR)
    p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p)
    buf = np.convolve(buf, [bright, 1 - bright], mode="same")
    out = np.zeros(n)
    decay = 0.996
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = decay * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    # hammered attack + gentle doubled course
    t = np.arange(n) / SR
    out = out + 0.5 * np.roll(out, int(0.0012 * SR))
    return out * (1 - np.exp(-t / 0.002)) * 0.22


_pluck_cache = {}


def santoor(sw, t0, pan=0.0, gain=1.0, base=SA * 2):
    if sw not in _pluck_cache:
        _pluck_cache[sw] = pluck(freq(sw, base))
    add(_pluck_cache[sw], t0, pan, gain)


# ---------------------------------------------------------------- percussion
def dholak_bass(gain=1.0):
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    f = 62 + 70 * np.exp(-t / 0.045)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t / 0.18)
    s += 0.3 * rng.standard_normal(n) * np.exp(-t / 0.006)
    return s * 0.55 * gain


def dholak_treble(gain=1.0, ring=420):
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    s = 0.6 * np.sin(2 * np.pi * ring * t) * np.exp(-t / 0.06)
    s += 0.35 * np.sin(2 * np.pi * ring * 2.31 * t) * np.exp(-t / 0.03)
    nz = rng.standard_normal(n)
    nz = nz - np.convolve(nz, np.ones(8) / 8, mode="same")
    s += 0.5 * nz * np.exp(-t / 0.012)
    return s * 0.32 * gain


def manjira(gain=1.0):
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f, a in [(2650, 1), (3990, 0.7), (5230, 0.5), (6870, 0.35), (8120, 0.25)]:
        s += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * (1 + 0.3 * np.sin(2 * np.pi * 7 * t))
    s *= np.exp(-t / 0.45) * (1 - np.exp(-t / 0.001))
    return s * 0.05 * gain


def ghungroo(gain=1.0):
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for j in range(7):
        off = int(rng.uniform(0, 0.025) * SR)
        f = rng.uniform(5200, 9500)
        b = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.03)
        s[off:] += b[: n - off]
    nz = rng.standard_normal(n)
    nz = nz - np.convolve(nz, np.ones(4) / 4, mode="same")
    s += 0.6 * nz * np.exp(-t / 0.02)
    return s * 0.03 * gain


def bell(f=1174.7, gain=1.0, dur=4.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for ratio, a, dec in [(1, 1, 1.6), (2.76, 0.5, 0.9), (5.4, 0.25, 0.5), (8.93, 0.12, 0.3), (0.5, 0.3, 2.2)]:
        s += a * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / dec)
    return s * (1 - np.exp(-t / 0.002)) * 0.07 * gain


def swell(dur, gain=1.0):
    """Reverse-cymbal style noise riser for transitions."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    nz = nz - np.convolve(nz, np.ones(10) / 10, mode="same")
    return nz * (t / dur) ** 2.5 * 0.05 * gain


# ---------------------------------------------------------------- arrangement
def bar_t(b, beat=0.0):
    return (b - 1) * BAR + beat * BEAT


# Melody (bars 1..18). Sargam, beats.
melody = [
    # 1-2 intro: slow alap
    ("-", 2), ("G", 2),
    ("R", 1), ("S", 3),
    # 3-4
    ("G", .5), ("P", .5), ("D", 1), ("P", 1), ("G", 1),
    ("R", .5), ("G", .5), ("P", 1), ("G", 2),
    # 5-6
    ("G", .5), ("P", .5), ("D", 1), ("S'", 1), ("D", .5), ("P", .5),
    ("G", 1), ("R", 1), ("S", 2),
    # 7-8
    ("P", .5), ("D", .5), ("S'", 1), ("R'", 1), ("S'", 1),
    ("D", .5), ("S'", .5), ("D", .5), ("P", .5), ("G", 2),
    # 9-10
    ("G", .5), ("P", .5), ("D", 1), ("S'", .5), ("D", .5), ("P", 1),
    ("G", .5), ("R", .5), ("G", 1), ("S", 2),
    # 11-12 build (upper register)
    ("S'", 1), ("S'", .5), ("R'", .5), ("G'", 1), ("R'", 1),
    ("S'", .5), ("R'", .5), ("S'", .5), ("D", .5), ("P", 2),
    # 13-14
    ("P", .5), ("D", .5), ("S'", 1), ("D", .5), ("P", .5), ("G", 1),
    ("R", .5), ("G", .5), ("P", 1), ("G", 1), ("R", 1),
    # 15-16 CTA, resolving
    ("G", .5), ("P", .5), ("D", 1), ("S'", 2),
    ("D", .5), ("P", .5), ("G", 1), ("R", 1), ("S", 1),
    # 17
    ("S", 3.5), ("-", .5),
]
bansuri(melody, 0.0, gain=1.0)

# Santoor arpeggios: pattern per bar (8 eighths), chosen by section
ARP_A = ["S", "P", "S'", "P", "G", "P", "S'", "P"]
ARP_B = ["D", "S'", "G'", "S'", "P", "S'", "D", "S'"]
ARP_C = [".D", "S", "G", "S", "R", "G", "P", "G"]
arp_plan = {1: ARP_A, 2: ARP_A, 3: ARP_A, 4: ARP_C, 5: ARP_A, 6: ARP_C, 7: ARP_B, 8: ARP_A,
            9: ARP_A, 10: ARP_C, 11: ARP_B, 12: ARP_B, 13: ARP_A, 14: ARP_C, 15: ARP_A, 16: ARP_C}
for b, pat in arp_plan.items():
    dense = b in (11, 12, 13, 14)
    g = 0.45 if b <= 2 else (0.75 if dense else 0.6)
    for i, sw in enumerate(pat):
        santoor(sw, bar_t(b, i * 0.5), pan=0.45 if i % 2 else 0.25, gain=g)
        if dense and i % 2 == 0:
            santoor(sw + "'", bar_t(b, i * 0.5 + 0.25), pan=0.5, gain=g * 0.5)
# final rolled chord
for i, sw in enumerate(["S", "G", "P", "S'", "G'"]):
    santoor(sw, bar_t(17, i * 0.12), pan=0.3, gain=0.7)

# Dholak keherwa: Dha Ge Na Ti Na Ka Dhi Na
KEHERWA = [("B", 1.0), ("B", 0.55), ("T", 0.8), ("t", 0.4), ("T", 0.7), ("t", 0.35), ("BT", 0.9), ("T", 0.7)]
bass_s = dholak_bass()
for b in range(3, 17):
    for i, (stroke, v) in enumerate(KEHERWA):
        tt = bar_t(b, i * 0.5) + rng.uniform(-0.004, 0.004)
        if "B" in stroke:
            add(bass_s, tt, -0.05, v * (1.15 if b >= 11 else 1.0))
        if "T" in stroke:
            add(dholak_treble(v, 430), tt, 0.1)
        if stroke == "t":
            add(dholak_treble(v, 610), tt, 0.15)
    # fills leading into new sections
    if b in (6, 10, 14):
        for j in range(4):
            add(dholak_treble(0.5 + 0.12 * j, 520), bar_t(b, 3 + j * 0.25), 0.1)
add(dholak_bass(1.3), bar_t(17), 0)
add(dholak_treble(0.9), bar_t(17), 0.1)

# Manjira on 2 and 4, ghungroo shimmer on eighths in the busy section
for b in range(3, 17):
    for beat in (1, 3):
        add(manjira(1.0 if b >= 11 else 0.7), bar_t(b, beat), -0.4)
for b in range(9, 17):
    for i in range(8):
        add(ghungroo(1.0 if i % 2 else 0.6), bar_t(b, i * 0.5 + 0.25), 0.55)

# Temple bells marking scene beats + risers into title and CTA
for b, g in [(1, 0.6), (3, 1.0), (7, 0.6), (11, 0.8), (15, 0.9), (17, 1.2)]:
    add(bell(SA * 8, g), bar_t(b), -0.2)
add(swell(BAR * 0.9), bar_t(3) - BAR * 0.9, 0)
add(swell(BAR * 0.9, 1.2), bar_t(11) - BAR * 0.9, 0)
add(swell(BAR * 0.9), bar_t(15) - BAR * 0.9, 0)

# low Sa drone pad under everything (gentle)
t = np.arange(N) / SR
pad = (np.sin(2 * np.pi * SA / 2 * t) + 0.4 * np.sin(2 * np.pi * SA * t) + 0.15 * np.sin(2 * np.pi * SA * 1.5 * t))
pad *= np.clip(t / 3, 0, 1) * np.clip((DUR - t) / 3, 0, 1) * 0.04
L += pad
R += pad


# ---------------------------------------------------------------- reverb + master
def reverb(x, seed, rt=1.8, wet=0.22):
    r = np.random.default_rng(seed)
    n = int(rt * SR)
    tt = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-tt * 6.9 / rt)
    ir = np.convolve(ir, np.ones(5) / 5, mode="same")  # darken
    ir[: int(0.015 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    m = len(x) + n
    nfft = 1 << (m - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    return x + wet * y


L = reverb(L, 1)
R = reverb(R, 2)
fade_out = np.clip((DUR - t) / 2.0, 0, 1) ** 1.5
fade_in = np.clip(t / 0.08, 0, 1)
L *= fade_out * fade_in
R *= fade_out * fade_in
peak = max(np.abs(L).max(), np.abs(R).max())
L, R = L / peak * 0.89, R / peak * 0.89
# soft saturation glue
L, R = np.tanh(L * 1.2) / np.tanh(1.2), np.tanh(R * 1.2) / np.tanh(1.2)

out = sys.argv[1] if len(sys.argv) > 1 else "music.wav"
data = (np.stack([L, R], 1) * 32767 * 0.95).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(data.tobytes())
print("wrote", out, DUR, "s")
