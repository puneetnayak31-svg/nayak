# HIPL website

The website for HIPL — Hinduism in Public Life, on the Sabha identity (Direction A). Static and mobile-first; about 50 pages generated from `src/` by `build.py` (Python standard library only), with a built-in CMS (`cms/`) for editing everything and drafting Explorations with AI. See `CMS-GUIDE.md`.

```bash
python3 build.py                  # build into dist/
python3 -m http.server -d dist    # preview at http://localhost:8000
python3 cms/server.py             # the CMS at http://localhost:8800/admin
python3 build.py --offline        # self-contained pages for opening from disk (CSS/JS inside each page)
python3 tools/check.py            # every check: build, links, content, renderer, CMS API (run before committing)
```

Developer documentation (architecture, deployment, API, security) is in [`../docs/`](../docs/HANDOFF.md). AI agents: see [`../AGENTS.md`](../AGENTS.md).

## What's here

| Path | What it is |
|---|---|
| `src/pages/` | One HTML fragment per page; folders mirror the URLs |
| `src/data/explorations.json` | The 3 series, 36 planned entries and the concept glossary |
| `src/data/questions.json` | The 100 Questions: answers, who answers, comments |
| `src/data/*.json` | Site settings, events, programmes, team, interviews, Voices, Dispatch, Reading Circle |
| `sitekit/` | Renderers: Markdown, Explorations blocks, events, In Person, Voices and more |
| `cms/` | The CMS server, admin app and AI Composer |
| `assets/css/site.css` | Design tokens and every component |
| `assets/js/site.js` | Interactives, filters, forms, generative cover art, analytics hooks |
| `assets/brand/` | Logo family, outlined from the master artwork (`tools/make_logos.py`) |
| `build.py` | Layout, header and footer, card rendering, series pages, sitemap |
| `vercel.json` | Clean URLs and headers for Vercel |
| `tests/` | unittest suite (`python3 tools/check.py`) |
| `tools/` | `check.py`, `check_links.py`, `find_placeholders.py`, `make_logos.py` |
| `Dockerfile`, `requirements.txt` | Container image for the CMS; `anthropic` is the only (optional) dependency |
| `EDITOR-GUIDE.md` | How to update content |

## Pages

Home · Dialogues + Dialogue 01 event page · Interviews + sample episode · The First 100 Questions (list + one page per question, with answers and comments) · Explorations hub, 3 series pages, 5 sample entries (Dharma, Six Schools, Nachiketa, Arjuna's Dilemma, Many Ramayanas) and a concept page · Reading Circle + reading guide · Dispatch + sample issue · About · Write for HIPL · Voices + sample article + contributor page · Privacy · Corrections · Component library.

## Content rules

Sample content is labelled "Sample". People, dates and venues that aren't confirmed are `[PLACEHOLDERS]`. Quotations and verse numbers that need checking carry a `VERIFY` marker. Nothing is invented. See `../hipl-launch-kit/LAUNCH-CHECKLIST.md` before going live and `../docs/DEPLOYMENT.md` for hosting, the domain and forms.
