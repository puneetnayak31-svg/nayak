# Design system: how to build anything that looks and sounds like HIPL

Read this **before building any page, section, component, image or email**. The brand source is the Sabha brand guidelines (summarised in [reference/brand-guidelines.md](reference/brand-guidelines.md); the original is in `reference/originals/`). The implementation is `hipl-website/assets/css/site.css`. The living component library is the page `/components.html` (source: `hipl-website/src/pages/components.html`). Open it before inventing anything new.

`hipl-website/tests/test_design.py` enforces the parts a machine can check: palette-only colours, tokens instead of raw hex, brand fonts only, no text shadows or glows.

## 1. The idea in one line

**Sabha: many voices, one circle.** The mark is an assembly drawn as a circle of bars. Each bar is a different voice (elder, student, sceptic), with a different length and a different opinion. Together they make a sun, the light of shared inquiry. It moves and pulses like a living tradition. The *bindu* at the centre is the question every conversation returns to.

Tagline: **"Heritage that thinks forward."** Brand words: *Many voices · One circle · Always moving.*

Every design choice should feel like this: **loud headlines, calm reading; night sky, festival light; open argument, warmth, evidence.**

## 2. Colour

| Token | Hex | Role | Share of a layout |
|---|---|---|---|
| `--midnight` | `#14123A` | Primary. Carries the brand: dark bands, text on light | about 40% |
| `--chalk` | `#F7F3EC` | Ground. Page background | about 25% |
| `--saffron` | `#FF8A1F` | Accent and signature: primary buttons, the rule in the logo, key highlights | about 20% |
| `--marigold` | `#FFC93C` | Highlight spark: hover, stickers, data | about 10% |
| `--lotus` | `#FF6FA3` | Pop spark: occasional, playful | about 5% |
| Derived | `--midnight-2` `#2A2650`, `--midnight-line` `#3B3670`, `--sand` `#E9E3D7`, `--paper` `#FFFFFF`, `--line` `#DDD5C6`, `--muted` `#5B577A`, `--on-dark-muted` `#C9C3E8`, `--on-dark-soft` `#DCD7F2`, `--saffron-ink` `#B4530A` (saffron text on light), `--saffron-tint` `#FFF4E5`, `--lotus-ink` `#B0124F`, `--error` `#A0153E` | Surfaces, lines, readable text variants | n/a |

Rules:
- **Text on Chalk is always Midnight.** Text on Midnight is Chalk, or `--on-dark-muted` for secondary text.
- **Marigold and Lotus are sparks.** Use them for highlights, stickers, tags and data. **Never for body text.** On light backgrounds, use `--saffron-ink` or `--lotus-ink` for coloured text, for contrast.
- **No colours outside the palette.** That means no gradients from other hues, no greys that aren't tokens, no new blues or greens on the public site. Use `var(--token)`, never raw hex (tested). If you truly need a new shade, derive it from the palette, add it to `:root`, and ask the owner.
- Full-bleed colour bands, used sparingly: `band-dark` (most common), `band-sand`, `band-paper`, `band-saffron`, `band-marigold`, `band-lotus`.

## 3. Typography

| Role | Font | Use |
|---|---|---|
| Display | **Unbounded** (800 for h1/h2, 600 for h3) | Headlines, posters, video titles, tags. Short and punchy |
| Text | **Instrument Sans** | Articles, UI, captions, buttons, the Dispatch |
| Hindi / Sanskrit | **Mukta** | All Devanagari, with `lang="hi"` or `lang="sa"` |

Scale (in `site.css`):
- h1: `clamp(2.25rem, 5.6vw, 4.5rem)`, line height 1.02, tight tracking (the guidelines specify 64/68)
- h2: `clamp(1.65rem, 3.4vw, 2.6rem)`
- h3: about 1.1–1.3rem
- Body: 17px with 1.6 line height; prose 18px; lede about 22px
- `.eyebrow`: 13px, bold, 0.2em tracking, uppercase, saffron-ink

Rules:
- **HIPL is always in capitals.** The English full name is in tracked capitals. **Never retype the logo.** Use the SVGs in `hipl-website/assets/brand/` (the master artwork, outlined).
- Fonts are self-hosted (`assets/fonts/`). Never add Google Fonts or other families (tested).
- Hindi lockups spread words to HIPL's width. Never stretch letters (it breaks conjuncts).

## 4. The logo and the sun

- **Logo files**: `assets/brand/hipl-lockup-horizontal-on-dark|on-light.svg` (header and footer), `-stacked-`, `-compact-`, `-symbol-`, `-mono-` and the favicon/avatar. The launch kit has PNGs.
- **Lockup rules**:
  - HIPL and the full name share the same left and right edges, joined by a saffron rule.
  - The symbol is as tall as the text block. The gap between symbol and text is one bindu.
  - Clear space is 1.5 × the bindu on every side.
  - Minimum sizes: symbol 24 px; horizontal lockup 96 px. Below 240 px wide, use symbol + HIPL only.
  - The tagline sits one bindu below, aligned to the text's left edge, and is never wider than the logo.
- **Don't**: stretch or squash it, recolour it outside the palette, add shadows, glows or bevels, swap the font, or lose contrast.
- **The live sun** (the sabha mark as an animated SVG) is the site's signature motion. Use it in templates with `<!--sabha:live style="width:120px;height:120px"-->` (or `<!--sabha-->` for a still mark). `build.py` expands it. Each bar breathes, the whole mark leans gently toward the pointer, and it is still for `prefers-reduced-motion`. **It must behave identically everywhere** (owner decision D12). Don't animate it any other way.

