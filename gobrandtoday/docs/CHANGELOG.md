# Changelog

What changed, round by round, and why. Newest first. **Every change adds a line under Unreleased**:
user-visible behaviour, new or removed modules, endpoints, env vars, and decisions taken or reversed (link the
`DECISIONS.md` entry). When a batch is committed, move its lines into a new round with the date and commit.

## Unreleased

_Nothing yet._

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
