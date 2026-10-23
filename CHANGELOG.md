# Changelog

## 2026-10-23: Owner's brief and design system in the repo
- `docs/BRIEF.md`: every instruction from the owner, in order, plus the decisions log (D1–D16) and the spec items not yet done.
- `docs/DESIGN-SYSTEM.md`: Sabha brand rules as implemented, with a checklist for any new UI.
- `docs/reference/`: the owner's original specs and brand guidelines (originals + readable Markdown).
- `tests/test_design.py`: palette, fonts, square corners and no glows are now enforced. Three stray colours became tokens.
- AI agent files point to the brief and the design system; added the `design-reviewer` agent and the `/new-page` skill.

## 2026-10-23: Developer hand-off
- Developer docs in `docs/`: hand-off, architecture, tech stack, deployment, content model, CMS API, development, security.
- AI agent instructions: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, Claude Code subagents and skills in `.claude/`.
- Production deployment: `hipl-website/Dockerfile`, `deploy/docker-compose.yml` with Caddy (automatic HTTPS), systemd unit, `.env.example`, content-sync and backup scripts.
- CMS hardening:
  - client IP from `X-Forwarded-For` behind a trusted proxy (`HIPL_TRUST_PROXY`)
  - `Secure` session cookie behind HTTPS
  - login rate limit
  - `/api/health`
  - CORS for cross-origin forms (`HIPL_FORMS_ORIGINS`)
  - stricter static-path check
  - an env-provided first password is no longer stored for display
- Security fixes:
  - Knowledge Card text is now HTML-escaped (it was injectable)
  - concept names are escaped in pop-ups and glossary chips
- Team placeholders renamed so each team member has a unique key.
- Tests (46) and CI: build, links, content, renderer XSS, CMS API; Python 3.9 and 3.12; Docker smoke test. Tools: `tools/check.py`, `tools/check_links.py`, `tools/find_placeholders.py`.

## 2026-10-22: CMS, In Person, launch event
- CMS with Explorations Studio, Inbox, AI Composer, history, media, preview and publish.
- In Person section; the 31 October 2026 launch as Dialogue 01; co-founders on About; new homepage headline; smoother About-page sun; share engine (post and story images, quote cards, social links).

## Earlier
- Offline package; founder feedback round; launch kit; first full build of the site on the Sabha identity.
