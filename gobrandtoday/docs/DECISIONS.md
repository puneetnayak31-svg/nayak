# Decisions

Deliberate choices, why they were made, and what would justify changing them. **Do not reverse one of these
as a side effect of another task.** If a change requires reversing one, say so explicitly, mark the old entry
`Superseded by Dnn`, and add a new entry. Rounds refer to [`CHANGELOG.md`](CHANGELOG.md).

| Status | Meaning |
|---|---|
| Active | In force. |
| Superseded | Replaced by a later decision (kept for history). |

---

**D1 — TypeScript monorepo with a shared source package** · Active · Round 1
`packages/shared` is consumed as `.ts` source by the API (tsx/tsup), Next.js (`transpilePackages`) and the
preview (esbuild). One source of truth for schemas, scoring and rendering; no publish or build step.
*Change only if* a consumer can no longer compile TS source.

**D2 — Separate Fastify API; the web app treats it as an external service** · Active · Round 1
No Next.js server actions or route handlers for product logic. The web app proxies `/api/*` to the API so
cookies stay first-party and keys stay server-side. This lets the API serve other clients and the preview mirror it.

**D3 — Every external capability behind a provider interface with a no-key fallback** · Active · Round 1
AI, domains, social, images, analytics and billing are chosen by env vars. The product must run with zero keys
(offline AI, RDAP, manual social links, Pollinations). Never call a third party from a service or route directly.

**D4 — Never fabricate availability** · Active · Round 1, tightened in Round 4
- Providers return `unknown` when unsure; `unknown` is never cached and never shown as available.
- RDAP "not registered" is shown as **Likely free**. Only a registrar confirmation (`confirmed: true`) or a platform API makes it **Available**.
- A registry 404 with live nameservers is **taken**.
- Demo/sample results (`source: 'demo'` / `method: 'demo'`) never count as free and never move the score.
- The preview can't check anything, so it shows "Not checked" with links and price estimates.

*Why*: users reported ".com available" in the app while the registrar said otherwise (Round 4).

**D5 — No scraping of social platforms** · Active · Round 1
Instagram, X, TikTok, LinkedIn, Facebook, Threads and Pinterest have no compliant public availability check,
so they get a one-tap "Check ↗" link. *Change only by* plugging a licensed aggregator into `SocialChecker`.

**D6 — Guest-first cookie sessions** · Active · Round 1
The first state-changing call creates a guest account and an httpOnly `gbt_sid` cookie (token stored as SHA-256).
Signup upgrades the same row; login merges guest work. scrypt for passwords. No JWTs.

**D7 — CSRF via a required custom header** · Active · Round 1
POST/PUT/PATCH/DELETE on `/api/*` must send `x-gbt-csrf: 1`. Browsers can't add it cross-site without a CORS
preflight the API never grants. No token endpoint to manage.

**D8 — Logos are deterministic vector SVG, not AI images** · Active · Round 1, extended Rounds 3–4
Logos are built from data (`shared/logo.ts`, `shared/symbols.ts`): crisp, editable, exportable, identical
on screen, in print and in exports. Image models are used only for moodboards and concept sketches (Round 4).
*Why not raster AI logos*: garbled text, not editable, not exportable as vector, inconsistent across renders.

**D9 — AI may draw symbols, but only through an allow-list sanitiser** · Active · Round 4
Model SVG goes through `sanitizeSymbolSvg()`: basic shapes only, numeric path data, transforms limited to
translate/rotate/scale/matrix/skew, colours mapped to palette roles (`brand`, `accent`, `ink`, `tint`, `paper`).
Never render model SVG by any other path.

**D10 — Four looks first, then the guidelines** · Active · Round 3
New kits carry four genuinely different looks and `lookChosen: false`; the UI blocks on the picker. At least two
looks carry a real symbol (Round 4). *Why*: users found a single generated style limiting.

**D11 — The model writes the words; the system makes design decisions** · Active · Round 1
The AI proposes look parameters (style, hue, font trio, symbol). Code enforces WCAG contrast in palettes,
picks font pairings, renders logos and applies usage rules. Model output can't produce an inaccessible palette.

**D12 — Every kit change is a new version** · Active · Round 1
`saveVersion()` writes `brand_guidelines` and bumps `brands.version`; Undo restores the previous one. No in-place mutation.

**D13 — Strict structured output, validated twice** · Active · Round 1
Zod schemas → strict JSON Schema (`toStrictJsonSchema`: all properties required, closed objects) for the model,
then Zod validation of the response. Optional values in AI schemas use `.nullable()`, not `.optional()`.

**D14 — Exactly two currencies, priced per currency** · Active · Round 1
INR (default) and USD. Prices are set separately per currency (₹499 / $9), not FX-converted.

**D15 — Default AI provider order and model** · Active · Round 1
`AI_PROVIDER=auto` picks Anthropic if `ANTHROPIC_API_KEY` is set, else OpenAI, else offline. Default Anthropic model is
`claude-opus-5-5`. Don't change model IDs unless asked, even if they look unfamiliar.

