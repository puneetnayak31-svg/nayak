# Tech brief

How GoBrandToday is built: stack, architecture, every module and what it owns, the data model and the
invariants. Paths are relative to `gobrandtoday/`. Deeper dives: [`ARCHITECTURE.md`](ARCHITECTURE.md)
(flows, caching, extension points), [`API.md`](API.md), [`PROVIDERS.md`](PROVIDERS.md).

## 1. Stack

| Layer | Technology (version from `package.json`) |
|---|---|
| Language | TypeScript ~5.9, strict, `noUncheckedIndexedAccess` (`tsconfig.base.json`). ESM throughout. Node ≥ 20.11 (22 recommended). |
| Monorepo | npm workspaces: `packages/*`, `apps/*`. No Turborepo/Nx. |
| Web | Next.js ^16.4 (App Router), React ^19.3. Hand-written CSS with design tokens in `apps/web/app/globals.css`; no CSS framework. Fonts via `next/font`: Space Grotesk, Manrope, Space Mono. |
| API | Fastify ^5.12 with `@fastify/helmet`, `cors`, `rate-limit`, `cookie`, `swagger`, `swagger-ui`. Pino logging. |
| Data | PostgreSQL 16, Drizzle ORM ^0.45, drizzle-kit ^0.31 (SQL migrations in `apps/api/drizzle/`). |
| Validation | Zod ^4.6 (shared schemas, route input, AI output). |
| AI | `@anthropic-ai/sdk` ^0.131 (default model `claude-opus-5-5`), `openai` ^7.30, plus an offline rule-based engine. |
| Build | `tsup` (API bundle), `next build` (web), esbuild (single-file preview). |
| Tests | Vitest ^5 in `packages/shared` and `apps/api`. |
| Deploy | Dockerfiles in `apps/api` and `apps/web`, `docker-compose.yml` (Postgres + API + web). |

## 2. Architecture

```
Browser ──► apps/web (Next.js) ──/api/* rewrite──► apps/api (Fastify) ──► PostgreSQL (Drizzle)
                │                                       │
                └── imports @gbt/shared ◄───────────────┤ (same TS source on both sides)
                                                        ├─► AI        Anthropic | OpenAI | offline
                                                        ├─► Domains   RDAP (+DNS) | GoDaddy | Hostinger | Namecheap | Name.com | Porkbun | mock
                                                        ├─► Social    GitHub API | Reddit endpoint | YouTube API/probe | manual | mock
                                                        ├─► Images    Pollinations | Hugging Face | Cloudflare | Together | OpenAI | none
                                                        ├─► Analytics db | PostHog | log | none
                                                        └─► Billing   stub (Razorpay/Stripe prepared)
```

- **The web app never calls a third party.** `apps/web/next.config.ts` rewrites `/api/*` to `API_ORIGIN`, so
  cookies are first-party and keys stay server-side.
- **API layering is strict:** `routes/*` (HTTP + Zod parse) → `services/*` (business logic, the only code that
  touches Drizzle) → `providers/*` (the only code that talks to the outside world).
- **Providers are chosen at boot by env vars** and every kind has a no-key fallback, so the whole product
  runs offline. See [`PROVIDERS.md`](PROVIDERS.md).
- **`services/kit.ts` is pure** (no DB, no network) and is reused by the preview build.

## 3. Module index

### `packages/shared/src` (consumed as TypeScript source by API, web and preview)

