# Mithila painting reels: Dr Piyush Kiran Nayak

These are 9:16 Instagram Reels (1080×1920, 30 fps, H.264 at about 4.8 Mbps, AAC, -14 LUFS), one per painting. They have no
voiceover. Every caption comes from the artist's portfolio, and each reel has its own playful soundtrack.

## Outputs (`output/`): one reel and one thumbnail per painting
| Plate | Painting | Length | Music |
|---|---|---|---|
| N° 01 | Amausa Ka Mela | 45.5 s | Village fair: shehnai and bansuri over fast dholak, ghungroo and claps (Bhupali) |
| N° 02 | Across the Yamuna: The Divine Journey | 47.1 s | Krishna's flute in Raag Khamaj, pakhawaj, manjira, conch and river drops |
| N° 03 | Nature in Godna, inspired by Chanu Devi | 44.0 s | Tribal: madal drum, clap-sticks, bamboo flute, wooden mallets and birdsong |
| N° 04 | Sawan: Women, Bangles, and Celebration | 47.1 s | Kajri swing in 12/8 (Raag Desh), jingling bangles, dholak, thunder and rain |
| N° 06 | Anvarat | 42.6 s | Rowing song: steady oar-stroke pulse, splashes, sitar and peacock calls |
| N° 10 | Fire Does Not Consume the Faithful | 41.3 s | Holi phag in Raag Kafi: dhol, claps, shehnai, harmonium and crackling fire |

Every reel follows the same story arc, timed to the bars of its music:
1. Hook
2. Title card
3. The story (two museum-label cards)
4. A statement over the painting
5. Technique (two close-ups)
6. Mithila elements (four medallions)
7. The full painting revealed
8. The artist and her credentials
9. CTA: Follow @piyushart_gallery · piyushkirannayak.com

## Files
- `paintings.py`: per-painting story, camera moves, close-ups and music style, plus the shared credentials
- `music.py`: synthesises each soundtrack. There are no samples, so nothing needs licensing.
- `render.py`: renders the frames, muxes the video, makes the thumbnail and checks the safe area

## Instagram safe zones
Text stays inside x 90–930 and y 270–1480. That leaves the top 270 px clear for the Reels header, the
bottom 440 px for the caption and audio row, and the right 150 px for the action buttons.
`python3 render.py SLUG x --check` measures every caption on every third frame.

## Rebuild
```
python3 music.py SLUG music.wav
python3 render.py SLUG output/SLUG.mp4 music.wav
python3 render.py SLUG output/SLUG-thumbnail.jpg --thumbnail
```
Requires Python 3 with Pillow (with raqm) and numpy (`pip install -r requirements.txt`), plus ffmpeg with libx264.
Fonts are Cormorant Garamond, Jost and Tiro Devanagari Hindi, all under SIL OFL (see `assets/fonts`).
