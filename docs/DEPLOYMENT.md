# Deployment: putting HIPL live on its domain

Choose one of three setups:

| Option | What runs where | Forms and Inbox | CMS editing | Effort |
|---|---|---|---|---|
| **A. One server (recommended)** | A VPS runs the CMS, which also serves the site, behind Caddy | Work | In the browser, live | About 1 hour |
| B. Static host + CMS server | Vercel or Netlify serve `dist/`; a small VPS runs the CMS on `cms.<domain>` | Work (CORS) | Edits reach the site via a git push | About 2 hours |
| C. Static only | Vercel, Netlify or GitHub Pages serve `dist/` | Don't work until a backend is added | Edit JSON in git, or run the CMS locally and push | About 15 minutes |

Option A is the simplest setup with everything working: the CMS, the forms and the Inbox, AI drafts, and Publish updating the live site instantly.

---

## Before you start (all options)

1. **Domain.** In `hipl-website/src/data/site.json`, set `"site_url": "https://<your-domain>"` (or edit it in CMS → Site settings → "Website address"). It is used for canonical links, Open Graph images, the sitemap and calendar links. Rebuild and commit `dist/`.
2. **Read** `hipl-launch-kit/LAUNCH-CHECKLIST.md` for the content side: placeholders, sample labels, `VERIFY` markers and speaker names.
3. **Run the checks** locally: `cd hipl-website && python3 tools/check.py`.

---

## Option A: one server with Docker and Caddy (recommended)

### 1. Server
- Ubuntu 24.04 LTS (or any Linux), 1 vCPU and 1 GB RAM.
- Install Docker: `curl -fsSL https://get.docker.com | sh`.
- Firewall: allow 22, 80 and 443 (`ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable`).

### 2. DNS
At your registrar or DNS provider, create:

| Type | Name | Value |
|---|---|---|
| A | `@` | server IPv4 |
| A | `www` | server IPv4 |
| AAAA | `@` and `www` | server IPv6 (if it has one) |

Wait until `dig +short <domain>` returns the server IP. Caddy needs this to get the certificate.

### 3. Code
```bash
sudo mkdir -p /srv/hipl && sudo chown $USER /srv/hipl
git clone https://github.com/<owner>/<repo>.git /srv/hipl
cd /srv/hipl
cp deploy/.env.example deploy/.env
nano deploy/.env        # HIPL_DOMAIN, HIPL_CMS_PASSWORD, HIPL_UID/GID (id -u / id -g), optional ANTHROPIC_API_KEY
chmod 600 deploy/.env
```

### 4. Start
```bash
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
docker compose -f deploy/docker-compose.yml --env-file deploy/.env logs -f
```

Within a minute:
- `https://<domain>/` serves the website (HTTPS certificate issued automatically).
- `https://www.<domain>/` redirects to the bare domain.
- `https://<domain>/admin` is the CMS. Sign in with `HIPL_CMS_PASSWORD`.
- `https://<domain>/api/health` returns `{"ok": true, ...}`.

`HIPL_CMS_PASSWORD` is used only on first start, when `hipl-website/cms/state/config.json` doesn't exist yet. After that, change the password in the CMS under Settings. To reset a forgotten password, stop the stack, delete `cms/state/config.json` (this also clears the saved API key and deploy hook), and start it again.

### 5. Turn on the AI Composer
Paste an Anthropic API key in CMS → Settings, or set `ANTHROPIC_API_KEY` in `deploy/.env` and restart. The `anthropic` SDK is already in the Docker image.

### 6. Back up and sync content (cron)
The CMS writes content into the checkout on the server. Commit it back to git so the repo stays the source of truth:

```bash
# on the server, as the user that owns /srv/hipl
crontab -e
*/30 * * * * /srv/hipl/deploy/sync-content.sh >> /var/log/hipl-sync.log 2>&1
15 3 * * *   /srv/hipl/deploy/backup.sh /var/backups/hipl >> /var/log/hipl-backup.log 2>&1
```

- `sync-content.sh` rebuilds, commits `src/data`, `src/pages`, `assets/uploads` and `dist/`, pulls (merge) and pushes. The server needs push access: add a **deploy key with write access** (GitHub → repo → Settings → Deploy keys) and use the SSH remote (`git remote set-url origin git@github.com:<owner>/<repo>.git`). Set `HIPL_CONTENT_BRANCH` to push to a specific branch.
- `backup.sh` archives `cms/state` (inbox submissions, password hash, API key, history) plus the content, and keeps 30 days. **Copy the archives off the server** (for example with `rclone` to object storage). They contain personal data.

### 7. Updating the code
```bash
cd /srv/hipl
deploy/sync-content.sh                    # commit any pending CMS edits first
git pull
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
```
The site rebuilds when someone presses Publish. To rebuild right away: `docker compose -f deploy/docker-compose.yml exec cms python build.py`.

### 8. Rolling back
- Content: CMS → any section → History → Restore. Or `git revert` the content commit and rebuild.
- Code: `git checkout <previous-tag-or-commit>`, then `up -d --build`.