## 5. Layout

- **Mobile-first.** Breakpoints at about 600, 900 and 1240 px. Everything must work at 375 px with no horizontal scroll (`main{overflow-x:clip}`). A 16 px minimum gutter (`--gutter`), max content width 1280 px (`--max`), reading width 680 px (`--read`).
- Page skeleton: a stack of `<section class="section [band-…] [on-dark]"><div class="wrap">…</div></section>` blocks.
- Primitives:
  - `.stack` (vertical, `--gap`)
  - `.row` (horizontal, wraps)
  - `.grid` (`--cols:2|3|4`; collapses to one column under 600 px)
  - `.split` (5/7 columns; `.even`, `.rev`)
  - `.sec-head` (eyebrow + h2 on the left, a short note or link on the right)
- **Square corners.** Cards, buttons, tags and inputs have no rounded corners. Only circles (bindu, dots, avatars) and pills (status) are round. Flat colour, generous space and strong type do the work. No drop shadows on the brand, no glassmorphism, no stock gradients.
- One `<h1>` per page (tested). An eyebrow above most headings.

## 6. Components (use these before making new ones)

All are in `/components.html`. Class names are in `site.css`.

| Need | Use |
|---|---|
| Buttons | `.btn` (saffron), `.btn.dark` (midnight), `.btn.ghost` (outline), plus `.small`. Hover lifts 2 px to marigold. Minimum height 48 px |
| Labels | `.eyebrow`; `.tag` + `saffron` / `marigold` / `lotus` / `chalk` / `outline`; `.status` pills |
| Cards | `.card`, `.card.dark`; Explorations cards (`{{xcards:…}}`); event cards; question items |
| Text | `.lede`, `.prose` (long text, with Markdown output), `.pull` (pull quote with `<cite>`), `.notice` (marigold left rule), `.muted`, `.small`, `.tiny`, `.big` |
| Hero | `.page-hero`, `.hero`, `.event-hero` (with a `.date-block`), `.entry-cover` (Explorations, with generative canvas art) |
| Events | `.date-block`, `.event-facts`, `.evening` (numbered programme), `.motion-card`, `.partner-badge`, `.countdown`, add-to-calendar (`data-ics`) |
| Explorations interactives | Knowledge cards, meaning layers, scenarios, dilemma, compare, characters, scene, map, timeline, poll, interpretations, claim labels (`.claim`), concept pop-ups (`[[term]]`). Build them as **blocks** (`sitekit/schema.py`), not hand HTML |
| Forms | `form.js-form[data-kind]` with `.field`, a consent `.check`, the honeypot `.hp`, `.form-msg` |
| Sharing | Add `data-share-card data-share-kicker data-share-title data-share-body` to any element to get the share button and the post/story images. `.share` rows for links |
| Art | `<canvas data-art="N">` (entry covers), `data-scene`, `data-face`: generative, seeded, palette-only. Prefer this or real photos with credits over stock imagery |

## 7. Motion

- Purposeful and calm: hover lifts (0.15–0.2 s), tab and card transitions, the breathing sun, the ticker, read-progress.
- Everything respects `prefers-reduced-motion` (a global rule in `site.css`; JS checks it too).
- No parallax overload, no autoplaying video or sound. YouTube loads only on click (`youtube-nocookie`).

## 8. Imagery and social images

- Social and share images use the same system: Midnight ground, Chalk and Saffron type in Unbounded, the sabha mark, a small HIPL lockup. Templates are in `hipl-launch-kit/templates/social.html` and the canvas renderer `drawShare()` in `site.js`. Post 1080×1350, story 1080×1920.
- Photos: real people and places from HIPL events, credited. Alt text is required (tested on Explorations images).

## 9. Voice and copy

**"The smartest, warmest person at the chai stall."**
- We sound: curious, confident, warm, witty, evidence-led, open to disagreement. *"What would you keep, and what would you rethink?"*
- We never sound: preachy, defensive, outraged, jargon-heavy, like a political campaign, or holier-than-thou. *Not: "Only true believers will understand this."*
- Headlines are short and often a question. Body copy is plain, in short paragraphs. Explain every Sanskrit term the first time. No emoji, and no exclamation marks in UI messages.
- Content rules (sources, claim labels, no invention) are in `AGENTS.md` and [CONTENT-MODEL.md](CONTENT-MODEL.md#editorial-conventions).

## 10. Checklist for any new page or component

- [ ] Built from existing sections, primitives and components (checked `/components.html` first)
- [ ] Palette tokens only. Text on Chalk is Midnight. Marigold and Lotus only as sparks
- [ ] Unbounded headings, Instrument Sans text, Mukta for Devanagari with `lang`
- [ ] Square corners, flat colour, no shadows or glows on the brand
- [ ] Logo from the master SVG, with clear space respected
- [ ] One h1, an eyebrow, short copy in the brand voice
- [ ] Works at 375 px and 1280 px, keyboard-usable, visible focus, reduced motion respected, text fallback for visuals
- [ ] Shareable where it makes sense (`data-share-card`)
- [ ] Data-driven if editors will change it (a field in `cms/content_model.py`, not hard-coded text)
- [ ] `python3 tools/check.py` passes (includes `test_design.py`)
- [ ] Doesn't contradict an owner decision in [BRIEF.md](BRIEF.md#3-decisions-keep-these-unless-the-owner-changes-them)