| File | Owns |
|---|---|
| `packages/shared/src/index.ts` | Re-exports every module below. |
| `packages/shared/src/types.ts` | Zod schemas and types: `BriefSchema`, `GenerateNamesRequestSchema`, `NameCandidate`, `DomainResult`, `SocialResult`, `GoBrandScore`, `LookSchema`, `SymbolSpecSchema`, `BrandKitSchema`, `CreateBrandRequestSchema`, `AssistantRequestSchema`, `SystemInfo`; enums `LOGO_STYLES`, `MARK_SHAPES`, `PALETTE_ROLES`, `WORDMARK_CASES`, `NAME_TYPES`. |
| `packages/shared/src/options.ts` | Catalogues: `INDUSTRIES`, `GEOGRAPHIES`, `PERSONALITIES`, `NAME_STYLES`, `TLDS`, `NAME_MODES`, `REFINEMENTS`, `SOCIAL_PLATFORMS` (+ `profileUrl`). |
| `packages/shared/src/text.ts` | `toSlug`, syllables, `pronunciationGuide`, `extractKeywords`, `hash32`, seeded `rng`, `levenshtein`. |
| `packages/shared/src/lexicon.ts` | Word lists: common/evocative words, generic affixes, famous brands, risky words (9 languages), concepts, Indian roots. |
| `packages/shared/src/scoring.ts` | GoBrand Score engine (`scoreName`, component scorers, `detectRisks`, `SCORE_WEIGHTS`). Demo results are ignored. |
| `packages/shared/src/handles.ts` | Per-platform handle rules, `normaliseHandle`, `validateHandle`, `handleAlternatives`. |
| `packages/shared/src/pricing.ts` | `PLANS` (Spark/Pro/Studio, prices in INR and USD, limits), `formatPrice`, `regionForCurrency`, `Currency`. |
| `packages/shared/src/registrars.ts` | Registrar deep links (Hostinger, GoDaddy, Namecheap; IN/US storefronts; affiliate params): `buyLinks`. |
| `packages/shared/src/domain-pricing.ts` | `TLD_PRICES` estimates, `estimatePrice`, `displayPrice`, `formatMoney`; Core 5 logic: `coreAvailability`, `domainState`, `socialState`. |
| `packages/shared/src/brand-system.ts` | GoBrandToday's own tokens (`GBT_TOKENS`), `MARK_PATHS`, `generatePalette` (WCAG-checked), `contrast`, `onColor`, `swatch`, `FONT_TRIOS`, `googleFontsHref`. |
| `packages/shared/src/logo.ts` | Logo constructions: `LOGO_STYLE_META`, `generateLooks`, `buildLook`, `lookToIdentity`, `logoSVG`, `iconSVG`, `Measurer`, `approxMeasure`. |
| `packages/shared/src/symbols.ts` | Generative symbol families (`SYMBOL_FAMILIES`, `SYMBOL_META`, `familySymbol`, `drawSymbol`, `pickFamily`) and the AI-SVG sanitiser `sanitizeSymbolSvg`. |
| `packages/shared/src/mockups.ts` | Application mockups as SVG: nine generic scenes (`BASE_MOCKUP_KINDS`) plus the industry scenes, `MOCKUP_KINDS`, `MOCKUP_META`, `mockupSVG`, `sceneContext` (colours, logo versions, graphic device and text helpers shared by scenes, toolkit and social kit), `hexToCmyk`. |
| `packages/shared/src/scenes.ts` | Industry scenes (`SCENE_KINDS`, `SCENE_META`, `SCENES`): letterhead, coffee bag, neck label, hang tag, shopping bag, mithai box, candle, serum bottle, cans, bottles, menu, takeaway bag, product screen, payment card, ID badge, notebooks, water bottle, jewellery box, shipping box, stickers, channel banner, signboard, collar tag. |
| `packages/shared/src/sectors.ts` | Business sectors (`SECTORS`, `SECTOR_META`): `detectSector` (brief words first, `~` marks weak words, then industry), `sectorForKit` (stored or inferred for older kits), `mockupsForSector`, `PRIMARY_MOCKUPS`. |
| `packages/shared/src/elements.ts` | Brand toolkit (`ELEMENT_KINDS`, `ELEMENT_META`, `elementSVG`): supergraphic, pattern, icon set, seal, type wall, quiet/loud colour modes, photo frames, dividers, data device. Social kit (`SOCIAL_ASSETS`, `socialSVG`) and the website hero (`heroArtSVG`). |
| `packages/shared/src/brandbook.ts` | `brandBookHTML`: the brand book as one self-contained HTML file (prints to PDF). |
| `packages/shared/src/website.ts` | `websiteHTML` (first-draft one-page site), `WEBSITE_PACKAGES`, `WEBSITE_SECTIONS`, `WEBSITE_FEATURES`, `websiteBriefText` for the "we build it for you" request. |
| `packages/shared/src/tokens.ts` | Design tokens: `cssTokens`, `tailwindTokens`, `jsonTokens` (W3C DTCG), `kitTokens`. |
| `packages/shared/src/zip.ts` | Dependency-free stored ZIP writer (`makeZip`, `crc32`) for the whole-kit download. |
| `packages/shared/src/experts.ts` | Bespoke services catalogue (`EXPERT_SERVICES`, `rankExperts`), `ExpertRequestSchema`, budgets and timelines. |

