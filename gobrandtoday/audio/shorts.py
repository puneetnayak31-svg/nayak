"""Scores and voiceovers for the promo shorts, built from the signature sound in sound.py.

    python3 shorts.py SLUG [SLUG ...]     # or "all"; writes out/shorts/<slug>.wav (with voiceover)

Each short opens on a hook, runs on the 120 BPM groove and closes on the branded end card, whose
sting (dot, diamond, spark, twin) lands at t0+0.5, +1.0, +1.5 and +2.0. Cue times are shared with
the templates in ../video/src/.
"""
import os
import sys

import numpy as np

from sound import (BAR, BEAT, CHORDS, RNG, S16, SR, Mix, bell, clap, drop, filt, glitch, groove_bar, hat,
                   impact, kick, key_click, master, motif, noise, pad_chord, pluck, pop, reverse_whoosh,
                   rewind_fx, riser, sting, sub, sweep_lp, tabla, ting, tt, type_clicks, whoosh, write_wav,
                   adsr)
from voiceover import mix_vo

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out", "shorts")


# ------------------------------------------------------------------ shared pieces
def groove(m, t0, bars, start=0, level=1.0, fills=True, arp=True):
    for b in range(bars):
        groove_bar(m, t0 + b * BAR, start + b, level=level, fill=fills and (b % 2 == 1), arp=arp)


def end_card(m, t0, dur):
    """Whoosh into the dark, the sting on the wordmark, then a wide chord to the end."""
    m.add(whoosh(0.5, 0.8), t0 - 0.3, rev=0.1)
    m.add(pad_chord(CHORDS[0][0], 0.6, 0.3, bright=1200), t0, rev=0.4)
    sting(m, t0 + 0.5, big=True)
    m.kick(t0 + 1.5, 1.0, depth=0.3)
    m.add(clap(0.6), t0 + 1.5, rev=0.3)
    m.add(pad_chord(CHORDS[0][0] + [71, 75], dur - 1.5, 0.6, bright=2400), t0 + 1.5, rev=0.5)
    m.add(sub(40, dur - 1.6, 0.6), t0 + 1.5)
    m.add(tabla("dha", 0.45), t0 + 1.5, rev=0.2)
    m.add(tabla("tin", 0.35), t0 + 2.5, rev=0.3)
    m.add(ting(99, 0.6), t0 + 3.0, pan=0.4, rev=0.5, dly=0.3)


def quiet_pad(m, t0, dur, chord=0, lo=450, hi=1300, gain=0.5):
    m.add(sweep_lp(pad_chord(CHORDS[chord][0], dur, gain), lo, hi), t0, rev=0.35, bus="duck")


def page_flip(gain=1.0):
    """Paper turning: a short swish of filtered noise with a soft flap at the end."""
    d = 0.32
    t = tt(d)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    x = filt(noise(d), "band", (900, 6500)) * env * 0.35
    flap = filt(noise(d), "low", 900) * np.exp(-np.clip(t - d * 0.8, 0, None) / 0.02) * (t > d * 0.8) * 0.5
    return (x + flap) * gain


def tape_rip(gain=1.0):
    d = 0.5
    t = tt(d)
    grain = (RNG.random(len(t)) < 0.08) * RNG.standard_normal(len(t))
    x = filt(grain + 0.3 * noise(d), "band", (1200, 7000)) * np.minimum(t / 0.05, 1) * np.exp(-t / 0.3)
    return x * 0.6 * gain


