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


# ------------------------------------------------------------------ 9 tabs vs 1 tab (18 s)
RACE = dict(dur=18.0, tabs=[1.5 + i * 0.25 for i in range(9)], steps=[1.5 + i for i in range(7)], done=8.0,
            rail=10.0, end=14.0)
RACE_VO = [
    (0.1, "Same idea. Two ways to brand it."),
    (2.35, "The old way: nine tabs, three weekends."),
    (5.0, "Our way: one tab. Name, domains, logo, brand book. Done."),
    (10.2, "And that's not even everything. There's a lot more inside."),
]


def race():
    a = RACE
    m = Mix(a["dur"])
    groove(m, 0.0, 5, level=0.9)
    for i, t in enumerate(a["tabs"]):
        m.add(pop(480 + 40 * i, 0.55), t, pan=-0.5, rev=0.1)
        m.add(glitch(0.5), t + 0.12, pan=-0.6)
    for i, t in enumerate(a["steps"]):
        m.add(pluck(76 + [0, 4, 7, 11, 12, 16, 19][i], 0.5), t, pan=0.5, rev=0.25)
        m.add(ting(88 + [0, 4, 7, 11, 12, 16, 19][i] % 12, 0.25), t + 0.05, pan=0.5, rev=0.3)
    m.add(bell(88, 0.5), a["done"], pan=0.4, rev=0.4, dly=0.15)
    m.add(bell(95, 0.35), a["done"], pan=0.5, rev=0.4)
    m.add(whoosh(0.5, 0.8), a["rail"] - 0.3, rev=0.1)
    groove(m, a["rail"], 2, start=2, level=0.85)
    motif(m, a["rail"], 0.4)
    end_card(m, a["end"], a["dur"] - a["end"])
    return m.render(), RACE_VO


# ------------------------------------------------------------------ Four logos, one name (22 s)
FOUR = dict(dur=22.0, looks=[2.0, 4.0, 6.0, 8.0], grid=[10.1, 10.25, 10.4, 10.55], facts=14.0, end=18.0)
FOUR_VO = [
    (0.1, "Same name. Four logos. Which wins?"),
    (2.3, "One: a teacup with moon steam."),
    (4.3, "Two: an m that's fast asleep."),
    (6.3, "Three: a night-sky emblem."),
    (8.3, "Four: a full moon for an o."),
    (10.3, "Comment your pick. One, two, three, or four?"),
    (14.2, "Every brand gets four looks. And a lot more inside."),
]


def four():
    a = FOUR
    m = Mix(a["dur"])
    groove(m, 0.0, 9, level=0.9)
    for i, t in enumerate(a["looks"]):
        m.add(whoosh(0.45, 0.8), t - 0.3, rev=0.1)
        m.add(tabla("dha" if i % 2 else "tin", 0.55), t, rev=0.15)
        m.add(bell(76 + [0, 7, 12, 16][i], 0.45), t, pan=-0.3 + 0.2 * i, rev=0.35, dly=0.12)
    for i, t in enumerate(a["grid"]):
        m.add(pop(700 + 110 * i, 0.55), t, pan=-0.4 + 0.27 * i)
    motif(m, a["facts"], 0.4)
    end_card(m, a["end"], a["dur"] - a["end"])
    return m.render(), FOUR_VO


# ------------------------------------------------------------------ Inside the GoBrand Score (30 s)
SCORE = dict(dur=30.0, comps=[3.0 + 2 * i for i in range(8)], totals=19.0, guide=23.0, end=26.0)
SCORE_VO = [
    (0.1, "Is your brand name actually good? Here's how we score it."),
    (3.4, "Eight parts. Each one weighted, and explained."),
    (7.1, "Will people remember it? Can they say it?"),
    (11.1, "Is the domain free? Does it stand out?"),
    (15.1, "Does it work in other languages? Are the handles free?"),
    (19.2, "Add it up, and you get a score out of ten, with the reasons."),
    (22.75, "It's guidance, not a guarantee. And there's a lot more inside."),
]


