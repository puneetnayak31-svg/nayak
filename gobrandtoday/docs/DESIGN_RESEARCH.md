# Design research — what top brand studios ship

**As of 2026-10-08.** Research input for the logo, design-element and mockup renderers in
[`packages/shared/src/logo.ts`](../packages/shared/src/logo.ts),
[`packages/shared/src/symbols.ts`](../packages/shared/src/symbols.ts) and
[`packages/shared/src/mockups.ts`](../packages/shared/src/mockups.ts). It is a research note, not a spec;
the code is still the source of truth for what ships.

## 0. Method and source honesty

- **Direct page fetches failed.** Every `WebFetch` attempt (koto.com, koto.com/work, pentagram.com/work,
  designweek.co.uk, underconsideration.com/brandnew) was refused by this environment's network egress
  policy (`EGRESS_BLOCKED`). No studio page was opened directly.
- **What was used instead:** web-search results, whose index text was read for each linked page.
  Every link below is a page the search tool returned and summarised; treat claims as "reported by that
  page", not as verified from images. Where sources disagreed, that is noted.
- **Not verified as Koto work:** Glovo, Ecosia and Bumble did not come up as Koto projects in any search.
  BlaBlaCar appeared only as a client logo on Koto's services page
  ([koto.com/services](https://koto.com/services)), with no case study found. These are left out rather
  than guessed.
- Opinions in sections 3 to 6 are this report's synthesis. Numbers given there (ratios, sizes, angles)
  are GoBrandToday's proposed rules, not figures published by any studio.

## 1. Koto at a glance

| Fact | Source |
|---|---|
| "Five offices, one studio": Los Angeles, New York, London, Berlin, Sydney | [koto.com/about](https://koto.com/about) |
| Work index lives at koto.com/work; case studies at koto.com/projects/&lt;client&gt; | [koto.com/work](https://koto.com/work) |
| Acquired Stereo Creative (60 people; London, SF, LA, Portland, Dubai) | [koto.com/about](https://koto.com/about) |
| Launched its own type foundry, CcType, growing out of custom fonts for Faculty, Stack Overflow, Polkadot | [Creative Review](https://www.creativereview.co.uk/koto-new-type-foundry-cctype/) |
| Sydney studio built Riot Games' LoL Championship Pacific identity | [koto.com/latest](https://koto.com/latest/koto-designs-riot-games-lol-championship-pacific-identity) |

The recurring Koto move: **find one ownable shape already inside the brand (a smile, a progress bar, a
stack, a sunrise, a lightning bolt) and make it the engine of the whole system**, then add a custom or
near-custom typeface and a deliberately non-category colour.

## 2. Koto case studies

### 2.1 Identity system, part A: mark, device, type, colour

| Client (year) | Logo approach | Graphic device / supergraphic | Typography | Colour strategy |
|---|---|---|---|---|
| **Amazon** (2025) | Smile kept, redrawn: softer curves, expanded shaft and point | Smile as the constant across 50+ sub-brands | "Ember Modern" (7 weights, ~364–366 languages) plus a logo-only "Amazon Logo Sans" | One unified "Smile Orange"; sub-brands get category colours (Fresh greens, One Medical scrub-teal) |
| **Tripadvisor** (2025) | Ollie the owl kept, geometrically refined, animated eyes that "look at" traveller content | User photos and reviews are the graphic material | Custom "Trip Sans", UI to campaign | Turquoise to brighter lime "Trip Green"; seasonal/city palettes extracted from traveller photos |
| **Stack Overflow** (2025–26) | Reworked stack: stacked, offset lines | **Stacking** organises layouts and hierarchy; multi-state building blocks are "the central brand asset" | Custom Stack Sans (notched details), headline + text; Text cut free on Google Fonts (OFL) | Builds on the existing orange |
| **GoFundMe** (2026) | Sun motif kept; the **Progress Circle** revealed inside one ray | Former UI goal bar turned into a circle/arc that scales, frames content, isolates moments | Custom GoFundMe Sans, built for density on phones | Green anchor, wider range, duotone for legibility |
| **Workday** (2024) | Sunrise arc thickened, gradient-filled, joined to the "w"; short form "The Dub" (W + compressed horizon) | Cropped gradients as colour fields | Custom logo font; Workday Sans in development at launch | Day-cycle palette: warm sunrise, bright midday, cool dusk; counters "overly blue" enterprise software |
| **Faculty** (AI, ~2024) | Wordmark + stylised "f" | **"Threshold"**: a fluid graphic element/pattern for "frontier and frontline" | Custom Faculty Glyphic (carved, Wolpe/Albertus lineage), free on Google Fonts, paired with Inter Tight | Avoids AI clichés by mixing crafted and contemporary |
| **Bolt** (fintech checkout, 2023) | Bolt hidden in the wordmark's negative space | The bolt recurs in type details: slanted currency signs, exclamation points, card icons | Chunky, lively custom type | Blue dropped for fluorescent "Lightning Yellow" because "everyone is using" blue |
| **Glassdoor** (2023) | Uppercase wordmark that "swings open" in motion | Missing-pixel icon system ("staying open") | Custom Glassdoor Sans (geometric, office-vernacular quirks) | Sources disagree: black-and-white illustration vs a vibrant new palette |
| **Kikin** (fintech, 2023–24) | K (and i) extracted from the wordmark | **Woodcut-style club badges** in three tiers | Not reported | Outdoor greens, browns, blues, oranges; fabric textures |
| **De-Extinction** (packaging maker, 2023–24) | Small dinosaur icon + customised wordmark | Hand-drawn dinosaurs as "warnings", not mascots | Grotesque No.9 | Sharp green with lurid pinks, purples, off-whites, against bland eco cues |
| **MassiveMusic** (2025) | Redrawn: sharper geometry, taller stance | **Generative pattern language** of bodily reactions to sound (goosebumps) | Forma DJR Display, varied "by volume" | Mostly monochrome + one orange accent; pulse-like gradients |
| **Yazio** (2026) | Rounded lowercase wordmark; arcs in "y" and "z" read as a smile | A Yeti mascot replaces the apple across app, campaigns, merch | Yazio Sans (Hottype) + Noto Sans body | Not reported |

Sources, row by row: Amazon [koto.com](https://koto.com/projects/amazon),
[Dezeen](https://www.dezeen.com/2025/05/09/amazon-rebrand-2025-koto-xcm/amp/),
[Design Compass](https://designcompass.org/en/2025/04/29/amazon-rebrand/) ·
Tripadvisor [koto.com](https://koto.com/projects/tripadvisor),
[Fast Company](https://www.fastcompany.com/91360610/tripadvisor-rebrand),
[Visuelle](https://visuelle.co.uk/tripadvisor/),
[Branding in Asia](https://www.brandinginasia.com/real-stories-from-real-travelers-tripadvisors-new-brand-by-koto/) ·
Stack Overflow [koto.com](https://koto.com/projects/stack-overflow),
[Creative Boom](https://www.creativeboom.com/branding/koto-reframes-stack-overflow-around-the-one-thing-ai-cant-replace-its-community/),
[Stack Sans repo](https://github.com/DylanYoungKoto/Stack-Sans) ·
GoFundMe [PRINT](https://www.printmag.com/branding-identity-design/koto-rebrands-gofundme-around-a-simple-truth-help-adds-up/),
[Creative Boom](https://www.creativeboom.com/news/koto-evolves-gofundmes-brand-as-platform-expands-beyond-individual-giving/) ·
Workday [koto.studio](https://koto.studio/work/workday),
[Logos World](https://logos-world.net/workday-unveils-new-logo-and-brand-identity/),
[PRINT](https://www.printmag.com/branding-identity-design/kotos-refresh-for-workday-brings-optimism-to-enterprise-software/) ·
Faculty [koto.com](https://koto.com/projects/faculty),
[Creative Review](https://www.creativereview.co.uk/koto-faculty-ai-branding/) ·
Bolt [koto.com](https://koto.com/projects/bolt),
[It's Nice That](https://www.itsnicethat.com/news/koto-bolt-graphic-design-230123),
[Creative Boom](https://creativeboom.com/inspiration/bolt-gets-a-striking-new-identity-by-koto) ·
Glassdoor [It's Nice That](https://www.itsnicethat.com/news/koto-glassdoor-graphic-design-180723),
[Design Week](https://www.designweek.co.uk/issues/24-july-28-july/koto-glassdoor-identity/) ·
Kikin [koto.com](https://koto.com/projects/kikin),
[Creative Review](https://www.creativereview.co.uk/kikin-visual-identity/),
[BP&O](https://bpando.org/2024/05/16/digital-finance-platform-branding-kikin-by-koto/) ·
De-Extinction [koto.com](https://koto.com/projects/de-extinction),
[BP&O](https://bpando.org/2024/04/11/sustainable-packaging-manufacturer-de-extinction-miami-london-design-studio-koto/),
[Creative Boom](https://creativeboom.com/news/koto-gives-roar-to-de-extinction) ·
MassiveMusic [koto.com](https://koto.com/projects/massivemusic),
[Abduzeedo](https://abduzeedo.com/koto-redefines-massivemusics-brand-identity-new-dimensions-sound) ·
Yazio [koto.com](https://koto.com/projects/yazio),
[BP&O](https://bpando.org/2026/04/16/yazio-by-koto/),
[Logos World](https://logos-world.net/yazio-unveils-new-logo-and-brand-identity/).

### 2.2 Identity system, part B: illustration, icons, photography, pattern, applications

| Client | Illustration / iconography | Photography / pattern | Applications reported (industry-specific in **bold**) |
|---|---|---|---|
| Amazon | Sub-brand graphic systems (Grocery: "fresh, tasty, food-forward") | Grocery photo style | **Delivery vans, uniforms, packaging**, digital UI, F1 car livery |
| Tripadvisor | Ollie animated as an attentive companion | Traveller photos are the hero imagery; colour comes from them | Campaigns built from **real reviews and travel photos** |
| Stack Overflow | Building blocks in simple (UI) and expressive (campaign) modes | Generative tool (built with Claude) for composition, motion, colour | Product UI kept quiet; **Developer Survey** and campaigns go expressive |
| GoFundMe | Progress Circle segments = fundraisers, donors, nonprofits | Circle frames and crops imagery | Product UI, marketing, motion; **GoFundMe Pro** sub-brand from the same wordmark |
| Workday | Icon library simplified with a written construction guide | Gradients across print and digital | Product, print, digital |
| Faculty | Threshold as pattern | Editorial-style website | Website |
| Bolt | Bolt-derived icons; exaggerated illustration | "Exaggerated" photography; motion and sonic branding | **Checkout UI**, website, campaign "Shockingly Simple" |
| Glassdoor | Illustration library (Josep Puy); missing-pixel icons; custom emoji | — | App, website, **community emoji** |
| Kikin | 3-tier badges: 5 principles, typographic message badges, 17 re-drawn UN goals; 5 badges combine into 2 landscapes | Fabric-like textures | **In-app graphs and statistics** softened with badge art |
| De-Extinction | Hand-drawn dinosaurs | — | **Disposable tableware, cutlery and food packaging**, campaigns |
| MassiveMusic | — | Generative pattern; gradients and motion as "frequency pulses" | Website (built with Good City) |
| Yazio | Yeti mascot | — | **App, campaigns, merchandise** |
| Gustini (2024, food retail) | Playful print details | References **classic fruit tissue wrappers** | **Packaging and print** for an Italian-food D2C retailer ([koto.com](https://koto.com/projects/gustini)) |

Also noted: Koto produced an updated graphic toolkit for Netflix
([Creative Review](https://www.creativereview.co.uk/netflix-koto-graphic-design-illustration/); title only).

## 3. Other leading studios, briefly

| Studio | Project | Mark → device | Type / colour | Applications |
|---|---|---|---|---|
| **DesignStudio** | Airbnb (2014) | Bélo: person + pin + heart + "A", "drawable in the sand with a big toe"; a community version users restyle (colour, texture, line) | Custom Circular (Lineto); bespoke "Rausch" | Host stamps, stickers, keyrings, window stickers, labels on borrowable items |
| **DesignStudio** | Deliveroo (2016) | Illustrated roo → flat polygon head (two eyes, two ears); lowercase wordmark | Teal kept | **Rider jackets and jerseys with reflective panels**, for visibility |
| **Collins** | Mailchimp (2018) | Freddie simplified to a one-colour silhouette; chunky off-kilter wordmark | Cooper Light; yellow lead colour | Surreal illustration by several artists, mostly black and white with yellow accents |
| **Collins** (with in-house team) | Dropbox (2017) | Box abstracted into flat shapes | Sharp Grotesk in ~250+ styles; deliberately clashing colour pairings ("if it looks too good, it's wrong") | Illustration collaborations; user-chosen colour pairs |
| **Pentagram** | Baskin-Robbins Brown, Seoul | Circle-and-spot motif from the "O"; pink kept inside the "O" | Art-deco-leaning wordmark | **Concept-store packaging** |
| **Pentagram** | Peach Coffee Roasters; Hot Bread Kitchen | Patterned coffee-bag gussets; culture-derived bread patterns | — | **Compostable coffee bags; modular kit of pre-printed + clear bags and stickers** |
| **Ragged Edge** | Hipchips; Deliciously Ella; Batch Organics | Pinstripe turned 45°; signature-based logo + sunburst | Thorowgood Sans + Kings Caslon; classic red; "a single colour it could own" (Batch) | **Sharing boxes instead of packets**, signage; matte textured packs; smoothie/bowl range |
| **Mother Design** | Cora; Jägermeister; Plenish | Jägermeister system from how the bottle reflects light | Flexible type system, texture library | **Period-care shelf packaging**; a custom toolkit generator for local markets |

Sources: Airbnb [Dezeen](https://www.dezeen.com/2014/07/16/airbnb-rebrand-designstudio/),
[Design Week](https://www.designweek.co.uk/designstudio-creates-symbol-of-belonging-for-airbnb-rebrand/),
[designboom](https://www.designboom.com/design/airbnb-rebrand-gives-its-community-a-sense-of-belonging-07-16-2014/) ·
Deliveroo [Creative Review](https://www.creativereview.co.uk/deliveroorebrand/),
[Dezeen](https://www.dezeen.com/2016/09/05/deliveroo-minimalist-logo-rebrand-designstudio/amp/),
[The Drum](https://www.thedrum.com/news/2016/09/05/deliveroo-delivers-edgier-roo-colourful-rebrand-it-claims-will-increase-rider-safety) ·
Mailchimp [Creative Review](https://www.creativereview.co.uk/mailchimp-goes-yellow-in-rebrand-by-collins/),
[Design Week](https://www.designweek.co.uk/mailchimp-rebrand-aims-to-unify-bran/),
[Creative Bloq](https://creativebloq.com/news/mailchimp-rebrand-does-away-with-script-wordmark) ·
Dropbox [It's Nice That](https://www.itsnicethat.com/news/dropbox-rebrand-collins-graphic-design-041017),
[Dezeen](https://www.dezeen.com/2017/10/11/dropbox-rebrand-logo-visual-identity-graphic-design/amp/),
[Kepler Design](https://keplerdesign.substack.com/p/dropbox) ·
Pentagram [Baskin-Robbins Brown](https://www.pentagram.com/work/baskin-robbins-brown),
[Peach Coffee Roasters](https://pentagram.com/work/peach-coffee-roasters),
[Hot Bread Kitchen](https://pentagram.com/work/hot-bread-kitchen) ·
Ragged Edge [Creative Boom (Hipchips)](https://www.creativeboom.com/inspiration/ragged-edge-fries-up-a-brand-identity-for-londons-first-gourmet-crisps-restaurant/),
[Packaging Strategies (Deliciously Ella)](https://www.packagingstrategies.com/articles/89097-deliciously-ella-snags-new-identity-packaging),
[Dexigner (Hipchips)](https://www.dexigner.com/news/29449) ·
Mother Design [The Dieline (Cora)](https://thedieline.com/?p=44143),
[GDUSA (Jägermeister)](https://gdusa.com/jagermeister-bottle-inspires-new-identity/),
[Inspiration Grid (Plenish)](https://theinspirationgrid.com/plenish-juice-branding-by-mother-design).

## 4. Synthesis: why these feel like a system, not a template

1. **One idea, many expressions.** Each system has a single generative idea (stack, progress, sunrise,
   threshold, lightning, club badge). Every element is visibly *derived* from it. Templates feel
   generic because their decoration is unrelated to the mark.
2. **The mark is mined for parts.** Logos are taken apart: a ray becomes a progress arc (GoFundMe), a
   bolt becomes punctuation and currency signs (Bolt), a horizon becomes a short form (Workday's "Dub"),
   an "O" becomes a dot motif (Baskin-Robbins Brown), letters become the icon (Kikin).
3. **Owned colour, used with restraint.** One hero colour chosen *against* the category (Bolt vs fintech
   blue, Workday vs enterprise blue, De-Extinction vs eco green-and-leaf, Batch's single ownable colour),
   with monochrome doing most of the work (Mailchimp, MassiveMusic).
4. **Type carries voice.** Nearly every Koto system has a custom or customised face, often released on
   Google Fonts (Faculty Glyphic, Stack Sans Text). Display type is set huge; UI type stays quiet.
5. **Two registers.** A quiet "product" register and a loud "campaign" register from the same parts
   (Stack Overflow, GoFundMe). Showing both is what makes a book look agency-made.
6. **Applications are the proof.** Studios show the objects the business actually uses: rider jackets
   for Deliveroo, vans and boxes for Amazon, compostable coffee bags for Peach, sharing boxes for
   Hipchips, tableware for De-Extinction. Generic mugs and totes are filler.
7. **Systems ship as tools.** Generators appear repeatedly: Stack Overflow's generative tool, Mother's
   Jägermeister toolkit generator, MassiveMusic's generative patterns, Airbnb's "Create Airbnb". A
   procedural SVG engine is exactly that, which is GoBrandToday's natural advantage.

### 4.1 Codeable rules (proposed for GoBrandToday)

**A. Logo → graphic device (supergraphic)**

| Rule | Implementation sketch |
|---|---|
| Extract one *primitive* from the mark: an arc, a dot, a stroke, a corner, a ray | Each symbol family and mark shape exports a `primitive()` returning a single path in a 100×100 box |
| Device = primitive scaled 4–12× the logo height and **cropped by the frame** | Place at 300–800% scale with the anchor off-canvas; clip with the artboard |
| Crop so 25–60% of the device is visible, never centred | Choose an anchor corner by seed; offset by 20–45% of the shorter side |
| Device in `brand` on `paper`, or `tint` on `brand`; never more than 2 colours | Pick from fixed role pairs that pass contrast |
| One device per layout | Enforced in each mockup renderer |

**B. Crop and scale**

- Three scales only: **micro** (icon at 16–48px), **meso** (lockup, 15–25% of width), **macro**
  (device or type, 120%+ of the shorter side, bleeding).
- Macro elements always bleed on at least two edges; meso elements never bleed.
- Ratio between consecutive type sizes ≥ 2.5 (for example 120 / 40 / 14), not 1.2: the jump is what reads
  as "designed".

**C. Colour proportions (with the `ink, brand, accent, tint, paper` roles)**

| Mode | paper | brand | ink | tint | accent |
|---|---|---|---|---|---|
| Quiet (product, stationery) | 70% | 10% | 15% | 5% | ≤ 2% |
| Loud (campaign, packaging front) | 5% | 65% | 20% | — | 10% |
| Mono + spark (Mailchimp, MassiveMusic style) | 45% | — | 50% | — | 5% |

Accent appears once per surface (a dot, a sticker, a CTA). Gradients only when the mark itself is about
light or time (Workday), always cropped, never as a background wash.

**D. Big type**

- Headline at 10–18% of artboard height, tight leading (0.9–1.0), tracking −2% to −4%, 2–5 words.
- Allow type to bleed or be cropped by up to 8% on posters and bags; never on cards or UI.
- One family, two weights at most, per surface; data/mono face only for small labels and numbers.
- Set a single word or the brand name as a "type supergraphic" across packaging, cropped at baseline.

**E. Stickers and badges (Kikin, Airbnb, Hot Bread Kitchen)**

- Badge = closed shape (circle, scallop, shield, rounded rect) + mark + text on a circular path.
- Tiers: (1) principle badges with an icon, (2) typographic message stickers, (3) category/product seals.
- 1.5–3px keyline at 24px scale, white die-cut border 6–8% of the diameter, rotated −8° to +8°.
- A sticker sheet shows 6–9 stickers on a grid with slight random rotation and overlap ≤ 10%.

**F. Icons derived from the mark**

- Inherit the mark's stroke weight, corner radius and terminal shape (round vs square).
- 24px grid, 2px padding, stroke = mark stroke scaled to 24px (clamped 1.5–2.5px).
- One signature detail from the mark per icon set (Bolt's slant, Glassdoor's missing pixel): a notch, a
  dot or an offset applied at the same place in every icon.

**G. Pattern logic**

- Tile = primitive on a square or hex lattice; repeat with `<pattern>`.
- Variation by rule, not randomness: rotate in 90° or 45° steps, alternate scale 1 : 0.5, step colour
  between `brand` and `tint`.
- Density: 8–20% of the tile area inked for backgrounds; 30–50% for gift wrap, tissue and gussets.
- Patterns appear on secondary surfaces (box inside, gusset, tissue, card back, label border).

**H. Layout grids for applications**

- 12-column grid with margins of 6–8% of the shorter side; baseline 4px (screens) or 1mm (print).
- Lockup always on a grid corner (top-left or bottom-left); device on the opposite diagonal.
- Text blocks max 8 columns; leave one full column of empty space next to every macro element.

**I. Choosing mockups for an industry**

- Show 3 industry objects first (section 5), then 2–3 universal ones (card, social, web).
- Every scene uses real copy from the kit (product name, price, URL) and one device or pattern, so the
  scene proves the system rather than just stamping a logo.

## 5. Industry → mockups map

"Now" refers to today's `MOCKUP_KINDS` (`card, phone, social, web, tshirt, tote, cup, storefront,
packaging`). Objects in *italics* would be new renderers.

| Industry | What a top studio would show (3–5) | Reuse now |
|---|---|---|
| Coffee / café | *Takeaway cup with sleeve*, *coffee bag with patterned gusset*, *menu board*, *loyalty stamp card* | cup, storefront |
| Clothing / fashion | *Woven neck label*, *hang tag with string*, *tissue paper with pattern*, *garment bag / shopping bag* | tshirt, tote |
| Sweets / mithai / confectionery | *Mithai box (lid + band)*, *sweet wrapper / twist*, *gift sleeve with ribbon*, *festive (Diwali) gift tag* | packaging, storefront |
| Bakery | *Paper bread bag*, *cake box*, *sticker seal on kraft*, *chalk/menu board* | packaging, storefront |
| Candles / home fragrance | *Candle jar with wrap label*, *rigid gift box*, *matchbox*, *care card* | packaging |
| Cosmetics / skincare | *Serum dropper bottle*, *tube*, *jar lid (top view)*, *outer carton*, *shelf talker* | packaging, social |
| Beverage | *Can wrap*, *bottle label*, *crate / multipack sleeve*, *bar coaster* | packaging, social |
| Restaurant / food delivery | *Menu*, *delivery bag*, *takeaway box with sticker seal*, *rider jacket*, *app order screen* | storefront, phone |
| SaaS / tech / AI | *Product UI dashboard*, *app icon set*, *conference lanyard*, *laptop sticker sheet*, *pitch slide* | web, phone, social |
| Fintech | *Payment card (front/back)*, *app balance screen*, *checkout button*, *receipt / statement* | phone, web |
| Healthcare / clinic | *Appointment card*, *wayfinding sign*, *prescription bag*, *staff ID badge* | card, storefront |
| Education | *Notebook cover*, *certificate*, *student ID / lanyard*, *course slide* | web, social, tote |
| Fitness | *Water bottle*, *gym bag*, *class schedule poster*, *membership card*, *app streak screen* | tshirt, phone |
| Jewellery | *Ring box (open)*, *velvet pouch with foil mark*, *care card*, *gift bag with ribbon* | packaging |
| Pet | *Pet food pouch*, *collar tag*, *bandana*, *treat jar label* | packaging, tote |
| Real estate | *For-sale board*, *property brochure cover*, *key tag*, *listing card (social)* | card, social, web |
| Creator / media | *Podcast cover*, *YouTube thumbnail*, *channel banner*, *merch hoodie* | social, tshirt, phone |
| E-commerce | *Shipping box with printed tape*, *thank-you insert card*, *poly mailer*, *product page* | packaging, web |
| Consulting / professional | *Proposal cover*, *slide master*, *letterhead*, *email signature* | card, web |

Evidence for industry-specific choices: delivery vans, uniforms and boxes (Amazon, §2.1); rider
jackets (Deliveroo, §3); compostable coffee bags with patterned gussets (Peach Coffee, §3); sharing
boxes (Hipchips, §3); food tableware (De-Extinction, §2.2); in-app finance graphs (Kikin, §2.2);
checkout UI (Bolt, §2.2); fruit-tissue wrappers (Gustini, §2.2).

## 6. Design elements in a brand toolkit, and how to generate them

Inputs available today: the symbol (13 families in `SYMBOL_FAMILIES`), the mark shape, five palette
roles, three fonts (display, body, data).

| # | Element | What agencies hand over | Procedural SVG recipe |
|---|---|---|---|
| 1 | **Graphic device / supergraphic** | The mark's key shape at huge scale, cropped | `primitive()` of the mark; scale 4–12×; anchor off-canvas by seeded corner; `clipPath` to artboard; 1–2 roles |
| 2 | **Pattern tile** | Repeat for packaging insides, tissue, gussets | Primitive on a square/hex lattice in `<pattern>`; rotate 0/90/180/270 by `(i+j)%4`; alternate scale 1/0.5; density target 8–20% or 30–50% |
| 3 | **Icon set** (8–12) | UI and wayfinding icons in the mark's style | Fixed icon skeletons (home, cart, chat, pin, star, user, mail, clock…) drawn as strokes; apply the mark's stroke width, cap/join, corner radius and one signature notch/dot |
| 4 | **Badge / seal** | Round or scalloped stamp with text on a path | Circle or n-scallop path; `<textPath>` with tagline and year; symbol centred at 40% diameter; ring 1.5–3px |
| 5 | **Sticker sheet** | 6–9 die-cut stickers | Mix badge, wordmark, icon, one-word message on `brand`/`accent`; white offset outline via `stroke` 6–8%; random rotation ±8° by seed |
| 6 | **Colour fields / gradient blocks** | Proportioned swatch blocks; cropped gradients for time/light brands | Rects in the §4.1 C ratios; a linear gradient `brand → tint` only for light/time families (`burst`, `arcs`, `crescent`); cropped with a rounded rect |
| 7 | **Type lockups** | Headline treatments, stacked brand name, type supergraphic | Display font at 10–18% height, tracking −3%; brand name repeated in rows with alternating outline (`stroke`, `fill="none"`) |
| 8 | **Frames and crops for photography** | A shape that crops photos (GoFundMe's circle, Airbnb's Bélo) | Symbol outline or primitive as `clipPath` over a placeholder or moodboard image; duotone via `feColorMatrix` mapped to `ink`/`brand` |
| 9 | **Dividers, borders and rules** | Edge treatments for labels, menus, certificates | Primitive repeated along a line (`stroke-dasharray` or tiled micro-pattern); corner ornaments from the mark at 4 corners |
| 10 | **Spot illustrations** | Small scenes in the brand style | Compose 2–4 primitives + simple geometric props (sun, hill, box, cup) with palette roles; flat fills, one accent |
| 11 | **Data / progress device** | Brand-styled charts, progress, steps (Kikin, GoFundMe) | Progress arc or bar built from the primitive; segmented by count; labels in the data font |
| 12 | **Motion principles** | Logo reveal, device loop | CSS keyframes on the SVG: draw-on (`stroke-dashoffset`), scale-in of the device from its crop anchor, 400–700ms ease-out; respect `prefers-reduced-motion` |

## 7. What GoBrandToday adopts

Prioritised. P0 = do next; P1 = after P0; P2 = later. Each item names the rule, not just the idea.

### P0: make every brand a system

1. **Primitive extraction.** Every symbol family and mark shape exposes one primitive path. All devices,
   patterns, badges, dividers and icon signatures derive from it (§4.1 A). No decoration may come from
   anywhere else.
2. **Supergraphic on every macro surface.** Card back, packaging front, social post, storefront awning,
   tote: primitive at 4–12× logo height, cropped 25–60% visible, anchored to a seeded corner, opposite
   the lockup on the diagonal.
3. **Colour proportion presets.** Each mockup declares `quiet`, `loud` or `mono+spark` and uses the
   §4.1 C table; accent used once per surface; contrast checked with `contrast()` from `brand-system.ts`.
4. **Type scale jump ≥ 2.5×.** Mockups use three sizes per surface with ratio ≥ 2.5, headline tracking
   −3%, leading 0.95; the data font only for prices, URLs and small labels.
5. **Industry-first mockup selection.** Map the kit's industry to the §5 table; render three industry
   objects before universal ones. Start with the renderers that cover the most rows: *menu*, *delivery
   bag*, *mithai/gift box*, *hang tag + neck label*, *bottle/jar label*, *payment card*, *app UI screen*.
6. **Pattern tile** (§6 #2) on secondary surfaces: box insides, gussets, tissue, card backs, label borders.

### P1: toolkit page in the brand book

7. **Toolkit section** listing the 12 elements in §6, each exportable as SVG.
8. **Icon set** of 12 derived icons (§4.1 F) with the mark's stroke, caps and one signature detail.
9. **Badge tiers and sticker sheet** (§4.1 E): principle badges from brand values, message stickers from
   the tagline, a seal with the founding year.
10. **Two registers in the book.** Show each key application twice: quiet (product, stationery) and loud
    (campaign, packaging), from the same parts, as Stack Overflow and GoFundMe do.
11. **Photo frames** (§6 #8): the symbol as a crop shape over moodboard images, duotone-mapped.

### P2: polish and motion

12. **Motion spec:** draw-on mark and device scale-in (§6 #12) in the brand book and website mockup.
13. **Seasonal / regional palette variants** (Tripadvisor-style): festive variants (e.g. Diwali gold)
    generated by rotating `accent` while keeping `brand` fixed.
14. **Sub-brand rule:** the same wordmark with a descriptor and a category colour (Amazon, GoFundMe Pro)
    for users with more than one product line.

### Guardrails

- Never show more than one device, one pattern and one accent per surface.
- Never stretch, outline or recolour the logo inside a mockup to make it fit; change the layout instead.
- Do not claim a studio-grade custom typeface; GoBrandToday pairs Google Fonts (see `docs/MARKETING_BRIEF.md`
  claims guardrails before any marketing copy cites this research).
- Keep every new element vector and deterministic from the kit seed (AGENTS.md invariant 9).