### `apps/api/src` (Fastify)

| File | Owns |
|---|---|
| `apps/api/src/index.ts` | Process entry: builds the server and listens. |
| `apps/api/src/server.ts` | Fastify setup: plugins, error handler (Zod → 400, `AppError` → its status), Swagger at `/api/docs`, route registration. |
| `apps/api/src/config/env.ts` | Every env var, validated once at boot with Zod. Refuses the default `SESSION_SECRET` in production. |
| `apps/api/src/db/schema.ts` | Drizzle table definitions (section 4). |
| `apps/api/src/db/client.ts` | `pg` pool + Drizzle `db`. |
| `apps/api/src/db/migrate.ts` | Applies `apps/api/drizzle/*.sql`. |
| `apps/api/src/db/seed-demo.ts` | `npm run db:seed-demo`: creates or refreshes the demo Pro account (`DEMO_PRO_EMAIL`, `DEMO_PRO_PASSWORD`; local fallback password, refused in production without the env var). |
| `apps/api/src/lib/cache.ts` | TTL + LRU cache with in-flight de-duplication (`cached`). |
| `apps/api/src/lib/http.ts` | `httpFetch` (timeout, bounded retries), `mapLimit` (concurrency cap). |
| `apps/api/src/lib/errors.ts` | `AppError`, `badRequest`, `notFound`, `unauthorized`, `forbidden`, `limitReached`. |
| `apps/api/src/lib/validate.ts` | `parse(schema, input)`: Zod parse that throws a typed 400. |
| `apps/api/src/lib/logger.ts` | Pino logger. |
| `apps/api/src/plugins/auth.ts` | Session cookie → `req.user`, `ensureUser` (lazy guest), `requireAccount`, `requireAdmin`, CSRF header check, `regionOf`. |
| `apps/api/src/providers/ai/types.ts` | `AIProvider` interface; AI I/O schemas: `RawNameSchema`, `DraftLookSchema`, `IdentityDraftSchema`, `KitDraftSchema`, `AssistantOutputSchema`. |
| `apps/api/src/providers/ai/prompts.ts` | All system prompts and prompt builders (`NAMING_SYSTEM`, `KIT_SYSTEM`, `ASSISTANT_SYSTEM`, `namesPrompt`, `kitPrompt`, `assistantPrompt`, `summariseKit`). |
| `apps/api/src/providers/ai/llm.ts` | `LLMProvider` base (`completeJSON`), `toStrictJsonSchema`, `parseModelJSON`. |
| `apps/api/src/providers/ai/anthropic.ts` | Claude adapter (streaming, structured output, refusal/max_tokens handling, server-side fallbacks). |
| `apps/api/src/providers/ai/openai.ts` | OpenAI adapter (strict JSON schema). |
| `apps/api/src/providers/ai/index.ts` | `createAIProvider()` from `AI_PROVIDER`; exports `ai` and `offlineAI`. |
| `apps/api/src/providers/ai/offline/index.ts` | `OfflineProvider` (no network, labelled offline). |
| `apps/api/src/providers/ai/offline/names.ts` | Rule-based name generator (suffixed, blends, compounds, real words, invented, Indian roots, descriptive) + meaning/tagline/reasons/watch-out. |
| `apps/api/src/providers/ai/offline/kit.ts` | Template Brand Bible writer, looks via `generateLooks`, essence and moodboard prompts. |
| `apps/api/src/providers/ai/offline/copy.ts` | Offline copywriting: `understandBrief` (category, offer, place, audience, sector, so no field pastes the brief), `SECTOR_VOICE` (promise, CTA, hashtags, problem, beliefs, YouTube line, content ideas per sector), `nameHook` (wordplay from a word or Hindi/Sanskrit root in the name), `launchCopy` (platform-native bios, posts, thread, announcement). |
| `apps/api/src/providers/ai/offline/assistant.ts` | Intent-matching assistant (taglines, palette, logo style, mark, positioning, Gen Z, carousel…). |
| `apps/api/src/providers/domain/types.ts` | `DomainProvider` interface, `DomainCheck`, `unknown()` helper. |
| `apps/api/src/providers/domain/rdap.ts` | RDAP via IANA bootstrap (+ built-in servers), DNS nameserver cross-check. |
| `apps/api/src/providers/domain/godaddy.ts` | GoDaddy v1 bulk availability. |
| `apps/api/src/providers/domain/hostinger.ts` | Hostinger availability API. |
| `apps/api/src/providers/domain/namecheap.ts` | Namecheap XML API (`parseNamecheapResult`). |
| `apps/api/src/providers/domain/namecom.ts` | Name.com v4 `domains:checkAvailability`. |
| `apps/api/src/providers/domain/porkbun.ts` | Porkbun v3 `checkDomain`. |
| `apps/api/src/providers/domain/mock.ts` | Demo data (`source: 'demo'`, never verified). |
| `apps/api/src/providers/domain/index.ts` | `createDomainProvider()` → `{ primary, fallback, confirm }`. |
| `apps/api/src/providers/social/types.ts` | `SocialChecker` interface, `HandleCheck`. |
| `apps/api/src/providers/social/checkers.ts` | GitHub, Reddit, YouTube (API or HEAD probe), manual checkers. |
| `apps/api/src/providers/social/mock.ts` | Demo checker. |
| `apps/api/src/providers/social/index.ts` | Registry of per-platform checkers by `SOCIAL_PROVIDER`. |
| `apps/api/src/providers/image/index.ts` | `ImageProvider` + Pollinations, Hugging Face, Cloudflare, Together, OpenAI, none; `images` singleton. |
| `apps/api/src/providers/analytics/index.ts` | `ANALYTICS_EVENTS` allow-list, fire-and-forget `analytics.track`. |
| `apps/api/src/providers/billing/index.ts` | `BillingProvider` stub (not enabled). |
| `apps/api/src/services/auth.service.ts` | Sessions (SHA-256 token ids), scrypt passwords, guests, signup upgrade-in-place, Google OAuth. |
| `apps/api/src/services/usage.service.ts` | Atomic daily usage counters, `consume`, `usageToday`. |
| `apps/api/src/services/naming.service.ts` | Naming rounds and Domain-First; constraint enforcement; persistence to projects/brand_names. |
| `apps/api/src/services/domain.service.ts` | `checkDomains` (cache, fallback, registrar confirmation, buy links, audit log), `forgetDomains`. |
| `apps/api/src/services/social.service.ts` | `checkHandle`, verified alternatives, audit log. |
| `apps/api/src/services/kit.ts` | Pure kit logic: `completeLooks`, `draftOverrides`, `identityFromLook`, `assembleKit`, `applyLook`, `withFreshLooks`, `kitToDraft`, `applyAssistantChanges`, `mergeKit`, `toMarkdown`. |
| `apps/api/src/services/brand.service.ts` | Brand lifecycle: `createBrand` + background `runGeneration`, `saveVersion`, `regenerateSection`, `updateKit`, `undo`, `chooseLook`, `moreLooks`, `askAssistant`, `setSharing`, `publicBrand`, `generateImagery`, `getAsset`. |
| `apps/api/src/routes/system.ts` | `/health`, `/api/system`, `/api/pricing`, `/api/admin/status`. |
| `apps/api/src/routes/auth.ts` | Signup, login, logout, me, Google OAuth, `PATCH /api/me`. |
| `apps/api/src/routes/names.ts` | Generate/refine names, Domain-First, score, validate brief. |
| `apps/api/src/routes/domains.ts` | Domain check (single/bulk), watchlist. |
| `apps/api/src/routes/social.ts` | Handle check (single/bulk). |
| `apps/api/src/routes/brands.ts` | Brands CRUD, looks, sections, assistant, imagery, assets, export, undo, sharing, public brand. |
| `apps/api/src/routes/projects.ts` | Projects and saved names. |
| `apps/api/src/routes/experts.ts` | Experts catalogue and request intake (optional webhook). |
| `apps/api/src/routes/events.ts` | Client analytics events (allow-listed). |

