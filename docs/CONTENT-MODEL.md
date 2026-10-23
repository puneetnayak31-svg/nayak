# Content model

All content lives in `hipl-website/src/data/*.json` (UTF-8, 2-space indent, `ensure_ascii=False`). The CMS edits these files; developers and AI agents can edit them directly too. After editing, run `python3 build.py` and `python3 tools/check.py`.

The **authoritative field list** for everything the CMS can edit is `hipl-website/cms/content_model.py`. This page explains the meaning and the conventions.

## Files

| File | Holds | Rendered on |
|---|---|---|
| `site.json` | Name, tagline, `site_url`, description, announcement bar, homepage hero (Sanskrit line, three headline lines, lede, CTAs, floating questions), ticker, working test, contact email, social links, partners, `forms_endpoint` | Every page (layout), Home, About |
| `events.json` → `events[]` | Launch, Dialogues, Salons, Heritage Walks, Seva Saturdays… (`kind`, `status`, `date` YYYY-MM-DD, `start` HH:MM, `time_label`, `venue`, `address`, `company[]`, `programme[]`, `motion`, `hosted_by`, `speakers[]`, `moderator`, `rsvp`, `featured`, `dialogue_number`, and afterwards `video_id`, `key_moments[]`, `vote_before`/`vote_after`, `summary`) | `events/<slug>.html`, Home, Dialogues, In Person |
| `programmes.json` | `intro` + `programmes[]` (the six In Person formats; `status` `active`/`starting`/`coming`; `link`) | In Person, Home |
| `questions.json` → `questions[]` | The 100 Questions: `n`, `q`, `asked_by`, `theme`, `status` (`received`/`answering`/`answered`/`hidden`), `answerer{}`, `answer` (Markdown), `video`, `comments[]` | `questions.html`, `questions/NNN.html` |
| `explorations.json` | `series[]` (3), `types{}`, `entries[]` (36: planned and built), `concepts[]` (glossary) | Explorations hub, series pages, entry pages, concept pop-ups |
| `interviews.json` | `themes[]`, `episodes[]` | Interviews, Home |
| `voices.json` | `formats[]`, `articles[]` (with `writer{slug}` → contributor pages) | Voices, `voices/<slug>`, `contributors/<slug>` |
| `dispatch.json` | `issues[]`, `schedule[]` | Dispatch, `dispatch/issue-NN` |
| `reading_circle.json` → `months[]` | Text of the month, sessions, guide | Reading Circle, `reading-circle/guide` |
| `team.json` → `team[]` | `name` (unique, it's the key), `role`, `founder`, `bio`, `photo`, `links[]` | About |

## Explorations entries

```jsonc
{
  "n": 28,                          // unique number, the CMS key
  "series": "ancient-ideas-modern-life",
  "slug": "seva",                   // URL: explorations/<series>/<slug>.html
  "title": "...", "hook": "...",    // hook: one line for cards
  "type": "explainer",              // a key of explorations.json "types"
  "level": "Beginner",              // or "Deeper"
  "read": 8,                        // minutes
  "topics": ["practice"], "priority": "...", "sensitive": false,
  "status": "planned",              // planned | draft | fact-check | expert-review | ready | published | sample
  "built": false,                   // true = hand-written page in src/pages/explorations/
  "blocks": [ { "type": "hook", "text": "..." }, ... ],
  "sources": [ { "text": "Edition, translator, page", "url": "", "verify": false } ],
  "related": [2, 30, 32],           // entry numbers
  "made_with": "cms"                // or "ai-composer"
}
```

Publishing: an entry with `blocks` gets a page when its status is `published` or `sample`. `sitekit.blocks.validate()` lists what must be fixed before publishing (missing sources, a pull quote without a source, an image without alt text, any `VERIFY`). The CMS shows this list, and `tests/test_data.py` enforces it for `published` entries.

### Block types (`sitekit/schema.py`)

Field kinds: plain text unless marked. `md` is Markdown, `claim` is a claim label, `[ ... ]` is a repeating list.

| type | Label | Fields |
|---|---|---|
| `hook` | Hook | text:md |
| `context` | Context | body:md |
| `chapter` | Chapter | title, claim:claim, body:md |
| `pull_quote` | Pull quote | text:md, source, translator, verify:bool |
| `knowledge_cards` | Knowledge cards | title, cards[ kicker, title, deva, text:md, source ] |
| `meaning_layers` | Meaning layers | term, layers[ label, eyebrow, title, text:md ] |
| `scenarios` | Everyday scenarios | title, items[ tab, scenario:md, perspectives[ title, text:md, claim:claim ] ] |
| `dilemma` | What would you do? | title, scenario:md, options[ label, perspective_title, perspective:md, claim:claim ] |
| `compare` | Compare cards | title, columns[ name, deva ], rows[ label, cells (separated by `\|`) ] |
| `characters` | Character cards | title, characters[ name, deva, role, text:md ] |
| `scene` | Illustrated scene | title, text:md, image:image, alt, art:select(1–6), pause |
| `map` | Explore the map | title, intro:md, points[ label, title, region, lat:number, lon:number, on_map:bool, author, period, differs:md, claim:claim ] |
| `timeline` | Timeline | title, events[ when, confidence:(approximate\|debated\|firm), label, text:md, claim:claim ] |
| `poll` | Poll / reflection | question, options[ label ] |
| `interpretations` | Interpretations | title, items[ title, text:md, claim:claim ] |
| `why` | Why it matters today | title, text:md |
| `image` | Image | src:image, alt, caption, credit |
| `video` | Video | youtube (ID or URL), caption |
| `callout` | Callout | title, text:md |
| `text` | Text section | title, body:md |

Claim labels: `text` (The text says), `tradition` (Tradition holds), `historians` (Historians find), `debate` (Scholars debate), `asks` (HIPL asks), or empty.

## Markdown (`sitekit/md.py`)

This is a small, safe subset. All HTML is escaped, so raw HTML in content never renders.
- `**bold**`, `*italic*`, `[label](url)` (only `http(s):`, `mailto:`, `#` and relative links; `javascript:` and other schemes become `#`)
- Paragraphs, `## h2`, `### h3`, `> quote`, `- list`, `1. list`
- `[[dharma]]` or `[[dharma|shown text]]`: a concept pop-up (keys in `explorations.json` → `concepts`)
- `[^1]`: a citation to source 1. `[VERIFY ...]`: a visible marker that blocks publishing

## Page templates (`src/pages/**/*.html`)

Each file starts with `<!--meta {"title": "...", "description": "...", "nav": "<nav id>"} -->`, followed by an HTML fragment. These are trusted templates: they are written by developers, or by editors through the CMS "Page text (HTML)" screen, and they are not escaped. Data-driven sections use `{{tokens}}` (see [ARCHITECTURE.md](ARCHITECTURE.md#1-the-build-buildpy)).

## Editorial conventions

These rules are not negotiable. AI agents must follow them too.
- **Never invent** quotations, verse numbers, dates, people, speakers or venues. Unknown facts stay as `[PLACEHOLDER]` text, for example `[SPEAKER NAME]` or `[DATE]`. Uncertain facts get `[VERIFY]`.
- Name the version of every text (which edition, translation, tradition or region).
- Show more than one interpretation where they exist; frame modern connections as questions.
- Sample content keeps `"status": "sample"` and is labelled "Sample" on the site.
- The full rules are `EDITORIAL_RULES` in `cms/ai.py` and `hipl-website/EDITOR-GUIDE.md`.

## Inbox records (`cms/state/inbox/<kind>.jsonl`, not in git)

```json
{"id": "a1b2c3d4e5f6", "kind": "question", "at": "2026-10-23 09:30", "status": "new|approved|done|archived",
 "from": "<sha256(ip)[:10]>", "data": {"question": "...", "name": "...", "page": "/questions.html"}}
```
IP addresses are stored only as a truncated hash. Submissions contain personal data (names, emails), so treat `cms/state/` as confidential.
