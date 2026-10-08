# Logo science — what makes a professional logo work

**As of 2026-10-08.** Research input for the logo renderer
([`logo.ts`](../packages/shared/src/logo.ts)), the symbol families
([`symbols.ts`](../packages/shared/src/symbols.ts)) and the brand book
([`BrandGuidelines.tsx`](../apps/web/components/BrandGuidelines.tsx)). This is a research note, not a spec;
the code is still the source of truth. It complements [`DESIGN_RESEARCH.md`](DESIGN_RESEARCH.md), which
covers systems, toolkits and mockups. This note covers the logo itself.

**How to read the labels.** "(Module 24, p.N)" and "(Guidebook, p.N)" are claims taken from the two PDFs
below. "(general practice)" is professional knowledge added where the PDFs are thin; it is not attributed to
them. Named studies are cited by author and year so they can be looked up.

## Sources

| Short name | Title as it appears inside | Pages | Notes |
|---|---|---|---|
| **Module 24** | *Brand Design: Logo Design* (© Brands By Chris) | 15 | p.3–6 seven logo types; p.6 shape; p.7 style families; p.8 colour meanings; p.9 colour schemes, serif/sans; p.10 script/display, "9 Pro Logo Design Tips"; p.11–13 client questionnaire; p.14 blank notes; p.15 an advert for the author's consulting (no design content). Its footer forbids redistribution, so it is paraphrased here, not reproduced. |
| **Guidebook** | *A Beginner's Guide to Logo Types: Learn How to Choose the Right Logo Style for your Business* (running footer: "A Beginner's Guide to Logotypes") | 11 | p.2 intro; p.3–9 seven types, each with "best suited for", "why it works" and a recommendation; p.10 final thoughts. |

Page numbers are PDF page numbers. The Guidebook's printed folios are one lower (PDF p.3 is printed "2").
The Guidebook's intro says it covers "five" categories (Guidebook, p.2) but it presents seven.

Both PDFs are introductory. They are good on logo types, colour and type personality, and on the "keep it
simple" tips. They say almost nothing on clear space, minimum size, responsive logos, file formats or the
perception science, so most of sections 3 and 5 is general practice.

## 1. What a logo is for

- **A logo identifies; it does not sell.** The Guidebook's thesis is that a logo identifies a brand
  instantly rather than selling it instantly (Guidebook, p.2). Module 24 opens with Scott Cook's line that a
  brand is what consumers tell each other it is (Module 24, p.2): the logo is a container that meaning fills
  over time.
- **Meaning comes from exposure, not from the drawing** (general practice). Repeated exposure raises liking
  (Zajonc 1968, mere-exposure effect), and familiar, easily processed forms feel more trustworthy (Reber,
  Schwarz & Winkielman 2004, processing fluency). A new logo's job is to be *easy to encode and recall*, so
  that every later exposure adds to the same memory trace. This is why consistency rules (section 5) matter as
  much as the design.

## 2. Logo types and when each fits

| Type | What it is | Fits | Watch out | Sources |
|---|---|---|---|---|
| **Wordmark** | The name in distinctive type; the name *is* the identity | Service firms, consultants, local businesses, startups, short memorable names | Needs a short, distinctive name; spacing (kerning) and typeface carry all the character | Module 24, p.3; Guidebook, p.3 |
| **Lettermark** | Initials or an abbreviation, stylised | Long names, corporate, agencies, fashion and premium | Says little about the business; brands often move to it *after* they are known | Module 24, p.4; Guidebook, p.4 |
| **Pictorial mark** | A recognisable icon (apple, bird, shell) | Established brands, apps, tech, lifestyle | Works best once recognised; new firms should pair it with the name | Module 24, p.4; Guidebook, p.5 |
| **Abstract mark** | A non-literal geometric form (swoosh, stripes) | Modern startups, sport and tech, global brands, anyone wanting a unique identity | No built-in meaning: the brand must teach it | Module 24, p.5; Guidebook, p.6 |
| **Combination mark** | Symbol plus name, side by side or integrated | Restaurants, retail, small businesses, consumer brands; the most common type | Needs a symbol-only and a name-only version for small spaces | Module 24, p.5; Guidebook, p.7 |
| **Emblem / badge** | Text and elements *inside* a closed shape (seal, shield, crest) | Food and drink, cafés, heritage, local services, trust-led firms | Many small elements become illegible when scaled down | Module 24, p.5; Guidebook, p.9 |
| **Mascot** | A character that carries the personality | Kids, food, entertainment, sport, creative firms | Simpler mascots look more professional and versatile | Module 24, p.6; Guidebook, p.8 |

