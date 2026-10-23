# Development

## Setup (2 minutes)

```bash
git clone <repo> && cd <repo>/hipl-website
python3 --version                 # 3.9 or newer; nothing to install
python3 build.py                  # → dist/ (about 46 pages)
python3 cms/server.py             # CMS + site at http://localhost:8800 (password printed in the terminal)
python3 tools/check.py            # all checks; run before every commit
```

Optional:
- `pip install -r requirements.txt` for the AI Composer (the `anthropic` SDK). Set `ANTHROPIC_API_KEY` or paste a key in CMS → Settings.
- `python3 -m http.server -d dist 8000` serves the built site without the CMS (forms will show "not connected").
- `python3 build.py --offline --out /tmp/offline` produces pages that open straight from disk.

The CMS writes to `src/data/` in your checkout. Commit content changes like code, or discard them with `git checkout -- src/data`.

## Daily commands

| Task | Command (from `hipl-website/`) |
|---|---|
| Build | `python3 build.py` |
| Build including drafts | `python3 build.py --drafts --out .preview` |
| All checks | `python3 tools/check.py` (add `--dist` to also require a committed, up-to-date `dist/`) |
| Tests only | `python3 -m unittest discover -s tests -v` |
| One test | `python3 -m unittest tests.test_cms.CMSTest.test_public_form_lands_in_inbox` |
| Link check | `python3 tools/check_links.py dist` |
| Docker | `docker build -t hipl-cms . && docker run -p 8800:8800 -e HIPL_CMS_PASSWORD=dev-password-1 hipl-cms` |
| Re-export launch-kit images | from the repo root: `python3 -m http.server 8790` then `node hipl-launch-kit/templates/render.mjs http://localhost:8790` |
| Regenerate logo SVGs | `pip install fonttools brotli && python3 tools/make_logos.py` |

**Always commit `dist/`** after changing sources (the CMS serves it, static hosts can deploy it as is, and CI checks it's fresh).

## Code conventions

- **Python 3.9 compatible, standard library only** (except `anthropic`, imported lazily in `cms/ai.py`).
  - No `match`, no `X | Y` type unions, no `zip(strict=)`.
  - No backslashes or nested same-type quotes inside f-string expressions (that needs 3.12). Use a helper variable.
  - CI runs Python 3.9 and 3.12.
- **UTF-8 everywhere:** every `open()` passes `encoding="utf-8"`. JSON is written with `ensure_ascii=False, indent=2` (Devanagari must stay readable).
- **Escape everything** that comes from content: `esc()` in `build.py`, `ESC()` in `sitekit`, `md.inline()` or `md.render()` for Markdown. Only page templates are trusted HTML.
- **JS:** a single IIFE in `site.js` and in `admin.js`, ES5-style (`var`, `function`), no dependencies. Features bind to `data-*` attributes and classes, never to page-specific IDs. Insert text with `textContent`.
- **CSS:** use the tokens on `:root` (colours, spacing, radii); mobile-first; respect `prefers-reduced-motion`; check contrast on dark sections.
- **Accessibility:** one `<h1>` per page (tested), real buttons for controls, ARIA tabs for tab widgets, a text fallback for every visual interactive (the `details.fallback` pattern), alt text required for images.
- **Writing in the UI:** short, plain sentences. No exclamation marks in system messages, no emoji.
- Comments explain *why*, sparingly, matching the surrounding code.

## Common changes

### Add a field to something editors can change
1. Add it to the collection in `cms/content_model.py` (for example `f("dress_code", label="Dress code")`).
2. Use it in the renderer (`sitekit/pages.py` or `build.py`), escaped.
3. Optionally add a value in `src/data/*.json`, then build and check.

The admin form appears automatically.

### Add a page
1. Create `src/pages/<name>.html`, starting with `<!--meta {"title": "...", "description": "...", "nav": "<id>"} -->`.
2. To show it in the main nav, add it to `NAV` in `build.py`.
3. Build. `tests/test_build.py` checks the title, the single h1, links and tokens.

### Add a data token
Add a branch in `render_data_tokens()` in `build.py` that replaces `{{my_token}}` with rendered HTML, then use the token in a page template.

### Add an Explorations block type
1. `sitekit/schema.py`: add it to `BLOCKS` with `label`, `help` and `fields`. The CMS Studio form and the AI JSON schema update automatically.
2. `sitekit/blocks.py`: add a branch in `render_block()` that returns escaped HTML. Include a text fallback if it's visual.
3. `assets/js/site.js`: add the behaviour, bound by class or `data-*`, if it's interactive.
4. `assets/css/site.css`: add the styles.
5. Run `tests/test_sitekit.py`. It renders every block type with sample data and an XSS payload.
6. Mention the new block in the composer's catalogue if it needs special guidance. `cms/ai.py` already uses `block_catalogue()` from the schema.

### Add a form
1. In a page template: `<form class="js-form" data-kind="<kind>">`. Include the hidden honeypot `<input name="website">` and a consent checkbox, like the existing forms.
2. Add `<kind>` to `FORM_KINDS` in `cms/content_model.py` (so the server accepts it and the Inbox lists it).
3. Add a confirmation message for it in the `MSG` map in `site.js`.
4. If approving should publish something, extend `approve()` in `cms/server.py`.

### Add a content collection
Add a JSON file in `src/data/`, a collection in `COLLECTIONS` (with `file`, `path`, `key`, `title` and `fields`), loading in `build.py` and a renderer. `tests/test_data.py` checks key uniqueness and that the file exists.

## Testing strategy

| Suite | Covers |
|---|---|
| `tests/test_build.py` | Full build: core pages exist, no unrendered tokens, title and one h1 per page, every internal link resolves, offline build inlines assets |
| `tests/test_data.py` | All JSON parses; unique keys per collection; URL-safe slugs; published entries pass `validate()`; related entries exist; event dates are valid; page templates have meta lines |
| `tests/test_sitekit.py` | Markdown escaping and link schemes; every block type renders, including empty blocks and XSS payloads; validation rules; schema consistency |
| `tests/test_cms.py` | The real HTTP server against temp copies of the data: health, static serving, path traversal, forms (inbox, honeypot, rate limit, proxy IP, CORS), auth (cookie flags, Secure behind HTTPS, login limit, CSRF header), CRUD with history, approving questions, page-editor guards, upload filter, schema/validate, and the AI helpers (offline) |

There are no browser tests yet. For UI changes, check by hand at 375 px and 1280 px, with and without JavaScript, or add Playwright. Node and Playwright are already used by the launch-kit renderer.

## Working with AI coding agents

`AGENTS.md` (read by Codex, Cursor, Copilot, Gemini and others) and `CLAUDE.md` (Claude Code) at the repo root give agents the map, the commands and the rules. Claude Code also gets project subagents and skills in `.claude/`:

- `/verify`: run all checks and summarise the failures
- `/new-exploration`: draft an Explorations entry as blocks JSON, following the editorial rules
- `/release-check`: go through the go-live checklist
- Subagents: `content-reviewer` (editorial rules and placeholders), `security-reviewer` (escaping, auth, paths) and `deploy-helper`

Ask an agent to run `python3 tools/check.py` after every change. That is the definition of done.