### `apps/web` (Next.js)

| File | Owns |
|---|---|
| `apps/web/lib/api.ts` | The only fetch wrapper: same-origin `/api`, CSRF and currency headers, `ApiError`, `track`. |
| `apps/web/lib/providers.tsx` | `Providers` context: currency (INR default), current user, usage, system info, toasts. |
| `apps/web/lib/export.ts` | Every download, generated in the browser with real font metrics: logo/icon SVG and PNG (embedded font subsets), `brandBookFile`/`downloadBrandBookHTML`, `websiteFile`/`downloadWebsiteHTML`, tokens, social kit PNGs, mockup and toolkit SVGs, `emailSignatureHTML`, `downloadKitZip`; `kitMockupInput`, `kitMockupKinds`; `download` (supports a host-provided saver). |
| `apps/web/lib/seo-pages.ts` | `/tools/*` landing pages (generators and widget tools). |
| `apps/web/components/ui.tsx` | Shared UI: `Shell`, `SourceBadge`, `DemoBanner`, `ScorePill`, `ScoreCard`, `ScoreBreakdown`, `Risks`, `Loading`, `CopyButton`, `useGoogleFonts`, `Empty`. |
| `apps/web/components/Nav.tsx` | Top navigation. |
| `apps/web/components/AccountMenu.tsx` | Nav account control: guests see Sign in + free rounds left; accounts see an avatar chip (Pro/Studio: gradient ring + crown) with rounds left, and a menu with plan, brand boxes left and every usage meter; `UsageMeters`, `USAGE_LABELS` (also used on the dashboard). |
| `apps/web/components/SignupGate.tsx` | `useSignupGate` (`guard(fn)`) and `SignupPrompt`: downloads need a free account; guests get the sign-up prompt. |
| `apps/web/components/Footer.tsx` | Footer with product and tools links. |
| `apps/web/components/Spark.tsx` | GoBrandToday mark, wordmark and the loader animation. |
| `apps/web/components/CurrencyToggle.tsx` | ₹ / $ switch. |
| `apps/web/components/HeroComposer.tsx` | Landing composer: idea or name, quick filters. |
| `apps/web/components/HeroChecks.tsx` | Landing hero block: a name whose ending rolls through .com/.in/.ai/.io/.co, and the 10 platform icons (illustrative, claims nothing). |
| `apps/web/components/PlatformIcons.tsx` | Simplified icons for the 10 social platforms (`PLATFORM_ICON`, `PlatformIcon`), used in the hero and the availability panel. |
| `apps/web/components/DemoPlayer.tsx` | Scripted, labelled example of the journey on the landing page. |
| `apps/web/components/PricingCards.tsx` | Plan cards from `PLANS`. |
| `apps/web/components/Studio.tsx` | Naming studio: brief, rounds, refinement, name cards, detail modal, shortlist, compare. |
| `apps/web/components/NameCheck.tsx` | "I have a name" page body. |
| `apps/web/components/Availability.tsx` | One availability vocabulary: `CoreTag`, `DomainList`, `DomainChips`, `DomainPrice`, `HandleList`, `HandleIdeas`, `AvailabilityPanel`. |
| `apps/web/components/BrandView.tsx` | Brand page: polling while generating, look picker gate, tabs (Brand in a Box, Identity, Strategy, Launch kit, Website, Downloads, Assistant), assistant panel, imagery trigger. |
| `apps/web/components/LookPicker.tsx` | Four looks side by side; choose or ask for more. |
| `apps/web/components/Logo.tsx` | React wrappers for the SVG renderer: `Logo`, `LogoIcon`, `KitLogo`, `KitIcon`, `canvasMeasure`, `kitIdentity`. |
| `apps/web/components/BrandGuidelines.tsx` | The brand book (screen and print), including the brand toolkit and industry-first applications. |
| `apps/web/components/Mockups.tsx` | `Mockup`, `MockupGrid` (industry objects first, "show all"), `ToolkitElement`, `ToolkitGrid`, per-item SVG downloads. |
| `apps/web/components/ExportCentre.tsx` | Downloads tab: whole kit ZIP; brand book PDF/HTML/Markdown/JSON; logo files; website draft; tokens; social kit; email signature. |
| `apps/web/components/WebsiteBuilder.tsx` | Website tab: live first-draft site (desktop/mobile preview, download, open) and "we build it for you" packages + brief (sent as an experts request, service `website`). |
| `apps/web/components/Dashboard.tsx` | Dashboard sections: home, brands, saved, domains/watchlist, handles, assistant, settings. |
| `apps/web/components/AuthForm.tsx` | Login/signup form. |
| `apps/web/components/Experts.tsx` | `ExpertsBox`, `ExpertRequestForm`, request modal. |
| `apps/web/components/ExpertsPage.tsx` | `/experts` page body. |
| `apps/web/components/ToolContent.tsx` | `/tools/[slug]` page body. |
| `apps/web/components/ToolWidgets.tsx` | Username checker, domain checker, brand bible generator widgets. |
| `apps/web/components/ToolsIndex.tsx` | `/tools` index. |
| `apps/web/preview/build.mjs` | esbuild bundle of the real pages into `preview/dist/` (shims for `next/link`, `next/navigation`). |
| `apps/web/preview/main.tsx` | Preview entry: route switch, link interception, preview bar, downloads saver. |
| `apps/web/preview/router.tsx` | In-memory router (`ROUTES`). |
| `apps/web/preview/shims/next-link.tsx` | `next/link` replacement for the preview bundle (in-memory navigation). |
| `apps/web/preview/shims/next-navigation.ts` | `next/navigation` replacement (`useRouter`, `usePathname`, `useSearchParams`, `useParams`, `notFound`, `redirect`). |
| `apps/web/preview/local-api.ts` | In-browser stand-in for the API (same routes and shapes, localStorage). Never claims availability. |
| `apps/web/preview/claude.ts` | Claude via the artifact `sample` capability, reusing server prompts and schemas, with offline fallback. |