def score_video():
    a = SCORE
    m = Mix(a["dur"])
    groove(m, 0.0, 13, level=0.85)
    m.add(pop(700, 0.6), 1.2)
    m.add(pop(500, 0.6), 1.5)
    for i, t in enumerate(a["comps"]):
        m.add(whoosh(0.3, 0.4), t - 0.15)
        m.add(pluck(76 + [0, 4, 7, 11, 12, 16, 19, 23][i], 0.5), t, pan=-0.3 + 0.08 * i, rev=0.25)
        m.add(pop(900, 0.35), t + 0.5)
        m.add(pop(600, 0.3), t + 0.62)
    m.add(bell(88, 0.5), a["totals"], rev=0.35, dly=0.15)
    m.add(bell(76, 0.35), a["totals"] + 0.4, rev=0.35)
    motif(m, a["guide"], 0.35)
    end_card(m, a["end"], a["dur"] - a["end"])
    return m.render(), SCORE_VO


# ------------------------------------------------------------------ Indian roots (26 s)
ROOTS = dict(dur=26.0, morph=1.0, idea=3.4, mode=5.0, names=[7.4, 7.9, 8.4], langs=[13.6 + 0.25 * i for i in range(7)],
             clear=15.6, logo=17.2, mocks=[18.6, 19.1], end=22.0)
ROOTS_VO = [
    (0.1, "Names with Indian roots, that work everywhere."),
    (3.2, "Pick India-Inspired. One of ten naming modes."),
    (7.6, "Every name shows its roots, and its meaning."),
    (13.2, "And we check how it reads in other languages."),
    (16.9, "Even a logo inspired by the Devanagari headline bar. And a lot more inside."),
]


def roots():
    a = ROOTS
    m = Mix(a["dur"])
    m.add(pad_chord([40, 47, 52, 59], 3.2, 0.5, bright=900), 0.0, rev=0.4)       # a low drone under the hook
    m.add(tabla("tin", 0.6), 0.0, rev=0.2)
    m.add(tabla("dha", 0.7), a["morph"], rev=0.2)
    m.add(bell(88, 0.45), a["morph"] + 0.5, rev=0.4, dly=0.15)
    m.add(riser(1.0, 0.4), 2.0)
    groove(m, 3.0, 9, level=0.9)
    type_clicks(m, a["idea"], 27, S16 / 2, 0.5)
    m.add(bell(83, 0.5), a["mode"], rev=0.3, dly=0.12)
    for i, t in enumerate(a["names"]):
        m.add(pop(760 + 120 * i, 0.6), t, pan=-0.3 + 0.3 * i)
    for i, t in enumerate(a["langs"]):
        m.add(pluck(76 + [0, 2, 4, 7, 9, 12, 14][i], 0.4), t, pan=-0.5 + 0.16 * i, rev=0.2)
    m.add(bell(88, 0.4), a["clear"], rev=0.35)
    m.add(riser(0.8, 0.4), a["logo"] - 0.6)
    m.add(tabla("dha", 0.6), a["logo"] + 0.2, rev=0.2)
    for i, t in enumerate(a["mocks"]):
        m.add(pop(700 + 140 * i, 0.55), t)
    for t in (3.0, 7.0, 13.0, 17.0):
        m.add(whoosh(0.4, 0.6), t - 0.25, rev=0.1)
    motif(m, 13.0, 0.35)
    end_card(m, a["end"], a["dur"] - a["end"])
    return m.render(), ROOTS_VO


# ------------------------------------------------------------------ Brand book unboxing (24 s, ASMR)
UNBOX = dict(dur=24.0, rip=1.7, lid=2.6, rise=3.4, cover=4.6, flips=[6.0, 8.2, 10.4, 12.6, 14.8, 17.0], close=19.0, end=20.0,
             items={6.0: [6.5, 6.8, 7.1], 8.2: [8.7, 9.1], 10.4: [10.8, 10.95, 11.1, 11.25, 11.4], 12.6: [13.0, 13.4],
                    14.8: [15.2, 15.45, 15.7, 15.95], 17.0: [17.4, 17.8, 18.2]})
UNBOX_VO = [
    (0.2, "Your brand book just arrived."),
    (18.4, "Your brand, in a box. And more inside."),
]


