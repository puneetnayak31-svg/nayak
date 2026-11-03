# Animated sequence: "IPL की पहली रात" (7:51 – 8:46)

The first night at Chinnaswamy, retold with animated characters instead of text, over Vikrant's own voice.
The output is `../output/sample3_first_night_animated.mp4`.

| TC (master) | Vikrant says | What we see |
|---|---|---|
| 7:51.6 | (cut from him) | His shot morphs from full frame into a circular narrator window in the corner |
| 7:52 | "चिन्नास्वामी स्टेडियम…" | A dark stadium. The floodlights clunk on, tower by tower, and camera flashes ripple through the crowd |
| 7:55 | "बैंगलोर और कोलकाता" | Red-and-gold flags rise on one side, black-and-gold on the other |
| 7:57 | "कप्तान राहुल द्रविड़… सौरव गांगुली" | The two captains walk to the pitch. The coin spins up; Dravid waves KKR in to bat |
| 8:04 | "सौरव गांगुली और ब्रेंडन मैकलम ओपन…" | The openers walk out. A spotlight follows Ganguly; McCullum walks in the dark |
| 8:12 | "नंबर तीन… रिकी पोंटिंग" | A second spotlight finds Ponting, padded up at the boundary |
| 8:15 | "ध्यान सौरव और रिकी पर था" | Broadcast cameras swing round to the two stars and flashbulbs pop. McCullum is still in shadow |
| 8:21 | "सौरव गांगुली ने 10 रन बनाए" | Ganguly drives, a gold 10 appears, and he walks off; the light leaves with him |
| 8:24.7 | "लेकिन ब्रेंडन मैकलम…" | The light slams onto McCullum |
| 8:25 | "…आगाज़ इस तरह से किया" | He lofts it, the ball climbs into the night, and it bursts into fireworks |
| 8:28 | "बस पटाखे ही फोड़ते रहे" | Another swing, and the sky fills with fireworks over the crowd |
| 8:30.7 | "222 रन… 158 अकेले मैकलम" | The falling sparks gather into **222**, and 158 runs' worth of them turn gold |
| 8:35 | "10 दादा के, 20 पोंटिंग के…" | Three players stand on columns as tall as their runs: 10, 20, and McCullum's 158 towering over both |
| 8:39 | "10 चौके… 13 छक्के" | Ten balls race to the rope and thirteen sail into the night, each one ticking up a tally |
| 8:40.6 | "रोंगटे खड़े हो जाते हैं" | The whole stadium under fireworks, then the window grows back into Vikrant before the Nova Ghee L-band |

- **Characters** (`rig.py`): faceless flat-illustration cricketers on a jointed 2D rig, with a walk cycle and a
  stance → backlift → impact → follow-through swing. They are identified only by team kit and a small name tag. They are
  illustrations, not likenesses.
- **Text** is kept to five name tags and the numbers (10, 222, 158, 20, 4s/6s).
- **Sound** (`sfx.py`): a synthesised effects bed (crowd, floodlight clunks, coin, bat cracks, firework whistles and
  booms) mixed about 9 dB under the voice. It uses no samples, so there's nothing to license.
- The master's timing and audio are untouched. The photo insert at 8:24.8–8:28.8 is covered by the animation, and the
  narrator window hides for those seconds.

```
python3 sfx.py sfx.wav 471.0 526.5
python3 first_night.py ../source/kahaani_source.mp4 out.mp4 471.0 526.5 sfx.wav
STILLS=481.2,505.9,513.5 python3 first_night.py ../source/kahaani_source.mp4 frame   # design-check PNGs
```