**Decision rules** (general practice, consistent with the PDFs):

1. **Name length decides between a wordmark and a lettermark.** Short names (≤ 8 letters, one word) suit a
   wordmark. Long or multi-word names suit a lettermark or a monogram badge (Guidebook, p.4).
2. **Brand maturity decides how much text to drop.** New brands lead with a combination mark; a symbol alone
   comes later (Guidebook, p.5; Module 24, p.4).
3. **The smallest common use decides how detailed it can be.** If the logo lives mostly as an app icon,
   a WhatsApp display picture or a UPI QR standee, it needs a compact form that works at 16–48px.
4. **The Guidebook's default advice is a wordmark**, because simple type-based logos read as polished and
   trustworthy (Guidebook, p.3).

## 3. The principles and the science behind them

The PDFs' own list: simple, memorable, scalable, relevant to the business, easy to recognise
(Guidebook, p.10), plus "not too trendy" and "legible in a single colour" (Module 24, p.10).

| Principle | Why it works (mechanism) | Test |
|---|---|---|
| **Simplicity** | Objects are recognised from a few simple parts (Biederman 1987, recognition-by-components). Fewer parts mean faster encoding and fewer details lost when the logo is small (Module 24, p.10, tip 1). | Count the distinct shapes; squint test; 16px render. |
| **Memorability** | Memory favours a single distinctive feature (the isolation, or von Restorff, effect). Moderately elaborate, "natural" designs score best on recognition (Henderson & Cote 1998). | Show it for 5 seconds, then ask people to sketch it. |
| **Timelessness** | Trend-driven styles date because their novelty is borrowed (Module 24, p.10, tip 8). | Remove the current trend (gradient, glow, glitch); does it still stand? |
| **Versatility** | One identity must survive one colour, reversal, embroidery, stamps and screens (Module 24, p.10, tip 4). | One-colour and reversed renders; on photo; at 16px. |
| **Appropriateness** | Fit between the form and the category makes the brand easier to categorise; misfit costs trust (Henderson & Cote 1998; Module 24, p.10, tip 2: design for the audience, not your own taste). | Would the audience guess the category or tone from the logo alone? (Module 24, p.11) |
| **Scalability** | Vector geometry scales without loss (Module 24, p.10, tip 3); no photos or raster (tip 5). | Billboard and favicon from the same source. |
| **Distinctiveness** | Recognition needs difference from competitors, not only uniqueness of detail (general practice). | Line it up with 10 competitor logos; is it findable in a second? |

### 3.1 Gestalt: how the eye groups a logo (general practice)

| Law | What the eye does | Logo use | Already in GoBrandToday |
|---|---|---|---|
| Figure–ground | Separates a shape from its background | Knock-outs and hidden shapes (FedEx arrow) | Lettermark initial knocked out of its shape; monogram initials |
| Closure | Completes incomplete shapes | Broken rings, implied circles | Orbit's partial ring |
| Proximity | Groups near things | Lockup spacing ties symbol and name together | Symbol + wordmark gap (0.3 of the font size unit) |
| Similarity | Groups things alike in colour or shape | Repeated modules read as one mark | Tiles, pixels, layers |
| Continuity | Follows smooth lines | One stroke that joins letters | Heritage's unbroken headline bar |
| Common region | Groups what shares an enclosure | Badges, emblems, stickers | Monogram badge, stacked sticker block |
| Symmetry and Prägnanz | Prefers the simplest, most stable reading | Symmetric marks feel stable and "finished" | Pixel crest (mirror-symmetric), petals (radial) |

