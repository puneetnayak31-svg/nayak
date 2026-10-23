# Developer hand-off

**Start here.** This page gives you the current state of the project, what is left before launch, and what to check first. It should take an hour to read and set up.

## 1. What HIPL is

HIPL (Hinduism in Public Life) is a modern ideas platform: Dialogues (public debates), Interviews, *The First 100 Questions*, the Explorations library (interactive explainers), In Person events, Voices (reader essays), a weekly Dispatch and a Reading Circle. The visual identity is "Sabha" (`hipl-launch-kit/` holds the brand assets).

The first public event is the **launch on Saturday 31 October 2026**, 5 PM, at the Constitution Club of India, New Delhi, with a debate hosted by the Delhi Union. The site should be live before then.

## 2. Current state

| Area | State |
|---|---|
| Website (about 46 pages) | Built, responsive, accessible; all internal links pass |
| Content | Real structure; many items are **samples or placeholders** (see §4) |
| CMS (`/admin`) | Working: every collection, Explorations Studio, Inbox, history, media, preview, publish |
| Public forms → Inbox | Working when the site is served by the CMS (tested end to end) |
| AI Composer | Implemented. **Not yet run against the live Anthropic API** (no key during development) |
| Sharing (image cards, quotes, socials) | Working in modern browsers |
| Tests and CI | 46 tests (build, links, content, renderer XSS, CMS API); GitHub Actions on Python 3.9 and 3.12, plus a Docker smoke test |
| Deployment | Docker Compose + Caddy (auto-HTTPS) tested locally; systemd alternative documented |
| Domain | **Not set**. `site_url` is still `https://hipl.example` |

## 3. Your first day

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) (15 minutes) and skim [TECH-STACK.md](TECH-STACK.md).
2. Run it locally:
   ```bash
   cd hipl-website
   python3 tools/check.py         # should end with "All checks passed."
   python3 cms/server.py          # http://localhost:8800/admin, password printed in the terminal
   ```
3. In the CMS:
   - edit the homepage headline, Publish, and see the change at http://localhost:8800/
   - submit the "Ask a question" form on the site, then approve it in the Inbox
4. Pick a deployment option in [DEPLOYMENT.md](DEPLOYMENT.md). Option A (one VPS, Docker, Caddy) is recommended. Agree the domain and server with the project owner.
5. Acceptance: go through the go-live checklist at the end of DEPLOYMENT.md.

## 4. Must do before launch

**Content (with the project owner).** Run `python3 tools/find_placeholders.py --where` to list every remaining marker (99 at hand-off, many of them in clearly labelled sample pages). In particular:
- Launch event (`events.json` → `launch-2026`): speakers and moderator (`[SPEAKER NAME]`, `[MODERATOR NAME]`). Confirm the venue address "Rafi Marg, New Delhi".
- `site.json`: `site_url`, `contact_email` (`[CONTACT EMAIL]`), social links, Delhi Union logo (`partners[0].logo`; currently a text badge).
- `team.json`: three open roles (`[EDITOR NAME]`, `[PRODUCER NAME]`, `[COORDINATOR NAME]`). Remove them or fill them in, and add photos.
- Sample Explorations, the Interview, the Voices article and Dispatch issue 0 are labelled "Sample". Keep or remove each one deliberately.
- `hipl-launch-kit/LAUNCH-CHECKLIST.md` has the editorial and social checklist.

**Technical:**
- Deploy (DEPLOYMENT.md), set the domain, and turn on the sync and backup crons.
- **Poll and "What would you do?" percentages are not real yet.** Results combine numbers hard-coded in the sample pages (`data-base="…"` in `src/pages/explorations/**`) with the visitor's own vote, which is stored in their browser (`localStorage`). Either:
  - **(a)** add a small aggregate endpoint (for example `POST /api/vote/<id>` storing counts in `cms/state/votes.json`, and `GET` returning them) and read it in `initChoice()` in `site.js`, or
  - **(b)** remove the seeded numbers and change the copy to "your choice" only.

  Decide with the owner. Option (a) is about 2 hours including tests.
- Run one real AI Composer draft with a real key (Deep research on and off) and fix anything the live API rejects. The request shapes are in `cms/ai.py` `_call()`, `research()` and `compose()`. See the Anthropic docs for `output_config.format` (structured outputs), the `web_search_20260209` and `web_fetch_20260209` tools, and the `server-side-fallback-2026-07-01` beta.
- Optional: email confirmations (RSVP, pitches). Today submissions only land in the Inbox, with CSV export. A transactional email service (Resend, Postmark) called from `public_form()` would add confirmations.
- Optional: connect Dispatch sign-ups to a newsletter tool (Beehiiv, Buttondown), via a CSV export from the Inbox or an API call in `public_form()`.

## 5. Accounts and credentials needed

| What | Who provides | Where it goes |
|---|---|---|
| Domain registrar or DNS access | Project owner | A records → server |
| VPS (or PaaS) account | Project owner or developer | n/a |
| GitHub repo access (write) | Project owner (Settings → Collaborators) | n/a |
| Deploy key for content sync | Developer creates it; owner adds it in repo Settings → Deploy keys | `~/.ssh` on the server |
| Anthropic API key + monthly spend limit | Project owner (console.anthropic.com) | CMS → Settings, or `deploy/.env` |
| CMS password | Developer sets it; shares it with editors privately | `deploy/.env` (first run), then CMS → Settings |
| Optional: Plausible or Umami, uptime monitor, Search Console | n/a | `build.py` `layout()` / external |

Never send secrets by email or chat in plain text. Use a password manager share.

## 6. Repo housekeeping

- `reels/` is an unrelated project (Instagram reels for an artist's paintings). The owner should decide whether to move it to its own repository before sharing this one more widely.
- `HIPL-website-offline.zip` and `hipl-launch-kit.zip` at the root are packaged copies for non-developers (7.6 MB of binaries in git). Consider moving them to GitHub Releases.
- Work so far is on the branch `claude/funny-keller-lv40pb`. Merge it into `main` (via a PR) and deploy from `main`.

## 7. Known limitations

These are documented and accepted for v1. Details are in [SECURITY.md](SECURITY.md).
- There is one shared admin password and no per-user roles. Putting `/admin` behind Cloudflare Access or Tailscale is the quickest upgrade.
- Sessions and AI jobs live in memory, so a restart signs editors out and cancels a draft in progress.
- There are no browser (E2E) tests. Check UI changes by hand at 375 px and 1280 px.
- There is no image-resizing pipeline. Ask editors to upload web-sized images (max 2000 px, under 500 KB).
- `hipl-launch-kit/DEPLOY.md` ("Growing into the full plan") sketches a future move to Next.js + Payload. It is not needed at this scale.

## 8. Where to find things

| Question | Doc |
|---|---|
| How does it fit together? | [ARCHITECTURE.md](ARCHITECTURE.md) |
| What is it built with? | [TECH-STACK.md](TECH-STACK.md) |
| How do I make it live? | [DEPLOYMENT.md](DEPLOYMENT.md) |
| What are the content fields and rules? | [CONTENT-MODEL.md](CONTENT-MODEL.md) |
| What does the API do? | [CMS-API.md](CMS-API.md) |
| How do I change or extend it? | [DEVELOPMENT.md](DEVELOPMENT.md) |
| Is it safe? | [SECURITY.md](SECURITY.md) |
| How do editors use the CMS? | `hipl-website/CMS-GUIDE.md`, `hipl-website/EDITOR-GUIDE.md` |
| How do AI agents work in this repo? | `AGENTS.md`, `CLAUDE.md`, `.claude/` |
