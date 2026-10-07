# Scope

What GoBrandToday does, for whom, what is built, what is only stubbed, and what is deliberately out of scope.
The **Status** column is the important one: never assume a feature exists because it is mentioned in
marketing copy. Check the code paths listed.

## Product in one paragraph

GoBrandToday takes someone from "I have an idea" (or "I have a name") to a brand they can launch:
a name, real domain and social-handle checks with prices, a transparent GoBrand Score, four
genuinely different logo looks, a studio-style brand book with mockups, launch copy, website copy and an
AI assistant for edits. It is **India-first**: ₹ pricing by default (switchable to $), Indian registrar
storefronts, `.in`/`.co.in`, Indian-language name roots and Hindi meaning checks.

## Who it is for

- First-time founders and small businesses in India who need a name and a brand fast and cheaply.
- Creators and side-project builders who want a credible identity without hiring an agency.
- Agencies and freelancers who want a fast first draft (the Studio plan targets them; see the gaps below).

## Product principles (non-negotiable)

1. **Never fabricate availability.** Unknown is shown as unknown; demo data is labelled demo.
2. **Never hard-code a provider.** AI, domains, social, images, analytics and billing are swappable by env vars, and each has a no-key fallback.
3. **Never expose a secret.** The browser only talks to its own origin.
4. **Progressive disclosure.** One sentence first; details and options when the user asks for them.
5. **The user decides.** Compare shows the data and never declares a winner. Looks are offered and the user picks.

## Feature inventory

Status legend:
- **Live**: built and works with real providers when configured.
- **Fallback**: works with zero keys via a free or offline path.
- **Stub**: the interface exists but nothing is wired.
- **Copy only**: mentioned in UI or marketing text, not implemented.