### 3.2 Recognition speed (general practice)

People categorise an image in roughly 150 ms (Thorpe, Fize & Marlot 1996), so a logo is recognised first by
**silhouette, colour and proportion**, and only later read. Implications: a distinctive outer shape beats
inner detail; one dominant colour beats three equal ones; letterforms must stay open (large x-height, open
apertures) so the word shape survives at small sizes and at a glance.

### 3.3 Shape psychology

- **Round and free-form shapes** are associated with softness, kindness, warmth, care, fun and
  friendliness; **geometric** shapes with hardness, durability, power, innovation, respect and intelligence
  (Module 24, p.6).
- This matches the research (general practice): circular logos make a firm seem softer and more
  comfortable, angular logos make it seem harder and more durable (Jiang, Gorn, Galli & Chattopadhyay 2016).
  People generally prefer curved objects, and sharp contours read as a mild threat (Bar & Neta 2006). Sound
  symbolism ("bouba" round, "kiki" spiky; Köhler 1929, Ramachandran & Hubbard 2001) means the *name's* sound
  can be matched to the mark's geometry.
- More general practice: horizontal lines read calm and stable, verticals strong, diagonals and
  chevrons dynamic; upward means growth; symmetry means stability and trust; asymmetry means energy.

### 3.4 Colour psychology

| Colour | Association (Module 24, p.8) |
|---|---|
| Red | Excitement, passion, anger; loud, youthful, stands out |
| Orange | Energetic, vibrant, playful; less used than red |
| Yellow | Accessible, friendly, cheerful, affordable |
| Green | Very versatile; nature |
| Blue | Classic and common; calm, trustworthy, mature |
| Purple | Luxurious; mysterious, eclectic or feminine by shade |
| Pink | Youthful, feminine; can be grown-up and cool |
| Brown | Rugged, vintage, handmade |
| Black | Sleek, modern, luxurious, minimal |
| White | Neutral, modern, clean, economical |
| Grey | Mature, classic, serious |

Schemes: complementary (opposite hues, dynamic), analogous (neighbours, harmonious), triadic (three
equally spaced hues, bold) (Module 24, p.9). Keep the logo to 2–3 colours (Module 24, p.10, tip 6).

Caveats (general practice):

- Colour meanings are **learned and cultural**, not innate. The evidence is strongest for *fit*: a colour
  that suits the category and personality helps (Labrecque & Milne 2012). Hue charts are a starting point.
- **India-specific meanings:** saffron is sacred and political; red is weddings and auspiciousness; white
  can mean mourning; turmeric yellow is auspicious; green reads fresh or agricultural and also carries
  religious associations. Check the combination against flags and party colours.
- **Contrast beats hue.** WCAG exempts logotypes from text-contrast rules, but a mark needs about 3:1
  against its background to be seen (the WCAG 1.4.11 non-text threshold is a sensible bar).

### 3.5 Typography personality

Serif: classic, high-end, versatile, best for vintage, elegant or classic designs. Sans-serif: modern, clean,
sleek. Script: handwriting, individual, from elegant to relaxed. Display: decorative and eye-catching, but
can become busy next to other elements (Module 24, p.9–10). Pick a face that matches the personality
(Module 24, p.10, tip 7); for wordmarks, mind the character proportions and kerning (Module 24, p.3).

General practice: typeface impressions are measurable. Natural, harmonious, elaborate faces read as more
pleasing and engaging (Henderson, Giese & Cote 2004). Legibility at small sizes depends on x-height, open
counters and apertures, moderate contrast, and looser tracking for all caps. Very high-contrast serifs and
thin scripts are the first to break at 16px.

### 3.6 Negative space

The FedEx arrow between the "E" and "x" is the classic example: a subtle graphic hidden in the text implies
forward motion (Module 24, p.3). Pictorial marks should use whitespace well, and less is more (Module 24, p.4).
General practice: negative space adds a "second read" that rewards attention (good for memorability), but
the counter-shapes must stay open at the smallest size, or the hidden idea disappears.

## 4. The design process

The PDFs describe the front end of the process:

