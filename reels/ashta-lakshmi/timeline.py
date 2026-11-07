"""Builds the reel's timeline from the narration: visuals follow the voice, not the other way round.

Two versions share everything except which lines are spoken:
  reel  ~60 s: greeting, the first sentence of each goddess's description, "जय माता लक्ष्मी। जय अष्टलक्ष्मी।"
  full  ~2:45: every line of the brief, word for word.
"""
import os
import subprocess
from functools import lru_cache

import numpy as np

from script import GODDESSES, clips, sentences

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100
XF = 0.8  # crossfade between scenes (centred on each boundary)

VERSIONS = {
    # pre/post: silence before and after each goddess's narration; hold: end card after the last word
    "reel": dict(intro=["intro0"], sentences=1, grid=None, outro=["outro3"],
                 lead=0.8, pre=0.4, post=0.6, hold=1.2),
    "full": dict(intro=["intro0", "intro1", "intro2", "intro3"], sentences=2, grid="outro0",
                 outro=["outro1", "outro2", "outro3"], lead=1.0, pre=0.5, post=0.75, hold=1.9),
}


@lru_cache(None)
def voice(key):
    """Narration clip as float32 mono at 44.1 kHz, trimmed to the speech with short soft edges."""
    path = os.path.join(HERE, "assets", "voice", key + ".mp3")
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"])
    x = np.frombuffer(raw, np.float32).copy()
    on = np.flatnonzero(np.abs(x) > 10 ** (-45 / 20))
    a, b = max(0, on[0] - int(0.03 * SR)), min(len(x), on[-1] + int(0.15 * SR))
    x = x[a:b]
    f = int(0.02 * SR)
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    return x


def dur(key):
    return len(voice(key)) / SR


def inner_pause(key):
    """Seconds into a clip where its longest internal pause ends (e.g. between "जय माता लक्ष्मी।" and "जय अष्टलक्ष्मी।")."""
    x = np.abs(voice(key))
    w = int(0.02 * SR)
    e = np.convolve(x, np.ones(w) / w, mode="same") > 10 ** (-40 / 20)
    best, start, run_end = 0, None, 0.0
    for i in range(0, len(e), w):
        if not e[i]:
            start = i if start is None else start
        elif start is not None:
            if i - start > best and start > 0.3 * SR:
                best, run_end = i - start, i / SR
            start = None
    return run_end


def build(version):
    v = VERSIONS[version]
    scenes, speech, bells = [], [], []

    def say(key, t):
        speech.append((t, key))
        return t + dur(key)

    # Opening: diyas, "॥ शुभ दीपावली ॥", then the अष्टलक्ष्मी card
    t = v["lead"]
    events = {"greet": 0.4}
    for i, key in enumerate(v["intro"]):
        if key == "intro2":
            events["title"] = t - 0.2
        t = say(key, t) + 0.6
    t -= 0.6
    if "title" not in events:  # short version: the card joins the greeting while it is spoken
        events["title"] = v["lead"] + 2.6
    t += 0.7
    scenes.append(dict(kind="open", start=0.0, end=t, events=events))
    bells.append(0.35)

    # The eight forms, in order
    for idx, (slug, title, desc) in enumerate(GODDESSES):
        b = t
        bells.append(b - 0.15)
        lines = sentences(desc)[: v["sentences"]]
        on = []
        t = b + v["pre"]
        for j in range(len(lines)):
            on.append(t)
            t = say(f"{slug}-{j + 1}", t) + 0.45
        t = t - 0.45 + v["post"]
        scenes.append(dict(kind="goddess", start=b, end=t, idx=idx, slug=slug, title=title,
                           lines=lines, events=dict(title=b + v["pre"] - 0.25, lines=on)))

    # Full version: all eight together for "माँ लक्ष्मी के ये आठ स्वरूप ..."
    if v["grid"]:
        b = t
        bells.append(b - 0.15)
        t = say(v["grid"], b + 0.6) + 0.6
        scenes.append(dict(kind="grid", start=b, end=t, events={}))

    # Closing: diyas, शुभ दीपावली, जय माता लक्ष्मी, जय अष्टलक्ष्मी
    b = t
    bells.append(b - 0.15)
    t = b + 0.6
    for key in v["outro"]:
        if key == "outro3":
            jai = (t, t + inner_pause(key))
        t = say(key, t) + 0.65
    t = t - 0.65 + v["hold"]
    scenes.append(dict(kind="close", start=b, end=t, events=dict(greet=b + 0.2, jai=jai)))
    bells.append(jai[1] - 0.05)

    for a, n in zip(scenes, scenes[1:]):
        assert abs(a["end"] - n["start"]) < 1e-9
    return dict(version=version, dur=t, scenes=scenes, speech=speech, bells=bells)


if __name__ == "__main__":
    for ver in VERSIONS:
        tl = build(ver)
        print(f"{ver}: {tl['dur']:.2f} s, {len(tl['speech'])} clips")
        for s in tl["scenes"]:
            print(f"   {s['kind']:8s} {s['start']:6.2f} -> {s['end']:6.2f}  {s.get('title', '')}")
    assert set(clips()) >= {k for ver in VERSIONS for _, k in build(ver)["speech"]}
