# GoBrandToday marketing videos

| File (`output/`) | What it is |
|---|---|
| `gobrandtoday-logo-reveal-16x9.mp4`, `-9x16.mp4` | 6 s logo reveal: the full stop becomes the spark |
| `gobrandtoday-announcement-16x9.mp4`, `-9x16.mp4` | 38 s brand announcement, with cover frames (`-cover.jpg`) |

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
python3 video/build.py                    # one HyperFrames project per video and format
npx hyperframes render video/projects/announcement-9x16 -o output/gobrandtoday-announcement-9x16.mp4
```
Sources live in `video/src/`: `common.*` (brand tokens, the dot-to-spark morph, the wordmark, the
field of full stops), `wickd.js` (the example brand and its mockups) and one template per video.
The vertical cut keeps all text inside the Instagram Reels safe area (x 90-930, y 270-1480).
Cue times are shared between `audio/sound.py` (ANN, LOGO) and the templates.
