---
name: new-exploration
description: Draft a new HIPL Explorations entry (interactive explainer page) as blocks JSON in src/data/explorations.json, following the editorial rules. Use when asked to create, outline or draft an Exploration on a topic.
---

Goal: a draft entry that renders as an immersive, interactive page and is honest about what still needs checking.

1. Read `docs/CONTENT-MODEL.md` (block types and fields), `hipl-website/sitekit/schema.py` (exact fields) and `EDITORIAL_RULES` in `hipl-website/cms/ai.py`. Look at entry `n: 28` (`slug: "seva"`) in `src/data/explorations.json` as a model of a block-built entry.
2. Find the entry: if the topic matches a planned entry (`status: "planned"`), fill that one (keep its `n`, `series`, `slug`). Otherwise add a new entry with the next free `n` and the right `series`.
3. Build 8–16 blocks in reading order:
   - Start with `hook` and `context`, then 3–6 `chapter`s with claim labels.
   - Include at least two interactive blocks (`knowledge_cards`, `meaning_layers`, `scenarios`, `dilemma`, `compare`, `map`, `timeline` or `poll`).
   - End with `interpretations` and `why`.
   - Use `[[concept]]` only for keys present in `concepts`.
4. Sources go in `sources[]` (`text` names the edition and translator; `verify: true` if not yet checked) and are cited inline as `[^n]`. **Never invent quotations, verse numbers, dates or people.** Mark anything uncertain `[VERIFY]` and put pull quotes in only with a real named source.
5. Set `"status": "draft"`, `"made_with": "agent"`, plus `level`, `read`, `hook` and `topics`.
6. Validate:
   ```bash
   cd hipl-website
   python3 -c "import json,sys; sys.path.insert(0,'.'); from sitekit import blocks; e=[x for x in json.load(open('src/data/explorations.json',encoding='utf-8'))['entries'] if x['n']==N][0]; print(blocks.validate(e))"
   python3 build.py --drafts --out .preview
   python3 tools/check.py
   ```
   Replace `N` with the entry number. The page is at `.preview/explorations/<series>/<slug>.html`.
7. Report the page path, the block outline, and the fact-check list (every `[VERIFY]` and every source with `verify: true`). Suggest running the `content-reviewer` agent.

If the user has the CMS running with an API key, the AI Composer (CMS → AI Composer) can do the same with web research. Mention it as an option.
