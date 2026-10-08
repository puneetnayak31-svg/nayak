# Changelog

What changed, round by round, and why. Newest first. **Every change adds a line under Unreleased**:
user-visible behaviour, new or removed modules, endpoints, env vars, and decisions taken or reversed (link the
`DECISIONS.md` entry). When a batch is committed, move its lines into a new round with the date and commit.

## Unreleased

_Nothing yet._

## Round 9 — The hero shows the magic; currency to Settings; Identity type; signature logo · 2026-10-08

- **Changed** the landing hero to show what you get instead of listing it: an example idea types itself and a Brand in a
  Box assembles beside the composer (name and score, logo, domains with prices, handles, brand book, social kit,
  website draft, launch copy; three examples cycle, labelled "Example"), with an 8-item "Everything inside" strip under it
  and the same items as chips above the composer on phones (`HeroMagic.tsx`). The composer is compact in the hero.
  `HeroChecks.tsx` is removed.
- **Moved** the ₹/$ switch out of the header (D30). It lives in Settings (the account menu shows the current currency)
  and on the pricing page. The guest "free rounds left" pill shows from 1280 px.
- **Fixed** Identity: headings, labels and body text use GoBrandToday's own fonts; the brand's fonts appear only where
  they are shown off (the promise, type specimens, the UI sample and taglines).
- **Added** the brand icon to the email signature, an optional hosted-logo link for Gmail, a "Signature logo PNG"
  download, and `email-signature-logo.png` in the ZIP.
