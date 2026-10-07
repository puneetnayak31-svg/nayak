# Third-party setup

Every integration is optional. With **no keys**, the app runs end to end:

* naming and Brand Bibles come from the offline generator, labelled in the UI;
* domains are checked via RDAP;
* handles are checked on GitHub, Reddit and YouTube, with one-tap links for the rest.

## AI

### Anthropic (recommended)
1. Create a key at console.anthropic.com → **API keys**.
2. Set `ANTHROPIC_API_KEY=…` and leave `AI_PROVIDER=auto` (or set `AI_PROVIDER=anthropic`).
3. The default model is `claude-opus-5-5`; override it with `AI_MODEL`. `AI_NAMES_EFFORT` (default `low`) keeps naming rounds fast, and `AI_EFFORT` (default `medium`) controls Brand Bible depth.
4. Implementation: the official `@anthropic-ai/sdk`, streaming with `finalMessage()`, structured outputs (`output_config.format`), and server-side refusal fallbacks (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`).

### OpenAI
Set `AI_PROVIDER=openai`, `OPENAI_API_KEY`, and `OPENAI_MODEL` (any model that supports `response_format: json_schema`).

## Domains

| Provider | Setup | Notes |
|---|---|---|
| **RDAP** (default) | Nothing | The registries' own lookup protocol (successor to WHOIS). Servers come from the IANA bootstrap (`data.iana.org/rdap/dns.json`), with built-in fallbacks for .com/.net/.in/.ai/.io/.app/.dev/.xyz. A 404 means not registered. RDAP can't see premium pricing, so the UI says “price confirmed at checkout”. TLDs without RDAP fall back to DNS, which can prove *taken* but never *available*. |
| **GoDaddy** | developer.godaddy.com → API keys → `GODADDY_API_KEY`, `GODADDY_API_SECRET`, `DOMAIN_PROVIDER=godaddy` | Uses `POST /v1/domains/available` (bulk, FAST). GoDaddy restricts production availability API access to qualifying accounts; use `GODADDY_ENV=ote` to test. Returns prices. |
| **Hostinger** | hPanel → Profile → **API** → token → `HOSTINGER_API_TOKEN`, `DOMAIN_PROVIDER=hostinger` | `POST https://developers.hostinger.com/api/domains/v1/availability`, one name × many TLDs per call, about 10 requests/min. Results are cached and RDAP fills any gaps. |
| **Namecheap** | Enable API access, whitelist your server IP → `NAMECHEAP_API_USER`, `NAMECHEAP_API_KEY`, `NAMECHEAP_USERNAME`, `NAMECHEAP_CLIENT_IP`, `DOMAIN_PROVIDER=namecheap` | `namecheap.domains.check`; reports premium names and premium prices. |

### Registrar confirmation and prices

RDAP tells you a name has no owner at the registry, but a registry can still reserve a name or price it as premium. That is why a registry-only answer is shown as **Likely free**. Configure a registrar to confirm those answers, so **Available** means *you can buy it right now*, with the real price:

| Registrar | Setup | Notes |
|---|---|---|
| **Name.com** | name.com/account/settings/api → `NAMECOM_USERNAME`, `NAMECOM_API_TOKEN` | `POST /v4/domains:checkAvailability`, up to 50 names per call; purchasable, premium flag, purchase and renewal price (USD). |
| **Porkbun** | porkbun.com/account/api (enable API access) → `PORKBUN_API_KEY`, `PORKBUN_SECRET_KEY` | `POST /api/json/v3/domain/checkDomain/{domain}`; availability, price, renewal, premium. Free, but rate-limited to about one check per 10 seconds, so it only confirms names the registry already reports free. |
| GoDaddy / Namecheap / Hostinger | as above | Any configured registrar can confirm. |

`DOMAIN_CONFIRM_PROVIDER=auto` (default) uses the first registrar with credentials. When a registrar says *not available* for a name the registry calls free, the result becomes **Taken** with an explanation (reserved, held, or in a drop cycle). Two more safety nets run on every RDAP “not registered” answer: a quick nameserver lookup (live DNS means registered), and unknown results are never cached.

**Prices in results.** Live registrar prices are shown as-is. Without one, the UI shows a typical first-year and renewal price from `packages/shared/src/domain-pricing.ts`, clearly labelled **est.**, in ₹ or $.

**Buy links** don't depend on the check provider. They open Hostinger, GoDaddy or Namecheap search with the domain pre-filled (Indian storefronts when the visitor is on ₹). Add referral parameters with `AFFILIATE_HOSTINGER`, `AFFILIATE_GODADDY` and `AFFILIATE_NAMECHEAP` (query-string fragments, e.g. `REFERRALCODE=ABC123`).

## Social handles

| Platform | Method | Setup |
|---|---|---|
| GitHub | Official REST API `GET /users/{name}` | Optional `GITHUB_TOKEN` (raises the rate limit to 5,000/h) |
| Reddit | Public `api/username_available.json` | — |
| YouTube | Data API v3 `channels?forHandle=@…` | `YOUTUBE_API_KEY` (Google Cloud → YouTube Data API v3). Without a key: one `HEAD` request to `youtube.com/@handle` (turn off with `SOCIAL_PROFILE_PROBES=false`). |
| Instagram, Threads, X, TikTok, LinkedIn, Facebook, Pinterest | **Manual** | These platforms offer no compliant public availability check, so we don't scrape. Users get a pre-filled profile link (“Check ↗”). To add a licensed aggregator later, implement `SocialChecker` for those platforms. |

**The Core 5 tag.** Every name gets one line telling you how it stands on .com, Instagram, X, YouTube and LinkedIn: verified free, taken, or “to confirm” with a one-tap link. Instagram, X and LinkedIn are always “to confirm” because they have no compliant public check.

Handle rules (length and allowed characters) are checked before any network call, so an impossible handle is reported as **Not allowed** rather than “available”.

## Images (moodboards and logo concept sketches)

| Provider | Setup | Notes |
|---|---|---|
| **Pollinations** (default) | Nothing (optional `POLLINATIONS_TOKEN`) | Free, keyless FLUX. Returns a stable image URL the browser loads directly. |
| Hugging Face | `HF_TOKEN` (free tier), `HF_IMAGE_MODEL` (default `black-forest-labs/FLUX.1-schnell`) | Images are stored in `brand_assets` and served from `/api/assets/:id`. |
| Cloudflare Workers AI | `CF_ACCOUNT_ID`, `CF_API_TOKEN` | `@cf/black-forest-labs/flux-1-schnell`, free daily allowance. |
| Together AI | `TOGETHER_API_KEY` | `FLUX.1-schnell-Free`. |
| OpenAI Images | `OPENAI_API_KEY`, `IMAGE_PROVIDER=openai` | Paid; never picked by `auto`. |

`IMAGE_PROVIDER=auto` picks the first free provider with a key, else Pollinations. Logos themselves stay vector: generative symbol families, plus symbols the AI draws as SVG (sanitised to simple shapes and palette colours). Image models are used for the moodboard and for raster “concept sketches” a designer can refine.

## Experts

“Work with an expert” requests are stored in `expert_requests`. Set `EXPERTS_WEBHOOK_URL` to forward each one (Slack, a CRM or Zapier). The service catalogue and starting prices live in `packages/shared/src/experts.ts`.

## Google sign-in
1. Google Cloud Console → APIs & Services → Credentials → **OAuth client ID** (Web).
2. Authorised redirect URI: `{APP_URL}/api/auth/google/callback` (or `{PUBLIC_API_URL}/api/auth/google/callback`).
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. The “Continue with Google” button appears automatically.

## Analytics
`ANALYTICS_PROVIDER=db` (default) writes events to `analytics_events`. `posthog` with `POSTHOG_API_KEY` sends them to PostHog. `log` and `none` are also available. The events tracked are listed in `apps/api/src/providers/analytics/index.ts`. The client can only send allow-listed names.

## Payments (prepared, not enabled)
Plans, prices (₹/$) and limits live in `packages/shared/src/pricing.ts`, and quotas are already enforced. To launch billing, implement `BillingProvider` (`apps/api/src/providers/billing`): Razorpay for INR (UPI, cards, netbanking) and Stripe for USD. Then add a webhook route that writes `subscriptions` and sets `users.plan`.
