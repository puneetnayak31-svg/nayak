"""Speaks the voiceover with Kokoro (offline TTS) and writes the timeline.

    python3 vo.py LANG OUT.wav           # LANG = hi | en; also writes OUT.json

The Kokoro model files are not in the repo (about 350 MB). Download them once:
    https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
    https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
and point KOKORO_DIR at their folder (default: ./models).

The JSON timeline lists every line (scene, start, end, caption) and every scene
(name, start, end). render.py and music.py read it, so cuts and captions follow the voice.
"""
import json
import os
import sys
import wave

import numpy as np

from story import LEAD_IN, LINES, PAUSE, SCENE_GAP, SCENES, TAIL, VOICES

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))


def trim(x, sr, thresh=0.012, pad=0.04):
    """Cut leading and trailing silence, keeping a short pad."""
    env = np.convolve(np.abs(x), np.ones(int(0.01 * sr)) / int(0.01 * sr), mode="same")
    idx = np.where(env > thresh * env.max())[0]
    if not len(idx):
        return x
    a = max(0, idx[0] - int(pad * sr))
    b = min(len(x), idx[-1] + int(pad * sr))
    return x[a:b]


def resample(x, sr_in, sr_out):
    n = int(len(x) * sr_out / sr_in)
    return np.interp(np.arange(n) * sr_in / sr_out, np.arange(len(x)), x)


def polish(x):
    """High-pass, gentle compression and a little presence, so the voice sits on top of the bed."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (70 / np.maximum(f, 1)) ** 4)  # high-pass at 70 Hz
    X *= 1 + 0.25 * np.exp(-((f - 3200) / 1400) ** 2)  # presence lift
    X *= 1 + 0.15 * np.exp(-((f - 160) / 90) ** 2)  # chest warmth
    x = np.fft.irfft(X, len(x))
    env = np.sqrt(np.convolve(x ** 2, np.ones(441) / 441, mode="same")) + 1e-6
    target = np.percentile(env, 90)
    gain = np.clip((env / target) ** -0.35, 0.6, 2.2)  # about 1.5:1 above and below the target
    gain = np.convolve(gain, np.ones(882) / 882, mode="same")
    return x * gain


def main(lang, out):
    from kokoro_onnx import Kokoro

    d = os.environ.get("KOKORO_DIR", os.path.join(HERE, "models"))
    k = Kokoro(os.path.join(d, "kokoro-v1.0.onnx"), os.path.join(d, "voices-v1.0.bin"))
    v = VOICES[lang]
    clips, lines, scenes = [], [], []
    t = LEAD_IN
    for si, name in enumerate(SCENES):
        if si:
            t += SCENE_GAP
        s0 = t
        for li, line in enumerate(LINES[lang][name]):
            spoken, caption = line[0], line[1]
            audio, sr = k.create(spoken, voice=v["voice"], speed=v["speed"], lang=v["lang"])
            audio = resample(trim(np.asarray(audio, dtype=np.float64), sr), sr, SR)
            audio = polish(audio)
            audio /= np.sqrt(np.mean(audio ** 2)) + 1e-9  # same loudness for every line
            clips.append((t, audio))
            lines.append(dict(scene=name, start=round(t, 3), end=round(t + len(audio) / SR, 3), caption=caption))
            print(f"{name:9s} {t:6.2f}  {len(audio) / SR:5.2f}s  {caption}")
            t += len(audio) / SR
            last = li == len(LINES[lang][name]) - 1
            t += (line[2] if len(line) > 2 else PAUSE) if not last else 0
        scenes.append(dict(name=name, start=round(s0, 3), end=round(t, 3)))
    dur = t + TAIL
    # Scenes cut a moment before their first word and run until the next one starts.
    for a, b in zip(scenes, scenes[1:]):
        b["start"] = round(b["start"] - SCENE_GAP * 0.6, 3)
        a["end"] = b["start"]
    scenes[0]["start"] = 0.0
    scenes[-1]["end"] = round(dur, 3)

    mix = np.zeros(int(dur * SR) + SR)
    for t0, a in clips:
        i = int(t0 * SR)
        mix[i:i + len(a)] += a
    mix = mix[: int(dur * SR)]
    mix *= 0.5 / np.abs(mix).max()
    with wave.open(out, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    with open(os.path.splitext(out)[0] + ".json", "w") as f:
        json.dump(dict(lang=lang, duration=round(dur, 3), lines=lines, scenes=scenes), f, ensure_ascii=False, indent=1)
    print(f"total {dur:.2f}s")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
