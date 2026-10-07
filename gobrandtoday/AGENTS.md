# AGENTS.md — GoBrandToday

Instructions for AI coding agents (Claude Code, Codex, Antigravity/Gemini, Cursor and others) and for humans.
This file is the entry point. `CLAUDE.md` and `GEMINI.md` point here. If anything below disagrees with the
code, **the code wins**: fix this file in the same change.

## 1. What this project is

GoBrandToday is an India-first AI brand studio. A user goes from an idea to a brand name, checked domains
and social handles, a transparent GoBrand Score, four logo "looks", a full brand book (guidelines and
mockups) and launch copy.

It is an npm-workspaces TypeScript monorepo:

| Workspace | What it is |
|---|---|
| `packages/shared` (`@gbt/shared`) | Zod schemas and types, scoring engine, brand system, SVG logo/symbol/mockup renderers, pricing, experts catalogue. Consumed as TypeScript source (no build step). |
| `apps/api` (`@gbt/api`) | Fastify 5 REST API, Drizzle ORM on PostgreSQL. Layers: routes → services → providers. |
| `apps/web` (`@gbt/web`) | Next.js 16 App Router + React 19. Talks only to its own origin; `/api/*` is proxied to the API. Also contains `preview/`, a server-free single-file build. |

## 2. Read in this order before changing anything

1. This file.
2. [`docs/SCOPE.md`](docs/SCOPE.md) — what the product does and deliberately does not do.
3. [`docs/TECH_BRIEF.md`](docs/TECH_BRIEF.md) — stack, architecture, module index (file → responsibility), data model.
4. [`docs/WORKFLOWS.md`](docs/WORKFLOWS.md) — user flows end to end, and step-by-step recipes for common dev changes.
5. [`docs/DECISIONS.md`](docs/DECISIONS.md) — deliberate choices. Do not "fix" these without being asked.
6. The area doc you need: [`docs/API.md`](docs/API.md), [`docs/PROVIDERS.md`](docs/PROVIDERS.md),
   [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md),
   [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md). History is in [`docs/CHANGELOG.md`](docs/CHANGELOG.md).

## 3. Commands (run from `gobrandtoday/`)

| Command | What it does |
|---|---|
| `npm install` | Install all workspaces. |
| `npm run dev` | API (`tsx watch`, :4000) and web (`next dev`, :3000). Needs Postgres. |
| `npm run dev:api` / `npm run dev:web` | One side only. |
| `npm run db:migrate` | Apply SQL migrations in `apps/api/drizzle/`. |
| `npm run db:generate` | Generate a new migration after editing `apps/api/src/db/schema.ts`. Commit the SQL. |
| `npm run typecheck` | `tsc --noEmit` in every workspace (strict, `noUncheckedIndexedAccess`). |
| `npm test` | Docs drift check, then Vitest in `packages/shared` and `apps/api`. The API integration test needs a reachable `DATABASE_URL`; without it, it prints a SKIPPED warning and passes (`SKIP_DB_TESTS=1` forces a skip). |
| `npm run docs:check` | Only the docs drift check (`scripts/check-docs.mjs`). |
| `npm run build` / `npm start` | Production build / start of both apps. |
| `npm run preview:build` | Single-file preview → `apps/web/preview/dist/` (gitignored). |

Local Postgres: `docker compose up -d db`, then `cp .env.example .env` (works as-is for local dev).
The app runs with **zero API keys**: AI falls back to the offline generator, domains use RDAP, images use Pollinations.

## 4. Rules that must hold (invariants)

1. **Never fabricate availability.** A domain or handle is only "available" when a registry, registrar or
   platform API said so. Unknown stays `unknown`; demo data is labelled `demo` and never counts as free
   or moves the score. Enforced in `providers/domain/*`, `providers/social/*`, `shared/domain-pricing.ts`
   (`domainState`, `socialState`), `shared/scoring.ts` (demo results filtered out).
2. **No secrets in the browser.** Every third-party call is made by `apps/api`. The web app calls only `/api/*` on its own origin.
3. **Every external capability sits behind a provider interface** chosen by env vars, with a working
   no-key fallback. Do not call an external service directly from a service or route.
4. **Validate at the edges with Zod.** Routes `parse()` input; AI output is validated against the same Zod schemas it was generated from.
5. **AI-drawn SVG is untrusted.** It goes through `sanitizeSymbolSvg()` (`shared/symbols.ts`) before it is stored or rendered. Never render model SVG any other way.
6. **The offline generator is never presented as AI.** UI badges come from `source: 'ai' | 'offline'`.
7. **Kits are versioned, never overwritten.** Every kit change goes through `saveVersion()` (new `brand_guidelines` row) so Undo works.
8. **Exactly two currencies: INR (default) and USD.**
9. **Logos are vector.** Logos are built as SVG from data; image models are only for moodboards and concept sketches.

## 5. Avoiding hallucination

- **Grep before you assume.** Before you use a route, env var, table, type, provider id or component, find it in the code.
  Facts live here: routes in `apps/api/src/routes/*.ts`; env vars in `apps/api/src/config/env.ts`; tables in
  `apps/api/src/db/schema.ts`; shared types in `packages/shared/src/types.ts`; pages in `apps/web/app/**/page.tsx`.
