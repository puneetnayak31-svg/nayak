"""Voices every line with Kokoro (offline TTS, Hindi voices) and writes build/timeline.json.

Usage: python3 voice.py MODEL_DIR
MODEL_DIR holds kokoro-v1.0.onnx and voices-v1.0.bin from
https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
These are placeholder voices: swap build/voice/<id>.wav for the studio recordings
and rerun with --keep to rebuild the timeline from them.
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

from script import CAST, LINES

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
VOICE = os.path.join(BUILD, "voice")
SR = 48000
LEAD_IN = 3.2      # title card before the first line
TAIL = 4.0         # end card after the last line


def trim(x, thresh=0.01):
    idx = np.where(np.abs(x) > thresh)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - 400)
    b = min(len(x), idx[-1] + 1200)
    return x[a:b]


def resample(x, sr_in, sr_out):
    n = int(round(len(x) * sr_out / sr_in))
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)


def main():
    keep = "--keep" in sys.argv
    os.makedirs(VOICE, exist_ok=True)
    if not keep:
        from kokoro_onnx import Kokoro
        mdir = sys.argv[1]
        k = Kokoro(os.path.join(mdir, "kokoro-v1.0.onnx"), os.path.join(mdir, "voices-v1.0.bin"))
    t = LEAD_IN
    events = []
    for lid, spk, roman, deva, speed, gap, beat in LINES:
        path = os.path.join(VOICE, lid + ".wav")
        if not keep:
            s, sr = k.create(deva, voice=CAST[spk]["voice"], speed=speed, lang="hi")
            s = trim(np.asarray(s, dtype=np.float32))
            sf.write(path, resample(s, sr, SR), SR)
        dur = sf.info(path).duration
        events.append({"id": lid, "spk": spk, "name": CAST[spk]["name"], "text": roman,
                       "beat": beat, "start": round(t, 3), "end": round(t + dur, 3)})
        t += dur + gap
    beats = []
    for e in events:
        if not beats or beats[-1]["name"] != e["beat"]:
            beats.append({"name": e["beat"], "start": e["start"]})
    beats[0]["start"] = 0.0
    for a, b in zip(beats, beats[1:]):
        a["end"] = b["start"]
    beats[-1]["end"] = round(t + TAIL, 3)
    tl = {"duration": round(t + TAIL, 3), "lead_in": LEAD_IN, "lines": events, "beats": beats,
          "end_card": round(t + 1.5, 3)}
    with open(os.path.join(BUILD, "timeline.json"), "w") as f:
        json.dump(tl, f, indent=1, ensure_ascii=False)
    print("duration", tl["duration"])
    for b in beats:
        print(b)


if __name__ == "__main__":
    main()
