# Workflows

Part A traces every user workflow through the code: screen → endpoint → service → tables, and what happens
when something fails. Part B gives step-by-step recipes for the changes developers (and AI agents) make most
often. Paths are relative to `gobrandtoday/`.

---

## Part A — User workflows

### A1. Generate names ("I have an idea")

1. **UI**: landing composer (`components/HeroComposer.tsx`) navigates to `/create?brief=…&mode=…&go=1` (filters
   become URL params `ind`, `st`, `tld`, `max`, `start`). `components/Studio.tsx` hydrates the brief and submits.
2. **API**: `POST /api/brand/generate-names` (`routes/names.ts`) → `ensureUser` (creates a guest + cookie on first
   use) → `consume(user, 'generation')` → `naming.service.generateNames`.
3. **Service**: AI provider (or offline if none / on failure, with a `notice`) → `toCandidate` → `passesConstraints`
   (max length, starts-with, avoid letters, must-include, high-risk words, exclusions, enforced even if the model
   ignored them) → de-duplicate → `scoreName` (provisional: no checks yet) → sort by score.
4. **DB**: `projects` (round n), `brand_names` (every candidate).
5. **UI**: name cards show name, pronunciation, tagline, type, meaning, provisional score. Nothing is checked yet:
   checks are lazy (A3) to save cost.

**Refine**: chips/feedback → `POST /api/brand/refine-names` with `projectId`, `refinements`, `feedback`,
`exclude` (all names shown so far) and `liked` (♥ names). Same pipeline; a new round is saved on the project.

### A2. Domain-First mode

`POST /api/brand/domain-first` → `generateDomainFirst`: up to 3 rounds × 24 candidates. Each round checks only the
primary TLD and keeps names that come back `available`, until 12 are kept. It then checks the remaining TLDs for the
survivors and re-scores them with real data. The response includes `checked` (how many names were tried).

### A3. Check availability for a name

- **Triggers**: "Check availability" on a card, opening Details, shortlisting into Compare, or the `/name/[name]` page.
- **API**: `POST /api/domain/check` `{ name, tlds }` and `POST /api/social/check` `{ handle, alternatives: true }`.
- **Domains** (`services/domain.service.ts`): `domainLabel` validation → per-domain `cached()`
  (taken 24 h, available 20 min, unknown never cached) → primary provider (RDAP by default) → fallback fills `unknown`s →
  `confirmAvailable` asks the configured registrar (if any) to confirm "available" results, attaching the real price.
  Registrar refusal → `taken` with a reason. Buy links attached unless taken. Every result is logged in `domain_checks`.
- **Handles** (`services/social.service.ts`): per-platform checker (official API / public endpoint / probe / manual) →
  alternatives (`handleAlternatives`) verified where possible → `social_handle_checks`.
- **UI** (`components/Availability.tsx`): one vocabulary everywhere. `Available` (registrar-confirmed or platform
  API), `Likely free` (registry only), `Taken`, `Not checked` (manual or unverifiable, with a one-tap link). Prices are live
  or `est.` (`displayPrice`). The Core 5 tag shows .com, Instagram, X, YouTube and LinkedIn.
- **Score**: the browser re-scores with `scoreName(..., domains, socials)`; demo results never count.

### A4. Build a brand

1. **UI**: "Build {name}" on a card, the name page, or the brand bible tool → `POST /api/brands`
   `{ name, brief, projectId?, domain?, handle? }`.
2. **API** (`routes/brands.ts`): brand-kit limit check against the plan (`PLANS[].limits.brandKits`) → `createBrand` →
   **returns `202` immediately** with `status: 'generating'`.
3. **Background** (`brand.service.runGeneration`): domains + handles checked in parallel → the AI (or offline) writes
   the kit draft (`strategy`, `taglines`, `identity`, `launch`, `website`) → `assembleKit` (four looks via
   `completeLooks`, `lookChosen: false`) → score → `saveVersion` (version 1, `brand_guidelines` row). Failure sets
   `status: 'failed'`, and the UI offers retry (`POST /api/brands/:id/retry`).
4. **UI**: `BrandView` polls `GET /api/brands/:id` every 1.8 s, then shows `LookPicker` until a look is chosen.

### A5. Choose a look / more looks

