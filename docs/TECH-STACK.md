# Tech stack

The site is deliberately small. A volunteer team can run it for years without upgrades, it builds anywhere Python runs, and the whole thing fits in an AI agent's context.

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Language (build and CMS) | Python | 3.9+ (CI: 3.9 and 3.12; Docker image: 3.12) | **Standard library only.** No pip install is needed to build or run the CMS |
| Site generator | `hipl-website/build.py` + `sitekit/` | in-repo | Templates with `{{tokens}}` and JSON content, output as static HTML |
| Content store | JSON files in `src/data/`, versioned in git | n/a | No database. The CMS keeps 60 versions of each file in `cms/state/history/` |
| CMS server | `http.server.ThreadingHTTPServer` | stdlib | One process: admin, API, public forms, static site |
| CMS admin UI | Vanilla JavaScript SPA (`cms/admin/`) | ES5-style, no build | Forms generated from `content_model.py` |
| AI | Anthropic Python SDK `anthropic` | `>=2.1,<3` (tested with 2.1.0) | Optional: only the AI Composer needs it |
| AI model | Claude Opus 5.5 (`claude-opus-5-5`) | Configurable in CMS Settings | Server tools: `web_search_20260209`, `web_fetch_20260209`. Beta `server-side-fallback-2026-07-01` |
| Front-end JS | Vanilla JS, one file (`assets/js/site.js`) | No framework, no bundler | Canvas for generative art and share images |
| CSS | One stylesheet (`assets/css/site.css`) | Custom properties, no preprocessor | Sabha design tokens |
| Fonts | Unbounded, Instrument Sans, Mukta (Devanagari) | Self-hosted woff2 | Open Font License. No Google Fonts request at runtime |
| Reverse proxy and HTTPS | Caddy | 2.8 (Docker image `caddy:2.8`) | Automatic Let's Encrypt certificates, HSTS, gzip/zstd |
| Containers | Docker + Docker Compose | Compose v2 | `hipl-website/Dockerfile`, `deploy/docker-compose.yml` |
| Alternative process manager | systemd | n/a | `deploy/hipl-cms.service` |
| Static hosting (optional) | Vercel or Netlify | n/a | `hipl-website/vercel.json` (clean URLs, headers) |
| CI | GitHub Actions | n/a | `.github/workflows/ci.yml` |
| Tests | `unittest` (stdlib) | n/a | `python3 tools/check.py` |
| Analytics (optional) | Plausible or Umami | n/a | Cookieless; `site.js` calls `window.plausible` if present |
| Launch-kit image rendering (optional) | Node + Playwright | Node 18+ | Only to re-export `hipl-launch-kit/social/*.png` |
| Logo outlining (optional) | `fonttools`, `brotli` | n/a | Only for `tools/make_logos.py` |

## What is deliberately not used, and why

- **No JS framework or bundler.** Pages are server-rendered HTML that works without JavaScript; JS only enhances it. Nothing needs a weekly `npm audit`.
- **No database.** Content is a few hundred kilobytes of JSON. Git gives history, review and backup, and the CMS writes atomically under a lock.
- **No third-party scripts by default.** No trackers and no font CDNs. YouTube loads only when a visitor clicks play.
- **No external CMS.** The original plan suggested Next.js with Payload. The content model here maps one to one onto Payload collections and blocks if the project ever outgrows this (see `hipl-launch-kit/DEPLOY.md`, "Growing into the full plan").

## Runtime requirements (production)

- A small Linux VM (1 vCPU, 1 GB RAM is plenty): Hetzner, DigitalOcean, Lightsail, any VPS.
- Ports 80 and 443 open. A domain with A (and AAAA) records for `@` and `www` pointing to the VM.
- Docker, or Python 3.9+ and Caddy.
- Optional: an Anthropic API key (console.anthropic.com) for the AI Composer.
- Disk: under 100 MB for the code and content. Uploads and the inbox grow with use.
