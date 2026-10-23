# CLAUDE.md

@AGENTS.md

## Claude Code specifics

- Project skills (`.claude/skills/`):
  - `/verify` runs every check and explains the failures
  - `/new-exploration <topic>` drafts an Explorations entry as blocks JSON
  - `/release-check` walks through the go-live checklist
  - `/new-page` builds a page or feature that matches the brief and the design system
- Project subagents (`.claude/agents/`):
  - `content-reviewer`: editorial rules, placeholders, invented facts
  - `security-reviewer`: escaping, auth, paths, secrets
  - `deploy-helper`: server, DNS, Docker, Caddy, crons
  - `design-reviewer`: brand, theme and owner decisions for any UI change
- `.claude/settings.json` pre-allows the read-only and check commands (build, tests, link check, git status/diff/log). Anything that pushes, deploys or deletes still asks.
- When changing the AI Composer (`hipl-website/cms/ai.py`), use the `claude-api` skill for current Anthropic SDK shapes. Keep the model id configurable (default `claude-opus-5-5`), keep `server-side-fallback-2026-07-01` with `fallbacks="default"`, and keep the typed error handling.
- Finish every task by running `python3 tools/check.py` from `hipl-website/` and reporting the result.