- `POST /api/brands/:id/look` `{ lookId }` → `applyLook` → `identityFromLook` rebuilds palette, typography, mark or
  symbol, logo directions and usage rules → new version.
- `POST /api/brands/:id/looks` → four new looks (AI if live, else `freshOfflineLooks`, avoiding styles and symbol
  families already shown) → `withFreshLooks` sets `lookChosen: false` so the picker shows again; the current identity
  stays until the user picks.

### A6. Edit the kit

- **Regenerate a section**: `POST /api/brands/:id/sections/:section` `{ instruction? }` (or the alias
  `POST /api/brand/generate-*` with `brandId`). The draft is merged via `kitToDraft`; for `identity` the result is new looks.
- **Manual edit**: `PATCH /api/brands/:id` `{ kit: Partial<BrandKit> }` → `mergeKit` (deep for nested objects).
- **Assistant**: `POST /api/brands/:id/assistant` `{ message }` → AI returns `{ reply, names, changes }` →
  `applyAssistantChanges` maps typed changes (taglines, positioning, hue, darker palette, logo style, mark, font trio,
  bios, posts, website copy…) to a kit patch → new version. History is in `ai_messages`.
- **Undo**: `POST /api/brands/:id/undo` restores the previous `brand_guidelines` version.

Every one of these consumes the `assistant` quota except manual edits, undo and choosing a look.

### A7. Imagery

`POST /api/brands/:id/imagery` `{ kind: 'moodboard' | 'concepts' }` → `generateImagery`: builds prompts from
`identity.moodboard` (or defaults) and the palette → `images.generate` per prompt. A URL result (Pollinations) is
stored as-is; a bytes result is stored in `brand_assets` and served by `GET /api/assets/:id` → kit updated
(`identity.moodboard[].imageUrl` / `identity.concepts`) → new version. Not available in the preview.

### A8. Export and share