- **Added** icons to the brand page tabs (a box for Brand in a Box, also on the page's eyebrow) and fixed tab icons
  shrinking to nothing when the tab row is tight. Settings shows the plan's name.

## Round 8 — Social media kit up front, logo repurpose tool, hero and alignment fixes · 2026-10-08

- **Removed** every "Made in India" line: landing eyebrow, footer, marketing brief, the `#madeinindia` hashtag and the
  "Made in <place>" tagline in the offline writer, and the T-shirt label in the apparel mockup. India-first pricing stays.
- **Changed** the landing hero so the domains and handles box shows without scrolling at 1366 × 768: a smaller heading,
  a tighter box, and a third row showing the ready-to-post files (profile picture, LinkedIn/YouTube banners, X header,
  launch post, brand guidelines) with a quiet link to the logo repurpose tool.
- **Added** a logo repurpose tool (D29): upload a logo you already have and get a profile picture, a post, LinkedIn, X and
  YouTube banners and a one-page brand guidelines sheet, at exact sizes, made in the browser (`shared/repurpose.ts`,
  `LogoRepurposer.tsx`). Six SEO pages: `/tools/logo-to-social-kit`, `linkedin-banner-maker`, `youtube-banner-maker`,
  `x-header-maker`, `profile-picture-maker`, `brand-guidelines-from-logo`. Listed on `/tools` and in the footer, not in the main nav.
- **Changed** the brand page to say plainly that it includes social media files: the tab is "Social & launch kit" with
  platform icons and opens with the brand's profile picture, post and banners (`SocialStrip`); every copy block has its
  platform icon; Downloads leads with a "Social media kit" group; Brand in a Box gains a "Ready to post" row; the header
  button reads "Download kit + social files".
- **Fixed** alignment: the guest header no longer wraps the usage pill above "Sign in" (pill only at ≥ 1440 px); Downloads
  cards share row heights and their buttons sit on an even grid; the experts grid shows 4 or 2 columns, never a lone
  card; long example chips in the studio wrap instead of overflowing at 390 px.

## Round 7 — Launch copy that fits, Pro account menu, download sign-up, logo science · 2026-10-08

- **Changed** the offline launch kit (`offline/copy.ts`): the brief is read into category, offer, place and audience, so
  no field pastes it back. Bios, posts, thread, announcement and content ideas are written per platform (lengths,
  calls to action, local hashtags) and per name (wordplay on a word or Hindi/Sanskrit root inside it), with a
  vocabulary for each of the 20 sectors (D28). The AI prompt gained the same platform rules and the detected business type.
- **Changed** other strategy and website copy to use the parsed brief (one-liner, subheadline, about, FAQ, SEO title).
- **Added** an account menu (`AccountMenu.tsx`): Pro and Studio get a gradient-ring avatar with a crown; the chip shows
  rounds left today, the menu shows brand boxes left and every usage meter. Guests see free rounds left. The dashboard
  shows "What's left on <plan>". `GET /api/auth/me` usage now includes `brands` (total against the plan's cap).
- **Added** a demo Pro account: built into the preview (`demo@gobrandtoday.com` / `GoBrand@Pro2026`), and
  `npm run db:seed-demo` for the app (`DEMO_PRO_EMAIL`, `DEMO_PRO_PASSWORD`; the local default is refused in production).
- **Changed** downloads to need a free account (D27): guests can build and view one Brand Box; every download shows a
  sign-up prompt (`SignupGate.tsx`) and `GET /api/brands/:id/export` returns 401 for guests.
- **Added** a hero block on the landing page (`HeroChecks.tsx`): a name whose ending rolls through .com/.in/.ai/.io/.co
  and the 10 platforms as icons (`PlatformIcons.tsx`, also used in the availability panel).
- **Added** `docs/LOGO_SCIENCE.md` from the founder's two logo PDFs, and applied its quick fixes: the dark logo's mark
  is contrast-checked against ink (≥ 3:1, tested over all hues); a new all-white `reverse` version for brand-colour and
  photo backgrounds; the editorial lockup no longer prints the current year (`EST.` only with a stored `founded`);
  every construction has a logo type and note (`LOGO_STYLE_META.type/typeNote`, shown in the look picker and brand
  book); long names favour lettermark, monogram, symbol and emblem looks; symbol families carry shape-psychology
  notes (`SYMBOL_META.feel/caution`), shown in the brand book.

## Round 6 — Industry mockups, brand toolkit, downloads, website builder · 2026-10-08

- **Added** industry scenes (`shared/scenes.ts`): 23 objects a studio would show for the business (woven neck label,
  hang tag, mithai box, coffee bag, candle jar, serum bottle and carton, cans, bottles, menu, takeaway bag, product
  screen, payment card, ID badge, notebooks, water bottle, jewellery box, shipping box, sticker sheet, channel banner,
  signboard, collar tag, letterhead, shopping bag). 32 mockups in total.
- **Added** sectors (`shared/sectors.ts`): `detectSector` reads the brief (specific words beat generic ones) and the
  industry; `assembleKit` stores `kit.sector`; the brand book and Brand in a Box show that sector's objects first,
  9 at a time with "show all" (D23). `BrandKitSchema.sector` is optional; older kits infer it.
- **Added** the brand toolkit (`shared/elements.ts`): supergraphic, pattern, icon set, seal, type wall, quiet/loud colour
  modes, photo frames, dividers and data device, all from the brand's one graphic device (D26), shown in the brand
  book and downloadable as SVG. Research behind it: `docs/DESIGN_RESEARCH.md` (studio pages could not be fetched from
  this environment; sources are search results, and the report says so).
- **Added** a Downloads tab (`ExportCentre.tsx`) replacing the export menu: whole kit as a ZIP (`shared/zip.ts`),
  brand book as HTML (`shared/brandbook.ts`), PDF, Markdown, JSON, logo files incl. one-colour, favicons, design
  tokens (`shared/tokens.ts`: CSS, Tailwind, W3C JSON), social kit PNGs at platform sizes, email signature (D24).
- **Added** the website builder (`WebsiteBuilder.tsx`, `shared/website.ts`): a live first-draft website from the kit
  (desktop/mobile preview, one-file HTML download) and "we build it for you" packages with a brief, sent through the
  experts intake as `service: 'website'` (D25).
- **Changed** the "Website design & build" expert service to start from ₹9,999 / $199 (Launch page) and list the three
  packages, in step with `WEBSITE_PACKAGES`.
- **Changed** `mockupSVG` to share a `sceneContext`; SVG ids are now unique per brand and scene, so several mockups
  can sit on one page.
- **Changed** `scripts/check-docs.mjs` to also check `SCENE_KINDS`, `SECTORS` and `ELEMENT_KINDS` against `TECH_BRIEF.md`.
- **Added** `apps/web/AGENTS.md`, written by `next dev` (Next.js 16's agent note). Committed on purpose so the tree stays clean.

## Round 5b — Marketing brief · 2026-10-07 · `291182b`

- **Added** `docs/MARKETING_BRIEF.md`: a paste-ready brief for generating marketing material (features, plans,
  experts, GoBrandToday's own brand, demo story) with claims guardrails, so campaigns never promise what isn't built.
- **Fixed** the landing FAQ, which still said results show “Unverified”. It now matches the UI labels (“Likely free”, “Not checked”).

## Round 5 — Agent-ready docs · 2026-10-07

- **Added** `AGENTS.md` (single entry point for AI coding agents), `CLAUDE.md` and `GEMINI.md` pointers, and
  repository-root pointers (the git root also contains the unrelated `reels/` project).
- **Added** `docs/SCOPE.md`, `docs/TECH_BRIEF.md`, `docs/WORKFLOWS.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`, `docs/README.md`.
- **Added** `scripts/check-docs.mjs` (`npm run docs:check`), now run first by `npm test`. It fails when routes,
  env vars, tables, pages, modules, logo styles, symbol families or root scripts are undocumented (D22).
- **Fixed** the brand-kit limit message. Guests were told to "create a free account to build more brands", but
  the free plan has the same one-kit limit, and Pro users were told to "Go Pro". It now names the plan that
  actually raises the limit (`routes/brands.ts`). Covered by the integration test.
- **Changed** the API integration test to print a loud "SKIPPED" warning when Postgres is unreachable, instead of passing silently.
- **Docs drift fixed**: `HOST` and `COOKIE_DOMAIN` added to `.env.example`; `POST /api/brand/validate-brief` added to
  `docs/API.md`; `docs/ARCHITECTURE.md` updated for Round 4 (ten constructions, symbols, image providers, registrar
  confirmation, new tables); the stale "eight families" comment in `shared/logo.ts` corrected.

## Round 4 — Honest availability, generative logos, studio brand book · 2026-10-07 · `30cf258`

- **Domains**: registry-only answers become **Likely free**; a registrar (Name.com, Porkbun, GoDaddy, Namecheap,
  Hostinger) confirms "available" and supplies the real price (`DOMAIN_CONFIRM_PROVIDER`). A registry 404 with live
  nameservers counts as taken. Demo data never counts as free or affects the score (D4). Price estimates labelled "est." (D18).
- **Core 5 tag** (.com, Instagram, X, YouTube, LinkedIn) and one `AvailabilityPanel` used everywhere.
- **Logos**: 13 generative symbol families, new `emblem` and `lettermark` constructions (10 total), AI-drawn SVG symbols
  behind `sanitizeSymbolSvg` (D9), at least two symbol looks per set.
- **Images**: `ImageProvider` (Pollinations by default, keyless; Hugging Face, Cloudflare, Together, OpenAI) for
  moodboards and concept sketches; `brand_assets.data`/`content_type`; `GET /api/assets/:id`; `POST /api/brands/:id/imagery`.
- **Guidelines**: motion section removed (D17). Now: essence, logo system, clear space, minimum size, backgrounds, misuse,
  colour (HEX/RGB/CMYK, proportions, WCAG pairings), type scale, pattern, imagery, voice and UI, nine mockups (`shared/mockups.ts`).
- **Names**: meaning, tagline, three reasons and a watch-out per name (AI and offline).
- **Free tools**: social username checker, domain checker with prices, brand bible generator, `/tools` index.
- **Experts**: eight bespoke services (`shared/experts.ts`), `ExpertsBox`, `/experts`, `expert_requests` table,
  `POST /api/experts/requests`, optional `EXPERTS_WEBHOOK_URL`.
- **Preview**: Claude via the artifact `sample` capability for names, kits, symbols and the assistant; `downloads` for exports.
- Migration `0001_experts_and_assets.sql`.

## Round 3 — Four looks, better name cards, hero filters, server-free preview · 2026-10-07 · `56ea426`

- Four genuinely different looks offered before the guidelines are built (D10); "more looks"; switch looks later.
- Eight logo constructions with their own palettes and fonts; canvas-measured SVG rendering.
- Name cards: single-line names, clamped rationale, shortlist and compare.
- Quick filters on the landing composer (industry, style, must-have TLDs, max length, starts-with).
- `apps/web/preview`: the real UI bundled as one HTML file with an in-browser API (D19).

## Round 2 — Preview request · 2026-10-07

No code changes: screenshots and a preview were shared. The server-free preview build landed in Round 3.

## Round 1 — Initial product · 2026-10-07 · `487cfb3`, `fad1af8`

- Monorepo (D1), Fastify API (D2), Next.js web, Postgres via Drizzle, provider abstraction (D3).
- Naming (10 modes, offline generator), GoBrand Score (D21), RDAP + registrar domain checks, social checks (D5),
  Brand in a Box, AI assistant with versioned edits (D12), exports, sharing, guest-first auth (D6, D7), INR/USD plans (D14), Docker.
- `fad1af8`: diacritic-stripping regex stored as ASCII escapes, so the bundle works without UTF-8.
