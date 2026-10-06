# Amausa Ka Mela — Instagram Reel

A 45-second 9:16 reel (1080×1920, 30 fps, H.264 + AAC, -14 LUFS) built around
**Amausa Ka Mela** (N° 01), a Mithila painting by **Dr Piyush Kiran Nayak**.
It has no voiceover. All text and facts come from the artist's portfolio.

## Outputs (`output/`)
| File | What it is |
|---|---|
| `amausa-ka-mela-reel.mp4` | English reel, ready to upload |
| `amausa-ka-mela-cover.jpg` | English thumbnail |
| `amausa-ka-mela-reel-hindi.mp4` | Hindi reel (all on-screen text in Hindi), ready to upload |
| `amausa-ka-mela-thumbnail-hindi.jpg` | Hindi thumbnail |

In the Hindi version, the artist scene lists her credentials from the portfolio's "Recognition"
page instead of her quote: 25+ years with Indian folk art, Government of India licensed artisan,
studying at Shilp Kala Vidyapeeth.

## Storyboard (each scene is two bars of music, 2.5 s per bar)
| Time | Scene |
|---|---|
| 0–5 s | Hook: the two friends' eyes meet across the river. "Two childhood friends. One river. One fair." |
| 5–10 s | Title card: *Amausa Ka Mela* · अमौसा का मेला, framed the way the portfolio hangs it |
| 10–15 s | The reunion: Champa & Chameli at a mela in Prayagraj |
| 15–20 s | The Ganges between them, "holding their conversation in trust for years" |
| 20–25 s | Technique: *kachni* waves and *bharni* fills |
| 25–30 s | Mithila elements: birds in flight, floral fills, geometric patterning, ornamental motifs |
| 30–35 s | Full painting, inspired by Kailash Gautam's poem; acrylic on handmade paper, dip nib, 22 × 30 in |
| 35–40 s | The artist: logo, name, and her quote from the portfolio |
| 40–45 s | CTA: Follow @piyushart_gallery · piyushkirannayak.com |

## Music
All music is synthesised in `music.py`, so there is no licensing to clear. It has a tanpura drone,
a bansuri melody in a Bhupali-style pentatonic scale, santoor-like plucks, dholak in keherwa taal,
manjira, ghungroo and temple bells. The tempo is 96 bpm, and scene cuts land on bar lines.

## Instagram safe zones
Text and the CTA stay inside x 90–930 and y 270–1480. That leaves the top 270 px clear for the
Reels header, the bottom 440 px for the caption and audio row, and the right 150 px for the
action buttons. `python3 render.py x --check` (add `--lang hi` for Hindi) measures every caption on every third frame and
reports anything outside the safe area. Both versions currently report 0 issues.

## Rebuild
```
python3 music.py music.wav
python3 render.py output/amausa-ka-mela-reel.mp4 music.wav               # final
python3 render.py output/amausa-ka-mela-reel-hindi.mp4 music.wav --lang hi   # Hindi
python3 render.py output/preview.mp4 music.wav --safezones               # safe-zone overlay (review only)
```
Requires Python 3 with Pillow (with raqm, for Devanagari) and numpy, plus ffmpeg with libx264.
Fonts are Cormorant Garamond, Jost, Tiro Devanagari Hindi, Martel and Hind, all under SIL OFL (see `assets/fonts`).
