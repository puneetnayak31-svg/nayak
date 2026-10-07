# gobrandtoday✦

**Your idea deserves a brand.** GoBrandToday takes someone from *“I have an idea but don’t know what to call it”* to a name, verified domain, social handles, a transparent score, a full visual identity and launch content in a few minutes.

**Idea → Name → Domain → Handles → GoBrand Score™ → Brand Bible → Launch kit**

India-first: ₹ pricing (switch to $), `.in` domains, Indian-language name roots, Hindi meaning checks and Indian registrar storefronts.

---

## What's inside

| | |
|---|---|
| **Two front doors** | “I have an idea” (AI naming) or “I have a name” (instant domain + handle + score check). |
| **10 naming modes** | Smart, Short & Punchy, Premium, Tech/AI, Invented, Human, Global, India-Inspired, SEO-Friendly, **Domain-First** (keeps only names whose domain is free). |
| **Conversational refinement** | Chips (“Shorter”, “More Indian”…) and plain-English feedback (“too corporate”), plus hard constraints: max length, starts-with and letters to avoid. ♥ saved names steer the next round. |
| **Real availability** | Domains via the registries' own **RDAP** (free, keyless) or GoDaddy / Hostinger / Namecheap APIs. Handles are verified with official/public endpoints where they exist; elsewhere you get a one-tap “Check ↗” link. **Nothing is ever guessed.** |
| **GoBrand Score™** | 0–100 internally, shown /10, with 8 explained components, published weights, an SEO explanation and risk flags (unfortunate meanings in Hindi, Spanish, German and other languages, plus names one letter away from famous brands). |
| **Shortlist & compare** | Select up to 4, check them all, and compare every factor side by side. The app does not pick a winner for you. |
| **Brand in a Box** | Meaning, story, positioning, mission, vision, audience, archetype, voice, taglines and messaging. |
| **Identity in the GoBrandToday system** | Every brand gets guidelines in the same format as GoBrandToday's own (“Direction 06 Twinkle”): a lowercase wordmark whose full stop becomes a signature mark, dark/tint lockups, an app-icon tile and a 4-step motion story. It also gets a 5-role palette (contrast-checked HEX), a Google Fonts trio, a UI sample, voice, usage rules and logo directions. |
| **Launch & website kit** | Instagram/X/LinkedIn/YouTube bios, launch posts, an X thread, 10 content ideas, and full homepage copy with a live preview. |
| **AI Brand Assistant** | “Make my tagline more premium”, “darker palette”, “10 alternatives”, “Instagram carousel”. Changes apply to the kit, are versioned, and can be undone. |
| **Export & share** | PDF guidelines, PNG/SVG logo, SVG app icon, JSON, Markdown; read-only share links; saved-name CSV/share. |
| **Accounts without friction** | Start instantly as a guest. Sign up (email/password or Google) and your work comes with you. |

---

## Quick start (local)

Requirements: **Node 20.11+** (22 recommended) and **PostgreSQL 14+**.

```bash
cd gobrandtoday
cp .env.example .env                 # works as-is for local dev
npm install

# Postgres — either use your own, or:
docker compose up -d db

npm run db:migrate                   # creates tables
npm run dev                          # API on :4000, web on :3000
```

Open <http://localhost:3000>. With no API keys, GoBrandToday runs on its **offline generator** (labelled “Offline generator” in the UI). Add `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) to switch to real AI. Domain checks work immediately via RDAP.

| Script | What it does |
|---|---|
| `npm run dev` | API (tsx watch) + web (next dev) |
| `npm run build` / `npm start` | Production build / start both apps |
| `npm run db:migrate` | Apply SQL migrations (`apps/api/drizzle`) |
| `npm run db:generate` | Generate a new migration after editing `apps/api/src/db/schema.ts` |
| `npm test` | Unit tests (shared + API) and the API integration test (uses `DATABASE_URL`; set `SKIP_DB_TESTS=1` to skip) |
| `npm run typecheck` | TypeScript across all workspaces |

API docs (OpenAPI / Swagger UI): <http://localhost:4000/api/docs>.

## Demo mode

`DEMO_MODE=true` swaps domain and social checks for deterministic sample data. Every result is then marked **demo** and a banner explains it, so demo data can never be mistaken for a real check.

## Repository layout

```
gobrandtoday/
├── packages/shared/     # Types (zod), GoBrand Score engine, brand system (marks, palettes, fonts),
│                        # handle rules, pricing (INR/USD), registrar links. Used by API *and* web.
├── apps/api/            # Fastify + Drizzle/Postgres. Providers → services → routes.
│   ├── src/providers/   # ai/ (anthropic, openai, offline) · domain/ (rdap, godaddy, hostinger, namecheap, mock)
│   │                    # social/ (github, reddit, youtube, manual, mock) · analytics/ · billing/
│   ├── src/services/    # naming, domain, social, brand (kit, assistant, versions), auth, usage
│   ├── src/routes/      # REST endpoints
│   └── drizzle/         # SQL migrations
├── apps/web/            # Next.js (App Router). Talks only to its own origin; /api/* is proxied to the API.
└── docs/                # Architecture, API, providers, deployment, limitations
```

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): system design, data model, request flows, extension points
- [docs/API.md](docs/API.md): every endpoint, with examples
- [docs/PROVIDERS.md](docs/PROVIDERS.md): setting up Anthropic/OpenAI, RDAP, GoDaddy, Hostinger, Namecheap, GitHub, YouTube, Google OAuth, PostHog
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Docker, Render/Railway/Fly, Vercel + a Node host, plain VPS
- [docs/LIMITATIONS.md](docs/LIMITATIONS.md): known limitations and the roadmap of extension points

## Principles we kept

1. **Never fabricate availability.** Every domain and handle result carries its source (`rdap`, `godaddy`, `official_api`, `manual`, `demo`…) and a `verified` flag.
2. **Never hard-code a provider.** AI, domain, social, analytics and billing all sit behind interfaces chosen by env vars.
3. **Never expose a secret.** The browser only talks to its own origin; third-party calls happen server-side.
4. **Progressive disclosure.** One sentence first. Details, modes and constraints are there when you want them.

## Screenshots

These come from a real run in headless Chromium using the offline generator. In the sandbox where they were taken, outbound registry and social APIs were blocked, so some results read “Unverified”. That's the honest fallback working as designed.

| Landing | Studio + shortlist | Compare |
|---|---|---|
| ![](docs/screenshots/01-landing.png) | ![](docs/screenshots/03-shortlist.png) | ![](docs/screenshots/04-compare.png) |

| Brand in a Box | Identity (Twinkle-format guidelines) | “I have a name” check |
|---|---|---|
| ![](docs/screenshots/06-brand-box.png) | ![](docs/screenshots/07-brand-identity.png) | ![](docs/screenshots/10-name-check.png) |