def thud(gain=1.0):
    t = tt(0.4)
    return np.sin(2 * np.pi * np.cumsum(70 + 50 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.12) * 0.7 * gain


# ------------------------------------------------------------------ Name My Brand: Loopa (24 s)
NMB = dict(dur=24.0, type0=0.35, idea="A thrift app for college students", sting=2.5,
            names=[4.3, 4.7, 5.1], pick=6.6, domains=[8.4, 8.65, 8.9, 9.15], handles=[9.6 + i * 0.2 for i in range(6)],
            looks=[12.0, 12.5, 13.0, 13.5], lpick=14.5, reveal=[16.1, 16.6, 17.0, 17.4, 17.8], scenes=[8.0, 12.0, 16.0],
            end=20.0)
NMB_VO = [
    (0.1, "One sentence in. Let's make it a brand."),
    (4.2, "Loopa. Clothes that keep going round. Eight point nine out of ten."),
    (8.2, "Domains and handles, honestly checked."),
    (12.2, "Four looks. This one's the winner."),
    (16.2, "Meet Loopa. Logo, colours, mockups, and a lot more inside."),
    (20.6, "Want yours next? Comment your idea."),
]


def nmb():
    a = NMB
    m = Mix(a["dur"])
    quiet_pad(m, 0.0, 2.6)
    type_clicks(m, a["type0"], len(a["idea"]), S16 / 2, 0.7)
    sting(m, a["sting"], big=False)                  # the full stop becomes the spark; twin on the drop at 4
    groove(m, 4.0, 8)
    motif(m, 12.0, 0.4)
    for t in a["scenes"]:
        m.add(whoosh(0.5, 0.8), t - 0.3, rev=0.1)
    for i, t in enumerate(a["names"]):
        m.add(pop(760 + 120 * i, 0.7), t, pan=-0.3 + 0.3 * i)
    m.add(bell(88, 0.4), a["pick"], rev=0.3)
    for i, t in enumerate(a["domains"]):
        m.add(pop(900 if i else 500, 0.55), t, pan=0.2)
    for i, t in enumerate(a["handles"]):
        m.add(pop(1000 + 40 * i, 0.4), t, pan=-0.4 + 0.16 * i)
    for i, t in enumerate(a["looks"]):
        m.add(whoosh(0.25, 0.5), t - 0.08)
        m.add(tabla("na", 0.5), t, pan=-0.4 + 0.27 * i)
    m.add(bell(88, 0.5), a["lpick"], rev=0.35, dly=0.15)
    for i, t in enumerate(a["reveal"]):
        m.add(pop(640 + 80 * i, 0.5), t, pan=-0.4 + 0.2 * i)
    end_card(m, a["end"], a["dur"] - a["end"])
    return m.render(), NMB_VO


# ------------------------------------------------------------------ Comment -> Brand (22 s)
CMT = dict(dur=22.0, type0=0.4, idea="a dog café with a reading corner", post=2.4, sting=2.5,
           name=4.1, logo=6.0, swatches=[8.0, 8.25, 8.5, 8.75, 9.0], mocks=[10.25, 10.75, 11.25], chip=12.0,
           next=14.0, end=18.0)
CMT_VO = [
    (0.1, "Comment an idea, and we'll turn it into a brand."),
    (4.3, "Pawse. Paws, plus pause."),
    (6.2, "A paw that says pause."),
    (8.2, "Warm, cosy colours."),
    (10.2, "And a café ready to open. Plus a lot more inside."),
    (14.2, "Your idea could be next. Drop it in the comments."),
]


def comment():
    a = CMT
    m = Mix(a["dur"])
    groove_bar(m, 0.0, 0, level=0.55, arp=False)
    quiet_pad(m, 0.0, 2.6, chord=0, lo=600, hi=1600)
    type_clicks(m, a["type0"], len(a["idea"]), S16 / 2, 0.7)
    m.add(pop(1100, 0.8), a["post"], rev=0.2)
    sting(m, a["sting"], big=False)
    m.add(reverse_whoosh(0.4, 0.6), 3.6)
    groove(m, 4.0, 5)
    groove(m, 14.0, 2, start=1, level=0.8)
    motif(m, 14.0, 0.4)
    m.add(pop(800, 0.7), a["name"], rev=0.2)
    m.add(bell(83, 0.4), a["logo"], rev=0.3, dly=0.12)
    for i, t in enumerate(a["swatches"]):
        m.add(pop(620 + 90 * i, 0.55), t, pan=-0.4 + 0.2 * i)
    for i, t in enumerate(a["mocks"]):
        m.add(pop(700 + 120 * i, 0.6), t, pan=-0.3 + 0.3 * i)
        m.add(tabla("na", 0.4), t, rev=0.1)
    m.add(pop(1200, 0.45), a["chip"])
    for t in (4.0, 6.0, 8.0, 10.0, 14.0):
        m.add(whoosh(0.4, 0.6), t - 0.25, rev=0.1)
    end_card(m, a["end"], a["dur"] - a["end"])
    return m.render(), CMT_VO


SCORES = {"name-my-brand-loopa": nmb, "comment-to-brand": comment}


def build(slug):
    os.makedirs(OUT, exist_ok=True)
    music, lines = SCORES[slug]()
    raw = os.path.join(OUT, slug + "-music.raw.wav")
    write_wav(raw, music)
    mpath = os.path.join(OUT, slug + "-music.wav")
    master(raw, mpath)
    final = os.path.join(OUT, slug + ".wav")
    if lines:
        mix_vo(mpath, lines, final, os.path.join("vo", slug))
    else:
        os.replace(mpath, final)
    return final


if __name__ == "__main__":
    slugs = list(SCORES) if sys.argv[1:] == ["all"] else sys.argv[1:]
    for s in slugs:
        print("built", build(s))