### Without Docker (systemd + Caddy)
```bash
sudo apt install -y python3 caddy git
sudo useradd --system --home /srv/hipl hipl && sudo git clone <repo> /srv/hipl && sudo chown -R hipl:hipl /srv/hipl
# optional, for AI: a virtualenv (Ubuntu blocks system-wide pip), then point the unit at it
sudo apt install -y python3-venv && sudo -u hipl python3 -m venv /srv/hipl/.venv && sudo -u hipl /srv/hipl/.venv/bin/pip install anthropic
#   and in deploy/hipl-cms.service: ExecStart=/srv/hipl/.venv/bin/python cms/server.py --no-browser
echo "HIPL_CMS_PASSWORD=<long-password>" | sudo tee /etc/hipl-cms.env && sudo chmod 600 /etc/hipl-cms.env
sudo cp /srv/hipl/deploy/hipl-cms.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable --now hipl-cms
# Caddy: use deploy/Caddyfile with the variables filled in
sudo sed -e 's/{$HIPL_DOMAIN}/<domain>/g' -e 's/{$HIPL_UPSTREAM}/127.0.0.1:8800/' /srv/hipl/deploy/Caddyfile | sudo tee /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

### PaaS alternatives (Render, Railway, Fly.io)
Deploy `hipl-website/Dockerfile` and set the env vars from the table below.
- **Attach a persistent disk/volume.** Without one, every redeploy loses CMS edits, the inbox and the password.
- The CMS writes to five places under `/app`: `cms/state`, `src/data`, `src/pages`, `assets/uploads` and `dist`. All five must be on persistent storage. On a platform with a single volume this is awkward, which is why Option A is recommended.
- Set `HIPL_TRUST_PROXY=1`, because these platforms terminate TLS for you.

---

## Option B: static site on Vercel or Netlify, CMS on a subdomain

1. Deploy the CMS as in Option A, on `cms.<domain>`: set `HIPL_DOMAIN=cms.<domain>` and add an A record for `cms`.
2. In `deploy/.env`, set `HIPL_FORMS_ORIGINS=https://<domain>,https://www.<domain>`, then restart.
3. In CMS → Site settings → "Forms endpoint", set `https://cms.<domain>/api/forms/`, then Publish.
4. Vercel → New Project → import the repo.
   - Root directory: `hipl-website`
   - Framework preset: Other
   - Build command: none (`dist/` is committed), or `python3 build.py`
   - Output directory: `dist`
   - Add the domain under Settings → Domains.
   - `vercel.json` already sets clean URLs and security headers.
5. Content flow: an editor publishes in the CMS, `sync-content.sh` pushes to git, and Vercel rebuilds from the push. Run the sync script from cron every few minutes, or after Publish, for faster updates. The CMS "Deploy hook" setting only triggers a rebuild of what is already in git.

Netlify: base directory `hipl-website`, publish directory `hipl-website/dist`, "Pretty URLs" on.

## Option C: static only

As step 4 of Option B, without the CMS. Forms then show an error ("This site isn't connected to the HIPL form service yet"), because `/api/forms/` doesn't exist on a static host. Before launch, either do Option A or B, or point "Forms endpoint" at a form service that accepts JSON POSTs to `<endpoint>/<kind>`.

---

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `HIPL_CMS_PASSWORD` | random (printed once) | First password, used only when `cms/state/config.json` doesn't exist |
| `HIPL_CMS_HOST` | `127.0.0.1` (`0.0.0.0` in Docker) | Bind address |
| `PORT` | `8800` | Port |
| `HIPL_TRUST_PROXY` | off | `1` behind Caddy, nginx or a PaaS: client IP from `X-Forwarded-For` (for rate limits), and `X-Forwarded-Proto: https` makes the cookie `Secure`. **Only set it when a proxy is in front**, or clients can spoof their IP |
| `HIPL_SECURE_COOKIE` | off | `1` always marks the session cookie `Secure` |
| `HIPL_FORMS_ORIGINS` | empty | Comma-separated origins allowed to POST forms cross-origin (Option B) |
| `ANTHROPIC_API_KEY` | empty | AI Composer key if none is saved in Settings |
| `HIPL_CONTENT_BRANCH`, `HIPL_GIT_NAME`, `HIPL_GIT_EMAIL` | current branch, "HIPL CMS" | Used by `deploy/sync-content.sh` |
| `HIPL_DOMAIN`, `HIPL_UID`, `HIPL_GID` | n/a | Used by `deploy/docker-compose.yml` |

## Go-live checklist (technical)

- [ ] `site_url` set to the real domain; site rebuilt; `sitemap.xml` shows the domain
- [ ] HTTPS works for the bare domain; `www` redirects; HSTS header present
- [ ] CMS password changed from the first one; admin URL shared only with editors
- [ ] A test submission of each form arrives in the Inbox (question, RSVP, Dispatch sign-up, pitch with a file)
- [ ] Publish updates the live site
- [ ] Sync cron pushes to git; backup cron writes archives, and they are copied off the server
- [ ] One real AI Composer draft completes (with and without Deep research)
- [ ] Uptime monitor on `https://<domain>/api/health` (UptimeRobot, Better Stack or similar)
- [ ] Optional: Plausible or Umami script added in `build.py` `layout()`
- [ ] Optional: Google Search Console with the sitemap submitted
- [ ] Social links filled in CMS → Site settings
