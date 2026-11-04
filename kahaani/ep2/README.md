# KAHAANI: "जब एक नहीं दो-दो बार PAKISTAN को हराकर India ने जीती Benson & Hedges World Championship 1985"

Two re-edits of the **same segment, 21:26.5–23:44.5 (2 min 18 s)**, for a formal channel:

| | File | Approach |
|---|---|---|
| **A** | `output/version_a_graphics.mp4` | Archive photos with gentle 2.5D depth, the real Channel 9 footage, serif typography, result cards, a lap-of-honour plan of the MCG |
| **B** | `output/version_b_animation.mp4` | Editorial-illustration animation: the MCG at night, the trophy, a 1985 light-bulb scoreboard, the Audi 100, the team piling on, the lap, a tear-off calendar |

The segment runs from Gavaskar lifting the trophy, through Shastri, the Audi and the lap of honour, India beating Pakistan twice, and the 1985–87 side, to Vikrant's "victory week" recap. The sponsor L-band block ends at 21:27.9, and nothing in the segment covers a sponsor.

## Shared grammar (both versions)
- **Visuals come out of the studio's own LED screen.** A cutaway first plays *on* the screen beside Vikrant, then the screen
  opens out to full frame while the studio drifts forward and softens. At the end it folds back into the screen. The
  master's own photo inserts stay as hard cuts, just as the master has them.
- **Vikrant stays the anchor.** Between cutaways he is on screen, with at most a compact lower third that clears the
  sponsor screen.
- **Palette** is matched to the blue-violet set: deep navy, warm ivory, sand. **Type** is Playfair Display (serif) and Tiro
  Devanagari Hindi, with Inter Tight for small tracked kickers.
- **Motion** is slow sine and quart eases with no overshoot.
- **Sound** (`sound.py`, synthesised) sits about 22 dB under the voice: a slow ambient pad, distant stadium ambience
  only during stadium cutaways, and a soft "air" swell as cutaways open and close. Version B adds quiet diegetic touches
  (scoreboard relays, a faint engine for the lap, calendar paper). There are no booms or whistles.
- The **channel bug** was lifted cleanly from the master (pixels that stay constant across shots) and re-applied on every
  full-frame visual. The burned-in bug is inpainted out of archive stills before they move, so it never doubles.

## Beat sheet (master timecode)
| TC | He says | A: graphics | B: animation |
|---|---|---|---|
| 21:28.1 | Gavaskar's last tournament as captain; the trophy goes up | Trophy photo, 2.5D push, caption | MCG at night; the captain lifts the cup on the dais; press flashes |
| 21:35 | "Man of the tournament is Ravi Shastri" | Name card: Champion of Champions · Ravi Shastri | Camera tilts to the light-bulb board: CHAMPION OF CHAMPIONS … RAVI SHASTRI |
| 21:37.5 | The Audi; Ian Chappell | The real Channel 9 footage, captioned | Interviewer and Shastri beside the silver Audi 100 |
| 21:47.5 | "उस ज़माने के हरफ़नमौला" | Lower third: Ravi Shastri | Same |
| 21:56–22:14 | The team piles in: bonnet, back, front, seven inside | Colour photo; a soft pool of light travels to each spot | The team walks in, heads appear in the windows, players climb onto bonnet and boot |
| 22:11–22:21 | Shastri drives a lap: "the biggest Audi ad" | A plan of the MCG with the lap traced round the boundary, and his line quoted | The car's lap of honour, the camera following from the stand |
| 22:35.9 | (master's archive photo) | Re-finished in place | Same |
| 22:48 | Shastri and Audi since 10 March 1985 | Lower third | The Audi drawn line by line, then "10 · 3 · 1985" |
| 22:55 | India beat Pakistan twice | Two result cards: 20 Feb (league), 10 Mar (final) | The board again: INDIA V PAKISTAN, then both results |
| 23:05 | Nearly this team played the 1987 World Cup | Lower third | (on Vikrant) |
| 23:15.3 | (master's archive photo) | Re-finished in place | Same |
| 23:24.6 | "One of the best one-day teams… because of the all-rounders" | Pull quote (his words only) | (on Vikrant) |
| 23:33 | 8 March 2026 · 9 March 2025 · 10 March 1985 | Three date plates | A tear-off calendar, page by page |

## Facts on screen (checked)
- **League match, 20 Feb 1985, MCG:** Pakistan 183, India 184/4; India won by 6 wickets.
- **Final, 10 Mar 1985, MCG (day/night):** Pakistan 176/9, India 177/2 (47.1 overs); India won by 8 wickets.
- Ravi Shastri was named Champion of Champions and won an Audi 100. Ian Chappell interviewed him for Channel 9.
- Not shown: Shastri's tournament run and wicket totals, because sources disagree.

## Notes
- **Version B's figures** are faceless illustrations identified by context (kit, role), not likenesses. The trophy is a
  generic cup, not a replica. The car is an illustrated 1980s Audi 100 (C3) silhouette.
- **Version A** reuses only material already in the master (archive stills and the Channel 9 clip) and adds no new
  third-party imagery.
- **Rebuild**
  ```
  python3 sound.py a bed_a.wav
  python3 render.py a <master.mp4> out_a.mp4 --bed bed_a.wav
  ```
  Swap `a` for `b` to build version B.
