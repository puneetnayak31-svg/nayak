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
| Entry | Hero, visible without scrolling: "one sentence in, a whole brand out". An example idea types itself and a Brand in a Box assembles (name and score, logo, domains with prices, handles on 10 platforms, brand book, social kit, website draft, launch copy), next to the composer; under it, an 8-item "Everything inside" strip (chips above the composer on phones) | Live (illustrative, labelled Example) | `web/components/HeroMagic.tsx`, `app/page.tsx`, `PlatformIcons.tsx` |
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
| Guidelines | Brand book: essence, logo system, clear space, min size, backgrounds, misuse, colour (HEX/RGB/CMYK, proportions, WCAG pairs), type scale, pattern, brand toolkit, imagery, voice & UI, applications, other looks | Live | `web/components/BrandGuidelines.tsx` |
| Applications | 32 mockups (9 generic + 23 industry objects such as neck label, hang tag, mithai box, coffee bag, candle jar, serum bottle, cans, menu, takeaway bag, product screen, payment card). The sector is detected from the brief and the 9 most relevant show first; "show all" reveals the rest | Live (deterministic keyword rules) | `shared/mockups.ts`, `shared/scenes.ts`, `shared/sectors.ts` |
| Toolkit | Design elements from the brand's graphic device: supergraphic, pattern, icon set, seal, type wall, quiet/loud colour modes, photo frames, dividers, data device; each downloadable as SVG | Live | `shared/elements.ts`, `web/components/Mockups.tsx` |
| Imagery | Moodboard photos and logo concept sketches from free FLUX models | Live (Pollinations, keyless) | `providers/image/index.ts`, `brand.service.ts` (`generateImagery`) |
| Launch | "Social & launch kit" tab: the brand's profile picture, post and banners up front, then bios (Instagram ≤150, X ≤160, LinkedIn, YouTube), launch posts, X thread (≤270 per post), announcement and 10 content ideas, written natively per platform and per name: the brief is read into category/offer/place, never pasted back; sector vocabulary, local hashtags and wordplay on the name | Live (AI) / Fallback (`offline/copy.ts`) | kit section `launch`, `prompts.ts` launch rules |
| Assistant | Conversational edits as typed, versioned kit patches with undo | Live (AI) / Fallback (intent matching) | `brand.service.ts` (`askAssistant`), `kit.ts` (`applyAssistantChanges`) |
| Export | Downloads tab: whole kit as one ZIP (~45 files with README); brand book as PDF (browser print), self-contained HTML, Markdown and JSON; logo SVG/PNG light/dark/one-colour (fonts embedded); app icon and favicons; design tokens (CSS, Tailwind, W3C JSON); social kit PNGs at platform sizes (profile, post, X, LinkedIn, YouTube); email signature with the brand icon (and a hosted-logo field for Gmail); every mockup and toolkit element as SVG | Live (generated in the browser; PDF needs the full app) | `web/lib/export.ts`, `web/components/ExportCentre.tsx`, `shared/{brandbook,tokens,zip,elements}.ts`, `GET /api/brands/:id/export` |
| Website | First-draft one-page website built from the kit (brand colours, fonts, logo, copy, FAQ, SEO title/description), previewed live (desktop/mobile) and downloadable as one HTML file | Live | `shared/website.ts`, `web/components/WebsiteBuilder.tsx` |
| Website | "We build it for you": Launch page (from ₹9,999 / $199), Business website (from ₹34,999 / $699), Online store (from ₹64,999 / $1,299), Custom (quote), with a brief (sections, features, references, domain, timeline) | Live intake; fulfilment is manual (stored as an experts request, service `website`) | `shared/website.ts` (`WEBSITE_PACKAGES`), `WebsiteBuilder.tsx`, `POST /api/experts/requests` |
| Share | Read-only public brand page by slug | Live | `/b/[slug]`, `GET /api/public/brands/:slug` |
| Accounts | Guest-first sessions; email+password signup keeps guest work; Google OAuth | Live (Google needs keys) | `services/auth.service.ts`, `plugins/auth.ts` |
| Accounts | Account menu with what's left (naming rounds, brand boxes, domain/handle checks, AI messages); premium avatar for Pro and Studio; usage on the dashboard | Live | `web/components/AccountMenu.tsx`, `GET /api/auth/me` |
| Accounts | Demo Pro account to try the paid experience (`demo@gobrandtoday.com`) | Live (built into the preview; `npm run db:seed-demo` in the app) | `api/db/seed-demo.ts`, `preview/local-api.ts` |
| Free tier | One free Brand Box to build and view as a guest; downloading anything needs a free account | Live | `web/components/SignupGate.tsx`, `routes/brands.ts` (export) |
| Plans | Spark (free), Pro (₹499 / $9 a month), Studio (₹1,999 / $29 a month), daily quotas and a brand-kit cap enforced | Live (limits) | `shared/pricing.ts`, `services/usage.service.ts` |
| Billing | Checkout / subscriptions (Razorpay INR, Stripe USD) | **Stub**: nobody can pay; plans can only be changed in the DB | `providers/billing/index.ts` |
| Studio plan | "Brand approvals and comments", "Priority checks" | **Copy only** (listed in `PLANS`, not implemented) | `shared/pricing.ts` |
| Tools (SEO) | Social media username checker, domain availability checker with prices, brand bible generator, plus name-generator landing pages | Live | `web/lib/seo-pages.ts`, `web/components/ToolWidgets.tsx`, `/tools`, `/tools/[slug]` |
| Tools (add-on) | Logo repurpose: upload an existing logo → profile picture, post, LinkedIn/X/YouTube banners and a one-page brand guidelines sheet at exact sizes; colours picked from the logo; PNG or ZIP (free account). Pages: logo-to-social-kit, linkedin-banner-maker, youtube-banner-maker, x-header-maker, profile-picture-maker, brand-guidelines-from-logo. The file never leaves the browser (D29) | Live | `shared/repurpose.ts`, `web/components/LogoRepurposer.tsx`, `web/lib/seo-pages.ts` |
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