1. **Brief questionnaire** (Module 24, p.11–13): five admired logos from outside your industry and five
   from inside; five words that describe the brand; the target audience and what matters to them; how the
   audience should describe the brand from the logo alone; preferred style, logo type, colours and font
   class; five favourite Google Fonts.
2. **Choose a style family** (Module 24, p.7): luxury and upscale, retro and vintage, modern and minimal, fun
   and quirky, handcrafted.
3. **Choose a logo type** that matches the business, audience and long-term goals (Guidebook, p.10).
4. **Choose colours and type** by meaning and personality (Module 24, p.8–10).

General practice adds the back end: competitor audit, then many rough sketches, then 3–4 directions, then
refinement (grid, optical overshoot, kerning, stroke balance), then **stress tests** (16px, one colour,
reversed, on photos, in context), then the system (variations, rules), then delivery files.

GoBrandToday's flow covers steps 1 to 4 as a brief (personalities, industry), four looks
(`generateLooks`), a pick, and the brand book. It has no stress-test step and no competitor check.

## 5. Usage rules

The PDFs only touch on usage: one colour (Module 24, p.10, tip 4), vector (tip 3), and emblems at small sizes
(Module 24, p.5). Everything else here is general practice.

- **Clear space.** Define it with a unit taken from the logo itself (the x-height, cap height or mark
  height), so it scales with the logo. Typical: 1× the x-height for wordmarks, 0.5–1× the mark height for
  combination marks. Measure from the artwork's tight bounds, never from the padding in the file.
- **Minimum size.** Set by the smallest element, not by the overall width. Rule of thumb: the smallest text
  needs a cap height of at least about 6px on screen or about 1.2mm in print. Below that, switch to the next
  compact version.
- **Variations and lockups.** Primary (horizontal), stacked (vertical), wordmark-only, symbol-only. Fix the
  ratio between symbol and name and the gap between them, so nobody improvises.
- **Responsive logos.** A planned ladder: full lockup → compact lockup → icon → favicon. Each step drops
  detail on purpose (tagline, then name, then inner detail). The 16px favicon is often a redrawn,
  simplified glyph.
- **Colour versions.** Full colour; reversed (on dark); one colour positive (black or brand); one colour
  reversed (white). A true one-colour version has no second ink: knock-outs must be transparent, not white.
- **Backgrounds.** Choose the version with the most contrast. On photos use the reversed or one-colour
  version on a calm area. On brand colour use one colour (white), not the full-colour version.
- **Misuse.** Don't stretch, rotate, recolour, add effects, outline, rearrange the lockup, retype the name,
  crowd it, or place it on low-contrast or busy backgrounds. Show misuse with the real logo.
- **File formats.** SVG for web and app; PDF or EPS with **text converted to outlines** for printers, sign
  makers and embroidery (they rarely honour embedded fonts); PNG at 1×, 2× and 4× with transparency;
  favicon.ico (16/32/48) plus favicon.svg; apple-touch-icon at 180px; maskable PWA icons with the content
  inside the central 80% circle; colour values in HEX, RGB and CMYK, with the nearest Pantone for print.

## 6. Common mistakes

| Mistake | Why it hurts | Source |
|---|---|---|
| Too many small elements | They vanish at small sizes; recognition depends on silhouette | Module 24, p.10 (tip 1); Module 24, p.5 (emblems) |
| Designing for your own taste | The logo serves the audience | Module 24, p.10 (tip 2) |
| Raster or photo logos | They can't scale or print cleanly | Module 24, p.10 (tips 3 and 5) |
| Works only in full colour | It fails on stamps, embroidery and one-colour print | Module 24, p.10 (tip 4) |
| More than 2–3 colours | Slower to recognise; costly to print | Module 24, p.10 (tip 6) |
| Font that fights the personality | It sends a mixed signal | Module 24, p.10 (tip 7) |
| Chasing trends | It dates in a few years | Module 24, p.10 (tip 8) |
| Display font plus other elements | The logo becomes busy | Module 24, p.10 |
| Symbol-only for a new brand | Nobody knows it yet | Guidebook, p.5 |
| Complexity over clarity | Simplicity outperforms complexity | Guidebook, p.10 |
| Clichés (globe, swoosh, lightbulb, generic leaf) | Not distinctive in the category | general practice |
| Dates or facts that change baked into the logo | The logo stops being stable | general practice |
| Fake script (Latin dressed as another script) | It can read as pastiche to native readers | general practice |