All downloads live in the **Downloads** tab (`ExportCentre.tsx`; the header's "Download kit" button opens it). Everything
except Markdown/JSON is generated in the browser by `lib/export.ts`, so it uses real font metrics and works in the preview.

- **Whole kit (ZIP)**: `downloadKitZip` → logos (SVG + PNG ×3 variants), icon + favicons, `brandBookFile` (HTML),
  `websiteFile`, tokens, the first 9 industry mockups, the toolkit, social PNGs, email signature, Markdown/JSON
  (fetched from the API) and a README → `makeZip` (stored, no compression).
- **PDF**: `/brand/[id]/guidelines?print=1` opens the print-optimised `BrandGuidelines`; the browser prints to PDF
  (not in the preview; the HTML brand book prints to PDF too).
- **Brand book HTML**: `brandBookHTML` (`shared/brandbook.ts`) with logos, mockups and toolkit as inline SVG.
- **Logo/icon SVG/PNG**: `downloadLogoSVG/PNG`, `downloadIconSVG/PNG` with the Google Fonts subset embedded so files
  render anywhere. Social kit PNGs (`socialSVG` → `brandPng`) embed the fonts the same way.
- **Tokens**: `cssTokens`, `tailwindTokens`, `jsonTokens` (`shared/tokens.ts`).
- **Mockups and toolkit**: "SVG ↓" on each item (`downloadMockup`, `downloadElement`).
- **Markdown/JSON**: `GET /api/brands/:id/export?format=md|json` (`toMarkdown` in `services/kit.ts`).
- **Share**: `PATCH /api/brands/:id` `{ isPublic: true }` creates `shareSlug` → `/b/[slug]` reads
  `GET /api/public/brands/:slug`.

### A9. Accounts

Guests are created lazily (A1). `POST /api/auth/signup` upgrades the guest row in place (all work kept);
`POST /api/auth/login` signs in, and the current guest's work merges into the account. Google OAuth uses
`/api/auth/google` → `/callback`. `PATCH /api/me` sets name or currency.

### A10. Experts request

`ExpertsBox` (Brand in a Box, dashboard, landing, pricing, tools) or `/experts` → `ExpertRequestForm` →
`POST /api/experts/requests` (rate limit 5/hour; validated by `ExpertRequestSchema`; brand linked only if owned) →
`expert_requests` row → optional POST to `EXPERTS_WEBHOOK_URL`. Fulfilment (scope, quote, payment) happens off-platform.

### A10b. Website draft and "we build it for you"

Website tab → `WebsiteBuilder` renders `websiteFile(kit)` into a sandboxed `<iframe srcDoc>` (desktop/mobile toggle),
"Download HTML" saves the same file. Below it, the founder picks a `WEBSITE_PACKAGES` entry and fills a short brief →
`POST /api/experts/requests` with `service: 'website'`, `budget` = package label, `details` = `websiteBriefText(...)`
→ same intake as A10 (row in `expert_requests`, optional webhook). No payment is taken; fulfilment is manual.

### A10c. Industry objects in the brand book

`assembleKit` stores `kit.sector = detectSector(brief)`. The brand book and Brand in a Box call `kitMockupKinds(kit)`
(`sectorForKit` → `mockupsForSector`), so a mithai shop sees a mithai box first and a clothing label a neck label.
Kits made before sectors existed get a sector inferred from their own positioning and story.

### A11. Free tools

`/tools/[slug]` pages come from `lib/seo-pages.ts`. Pages with a `widget` render `ToolWidgets.tsx`:
username checker (A3 handles), domain checker with prices (A3 domains), and brand bible generator (A4 with a typed name).

---

## Part B — Developer workflows

### B1. First-time setup

```bash
cd gobrandtoday
cp .env.example .env            # works as-is locally
npm install
docker compose up -d db         # or a local Postgres matching DATABASE_URL
npm run db:migrate
npm run dev                     # API :4000 (docs at /api/docs), web :3000
```

### B2. Before every commit

```bash
npm run typecheck
npm test            # docs:check + shared + api (integration needs Postgres up)
npm run build       # if you touched the web app
```

Then update docs per the AGENTS.md section 6 table, and add a line under **Unreleased** in `docs/CHANGELOG.md`.

### B3. Add or change an API endpoint

1. Request/response schemas: shared ones in `packages/shared/src/types.ts`, route-local ones in the route file.
2. Logic in a service (`apps/api/src/services/*`); the route only parses, calls and serialises.
3. Register it in the right `routes/*.ts`. Add a Swagger `schema: { tags, summary }`. Use `ensureUser` for
   state-changing calls, `consume()` for quota'd work and `aiLimit` for AI-calling routes.
4. Mirror it in `apps/web/preview/local-api.ts` with the same path and shape (or a clear `ApiError` if it can't work offline).
5. Call it from the web app only through `lib/api.ts`.
6. Document it in `docs/API.md`. `npm run docs:check` fails until you do.
7. Test it: unit tests for logic; extend `apps/api/test/api.integration.test.ts` for HTTP behaviour.

### B4. Change the database

1. Edit `apps/api/src/db/schema.ts`.
2. `npm run db:generate -w @gbt/api` (or `npm run db:generate`) and review the generated SQL in `apps/api/drizzle/`.
3. `npm run db:migrate`. Commit the SQL and the `meta/` snapshot.
4. Update the table list in `docs/TECH_BRIEF.md` (checked by `docs:check`).

### B5. Change the Brand Kit shape

1. `BrandKitSchema` in `shared/types.ts`: new fields **optional** (old kits in `brands.kit` must still parse).
2. AI draft schema in `providers/ai/types.ts` (if the AI writes it), the prompt in `prompts.ts`, and the offline writer
   `offline/kit.ts`. Both must produce the same shape.
3. `services/kit.ts`: `identityFromLook` / `assembleKit` (carry it through), `kitToDraft` (round-trip),
   `toMarkdown` (export), `applyAssistantChanges` if the assistant can edit it.
4. Render it: `components/BrandGuidelines.tsx` and/or `BrandView.tsx`.
5. Tests: `apps/api/test/ai.test.ts` (offline kit validates and assembles).

### B6. Change AI behaviour

- Prompts are only in `providers/ai/prompts.ts`. Output schemas are in `providers/ai/types.ts` and must be "strict-friendly"
  (every property required; use `.nullable()` for optional values).
- Keep the offline generators in step, so the product never breaks without a key.
- The preview reuses the same prompts and schemas (`apps/web/preview/claude.ts`). Nothing to change there unless the
  route shape changes.
- Never change the default model ID in `anthropic.ts` unless asked.

### B7. Add a provider

| Kind | Implement | Register | Also |
|---|---|---|---|
| AI | Extend `LLMProvider` (`completeJSON`) | `providers/ai/index.ts` | env vars, `docs/PROVIDERS.md` |
| Domain registrar | `DomainProvider` (must return `unknown`, never guess `available`) | `providers/domain/index.ts` (`registrar()`, `CONFIRM_ORDER`) | storefront in `shared/registrars.ts` if it has buy links; tests in `apps/api/test/domain.test.ts` |
| Social platform | `SocialChecker` (official or documented endpoint only) | `providers/social/index.ts` | `SOCIAL_PLATFORMS` + `HANDLE_RULES` in shared |
| Images | `ImageProvider` | `createImageProvider()` in `providers/image/index.ts` | env vars, `docs/PROVIDERS.md` |

Every env var: `config/env.ts` + `.env.example` (checked by `docs:check`).

### B8. Add a logo construction or symbol family

- **Construction**: add the id to `LOGO_STYLES` (`shared/types.ts`), metadata to `LOGO_STYLE_META` and a concept to
  `CONCEPTS` (`shared/logo.ts`), and a `case` in both `logoSVG` and `iconSVG`. `packages/shared/test/logo.test.ts` renders
  every style automatically.
- **Symbol family**: add to `SYMBOL_FAMILIES` and `SYMBOL_META`, plus a draw function in `DRAW` (`shared/symbols.ts`), in a
  100×100 box using only `SymbolColors`. Tests iterate all families.
- List the new id in `docs/TECH_BRIEF.md` section 6 (checked by `docs:check`).

### B8b. Add an industry scene, sector or toolkit element

- **Scene**: add the id to `SCENE_KINDS`, a title/note to `SCENE_META` and a draw function to `SCENES`
  (`shared/scenes.ts`) using only the `SceneCtx` it receives (colours, `logoOn`, `device`, `place`, `fit`). Put the logo
  where the object's maker would; crop the device big with `superGraphic`. `symbols.test.ts` renders every kind.
- **Sector**: add to `SECTORS` and `SECTOR_META` (`shared/sectors.ts`) with specific words (generic ones prefixed `~`),
  industries and 3–5 mockups; add a case to `sectors.test.ts`.
- **Toolkit element**: add to `ELEMENT_KINDS`, `ELEMENT_META` and `BUILD` (`shared/elements.ts`).
- List the new id in `docs/TECH_BRIEF.md` section 6 (checked by `docs:check`). Render a contact sheet and look at it
  for two or three logo styles before committing (see the design rules in `DESIGN_RESEARCH.md`).

### B9. Add a page

1. `apps/web/app/<route>/page.tsx` (thin), with the body in a component.
2. If public: `app/sitemap.ts`, nav/footer links if relevant.
3. If it should work in the preview: add to `ROUTES` in `preview/router.tsx` and the switch in `preview/main.tsx`.
4. Add it to the page list in `docs/TECH_BRIEF.md` (checked by `docs:check`).
5. Check it at desktop width and ~390px; no horizontal scroll.

### B10. Rebuild the preview

```bash
npm run preview:build           # → apps/web/preview/dist/{index.html, app.js, app.css}
```

Serve `dist/` statically to test (`python3 -m http.server` inside it). The preview must keep working with no network:
it can't check availability and must say so.

### B11. Deploy

See [`DEPLOYMENT.md`](DEPLOYMENT.md). Production needs `SESSION_SECRET`, `APP_URL`, `DATABASE_URL`, and `API_ORIGIN`
**at web build time**. Migrations run with `npm run db:migrate` (the API image does it on start).

### B12. Keep the docs true (every change)

1. Code first, then docs in the **same** commit.
2. Follow the AGENTS.md section 6 table.
3. `npm run docs:check` catches missing routes, env vars, tables, pages, modules, logo styles, symbol families and
   root scripts. It cannot catch wrong prose, so read what you touched.
4. Add a line under **Unreleased** in `docs/CHANGELOG.md`: user-visible behaviour, new or removed modules, decisions.
5. If you reversed a decision, update `docs/DECISIONS.md` (mark it superseded) instead of deleting it.
