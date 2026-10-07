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

**Buy links** don't depend on the check provider. They open Hostinger, GoDaddy or Namecheap search with the domain pre-filled (Indian storefronts when the visitor is on ₹). Add referral parameters with `AFFILIATE_HOSTINGER`, `AFFILIATE_GODADDY` and `AFFILIATE_NAMECHEAP` (query-string fragments, e.g. `REFERRALCODE=ABC123`).

## Social handles

| Platform | Method | Setup |
|---|---|---|
| GitHub | Official REST API `GET /users/{name}` | Optional `GITHUB_TOKEN` (raises the rate limit to 5,000/h) |
| Reddit | Public `api/username_available.json` | — |
| YouTube | Data API v3 `channels?forHandle=@…` | `YOUTUBE_API_KEY` (Google Cloud → YouTube Data API v3). Without a key: one `HEAD` request to `youtube.com/@handle` (turn off with `SOCIAL_PROFILE_PROBES=false`). |
| Instagram, Threads, X, TikTok, LinkedIn, Facebook, Pinterest | **Manual** | These platforms offer no compliant public availability check, so we don't scrape. Users get a pre-filled profile link (“Check ↗”). To add a licensed aggregator later, implement `SocialChecker` for those platforms. |

Handle rules (length and allowed characters) are checked before any network call, so an impossible handle is reported as **Not allowed** rather than “available”.

## Google sign-in
1. Google Cloud Console → APIs & Services → Credentials → **OAuth client ID** (Web).
2. Authorised redirect URI: `{APP_URL}/api/auth/google/callback` (or `{PUBLIC_API_URL}/api/auth/google/callback`).
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. The “Continue with Google” button appears automatically.

## Analytics
`ANALYTICS_PROVIDER=db` (default) writes events to `analytics_events`. `posthog` with `POSTHOG_API_KEY` sends them to PostHog. `log` and `none` are also available. The events tracked are listed in `apps/api/src/providers/analytics/index.ts`. The client can only send allow-listed names.

## Payments (prepared, not enabled)
Plans, prices (₹/$) and limits live in `packages/shared/src/pricing.ts`, and quotas are already enforced. To launch billing, implement `BillingProvider` (`apps/api/src/providers/billing`): Razorpay for INR (UPI, cards, netbanking) and Stripe for USD. Then add a webhook route that writes `subscriptions` and sets `users.plan`.