### Web pages (`apps/web/app/**/page.tsx`)

| Route | Purpose |
|---|---|
| `/` | Landing: composer, how it works, demo, pricing, experts, FAQ. |
| `/create` | Naming studio. |
| `/name/[name]` | Instant check for a name the user already has. |
| `/brand/[id]` | Brand in a Box and tabs (Identity, Strategy, Launch kit, Website, Downloads, Assistant). |
| `/brand/[id]/guidelines` | Print-optimised guidelines (PDF via the browser). |
| `/b/[slug]` | Public read-only brand. |
| `/pricing` | Plans and experts. |
| `/experts` | Bespoke services and request form. |
| `/tools` | Free tools index. |
| `/tools/[slug]` | SEO tool and generator pages. |
| `/login`, `/signup` | Auth. |
| `/dashboard`, `/dashboard/brands`, `/dashboard/saved`, `/dashboard/domains`, `/dashboard/handles`, `/dashboard/assistant`, `/dashboard/settings` | Signed-in (or guest) workspace. |

Also generated: `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `not-found.tsx`.

## 4. Data model (PostgreSQL via Drizzle, `apps/api/src/db/schema.ts`)

| Table | Holds |
|---|---|
| `users` | Guests and accounts (email, password hash, Google id, `is_guest`, plan, currency). |
| `sessions` | Session token hashes for the `gbt_sid` cookie. |
| `subscriptions` | Billing state (unused until billing is enabled). |
| `usage` | User × kind × day counters for quotas. |
| `projects` | A naming brief and its rounds. |
| `brand_names` | Every generated candidate with its score. |
| `saved_names` | Shortlist/favourites. |
| `domain_checks` | Audit log of domain lookups. |
| `social_handle_checks` | Audit log of handle lookups. |
| `domain_watch` | Watchlist. |
| `brands` | Brand record: name, domain, handle, brief, current `kit` (JSONB), domains/socials, score, status, version, sharing. |
| `brand_guidelines` | Every kit version (undo history). |
| `brand_scores` | Score snapshots. |
| `brand_assets` | Generated images (base64 `data` + `content_type`, or a URL). |
| `ai_messages` | Assistant conversation per brand. |
| `analytics_events` | Product events when `ANALYTICS_PROVIDER=db`. |
| `expert_requests` | Experts intake (service, contact, budget, timeline, details, status). |

Migrations: `apps/api/drizzle/0000_init.sql`, `0001_experts_and_assets.sql` (+ `meta/`). Never edit an
applied migration; generate a new one.

## 5. Core domain objects

- **`Brief`**: `description`, `industry?`, `audience?`, `geography?`, `personalities[]`, `styles[]`, `tlds[]`, `mode`, `constraints?` (`maxLength`, `startsWith`, `avoidLetters`, `mustInclude`).
- **`NameCandidate`**: name, rationale, `nameType`, pronunciation, personality, origin, relevance, `tagline?`, `meaning?`, `whyItWorks?`, `watchOut?`, `source`, `score`, optional `domains`/`socials`.
- **`DomainResult`**: `status` (`available | taken | premium | unknown | invalid`), `source` (`rdap | godaddy | hostinger | namecheap | porkbun | namecom | dns | demo`), `verified`, `confirmed?`, `price?`, `buyLinks`.
- **`SocialResult`**: `status` (`available | taken | unknown | invalid | manual`), `method` (`official_api | public_endpoint | profile_probe | manual | demo`), `verified`, `url`.
- **`GoBrandScore`**: `overall100`, `overall` (/10), `provisional`, 8 `components`, `seo`, `risks`.
  Weights (`SCORE_WEIGHTS`): brandability 18, memorability 15, pronunciation 13, distinctiveness 12, global 9, SEO 11, domain 13, social 9.
- **`BrandKit`** (`BrandKitSchema`): `sector?` (see section 6), strategy fields, voice, taglines, messaging, `identity`, `launch`, `website`.
  `identity` carries the chosen look (`style`, `seed`, `symbol?`, `case?`, palette, typography, mark) plus `looks[]`, `lookChosen`, `designSystem`, `usageRules`, and optional `essence`, `moodboard`, `concepts`. `motion` is legacy (optional, no longer generated or shown).
- **`Look`**: `style` (one of `LOGO_STYLES`), `hue`, `fontTrio`, `markShape`, `seed`, `palette`, `symbol?` (`family` | sanitised `svg` | `imageUrl`), `case?`, `origin` (`ai` | `generative`).

## 6. Logo system

- **Constructions (`LOGO_STYLES`)**: `twinkle` (spark full stop), `monogram` (signet badge), `editorial`
  (serif + rule), `stacked` (sticker stack), `symbol` (symbol + wordmark), `emblem` (symbol over spaced
  caps), `lettermark` (initial cut from a shape), `playful` (bouncy letters), `terminal` (command line),
  `heritage` (Devanagari-style headline bar).
- **Symbol families (`SYMBOL_FAMILIES`)**: `tiles`, `orbit`, `petals`, `stripes`, `blob`, `pixels`,
  `chevrons`, `crescent`, `burst`, `interlock`, `sprout`, `layers`, `arcs`. Each is seeded by the brand name,
  so output is deterministic per brand and seed.
- **AI symbols**: the kit prompt asks for `symbolSvg` on at least two looks; `draftOverrides()`
  (`services/kit.ts`) runs `sanitizeSymbolSvg()` and stores it with palette-role colours.
- **Rendering**: `logoSVG`/`iconSVG` return SVG strings; the browser passes `canvasMeasure` for exact text widths.
  Mockups nest the same SVGs.
- **Graphic device**: the symbol (or, without one, the mark) drawn in one colour by `sceneContext().device`. Scenes,
  the toolkit, the social kit and the website hero crop it big ("supergraphic") instead of repeating it small.
  Rules and sources: [`DESIGN_RESEARCH.md`](DESIGN_RESEARCH.md).
- **Industry scenes (`SCENE_KINDS`)**: `letterhead`, `coffeebag`, `necklabel`, `hangtag`, `shoppingbag`, `sweetbox`,
  `candle`, `dropper`, `can`, `bottle`, `menu`, `deliverybag`, `dashboard`, `paycard`, `badge`, `notebook`,
  `waterbottle`, `jewelbox`, `mailer`, `stickers`, `banner`, `signboard`, `pettag`.
- **Sectors (`SECTORS`)**: `coffee`, `fashion`, `sweets`, `bakery`, `candles`, `beauty`, `beverage`, `food`,
  `jewellery`, `pet`, `fitness`, `education`, `health`, `fintech`, `tech`, `creator`, `realestate`, `services`,
  `retail`, `general`. `assembleKit` stores `kit.sector`; the brand book shows that sector's objects first (9 of 32).
- **Toolkit (`ELEMENT_KINDS`)**: `poster`, `pattern`, `icons`, `seal`, `typewall`, `colourmodes`, `frames`, `dividers`, `progress`.

## 7. Configuration

All API configuration is environment variables validated in `apps/api/src/config/env.ts`. `.env.example`
documents every one of them. Web build-time variables: `API_ORIGIN` (rewrite target, baked at build),
`NEXT_PUBLIC_SITE_URL` (canonical URL), `NEXT_OUTPUT=standalone` (Docker), `NEXT_PUBLIC_PREVIEW=1` (set by the preview build).
Run modes: offline (no keys), demo (`DEMO_MODE=true`, labelled sample data), live (any mix of providers).

## 8. Testing

| Suite | Covers |
|---|---|
| `packages/shared/test/scoring.test.ts` | Provisional vs final scores, weights sum to 100, components, risk detection. |
| `packages/shared/test/brand-system.test.ts` | Palettes, contrast, fonts. |
| `packages/shared/test/logo.test.ts` | Look generation rules, every style renders in light/dark/mono + icon. |
| `packages/shared/test/symbols.test.ts` | Every symbol family, the SVG sanitiser (script/handler/href stripping), mockups, CMYK. |
| `packages/shared/test/domain-pricing.test.ts` | Price estimates, `displayPrice`, Core 5 verdicts (demo never counts). |
| `packages/shared/test/sectors.test.ts` | Sector detection (specific beats generic words, industry fallback), industry-first mockup order, every toolkit element and social asset renders, ZIP structure and CRC-32, website brief text. |
| `apps/api/test/domain.test.ts` | RDAP (404/200, DNS cross-check, failure → unknown), registrar adapters, mock. |
| `apps/api/test/social.test.ts` | Social checkers. |
| `apps/api/test/ai.test.ts` | Offline name generator (count, constraints, Indian roots), strict JSON-schema conversion, offline kit → full kit, four looks, assistant changes. |
| `apps/api/test/api.integration.test.ts` | Real HTTP flow on Postgres: CSRF, names, save, brand build, assistant, undo, export, imagery, brand limit, signup, experts. |
| `scripts/check-docs.mjs` | Docs drift (run by `npm test`). |
