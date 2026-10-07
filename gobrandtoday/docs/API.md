# API

Base URL: the web origin (`/api/*` is proxied) or the API directly (`http://localhost:4000`). Interactive docs: **`/api/docs`**.

**Conventions**
* JSON in and out. Errors look like `{ "error": { "code": "limit_reached", "message": "…" } }`.
* Auth uses the `gbt_sid` httpOnly cookie. The first state-changing call creates a guest automatically.
* Every `POST/PATCH/DELETE` needs the header **`x-gbt-csrf: 1`**. Optionally send `x-gbt-currency: INR|USD` to choose the registrar storefront.
* Rate limits: 120 requests/min overall and 20/min on AI routes (configurable). The plan's daily quotas return `429 limit_reached`.

## Names

| Method & path | Body | Returns |
|---|---|---|
| `POST /api/brand/generate-names` | `{ brief, count?, projectId?, exclude? }` | `{ projectId, round, names: NameCandidate[], source: 'ai'\|'offline', notice? }` |
| `POST /api/brand/refine-names` | `{ brief, projectId, feedback?, refinements?: string[], exclude?, liked? }` | same |
| `POST /api/brand/domain-first` | `{ brief, count? }` | same + `names[].domains`, `checked` |
| `POST /api/brand/score` | `{ name, brief?, relevance?, domains?, socials? }` | `GoBrandScore` |
| `POST /api/brand/validate-brief` | a `brief` object | `{ brief }` (normalised with defaults) or `400` |

`brief`:
```json
{ "description": "A cosy candle brand for Gen Z in India", "industry": "Consumer", "audience": "Gen Z",
  "geography": "India", "personalities": ["Playful"], "styles": ["Short"], "tlds": ["com","in","ai"],
  "mode": "smart", "constraints": { "maxLength": 7, "startsWith": "k", "avoidLetters": "xq" } }
```
`mode` ∈ `smart | short | premium | tech | invented | human | global | india | seo | domain_first`.

## Domains

| | |
|---|---|
| `POST /api/domain/check` | `{ name, tlds, region?: 'IN'\|'US', fresh?: boolean }` → `{ results: DomainResult[] }` |
| `POST /api/domain/check-bulk` | `{ names (≤12), tlds }` → `{ results: [{ name, results }] }` |
| `GET/POST /api/watch`, `POST /api/watch/:id/recheck`, `DELETE /api/watch/:id` | Watchlist |

`DomainResult`:
```json
{ "domain": "kettlo.in", "tld": "in", "status": "available", "source": "rdap", "verified": true,
  "note": "Not registered at the registry. Price and premium status are confirmed at checkout.",
  "buyLinks": [{ "registrar": "hostinger", "label": "Hostinger", "url": "https://www.hostinger.com/in/domain-name-search?domain=kettlo.in" }] }
```
`status` ∈ `available | taken | premium | unknown | invalid`. `verified` is `true` only when a registry or registrar answered definitively.

## Social

| | |
|---|---|
| `POST /api/social/check` | `{ handle, platforms?, alternatives? }` → `{ results: SocialResult[], alternatives: HandleSuggestion[] }` |
| `POST /api/social/check-bulk` | `{ handles (≤8), platforms? }` |

`SocialResult.status` ∈ `available | taken | unknown | invalid | manual`. `manual` means the platform offers no compliant check; use `url`. `method` ∈ `official_api | public_endpoint | profile_probe | manual | demo`. A `HandleSuggestion` stays a suggestion; `verifiedOn` lists the platforms where it was actually verified.

## Brands (Brand Bible)

| | |
|---|---|
| `POST /api/brands` | `{ name, brief, projectId?, domain?, handle? }` → `202 { brand }` (status `generating`). When ready, `kit.identity.looks` holds four options and `kit.identity.lookChosen` is `false` until the user picks one. |
| `GET /api/brands` / `GET /api/brands/:id` | list / full brand incl. `kit`, `score`, `domains`, `socials`, `version` |
| `PATCH /api/brands/:id` | `{ kit?: Partial<BrandKit>, domain?, handle?, isPublic? }` |
| `DELETE /api/brands/:id` | |
| `POST /api/brands/:id/retry` | retry a failed generation |
| `POST /api/brands/:id/sections/:section` | `{ instruction? }` — regenerate `strategy \| taglines \| identity \| launch \| website` |
| `POST /api/brand/generate-guidelines \| generate-taglines \| generate-logo-concepts \| generate-social-content \| generate-website-copy` | `{ brandId, instruction? }` (aliases of the above) |
| `POST /api/brands/:id/look` | `{ lookId }` — pick one of the offered looks; the identity is rebuilt around it |
| `POST /api/brands/:id/looks` | offer four new looks (different styles from those on screen) |
| `POST /api/brands/:id/undo` | restore the previous version |
| `POST /api/brands/:id/imagery` | `{ kind: "moodboard" \| "concepts" }`: generate moodboard photos or logo concept sketches with the image model; stored on `kit.identity.moodboard` / `kit.identity.concepts` |
| `GET /api/assets/:id` | a generated image stored by the server |
| `GET/POST /api/brands/:id/assistant` | history / `{ message }` → `{ reply, names, changed, source, brand }` |
| `GET /api/brands/:id/export?format=json\|md` | download |
| `GET /api/public/brands/:slug` | read-only shared brand |

## Experts

| | |
|---|---|
| `GET /api/experts` | the bespoke service catalogue (id, title, includes, turnaround, `from` price in INR/USD) |
| `POST /api/experts/requests` | `{ service, also?, name, email, phone?, budget?, timeline?, details?, brandId?, currency }` → `{ ok, id, message }`. Rate-limited to 5 an hour. |

## Projects & saved names

`GET/POST /api/projects`, `GET/DELETE /api/projects/:id` (with every round's names), `GET/POST /api/saved`, `PATCH/DELETE /api/saved/:id`.

## Auth & account

`GET /api/auth/me` (user + today's usage), `POST /api/auth/signup`, `POST /api/auth/login` (merges guest work), `POST /api/auth/logout`, `PATCH /api/me` (`name`, `currency`), `GET /api/auth/google` → `/api/auth/google/callback`.

## System

`GET /health`, `GET /api/system` (live/demo providers for UI badges), `GET /api/pricing`, `POST /api/events` (allow-listed analytics events), `GET /api/admin/status` (only for `ADMIN_EMAILS`: config, totals, 7-day usage and events).
