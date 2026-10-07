"""Voiceover for the announcement, mixed over the score with the music ducked under the voice.

    python3 voiceover.py          # needs out/announcement.wav (python3 sound.py out) first

Each line is spoken by Kokoro-82M (a local text-to-speech model, run through `hyperframes tts`)
and placed on its scene. Writes vo/NN.wav (one per line) and out/announcement-vo.wav (the final mix).
"""
import hashlib
import os
import subprocess
import wave

import numpy as np
from scipy.signal import resample_poly

from sound import SR, master, write_wav

HERE = os.path.dirname(os.path.abspath(__file__))
VOICE, SPEED = "af_heart", 1.0

# (start in seconds on the 54 s timeline, text). Brand names are spelt the way they should sound.
LINES = [
    (0.15, "This brand didn't exist five minutes ago."),
    (3.1, "It started with one sentence."),
    (5.7, "Normally, that means nine tabs... and three weekends."),
    (10.9, "Or just one tab."),
    (12.6, "Describe your idea. Get names with real meaning, each one scored out of ten."),
    (18.5, "Then check domains and social handles. Honestly checked. Never guessed."),
    (24.5, "The Go Brand Score shows its working. Every part, explained."),
    (30.5, "Pick from four logo looks. Real vector logos, not clip-art."),
    (36.4, "Then get the whole brand. Colours, fonts and mockups."),
    (40.4, "Plus a launch kit, and an AI assistant to fine-tune it."),
    (44.5, "Your idea deserves a brand."),
    (48.6, "Start free at go brand today dot com. No sign-up needed."),
]


def read_wav(path):
    with wave.open(path) as w:
        sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype="<i2").astype(float) / 32768
    x = x.reshape(-1, ch).T
    return sr, x


def line_audio(k, text, cache="vo"):
    tag = hashlib.md5(f"{VOICE}|{SPEED}|{text}".encode()).hexdigest()[:8]
    path = os.path.join(HERE, cache, f"{k:02d}-{tag}.wav")
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        subprocess.run(["npx", "--no-install", "hyperframes", "tts", text, "-v", VOICE, "-s", str(SPEED), "-o", path],
                       check=True, capture_output=True, cwd=HERE)
    sr, x = read_wav(path)
    mono = x.mean(axis=0)
    if sr != SR:
        mono = resample_poly(mono, SR, sr)
    # trim silence at both ends and normalise each line to the same peak
    idx = np.where(np.abs(mono) > 0.01)[0]
    mono = mono[max(idx[0] - 200, 0): idx[-1] + 2400]
    return mono / (np.max(np.abs(mono)) + 1e-9) * 0.7


def main():
    mix_vo(os.path.join(HERE, "out", "announcement.wav"), LINES, os.path.join(HERE, "out", "announcement-vo.wav"), "vo")


def mix_vo(music_path, lines, out_path, cache):
    """Place each (start, text) line over the music, duck the music under it and master."""
    sr, music = read_wav(music_path)
    assert sr == SR
    LINES = lines
    n = music.shape[1]
    vo = np.zeros(n)
    for k, (t, text) in enumerate(LINES):
        a = line_audio(k, text, cache)
        i = int(t * SR)
        end = t + len(a) / SR
        nxt = LINES[k + 1][0] if k + 1 < len(LINES) else n / SR
        print(f"{t:5.2f}-{end:5.2f}s {'OVERLAPS NEXT LINE ' if end > nxt else ''}{text}")
        vo[i:i + len(a)] += a[: n - i]
    # duck the music under the voice: fast attack, slow release, about -9 dB at full voice
    env = np.abs(vo)
    win = int(0.03 * SR)
    env = np.convolve(env, np.ones(win) / win, mode="same")
    rel = np.exp(-1 / (0.35 * SR))
    sm = np.empty_like(env)
    acc = 0.0
    for j, v in enumerate(env):
        acc = v if v > acc else acc * rel + v * (1 - rel)
        sm[j] = acc
    duck = 1 - 0.65 * np.clip(sm / 0.08, 0, 1)
    mix = music * duck[None, :] + np.stack([vo, vo]) * 0.95
    raw = out_path.replace(".wav", ".raw.wav")
    write_wav(raw, mix / max(1.0, np.max(np.abs(mix))))
    master(raw, out_path)
    print("wrote", os.path.relpath(out_path, HERE))


if __name__ == "__main__":
    main()
