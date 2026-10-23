# CMS HTTP API

Everything is served by `hipl-website/cms/server.py`. Request and response bodies are JSON unless noted. Errors look like `{"error": "message"}` with a 4xx or 5xx status.

**Auth.** `POST /api/login` sets the `hipl_cms` cookie (HttpOnly, SameSite=Strict, 12 h, plus `Secure` behind HTTPS). Every `POST`, `PUT` and `DELETE` under `/api/` (except login and forms) must also send the header `X-HIPL: 1`. A cross-site form can't set that header, so it is the CSRF guard.

## Public (no login)

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/health` | n/a | `{"ok": true, "built": bool}`, for uptime monitors and Docker healthchecks |
| GET | `/api/status` | n/a | `{"signed_in": bool, "first_run": bool}` |
| POST | `/api/forms/<kind>` | form fields | `kind` is one of `dispatch`, `question`, `comment`, `rsvp`, `dialogue-question`, `circle`, `pitch`, `guest`, `correction`, `interest` (`content_model.FORM_KINDS`). Strings are cut to 8,000 characters and keys to 40. A non-empty `website` field is the honeypot: the server answers 200 and stores nothing. `pitch` accepts one file `{name, type, data(base64)}`, `.pdf` or `.docx`, up to about 5 MB. Rate limit: 8 per minute per IP, then 429. CORS for `HIPL_FORMS_ORIGINS` |
| OPTIONS | `/api/forms/<kind>` | n/a | CORS preflight (204) for allowed origins only |
| POST | `/api/login` | `{"password"}` | 200 sets the cookie; 401 wrong password; 429 after 10 attempts in 5 minutes |
| GET | `/`, `/<page>` | n/a | Built site from `dist/` with clean URLs |
| GET | `/admin/` | n/a | Admin app |

## Signed in

| Method | Path | Body / query | Returns |
|---|---|---|---|
| POST | `/api/logout` | n/a | Clears the session |
| GET | `/api/schema` | n/a | `{collections, blocks, claims, forms}`: the admin builds its forms from this |
| GET | `/api/dashboard` | n/a | Inbox counts, Explorations by status, upcoming events, AI status |
| GET | `/api/content/<collection>` | n/a | The item list (or the object, for single collections like `settings`) |
| POST | `/api/content/<collection>` | item | Create. Missing `slug`, `n` or `number` keys are generated. 409 on a duplicate key |
| PUT | `/api/content/<collection>/<key>` | item | Update (merged, so unknown fields are kept). For single collections: `PUT /api/content/settings` |
| DELETE | `/api/content/<collection>/<key>` | n/a | Delete |
| GET | `/api/validate/<n>` | n/a | `{"problems": [...]}`: the publish checklist for Exploration `n` |
| GET | `/api/inbox?kind=` | n/a | Submissions, newest first |
| POST | `/api/inbox/<kind>/<id>/(approve\|done\|archive\|new)` | `{}` | Changes status. `approve` publishes questions and comments |
| GET | `/api/inbox.csv?kind=` | n/a | CSV download |
| GET | `/api/inbox/file/<name>` | n/a | Download a pitch attachment |
| GET | `/api/pages` | n/a | List of `src/pages/**/*.html` |
| GET / PUT | `/api/pages/<path>.html` | `{"html"}` | Read or replace a page template. The HTML must start with `<!--meta {...} -->` |
| GET | `/api/media` | n/a | Uploaded files |
| POST | `/api/upload` | `{name, data(base64)}` | png, jpg, webp, gif, svg or pdf, saved to `assets/uploads/` |
| DELETE | `/api/media/<name>` | n/a | Delete an upload |
| GET | `/api/history/<file>` | n/a | Saved versions of `src/data/<file>.json` (newest first) |
| POST | `/api/history/<file>/restore` | `{"version"}` | Restore one (the current file is saved to history first) |
| POST | `/api/build` | `{"preview": bool}` | Runs `build.py` (preview: `--drafts` into `.preview/`). Returns `{ok, log}` |
| POST | `/api/deploy` | `{}` | Build, then POST to the deploy hook |
| POST | `/api/ai/compose` | `{topic, series, type, level, read, element, notes, article, links, attachments[], deep_research: bool}` | `{"job": id}`. Poll `/api/jobs/<id>` |
| GET | `/api/jobs/<id>` | n/a | `{status: running\|done\|error, log[], result, error}` |
| POST | `/api/ai/assist` | `{block, instruction, context}` | The rewritten block |
| GET / POST | `/api/settings` | `{current_password, new_password}`, `{api_key}`, `{clear_api_key}`, `{model}`, `{deploy_hook}` | The API key is never returned, only `api_key_set` |

## Collections (`content_model.COLLECTIONS`)

| id | File → path | Key |
|---|---|---|
| `settings` | `site.json` (single) | n/a |
| `events` | `events.json` → `events` | `slug` |
| `programmes` | `programmes.json` → `programmes` | `slug` |
| `inperson_intro` | `programmes.json` (single) | n/a |
| `questions` | `questions.json` → `questions` | `n` |
| `explorations` | `explorations.json` → `entries` | `n` |
| `concepts` | `explorations.json` → `concepts` | `term` |
| `interviews` | `interviews.json` → `episodes` | `slug` |
| `voices` | `voices.json` → `articles` | `slug` |
| `dispatch` | `dispatch.json` → `issues` | `number` |
| `circle` | `reading_circle.json` → `months` | `slug` |
| `team` | `team.json` → `team` | `name` (names must be unique) |

Field-level detail lives in `hipl-website/cms/content_model.py` and [CONTENT-MODEL.md](CONTENT-MODEL.md).
