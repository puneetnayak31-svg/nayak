# HIPL editor guide

A short guide to updating the site in its current static form. Every change is: edit a file → run `python3 build.py` → push (Vercel redeploys).

## Where things live

| To change… | Edit |
|---|---|
| A page's text | `src/pages/<page>.html` (the file mirrors the URL) |
| The list of 36 Explorations, series, glossary terms | `src/data/explorations.json` |
| Header menu and footer | `NAV` and `layout()` in `build.py` |
| Colours, type, components | `assets/css/site.css` |
| Interactive behaviour | `assets/js/site.js` |
| Logos | Never edit by hand. Regenerate with `python3 tools/make_logos.py` |

Each page starts with a meta line: `<!--meta {"title": "...", "description": "...", "nav": "explorations"} -->`. The title appears in the browser tab and in search results; keep the description under 160 characters.

Shortcuts the build understands inside pages:
- `{{root}}`: the path to the site root (use it at the start of every internal link).
- `{{xcards:n=2,13,25}}`: Explorations cards for entries 2, 13 and 25. Also `{{xcards:all}}`, `{{xcards:start}}`, `{{xcards:featured}}`, `{{xcards:series=stories-that-stay}}`.
- `{{glossary}}`: the concept glossary strip.
- `{{ring:12}}`: the 100 Questions progress grid with 12 filled.
- `<!--sabha-->` and `<!--sabha:live-->`: the Sabha mark, still or animated.

## Build a new Exploration

1. In `explorations.json`, find the entry, add `"slug"`, `"built": true` and a `"hook"` (40–80 words, ending on a question).
2. Copy the closest sample in `src/pages/explorations/<series>/` as a template: `dharma.html` (Explainer), `nachiketa.html` (Illustrated Story), or `arjunas-dilemma.html` / `many-ramayanas.html` (Interactive). Save it as `<slug>.html` in the same series folder.
3. Follow the standard shape: cover → hook → context (150–300 words) → 3–6 chapters (80–200 words each) → visual layer → why it matters today → reflection → sources and related content.
4. Put a **claim label** before each key passage: `<span class="claim" data-kind="text"></span>`. The kinds are `text`, `tradition`, `historians`, `debate` and `asks`.
5. Number your sources at the foot of the entry and link footnotes to them: `<sup class="fn"><a href="#src-1">1</a></sup>`.
6. Pull quotes need a named source and translator. Leave `VERIFY` markers in until the fact-checker clears them.
7. Underline glossary terms: `<button class="concept" data-concept="karma">karma</button>`. New terms go in `concepts` in the JSON.
8. Set "Next in this series" and 3–6 "Keep exploring" cards.
9. Sensitive entries (07, 16, 23, 31, 33, 34, and anything on caste, gender or communal history) need an outside expert reader before publishing.

## Publish a 100 Questions answer

In `src/pages/questions.html`, copy a `q-item` row. Set `data-theme` (`belief`, `texts`, `caste`, `gender`, `ritual`, `science`, `public`) and `data-status` (`received`, `answering`, `answered`). Use the matching status pill, and link to the answer once it exists. Update the counter (`data-count` and `{{ring:N}}`).

## Handle a Voices pitch

1. Reply within 10 working days, even to decline.
2. Edits always go back to the writer; nothing is published without their approval of the final version.
3. To publish: copy `src/pages/voices/sample-essay.html`, keep the "Views are the writer's own" note, the byline format "[Name] for HIPL", and the "Write a response" button. Add a card to `voices.html` and a contributor page in `src/pages/contributors/`.
4. Under-18 writers: confirm guardian consent by email before publishing.

## Corrections

Fix the error, add a dated note at the foot of the page ("Corrected on [date]: …"), and add a line to `corrections.html`.

## Never

Invent quotes, verses, dates, speakers or facts. Use AI images of sacred figures. Use stock temple imagery or emoji. Retype the logo.