def unbox():
    a = UNBOX
    m = Mix(a["dur"])
    m.add(pad_chord(CHORDS[0][0], 6.2, 0.35, bright=900), 0.0, rev=0.4)
    m.add(thud(0.6), 0.3)
    m.add(tape_rip(1.0), a["rip"], pan=0.3, rev=0.08)
    m.add(thud(0.8), a["lid"])
    m.add(page_flip(0.6), a["lid"] + 0.05, pan=-0.2)
    m.add(riser(1.0, 0.25), a["rise"] - 0.2)
    m.add(bell(88, 0.35), a["cover"], rev=0.4, dly=0.15)
    groove(m, 6.0, 7, level=0.45, fills=False)
    for t in a["flips"]:
        m.add(page_flip(1.0), t - 0.05, pan=float(RNG.uniform(-0.3, 0.3)), rev=0.1)
    for t0, its in a["items"].items():
        for i, t in enumerate(its):
            m.add(pop(700 + 90 * i, 0.4), t, pan=-0.3 + 0.15 * i, rev=0.1)
    m.add(page_flip(0.9), a["close"] - 0.05)
    m.add(thud(0.6), a["close"] + 0.3)
    end_card(m, a["end"], a["dur"] - a["end"])
    return m.render(), UNBOX_VO


# ------------------------------------------------------------------ Naming rules (18 s each, five standalone videos)
RULE_VO = {
    "naming-rule-short": ["Short beats clever.", "The Candle and Wax Company? Too long.",
                          "Wickd. Five letters, and it says the vibe.", "That's memorability, part of your GoBrand Score."],
    "naming-rule-say-it": ["If they can't say it, they can't share it.", "Qwyzzlr? Good luck spelling that.",
                           "Mello. Say it once, and everyone gets it.", "That's pronunciation, part of your GoBrand Score."],
    "naming-rule-stand-out": ["Don't sound like everyone else.", "Smart App-ify? Sounds like every app.",
                              "Loopa. A hanger with a loop. Only one brand owns that.", "That's distinctiveness, part of your GoBrand Score."],
    "naming-rule-domain": ["Check the domain before you fall in love.", "Love the name, but the dot com is taken?",
                           "Domain-First shows only names you can register right now.", "Domain checks are part of your GoBrand Score."],
    "naming-rule-meaning": ["Make it mean something.", "Xorbo? Means nothing, so it says nothing.",
                            "Ojas. Sanskrit for vitality.", "That's brandability, part of your GoBrand Score."],
}
RULE_T = dict(dur=18.0, bad=3.0, good=5.6, comp=9.0, more=12.6, end=14.0)


def rule_score(slug):
    a = RULE_T
    m = Mix(a["dur"])
    groove(m, 0.0, 7, level=0.8)
    m.add(pop(800, 0.5), 0.2)
    m.add(whoosh(0.35, 0.6), a["bad"] - 0.2)
    m.add(thud(0.7), a["bad"] + 0.6)
    m.add(glitch(0.9), a["bad"] + 0.62)
    m.add(whoosh(0.35, 0.6), a["good"] - 0.2)
    m.add(bell(88, 0.5), a["good"] + 0.6, rev=0.35, dly=0.15)
    for i in range(3):
        m.add(pluck(76 + [0, 7, 12][i], 0.45), a["comp"] + 0.6 + i * 0.25, rev=0.2)
    m.add(whoosh(0.4, 0.6), a["more"] - 0.25)
    end_card(m, a["end"], a["dur"] - a["end"])
    v = RULE_VO[slug]
    return m.render(), [(0.1, v[0]), (3.1, v[1]), (5.8, v[2]), (9.2, v[3])]


SCORES = {"brand-book-unboxing": unbox, "indian-roots": roots, "inside-the-score": score_video, "name-my-brand-loopa": nmb, "comment-to-brand": comment, "nine-tabs-vs-one": race, "four-logos-one-name": four}


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


for _slug in RULE_VO:
    SCORES[_slug] = (lambda sl: (lambda: rule_score(sl)))(_slug)


if __name__ == "__main__":
    slugs = list(SCORES) if sys.argv[1:] == ["all"] else sys.argv[1:]
    for s in slugs:
        print("built", build(s))
