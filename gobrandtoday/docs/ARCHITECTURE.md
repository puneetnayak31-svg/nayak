# Architecture

Flows, internals and extension points. For the stack, the full module index and the table list, see
[`TECH_BRIEF.md`](TECH_BRIEF.md). For step-by-step recipes, see [`WORKFLOWS.md`](WORKFLOWS.md).

```
Browser ──► Next.js web (apps/web) ──/api/* rewrite──► Fastify API (apps/api) ──► PostgreSQL
                                                          │
                                                          ├─► AIProvider       (Anthropic | OpenAI | Offline)
                                                          ├─► DomainProvider   primary (RDAP | GoDaddy | Hostinger | Namecheap | Name.com | Porkbun | Mock)
                                                          │                    + fallback (RDAP) + confirm (a registrar, if configured)
                                                          ├─► SocialChecker×10 (GitHub API | Reddit endpoint | YouTube API/probe | Manual | Mock)
                                                          ├─► ImageProvider    (Pollinations | Hugging Face | Cloudflare | Together | OpenAI | none)
                                                          ├─► Analytics        (DB | PostHog | log | none)
                                                          └─► Billing          (stub: Razorpay INR / Stripe USD)
```

* **Frontend and backend are separate deployables.** The web app never calls a third party. It calls `/api/*` on its own origin, which Next.js proxies to `API_ORIGIN`. So cookies are first-party and keys stay on the server.
* **`@gbt/shared`** is plain TypeScript used by both sides. It holds the zod schemas, the GoBrand Score engine (so the browser can re-score instantly once checks come back), the brand system and the pricing tables.
* **Nothing depends on a hosting vendor.** Everything is driven by env vars, Postgres is standard, and the API is a plain Node process.

## Backend layers

| Layer | Responsibility |
|---|---|
| `config/env.ts` | Validates every env var once at boot (zod). Refuses to start in production without `SESSION_SECRET`. |
| `providers/*` | Talk to the outside world. One interface per concern; implementations are swappable by env. |
| `services/*` | Business logic: naming rounds, Domain-First loop, kit assembly, assistant patches, versioning, quotas, guest→account merge. |
| `routes/*` | HTTP: parse with zod, call a service, serialise. Route `schema`s feed the OpenAPI docs. |
| `plugins/auth.ts` | Session cookie → `req.user`, lazy guest creation, CSRF header check. |
| `lib/*` | `httpFetch` (timeouts and bounded retries), TTL/LRU cache with request coalescing, errors, logger. |

### Providers

```ts
interface AIProvider {            // providers/ai/types.ts
  generateNames(input): Promise<RawName[]>;
  generateKit(input):   Promise<Partial<KitDraft>>;   // sections: strategy | taglines | identity | launch | website
  assistant(input):     Promise<AssistantOutput>;     // reply + typed "changes" patch
}
interface DomainProvider { check(domains: string[]): Promise<DomainCheck[]> }   // never guesses: unknown, not available
interface SocialChecker  { platform; method; check(handle): Promise<HandleCheck> }
interface ImageProvider  { generate(req): Promise<{ kind: 'url', url } | { kind: 'bytes', contentType, data }> }
```

* **LLM providers** implement one method, `completeJSON`. They use strict JSON-schema structured outputs, generated from the zod schemas by `toStrictJsonSchema`, and validate the result with zod again. The Anthropic adapter uses the official SDK with streaming and `fallbacks: "default"` (server-side refusal fallback), and handles `refusal` and `max_tokens` stop reasons explicitly.
* **The model writes the words; the system makes the design decisions.** For identity, the AI proposes four *looks* (construction, base hue, font trio, word case, a generative symbol family or a hand-drawn SVG symbol, title and concept). Our system turns each one into a complete direction: a palette with WCAG AA contrast enforced, the font pairing, and the logo itself.
* **Logos are rendered from data** (`packages/shared/src/logo.ts`, `symbols.ts`). There are ten constructions (`LOGO_STYLES`) and thirteen seeded symbol families (`SYMBOL_FAMILIES`). AI-drawn symbols pass through `sanitizeSymbolSvg` (allow-listed shapes and attributes, palette-role colours) before they are stored. Each construction is an SVG builder with an injected font `measure`. The browser passes a canvas measurer that uses the real web font, so the screen, the guidelines, the mockups (`mockups.ts`), the exports and the preview all draw the same logo. Exports inline the subset font (Google Fonts `text=`), so SVG/PNG files render anywhere.
* **Domain answers are layered.** The primary provider (RDAP by default) answers; a DNS nameserver lookup overrides a registry 404 when the domain has live DNS; the fallback fills `unknown`s; and a configured registrar confirms "available" results and supplies the price (`services/domain.service.ts`, `confirmAvailable`). Registry-only results stay "Likely free".
* **Failure is graceful.** If the AI fails, the offline generator answers and the UI says so. If a domain provider fails, the fallback (RDAP) answers. If that fails too, the result is `unknown`, which is never `available`. One platform failing never fails the whole check. If an image provider fails for some prompts, the rest are kept.

