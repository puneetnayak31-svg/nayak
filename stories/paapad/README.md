# Paapad: one story in seven styles

These are sample videos of Story 02, "Paapad" (DI, September set 04), made to compare visual styles for CTV.
Each one is 1920×1080 at 24 fps, H.264 + AAC stereo, normalised to -16 LUFS, and about 1 m 44 s long.
Every style tells the whole story, from the title card to the end card, with the same voices and timing.

| File | Style | What to look at |
|---|---|---|
| `output/01-paper-desk.mp4` | Paper Ephemera Desk | Stop-motion paper cut-outs on a desk at 12 fps, typewriter-strip captions, rubber stamps, the fridge as a paper flap |
| `output/02-kalighat.mp4` | Neo-Kalighat | Swelling brush outlines and edge-shaded flat colour on raw paper, with hand-lettered captions across the top |
| `output/03-hoarding.mp4` | Bollywood Hoarding | Painted faces with turquoise shadows, sunbursts, 3D titles, a split-screen face-off and a triple zoom on "Haanji???" |
| `output/04-shadow-theatre.mp4` | Shadow Theatre | Translucent leather puppets on a lamp-lit screen, hinged jaws, rods, punched patterns, captions on the stage floor |
| `output/05-object-witness.mp4` | The Object Witness | No faces, only hands and objects shot like products, with a pressure cooker standing in for the fight and label captions |
| `output/06-riso-comic.mp4` | Two-Ink Riso Comic | Pink and blue overprint with halftones; each line becomes a panel and the speech bubbles are the captions |
| `output/07-doordarshan.mp4` | Doordarshan '89 | A VHS tape pass inside a TV cabinet, a "vichaar" card, serial reaction zooms and "rukawat ke liye khed hai" |

`output/style-board.jpg` shows every style at the same four moments: the opening shout, the argument, the expiry reveal and the final yell.

## Placeholder voices
The dialogue is synthesised with Kokoro, an offline TTS model with Hindi voices: Karun `hm_omega`, Jyotsna `hf_alpha`
and the narrator `hm_psi`. It is flat and only stands in for the timing. To use the studio recordings, drop one WAV per
line into `build/voice/<line id>.wav` (ids are in `script.py`), then run `python3 voice.py --keep` and rebuild.
The timeline follows the new durations automatically.

The dialogue follows the script. A few spellings were tidied: Dhai→Dahi, dehree→dheere, tumine→tumhe, Paapd→Paapad.

## Files
- `script.py`: the lines (Roman caption, Devanagari for the voice, speaker, pacing, scene beat)
- `voice.py`: voices the lines and writes `build/timeline.json`, which every style reads
- `audio.py`: synthesises the sound effects (chopping, rain, fridge door) and a music bed per style, ducked under the dialogue
- `frame.html`, `common.js`, `styles/*.js`: each style draws one frame for a given time on a canvas
- `render.mjs`: drives headless Chromium through Playwright and pipes the frames to ffmpeg, using parallel workers

## Rebuild
```
python3 voice.py /path/to/kokoro-models        # kokoro-v1.0.onnx + voices-v1.0.bin
python3 audio.py 03-hoarding build/03-hoarding.wav
WORKERS=4 node render.mjs 03-hoarding output/03-hoarding.mp4 build/03-hoarding.wav
node render.mjs 03-hoarding build/still --frames 12,76.5      # still frames for review
```
Requires Python 3 with numpy, scipy, soundfile and kokoro-onnx, plus Node with Playwright and Chromium, and ffmpeg.
The fonts in `assets/fonts` are under SIL OFL, except Special Elite, which is Apache 2.0.
Captions are kept inside the 90% title-safe area for TV.