**D16 — Brand generation in-process (202 + polling)** · Active (accepted trade-off) · Round 1
Simple and good enough at current scale. If the API restarts mid-generation, the brand shows "Try again".
*Change when* volume needs a queue (BullMQ/SQS); the `runGeneration` signature can stay.

**D17 — No motion section in user brand guidelines** · Active · Round 4
The "motion story" (dot → diamond → mark) was removed from generated guidelines at the user's request.
`identity.motion` stays in the schema as an optional legacy field so old kits still parse; it is no longer generated or shown.
(GoBrandToday's own loader animation in `components/Spark.tsx` is separate and stays.)

**D18 — Labelled price estimates when no live price exists** · Active · Round 4
`shared/domain-pricing.ts` holds typical first-year/renewal prices per TLD in INR and USD, always shown with "est.".
A live registrar price always wins.

**D19 — A server-free preview build of the real UI** · Active · Rounds 3–4
`apps/web/preview` bundles the real components with an in-browser API (`local-api.ts`) mirroring the server routes.
Inside a Claude viewer it uses the artifact `sample` capability (same prompts and schemas as the server) and
`downloads` for exports. It must never claim availability (see D4).

**D20 — Hand-written CSS with design tokens** · Active · Round 1
No Tailwind or CSS-in-JS. Tokens in `apps/web/app/globals.css` mirror GoBrandToday's own brand guidelines
(Graphite, Magic Violet, Twinkle Aqua, Lilac, Paper; Space Grotesk / Manrope / Space Mono).

**D21 — GoBrand Score is a transparent heuristic** · Active · Round 1
Deterministic, with published weights (sum 100), shown /10, provisional until checks run, and with explicit
"not a trademark search or a promise" copy. Don't add opaque ML scoring without a decision.

**D22 — Docs are part of the change, and drift is tested** · Active · Round 5
`AGENTS.md` is the single entry point for AI agents (`CLAUDE.md`/`GEMINI.md` point to it). `npm test` runs
`scripts/check-docs.mjs`, which fails when routes, env vars, tables, pages, modules, logo styles, symbol
families or root scripts are undocumented.

**D23 — Industry objects first, chosen by deterministic rules** · Active · Round 6
Mockups are chosen by a business sector detected from the brief's words (specific words outweigh generic ones like
"shop" or "app"), then its industry pick. Rules, not a model call: instant, free, testable and the same in the
preview. The sector is stored on the kit (`kit.sector`) so it is stable; older kits infer it from their own text.

**D24 — Downloads are generated in the browser** · Active · Round 6
The ZIP, HTML brand book, website draft, tokens and social PNGs are built client-side (`lib/export.ts`) from the shared
renderers. The browser has the real font metrics and the web fonts, the server stays light, and the preview works the
same way. Markdown and JSON still come from the API (`toMarkdown`). The ZIP writer is our own (stored, no compression,
`shared/zip.ts`): no dependency, and PNG/SVG gain little from deflate.

**D25 — The website service reuses the experts intake** · Active · Round 6
"We build it for you" requests go to `POST /api/experts/requests` with `service: 'website'`, the package as `budget`
and the brief as `details` text. No new table or endpoint; fulfilment stays manual, like every expert service.
Package prices live in `WEBSITE_PACKAGES`; the website entry in `EXPERT_SERVICES` must stay in step with them.

**D26 — Design elements follow one graphic device** · Active · Round 6
Toolkit elements, scenes and banners are drawn from a single device (the symbol, or the mark) cropped big, with
quiet/loud colour modes. Studio research and the numeric rules are in `DESIGN_RESEARCH.md`; the numbers are our
proposals, not published studio figures.

**D27 — Downloads need a free account** · Active · Round 7
Guests can build and view one Brand Box without signing up, but every download asks for a free account first
(`SignupGate.tsx`; the API's Markdown/JSON export requires an account). It saves the work to an account before it
leaves the app and turns the free tier into sign-ups. The client-built files can't be fully enforced server-side;
the gate is a product rule, not DRM.

**D28 — Offline copy reads the brief; it never repeats it** · Active · Round 7
The offline writer parses the brief into category, offer, place and audience and writes with a per-sector vocabulary
and per-name wordplay (`offline/copy.ts`). Pasting the founder's sentence into bios read as broken. Rules stay
deterministic (same name and brief → same copy), and two names never share launch copy.

**D29 — The logo repurpose tool runs in the browser and stays an add-on** · Active · Round 8
Founders who already have a logo can turn it into a social kit (`/tools/logo-to-social-kit` and five focused SEO pages).
The file is read, sampled and drawn on the client; it is never uploaded, so there's no storage, moderation or
retention to manage, and the SVG we draw embeds it as an image (an uploaded SVG can't run script inside `<image>`).
It is deliberately quiet: linked from the hero's small print, `/tools` and the footer, not the main nav, because the
core journey is idea → brand. Downloads follow D27 (free account).