### Caching and cost control

* Domain results: `taken` for 24 h, `available` for 20 min, `unknown` is never cached. Social results follow a similar pattern. Concurrent identical lookups share one upstream call.
* Names are generated first. Checks run **only** when the user opens, shortlists or builds a name (lazy verification).
* Per-plan daily quotas (`usage` table, atomic upsert) and per-IP/session rate limits, which are stricter on AI routes.

## Data model (PostgreSQL, Drizzle)

```
users ─┬─ sessions            (sha256 of token; raw token only in the httpOnly cookie)
       ├─ subscriptions       (plan, provider, status — billing-ready)
       ├─ usage               (user × kind × day → count)
       ├─ projects ── brand_names   (every candidate of every round)
       ├─ saved_names         (shortlist / favourites)
       ├─ domain_watch        (watchlist)
       └─ brands ─┬─ brand_guidelines  (versioned kits → undo)
                  ├─ brand_scores      (score history)
                  ├─ brand_assets      (generated images: base64 data + content type, or a URL)
                  └─ ai_messages       (assistant conversation)
expert_requests                       (Experts intake; user/brand links are optional)
domain_checks, social_handle_checks   (verification log — audit + analytics)
analytics_events                      (when ANALYTICS_PROVIDER=db)
```

## Key flows

**Naming round**: `POST /api/brand/generate-names` → quota → AI (or offline) → constraint enforcement (even if the model ignores them) → risk filter → `scoreName` → persisted as round *n* of the project.

**Domain-First**: up to 3 rounds of 24 candidates. Each round checks the primary TLD and keeps the registrable names, then completes the other TLDs for the survivors and re-scores them with real data.

**Build brand**: `POST /api/brands` returns `202` straight away. A background job checks domains and handles (so the copy uses the real domain), generates the kit, assembles the identity, scores it and saves version 1. The client polls `GET /api/brands/:id`.

**Looks**: a new brand's kit carries four looks with `lookChosen: false`; the UI shows the picker. `POST /look` applies one (new version, so it can be undone). `POST /looks` offers four more.

**Assistant**: the model returns `{ reply, names, changes }`, with typed nullable fields. The service maps the changes onto the kit and saves a new version, which **Undo** restores.

**Imagery**: `POST /api/brands/:id/imagery` builds prompts from `identity.moodboard` and the palette and calls the image provider. URL results (Pollinations) are stored as-is; byte results go to `brand_assets` and are served from `/api/assets/:id`.

## Frontend

Next.js App Router with server components for marketing and SEO pages and client components for the studio. Design tokens are in `app/globals.css` and mirror the Twinkle guidelines (Graphite `#16161A`, Magic Violet `#6D4AFF`, Twinkle Aqua `#19C3B4`, Lilac `#ECE7FF`, Paper `#FAFAF7`; Space Grotesk / Manrope / Space Mono). GoBrandToday's own loader animation is the brand's motion story (dot → soft diamond → spark → aqua twin). User brand guidelines no longer include a motion section (DECISIONS D17).

## Extension points

| Want to… | Do this |
|---|---|
| Add an AI provider | Extend `LLMProvider`, implement `completeJSON`, add a case to `providers/ai/index.ts`. |
| Add a registrar | Implement `DomainProvider`, register it in `registrar()` and `CONFIRM_ORDER` in `providers/domain/index.ts`, add a storefront to `shared/registrars.ts` if it has buy links. |
| Add an image model | Implement `ImageProvider`, add it to `createImageProvider()` in `providers/image/index.ts`. |
| Add a social platform | Add it to `SOCIAL_PLATFORMS` + `HANDLE_RULES` (shared), implement `SocialChecker`, register it in `providers/social/index.ts`. |
| Add a logo construction | Add an id to `LOGO_STYLES`, its metadata (fonts, marks, fit, usage) to `LOGO_STYLE_META`, a concept to `CONCEPTS`, and a `case` in `logoSVG` / `iconSVG`. |
| Add a symbol family | Add it to `SYMBOL_FAMILIES` and `SYMBOL_META`, and a draw function in `DRAW` (`shared/symbols.ts`). |
| Use Redis for cache | Implement `CacheStore` (`lib/cache.ts`) and export it as `cache`. |
| Turn on payments | Implement `BillingProvider.createCheckout` (Razorpay for INR, Stripe for USD), add a webhook route that writes `subscriptions` and sets `users.plan`. |
| Trademark / competitor analysis | Add a provider + service; `GoBrandScore.risks` already carries flags to the UI. |
| Monitoring alerts | A cron that re-runs `checkDomains` over `domain_watch` and emails on change. |
