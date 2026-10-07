# GoBrandToday marketing videos

| File (`output/`) | What it is |
|---|---|
| `gobrandtoday-logo-reveal-16x9.mp4`, `-9x16.mp4` | 6 s logo reveal: the full stop becomes the spark |
| `gobrandtoday-announcement-16x9.mp4`, `-9x16.mp4` | 54 s brand announcement with voiceover, plus cover frames (`-cover.jpg`) |
| `name-my-brand-loopa/` | 24 s: one idea typed live becomes a brand (Loopa) |
| `comment-to-brand/` | 22 s: a viewer's comment becomes a brand (Pawse) |
| `nine-tabs-vs-one/` | 18 s: split-screen race, the old way vs one tab |
| `four-logos-one-name/` | 22 s: four Mello logo looks, "which wins?" |
| `inside-the-score/` | 30 s: the eight weighted parts of the GoBrand Score |
| `indian-roots/` | 26 s: India-Inspired naming and the Shirorekha look (Ojas) |
| `brand-book-unboxing/` | 24 s: ASMR unboxing of the Wickd brand book |
| `naming-rules/` | five standalone 18 s naming rules |

Every promo folder holds both formats, covers and a `metadata.md` with captions, titles, hashtags and posting notes.

The example brand in the announcement (Wickd, "a cosy candle brand for Gen Z") is illustrative and
labelled EXAMPLE on screen. Its names, scores and availability are not real results.

## Signature sound
`audio/sound.py` synthesises everything; there are no samples, so there is nothing to license.
`audio/out/sonic-logo.wav` is the four-note sting (dot, diamond, spark, twin) for every video, and
`audio/out/bed-loop.wav` is 8 bars of the signature groove that loop seamlessly.

## Rebuild
```
pip install -r requirements.txt
python3 audio/sound.py audio/out          # music and sting, mastered to -14 LUFS
(cd audio && python3 voiceover.py)        # voiceover (Kokoro, local) mixed over the score
(cd audio && python3 shorts.py all)       # scores + voiceovers for the promo shorts
python3 video/build.py                    # one HyperFrames project per video and format
npx hyperframes render video/projects/announcement-9x16 -o output/gobrandtoday-announcement-9x16.mp4
```
Sources live in `video/src/`: `common.*` (brand tokens, the dot-to-spark morph, the wordmark, the
field of full stops), `kit.*` (layout helpers and the branded end card), `brands.js`, `looks.js` and
`wickd.js` (the example brands, their logo constructions and mockups) and one template per video.
`naming-rule.html` is built once per entry in `naming-rules.json`.
The vertical cut keeps all text inside the Instagram Reels safe area (x 90-930, y 270-1480).
Cue times are shared between `audio/sound.py` (ANN, LOGO, HOLDS) and the templates; the voiceover
lines and their start times live in `audio/voiceover.py`. The light scenes are kept free of the
background field so text reads cleanly; it shows only faintly on the dark scenes.
