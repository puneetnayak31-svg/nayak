# KAHAANI · "IPL की पहली रात": AI-assisted re-edit

A re-edit of the Sports Tak *Kahaani* episode in which Vikrant Gupta tells how the IPL was born, with graphics,
sourced visuals and new compositions built around his narrative. The plan, beat by beat with rights notes, is in
**[TREATMENT.md](TREATMENT.md)**.

## Outputs (`output/`)
| File | What |
|---|---|
| `sample1_cold_open.mp4` | 0:00–0:50 rendered: date slam behind Vikrant, venue, rebuilt name super, the four questions, title card |
| `sample2_first_night.mp4` | 7:16–10:00 rendered: the boycott called off, match-up, batting order, McCullum, the 158/222 run share, RCB squad, scoreboard, SRK, "super hit", Rajasthan Royals |
| `storyboard.jpg` | Key frames from both samples |

Programme timing and audio are untouched, so pre-rolls, sponsor L-bands and the app end card stay exactly where they were sold.

## How it works
- `transcribe.py`: word-level Hindi transcript of the master (Whisper large-v3-turbo, 10-s windows; with longer windows
  Devanagari overflows Whisper's per-window token budget and silently drops text). Output is in `transcript/`.
- `gfx.py`: rendering primitives: type (with proper Devanagari shaping), easing, grade, grain, the person matte
  (MediaPipe selfie segmentation) and video I/O.
- `treatments.py`: the visual devices: depth title, full-bleed, question stack, title card, kinetic phrase, split screen,
  scoreboard, name super, info card, match-up, side list, run share. Each one animates its own way in and out.
- `edl.py`: the edit decision list, one beat per line of narration. It also holds the protected sponsor windows and
  `check_edl()`, which fails if any beat touches one.
- `edit.py`: decodes the master, applies the active beats to each frame, and muxes with the original audio.
- `source_images.py`: pulls CC/PD images from Wikimedia Commons into `assets/sourced/`, with licence, author and source
  page written to `CREDITS.json`. Credit lines are burned on screen while each image is up.

## Rebuild
The master isn't in git (110 MB). Put it at `source/kahaani_source.mp4`, then:
```
pip install faster-whisper mediapipe opencv-python-headless pillow numpy
python3 edl.py                                          # checks no beat covers a sponsor window
python3 edit.py source/kahaani_source.mp4 output/sample1_cold_open.mp4 --from 0 --to 50
python3 edit.py source/kahaani_source.mp4 output/sample2_first_night.mp4 --from 436 --to 600
python3 edit.py source/kahaani_source.mp4 x --stills 14.6,481,522    # design-check PNGs
```
