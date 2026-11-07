# Ashta Lakshmi: Diwali reel (Hindi)

A devotional 9:16 reel (1080×1920, 30 fps, H.264 + AAC, -14 LUFS) presenting the artist's eight
Lakshmi paintings in the order Adi, Dhan, Dhanya, Gaj, Santan, Veer, Vijay, Vidya, with a Hindi
female voiceover from start to finish.

| Output (`../output/`) | Length | What is narrated |
|---|---|---|
| `ashta-lakshmi-diwali-reel.mp4` | 60.0 s | Diwali greeting, the first sentence of each goddess's description, "जय माता लक्ष्मी। जय अष्टलक्ष्मी।" |
| `ashta-lakshmi-diwali-full.mp4` | 2:38 | Every line of the brief, word for word (intro, both sentences for each goddess, full closing) |

The full script runs about 2½ minutes at a calm pace, so a 60-second reel cannot hold all of it
without rushing the voice. The 60-second cut keeps whole sentences from the brief, unedited, and drops
the rest. `NARRATION.md` lists every line with its start time.

## How it is made
- `script.py`: all narration and on-screen text, verbatim from the brief
- `voice.py`: Hindi narration with the Microsoft neural voice hi-IN-SwaraNeural (`pip install edge-tts`; needs network).
  The clips are committed in `assets/voice/`, so rebuilding does not need the network.
- `timeline.py`: timing driven by the narration. Each sentence appears on screen as it is spoken.
- `audio.py`: synthesised score (tanpura, bansuri alaap in Raag Yaman, sitar, temple bells, warm pad),
  ducked about 14 dB under the voice. No samples are used, so nothing needs licensing.
- `render.py`: diya and marigold opening and closing, gallery-framed paintings, gold Devanagari typography (Tiro Devanagari Hindi, OFL)

The paintings (`assets/paintings/`) are the artist's studio photographs, unchanged. They are shown
whole and only scaled. The renderer trims just the empty black backdrop and the gold mantra caption
under each frame, since the reel sets its own title.

## Rebuild
```
python3 audio.py reel build/reel.wav
python3 render.py reel ../output/ashta-lakshmi-diwali-reel.mp4 build/reel.wav
python3 render.py reel ../output/ashta-lakshmi-diwali-reel-cover.jpg --cover
```
Use `full` in place of `reel` for the long version. Needs Python 3 with Pillow (with raqm) and numpy, plus ffmpeg.