## 7. What GoBrandToday should do

### 7.1 Where the platform stands

| Principle | Status | Evidence in the code |
|---|---|---|
| Simplicity | Good | Ten constructions of 2–4 parts; symbols are 1–25 primitives in a 100×100 box. Pixel crests (up to 25 cells) and 12-point bursts are the busiest. |
| Memorability and distinctiveness | Good | Seeded symbols are unique per name; four looks are spread around the colour wheel (`generateLooks`). |
| Timelessness | One bug | `editorial` renders `EST. ${new Date().getFullYear()}`, so the logo changes every January and on every re-export. |
| Versatility | Partly | Light, dark and mono variants exist. But mono knock-outs are `#FFFFFF` (a second ink), and there is no white one-colour version. |
| Contrast on backgrounds | **Bug** | In the `dark` variant the mark is drawn in `accent`. Measured over 24 hues from `generatePalette`: accent on brand is **below 3:1 for 24 of 24 hues** (1.0–2.5:1), and accent on ink is below 3:1 for 8 of 24 (warm and magenta hues). The brand book's "Brand" background tile uses the `dark` variant, so the mark nearly disappears there. |
| Scalability | Partly | Logos are vector. But there is no 16px asset: `favicon.svg` is the 128px icon, and its fine details shrink below 1px (orbit ring 0.55px, layer gaps 0.33px, editorial icon rule 0.38px at 16px). |
| Usage rules | Partly | `LOGO_STYLE_META.usage` is good prose, but clear space uses a different unit for each of the ten styles (the “o” height, badge width, cap height, block height, tile and so on). The brand book draws generic corner "x" markers and prints a fixed "Print 25 mm · Screen 120 px" that contradicts each style's own `minSize` (for example, twinkle 96px, emblem 72px tall). |
| Logo types | Gap | No type label. `emblem` has no enclosing shape, so by the PDFs' definition (Module 24, p.5) it is a stacked combination mark. Look picking ignores name length (Guidebook, p.4). |
| File formats | Partly | SVG (with embedded subset fonts), PNG and favicons 32–1024. No outlined text, no PDF, no 16px or `.ico`, no white mono version, and no trimmed artwork (each SVG includes padding of 0.2–0.3 × the base font size). |

### 7.2 Logo type per construction

| Construction | Logo type | When it fits |
|---|---|---|
| twinkle | Wordmark (with an integrated glyph) | Short one-word names; modern tech or creator brands that want a quiet signature. |
| monogram | Combination mark (lettermark badge + spaced name) | Long or two-word names; trust-led premium firms (finance, consulting, health). |
| editorial | Wordmark (serif) | Fashion, media, beauty and premium services where type alone signals class. |
| stacked | Wordmark in a container (sticker) | Loud consumer, food and fashion brands that live on packaging and social media. |
| symbol | Combination mark (abstract mark + wordmark) | New brands that want a unique symbol for an app icon, with the name taught alongside it. |
| emblem | Combination mark, stacked (an emblem only if enclosed) | Food, hospitality, beauty and heritage, where a centred seal-like layout feels established. |
| lettermark | Combination mark (lettermark + wordmark) | Names that need a strong 16px form; consumer apps, SaaS and education. |
| playful | Wordmark (display type) | Kids, food and consumer brands with short names; it dislikes long names and small sizes. |
| terminal | Wordmark (with a prompt glyph) | Developer tools, AI and infrastructure; the audience must recognise the command-line idiom. |
| heritage | Wordmark (inspired by Devanagari) | Indian food, beauty, fashion and craft brands that want rootedness; pair it with real Devanagari for native readers. |

### 7.3 Shape psychology per symbol family