| Area | Feature | Status | Where in code |
|---|---|---|---|
| Entry | "I have an idea" composer with quick filters (industry, name style, must-have TLDs, max length, starts-with) | Live | `web/components/HeroComposer.tsx` |
| Entry | "I have a name" instant check | Live | `web/components/NameCheck.tsx`, page `/name/[name]` |
| Naming | 10 modes: smart, short, premium, tech, invented, human, global, india, seo, domain_first | Live (AI) / Fallback (offline) | `shared/options.ts` (`NAME_MODES`), `api/services/naming.service.ts` |
| Naming | Refinement chips + free-text feedback, liked names steer the next round, hard constraints enforced even if the model ignores them | Live | `naming.service.ts` (`passesConstraints`) |
| Naming | Per-name meaning, tagline, three "why it works" reasons, one watch-out | Live (AI) / Fallback | `providers/ai/prompts.ts`, `offline/names.ts` (`enrich`) |
| Naming | Domain-First mode (keeps only names whose primary TLD is free) | Live | `naming.service.ts` (`generateDomainFirst`) |
| Score | GoBrand Score: 8 weighted components, provisional until checks run, risk flags (bad meanings in 9 languages, near-famous brands) | Live | `shared/scoring.ts`, `shared/lexicon.ts` |
| Domains | RDAP registry check (free, keyless) + DNS cross-check | Fallback (default) | `providers/domain/rdap.ts` |
| Domains | Registrar confirmation and live price (Name.com, Porkbun, GoDaddy, Namecheap, Hostinger) | Live when keys set | `providers/domain/*`, `services/domain.service.ts` (`confirmAvailable`) |
| Domains | Typical price estimates labelled "est." when no live price | Live | `shared/domain-pricing.ts` |
| Domains | Buy links (Hostinger, GoDaddy, Namecheap; Indian storefronts on ₹; affiliate params) | Live | `shared/registrars.ts` |
| Domains | Watchlist with manual re-check | Live | routes `/api/watch*` |
| Domains | Scheduled watchlist monitoring and alerts | Not built | — |
| Handles | GitHub (official API), Reddit (public endpoint), YouTube (Data API or a single profile probe) | Live / Fallback | `providers/social/checkers.ts` |
| Handles | Instagram, X, TikTok, LinkedIn, Facebook, Threads, Pinterest | Manual one-tap link only (no compliant public check) | `providers/social/index.ts` |
| Handles | Core 5 tag (.com, Instagram, X, YouTube, LinkedIn) | Live | `shared/domain-pricing.ts` (`coreAvailability`), `web/components/Availability.tsx` |
| Handles | Handle alternatives (`getX`, `Xhq`, `Xindia`…) | Live | `shared/handles.ts` |
| Brand | Brand in a Box: meaning, story, positioning, mission, vision, audience, archetype, voice, taglines, messaging | Live (AI) / Fallback | `services/kit.ts`, `offline/kit.ts` |
| Identity | Four looks offered first; user picks; more looks on demand | Live | `shared/logo.ts` (`generateLooks`), `web/components/LookPicker.tsx` |
| Identity | 10 logo constructions, 13 generative symbol families, AI-drawn SVG symbols (sanitised) | Live | `shared/logo.ts`, `shared/symbols.ts` |
| Identity | Contrast-checked 5-role palettes, Google Fonts pairings | Live | `shared/brand-system.ts` |
| Guidelines | Brand book: essence, logo system, clear space, min size, backgrounds, misuse, colour (HEX/RGB/CMYK, proportions, WCAG pairs), type scale, pattern, imagery, voice & UI, 9 mockups, other looks | Live | `web/components/BrandGuidelines.tsx`, `shared/mockups.ts` |
| Imagery | Moodboard photos and logo concept sketches from free FLUX models | Live (Pollinations, keyless) | `providers/image/index.ts`, `brand.service.ts` (`generateImagery`) |
| Launch | Bios, launch posts, X thread, 10 content ideas, homepage copy | Live (AI) / Fallback | kit sections `launch`, `website` |
| Assistant | Conversational edits as typed, versioned kit patches with undo | Live (AI) / Fallback (intent matching) | `brand.service.ts` (`askAssistant`), `kit.ts` (`applyAssistantChanges`) |
| Export | PDF (browser print of `/brand/[id]/guidelines`), logo SVG/PNG (fonts embedded), icon SVG/PNG, Markdown, JSON | Live | `web/lib/export.ts`, `GET /api/brands/:id/export` |
| Share | Read-only public brand page by slug | Live | `/b/[slug]`, `GET /api/public/brands/:slug` |
| Accounts | Guest-first sessions; email+password signup keeps guest work; Google OAuth | Live (Google needs keys) | `services/auth.service.ts`, `plugins/auth.ts` |
| Plans | Spark (free), Pro (₹499 / $9 a month), Studio (₹1,999 / $29 a month), daily quotas and a brand-kit cap enforced | Live (limits) | `shared/pricing.ts`, `services/usage.service.ts` |
| Billing | Checkout / subscriptions (Razorpay INR, Stripe USD) | **Stub**: nobody can pay; plans can only be changed in the DB | `providers/billing/index.ts` |
| Studio plan | "Brand approvals and comments", "Priority checks" | **Copy only** (listed in `PLANS`, not implemented) | `shared/pricing.ts` |
| Tools (SEO) | Social media username checker, domain availability checker with prices, brand bible generator, plus name-generator landing pages | Live | `web/lib/seo-pages.ts`, `web/components/ToolWidgets.tsx`, `/tools`, `/tools/[slug]` |
| Experts | 8 bespoke services (identity, strategy workshop, website, sonic branding/music, packaging, launch video, trademark, social content) with request intake | Live intake; fulfilment is manual (requests stored, optional webhook) | `shared/experts.ts`, `routes/experts.ts`, `web/components/Experts.tsx` |
| Analytics | Allow-listed product events | Live (DB/PostHog/log) | `providers/analytics/index.ts` |
| Admin | `/api/admin/status` (config, totals, 7-day usage and events) for `ADMIN_EMAILS` | Live (API only; no admin UI) | `routes/system.ts` |
| Preview | Single-file server-free build of the real UI; Claude via the artifact `sample` capability when available | Live | `apps/web/preview/*` |

## Plan limits (from `shared/pricing.ts`, per day unless noted)

| Plan | Price (INR / USD per month) | Naming rounds | Domain checks | Handle checks | Assistant messages | Brand kits (total) |
|---|---|---|---|---|---|---|
| Spark | ₹0 / $0 | 5 | 40 | 20 | 5 | 1 |
| Pro | ₹499 / $9 | 200 | 1,000 | 400 | 200 | 10 |
| Studio | ₹1,999 / $29 | 1,000 | 5,000 | 2,000 | 1,000 | 1,000 |

Assistant messages, section regeneration (including the `/api/brand/generate-*` aliases) and imagery
generation consume the `assistant` quota. "More looks" (`POST /api/brands/:id/looks`) is only rate-limited.
Guests are limited to one brand kit until they sign up.

## Out of scope (deliberately)

- **Scraping** platforms that don't offer a public availability check (Instagram, X, TikTok, LinkedIn…).
- **Trademark clearance or legal advice.** Risk flags are heuristics; trademark filing is an Experts service done by humans.
- **Raster AI logos.** Logos stay vector; image models are for imagery and concept sketches only.
- **Currencies other than INR and USD.**
- **Promising SEO rankings or business success.** The score says it is guidance.

## Not built yet (candidates)

Billing; brand generation on a job queue; scheduled domain monitoring and alerts; team accounts, approvals
and comments (promised by the Studio plan); server-side PDF rendering; an admin UI; Redis for the cache and
rate limits across replicas. See [`LIMITATIONS.md`](LIMITATIONS.md) for the honest list and the extension
points in [`ARCHITECTURE.md`](ARCHITECTURE.md).
