# explore/indian/wildlife: Jackal reel ("Salute to the forest's most loyal cleaner")

A 9:16 reel for YouTube Shorts and Instagram Reels (1080×1920, 30 fps, H.264 at up to 6 Mbps, AAC, -14 LUFS),
in the **Pugmark Pin** brand: Deep Teal, Canopy, Signal Lime, Mist and Graphite, set in Space Grotesk and IBM Plex Mono,
with Mukta for Devanagari. It uses the four jackal photos from Sarapduli FRH, Dhikala Zone, Corbett.

## Outputs (`output/`)
| File | What |
|---|---|
| `jackal-hi.mp4` | Hindi voiceover with Hindi captions (≈68 s) |
| `jackal-en.mp4` | English voiceover with English captions (≈65 s) |
| `jackal-hi-cover.jpg`, `jackal-en-cover.jpg` | 9:16 covers in the brand thumbnail style |

## Story (scene, then what's on screen)
1. **Hook**: "Can you spot him?" A scanning reticle searches the bushes.
2. **Lock**: the reticle locks onto the face. Species card: Golden Jackal · *Canis aureus* · siyaar/geedad.
3. **Location**: brand lower third "Dhikala Zone · Corbett NP", with a tag for Sarapduli F.R.H.
4. **Stare**: eye-tracking brackets and "EYE CONTACT › LOCKED".
5. **Howl**: grade shifts to dusk (clock 17:58 → 18:42), then a synthesised howl plays alone over a live waveform.
6. **Hunter**: respect meter (tiger vs jackal), "Skilled hunter" and a diet log that ticks in time with the VO.
7. **Clean-up crew**: tiger pugmarks with jackal prints following them to the kill, on a topographic field.
8. **Loyalty**: loyalty meter, "pair bond often for life" and "last year's pups help raise the litter".
9. **Salute**: pulls back to the full camouflaged frame.
10. **CTA**: the Pugmark Pin emblem drops in, then the wordmark, and the Subscribe/Follow buttons get tapped.

## Safe area
All text and key graphics stay inside **x 90–920, y 290–1440**. That keeps the top 290 px clear of the Shorts/Reels header,
the bottom 480 px clear of the caption, channel and audio rows, and the right 160 px clear of the action buttons.
`python3 render.py LANG --check` measures every text box on every third frame. Both languages report 0 violations.

## Files
- `story.py`: VO lines (spoken text and caption) per scene, on-screen text, voices and pacing
- `vo.py`: offline TTS with Kokoro (`hm_omega` for Hindi, `bm_george` for English). Writes `build/vo-LANG.wav` and a timeline JSON that drives cuts and captions
- `music.py`: synthesised bed (D minor, 84 bpm), forest ambience, howl, HUD blips and whooshes, with music ducked under the VO. Uses no samples.
- `render.py`: frames, HUD, captions, transitions, encode, cover and safe-area check

## Rebuild
```
# once: Kokoro model files (~350 MB) into ./models (or set KOKORO_DIR)
#   https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
#   https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
pip install kokoro-onnx soundfile fonttools pillow numpy
python3 vo.py hi build/vo-hi.wav
python3 music.py hi
python3 render.py hi                 # output/jackal-hi.mp4
python3 render.py hi --thumbnail
```
Fonts (Space Grotesk, IBM Plex Mono, Mukta) are under the SIL OFL.