| Family | Geometry | Reads as | Caution |
|---|---|---|---|
| tiles | Mixed, on a strict grid | Order, system, rational creativity (Bauhaus) | In mono, tiles of the same colour merge; keep gaps |
| orbit | Curved | Ecosystem, a core with satellites, space and tech | 5-unit ring is under 1px at 16px; space cliché in AI |
| petals | Curved, radial | Care, growth, community, wellness | Lotus reading in India (a political party symbol); avoid saffron 8-petal combinations |
| stripes | Curved outline with horizontal bands | Warmth with order; retro sunset | 3–6-unit gaps close at small sizes |
| blob | Organic, asymmetric | Friendly, alive, playful; its eye triggers face-reading | Too casual for finance, health or premium |
| pixels | Angular, mirror-symmetric | Digital, crafted, gaming, retro-tech | Looks like generic identicons; busy at 16px |
| chevrons | Angular, directional | Progress, speed, ambition | Pointing down reads as decline; also military or rank |
| crescent | Curved | New beginnings, calm, premium, night | Crescent + star has strong religious and flag associations |
| burst | Angular, radial | Energy, celebration, "new!" | Many deep points read as a discount sticker |
| interlock | Curved, overlapping | Partnership, trust, connection | Close to famous ring logos; rings merge in mono |
| sprout | Organic | Growth, nature, agriculture, health | Category cliché in agri and wellness (generic leaf) |
| layers | Angular, isometric | Platform, depth, a stack to build on | Common in devtools; the 3-unit paper gaps vanish small |
| arcs | Curved, nested | Range, inclusion, optimism, sunrise | Can read as a rainbow or Pride flag; kid-like |

### 7.4 Prioritised changes

Effort: **S** is under a day, **M** is 1–3 days, **L** is more than 3 days. Files are under `packages/shared/src`
unless noted.

**P0: correctness and trust**

1. **Fix reversed-mark contrast (S).** In `colors()` (`logo.ts`), pick the mark colour for `dark` as the
   first of `accent`, `tint`, `paper` that reaches ≥ 3:1 against the background. Add a `reverse` variant
   (every element `paper` or white) and use it for the brand-colour tile in `BrandGuidelines.tsx`. Add a
   test that loops over hues and asserts ≥ 3:1.
2. **Remove the moving year (S).** Drop "EST. <current year>" from `editorial`, or render it only from an
   optional stored `identity.founded`. (Optional fields keep stored kits valid.)
3. **Logo type label per construction (S).** Add `type: 'wordmark' | 'lettermark' | 'combination' | 'emblem' |
   'abstract'` and `typeNote` to `LogoStyleMeta`, from table 7.2. Show it in `LookPicker.tsx` and in the
   brand book's logo section.
4. **Name-length-aware look scoring (S).** In `generateLooks`, boost `monogram` and `lettermark` for long or
   multi-word names (> 10 letters or ≥ 3 words); boost `twinkle`, `playful` and `stacked` for names of
   8 letters or fewer, and penalise them for long names (Guidebook, p.4).
5. **Make the brand book's minimum size consistent (S).** Replace the hard-coded "Print 25 mm · Screen 120 px"
   with the style's `usage.minSize`, so the two numbers never disagree.

**P1: the professional usage system**

6. **One-colour and reversed test (M).** Make knock-outs real holes (`fill-rule="evenodd"` paths or
   `<mask>`) in the monogram, lettermark and stacked constructions and in the petals, blob and layers
   symbols, so `mono` uses exactly one ink. Export `mono` (ink) and `mono-white`. Add a unit test that
   counts distinct non-`none` fills per variant: `mono` must have 1.
7. **16px legibility check and a dedicated favicon (M).** Add `faviconSVG(id)`, a simplified 16/32px
   drawing (initial or symbol primitive only, strokes ≥ 1.5px at 16). Add `minFeature(id, px)`, which
   returns the smallest stroke, gap or text height in output pixels; test it ≥ 1px at 16px for every style
   and family. Export `favicon-16.png` and `favicon.ico`.
