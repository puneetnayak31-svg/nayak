# Security

## What's protected and how

| Asset | Protection |
|---|---|
| CMS admin | One shared password, hashed with PBKDF2-SHA256 (200,000 iterations, random salt) in `cms/state/config.json`. Login is rate-limited (10 attempts per 5 minutes per IP, plus a delay after each failure) |
| Sessions | Random 24-byte token in an `HttpOnly; SameSite=Strict` cookie, `Secure` behind HTTPS. 12-hour lifetime. Held in memory, so a restart signs everyone out |
| CSRF | Every admin mutation needs the `X-HIPL: 1` header, which cross-site requests can't send, on top of the SameSite=Strict cookie |
| Public forms | Allow-listed `kind`; strings cut to 8,000 characters; honeypot field; 8 submissions per minute per IP; pitch files limited to `.pdf`/`.docx` and about 5 MB; request bodies capped at 25 MB |
| Stored XSS | All content goes through `sitekit/md.py` or `html.escape` when built; `javascript:` and other link schemes are neutralised; `site.js` and the admin app insert user text with `textContent`. `tests/test_sitekit.py` renders every block type with an XSS payload and fails if any tag or event handler survives |
| Path traversal | Static serving and page editing are confined to their folders (normalised paths with prefix checks; covered by tests); upload names are sanitised |
| Uploads | Only images (png, jpg, webp, gif, svg) and PDFs. They are served from the site's own origin |
| Secrets | API key and password hash are in `cms/state/` (git-ignored). `deploy/.env` is git-ignored. The API key is never sent back to the browser |
| Personal data | Inbox submissions are in `cms/state/inbox/`. IPs are stored only as a truncated SHA-256 hash |
| Transport | Caddy: automatic HTTPS, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: SAMEORIGIN` |
| Container | Runs as uid 1000, not root; no shell needed |

## Known limitations (accepted for v1; revisit as the team grows)

1. **A single shared admin password, no roles.** Everyone with the password is an admin. Fix if needed: add per-user accounts in `config.json` and roles (editor, fact-checker) checked in `Handler.authed()`, or put the CMS behind an identity-aware proxy (Cloudflare Access, Tailscale or oauth2-proxy) restricted to the team's emails. That needs no code change and is recommended.
2. **SVG uploads.** Trusted editors can upload SVGs, and an SVG can contain script if opened directly. Editors are trusted, but if contributor accounts are ever added, drop `svg` from the upload allow-list in `server.py` (`/api/upload`) or serve uploads with `Content-Security-Policy: sandbox`.
3. **Page templates are raw HTML** by design (the "Page text (HTML)" screen). Treat that screen as developer-level access.
4. **No Content-Security-Policy yet.** The site uses no inline event handlers. The offline build inlines its script, so a CSP would apply to the hosted build only. A starting point for Caddy: `default-src 'self'; img-src 'self' data: https://i.ytimg.com; frame-src https://www.youtube-nocookie.com https://www.youtube.com; style-src 'self' 'unsafe-inline'; script-src 'self'`. Test it before enabling.
5. **The rate limits are per process and in memory.** That is fine for one server. Behind a proxy, set `HIPL_TRUST_PROXY=1`, or every visitor shares one limit. Don't set it without a proxy in front, or clients can spoof `X-Forwarded-For`.
6. **No CAPTCHA** on public forms (just the honeypot and rate limit). If spam appears, add Cloudflare Turnstile: a widget in the form templates, plus a check in `public_form()`.
7. **Backups contain secrets and personal data.** Store them encrypted and off the server.

## Operational rules

- Use a strong CMS password (16+ random characters) and change it from the first-time one immediately.
- Never commit `cms/state/`, `deploy/.env` or API keys. CI does not need secrets.
- Rotate the Anthropic API key if a laptop or the server is compromised (console.anthropic.com → API keys). Set a monthly spend limit there.
- Keep the server patched (`unattended-upgrades`), allow SSH with keys only, and leave only ports 22, 80 and 443 open.
- Privacy: the site sets no cookies for visitors and uses no trackers. If you add analytics, use a cookieless one (Plausible or Umami) and update `privacy.html`. Delete Inbox data you no longer need (Inbox → archive, then remove old records from `cms/state/inbox/*.jsonl`), in line with `privacy.html` and India's DPDP Act.

## Reporting a vulnerability

Email the contact address in `src/data/site.json` (`contact_email`) with the details. Please don't open a public issue.