- **Versions are newer than many training sets**: Next.js 16, React 19, Fastify 5, Zod 4, Drizzle 0.45,
  Vitest 5, `@anthropic-ai/sdk` 0.131, TypeScript 5.9. Check the installed types in `node_modules` rather
  than memory (for example, Zod 4's built-in `z.toJSONSchema` is used in `providers/ai/llm.ts`; several Zod 3 APIs changed).
- **Model IDs are deliberate.** The default Anthropic model is `claude-opus-5-5`
  (`providers/ai/anthropic.ts`). Do not "correct" model IDs you don't recognise. Change them only when asked.
- **Don't trust stale prose.** If a doc, comment or this file contradicts the code, the code is right.
  Update the prose in the same change.
- **Don't invent product facts** (prices, plan limits, provider lists, service catalogue). They live in
  `shared/pricing.ts`, `shared/experts.ts`, `shared/domain-pricing.ts` and `shared/options.ts`.

## 6. If you change X, also update Y

| You change… | Also update… |
|---|---|
| An API route (add/rename/reshape) | Its service; `apps/web/preview/local-api.ts` (same path and shape, or the preview breaks); `docs/API.md`. |
| AI output schemas (`providers/ai/types.ts`) | `prompts.ts`; the offline generators (`offline/names.ts`, `offline/kit.ts`, `offline/assistant.ts`) must return the same shape; tests in `apps/api/test/ai.test.ts`. The preview reuses the same schemas automatically. |
| `BrandKitSchema` (`shared/types.ts`) | Make new fields optional (stored kits must still parse); `services/kit.ts` (`assembleKit`, `identityFromLook`, `kitToDraft`, `toMarkdown`); `components/BrandGuidelines.tsx`; the offline kit writer. |
| The DB schema | `npm run db:generate`, commit the SQL; table list in `docs/TECH_BRIEF.md`. |
| An env var | `apps/api/src/config/env.ts`, `.env.example`, and `docs/PROVIDERS.md` or `docs/DEPLOYMENT.md`. |
| A provider | Its interface implementation, registration in `providers/<kind>/index.ts`, `docs/PROVIDERS.md`, `/api/system` if the UI should show it. |
| A file in `packages/shared/src`, `apps/api/src/{providers,services,routes}` or `apps/web/components` | The module index in `docs/TECH_BRIEF.md`. |
| A web page | Page list in `docs/TECH_BRIEF.md`; `preview/router.tsx` + `preview/main.tsx` if it should work in the preview; `app/sitemap.ts` if public. |
| `LOGO_STYLES` or `SYMBOL_FAMILIES` | `LOGO_STYLE_META` / `SYMBOL_META`, render cases in `logo.ts`, and the lists in `docs/TECH_BRIEF.md`. |
| Scope or a user-visible behaviour | `docs/SCOPE.md` and `docs/CHANGELOG.md`. |
| Prices, plan limits, expert services, landing/site copy or a marketed feature | `docs/MARKETING_BRIEF.md` (including its claims guardrails, section 13). |
| A decision recorded in `docs/DECISIONS.md` | That entry (mark it superseded and add the new decision). Don't silently reverse it. |

`npm run docs:check` (also run by `npm test`) fails when routes, env vars, tables, pages, modules,
logo styles, symbol families or root scripts are missing from the docs. It prints which doc to fix.
It can't check prose. Keeping descriptions accurate is your job.

## 7. Definition of done

1. `npm run typecheck` is clean.
2. `npm test` passes (includes the docs check). Add or adjust tests for new logic, especially in `packages/shared`.
3. For UI changes: `npm run build` succeeds, and you looked at the result in a browser (desktop and ~390px mobile, with no horizontal scroll).
4. Docs updated per section 6, and a line added under **Unreleased** in `docs/CHANGELOG.md`.
5. No secrets committed (`.env` is gitignored; `.env.example` holds placeholders only).

## 8. Gotchas

- `packages/shared` is imported as `.ts` source (`transpilePackages` in `apps/web/next.config.ts`; `tsx`/`tsup` in the API). Do not add a build step or import from `dist`.
- Shared code must stay framework-free (its only dependency is `zod`) because it runs in the API, Next.js and the preview bundle.
- Strict structured outputs need every property required. AI output schemas use `.nullable()` rather than `.optional()` (see `AssistantOutputSchema`).
- The logo renderer needs text measurement. In the browser, pass `canvasMeasure` (`components/Logo.tsx`). On the server and in tests, `approxMeasure` is used, so widths are approximate there.
- `brands.kit` is JSONB holding kits written by older versions. Readers must tolerate missing optional fields (`identity.symbol`, `essence`, `moodboard`, `concepts`, legacy `motion`).
- The API integration test returns early (and prints a "SKIPPED" warning) when Postgres isn't reachable, so the suite still goes green. Before trusting a run, make sure Postgres is up (`docker compose up -d db` or `service postgresql start`) and `npm run db:migrate` has run.
- Brand generation runs in-process after `POST /api/brands` returns `202`; the client polls `GET /api/brands/:id`.
- CSRF: every POST/PUT/PATCH/DELETE to `/api/*` must send `x-gbt-csrf: 1` (`lib/api.ts` does this). Tests must too.
- The preview (`apps/web/preview`) can't reach the network. It must never claim a domain or handle is free.
- Fonts: the product uses Space Grotesk / Manrope / Space Mono; user brands load Google Fonts on demand.

## 9. Git

Work on the branch you're asked to use; don't push to `main` or force-push unless asked. Keep commits
focused, and describe *why* in the message. Don't commit `node_modules`, `.next`, `dist`,
`apps/web/preview/dist` or `.env`.