8. **Responsive logo set (M).** Add `logoSet(id)` returning `full`, `compact` (single line, no extras),
   `stacked`, `wordmark`, `symbol` (no tile) and `icon`, each with a recommended width range. Add a
   "Responsive logo" row to the brand book (≥ 120px full → 48–120px compact → 24–48px icon → 16px
   favicon) and a `logo/responsive/` folder to the ZIP.
9. **Clear space from an x-height unit (M).** Change `usage.clearSpace` to structured data
   (`{ unit: 'x' | 'cap' | 'mark', k: number }`, keeping the prose). Have `logoSVG` return `bounds` (the tight
   artwork box) and `unit` (in px). Draw the real exclusion zone in `BrandGuidelines.tsx` instead of the
   CSS corner markers.
10. **Computed minimum size (M).** Derive `minSize` from the smallest text element (cap height ≥ 6px on
    screen, ≥ 1.2mm in print) using the same geometry, so a 14-letter monogram gets a larger minimum than
    a 5-letter one.
11. **Shape-psychology notes per symbol family (S).** Add `geometry: 'curved' | 'angular' | 'mixed'`,
    `feel` and `caution` to `SYMBOL_META` (table 7.3). Weight `pickFamily` by geometry (Human, Playful and
    Youthful → curved; Technical, Trustworthy and Bold → angular), and show the note in the brand book.
12. **A real emblem (M).** Give `emblem` an enclosure (a circular seal with the name on a ring, or a shield),
    or rename it "Crest lockup" and label it a combination mark. Either way, keep a symbol-only fallback
    for small sizes (Module 24, p.5).
13. **Construction-specific misuse tiles (M).** Next to the six generic tiles, render 2–3 tiles from each
    style's `usage.dont` (for example: stacked straightened, heritage bar broken, terminal without cursor,
    editorial without rule).

**P2: delivery and India-first polish**

14. **Print-ready files (L).** Export SVG and PDF with text converted to paths (for example `opentype.js`
    reading the already-fetched woff2 subset), trimmed to the artwork, plus CMYK values and the nearest
    Pantone in the brand book. Indian printers and embroiderers mostly need outlined vectors.
15. **Bilingual lockup (L).** Add an optional secondary lockup with the name in Devanagari (later Tamil,
    Bengali and others) using Google Fonts such as Noto Sans Devanagari, Mukta or Tiro Devanagari Hindi.
    Transliteration comes from the AI provider, with a user-editable field as the offline fallback. This
    keeps `heritage` honest and avoids fake script.
16. **Circle-crop and maskable checks (S).** Test that the icon survives a circular crop (WhatsApp and
    Instagram display pictures) and that the content fits the 80% maskable safe zone. The arch-shaped
    lettermark container already reaches about 65px from the centre of the 128px tile.
17. **The Module 24 questionnaire in the brief (M).** Ask for five words, how the audience should describe
    the brand from the logo alone, and admired logos (Module 24, p.11). Map the answers onto the `fit` tags.
18. **Category-colour warning (S).** Flag when the brand hue matches the category's default (for example,
    fintech blue) and offer a contrasting option (see [`DESIGN_RESEARCH.md`](DESIGN_RESEARCH.md), section 4).

### 7.5 Studies cited (general practice)

Bar & Neta 2006, *Psychological Science* (preference for curved objects) · Biederman 1987, *Psychological
Review* (recognition-by-components) · Henderson & Cote 1998, *Journal of Marketing* (logo design guidelines) ·
Henderson, Giese & Cote 2004, *Journal of Marketing* (typeface impressions) · Jiang, Gorn, Galli &
Chattopadhyay 2016, *Journal of Consumer Research* (circular and angular logos) · Köhler 1929, Ramachandran &
Hubbard 2001 (bouba/kiki) · Labrecque & Milne 2012, *Journal of the Academy of Marketing Science* (colour and
brand personality) · Reber, Schwarz & Winkielman 2004, *Personality and Social Psychology Review*
(processing fluency) · Thorpe, Fize & Marlot 1996, *Nature* (speed of visual categorisation) · Zajonc 1968
(mere exposure) · W3C WCAG 2.2, success criteria 1.4.3 and 1.4.11.
