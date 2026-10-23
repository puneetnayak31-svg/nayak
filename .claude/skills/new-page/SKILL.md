---
name: new-page
description: Build a new HIPL page, section or feature that matches the owner's brief and the Sabha design system. Use whenever asked to add a page, a section, a component or a new kind of content to the website.
---

1. Read `docs/BRIEF.md` (the owner's binding decisions), `docs/DESIGN-SYSTEM.md` and the relevant parts of `docs/reference/` (the specs). If the request conflicts with a decision, stop and ask.
2. Open `hipl-website/src/pages/components.html` and the two closest existing pages (for example `in-person.html`, `dialogues.html`, `about.html`). Reuse their sections, primitives and components. Don't invent new visual patterns if an existing one fits.
3. Make it data-driven:
   - Content editors will change goes in `src/data/*.json`, with fields in `cms/content_model.py`, rendered by a `{{token}}` in `render_data_tokens()` (`build.py`) or a renderer in `sitekit/pages.py`.
   - Everything is escaped.
4. Create the template `src/pages/<name>.html`. It starts with `<!--meta {"title", "description", "nav"} -->`. Use `{{root}}` for every internal link. Add it to `NAV` in `build.py` only if the owner wants it in the main menu.
5. Make it HIPL:
   - One h1, eyebrows, short copy in the brand voice
   - Palette tokens only; square corners
   - The live sun where it adds meaning (`<!--sabha:live ...-->`)
   - `data-share-card` on anything worth sharing
   - Text fallbacks for visuals
   - Works at 375 px
6. Add or extend tests in `hipl-website/tests/` (build tests already check the title, h1, links and tokens; add data tests for new collections).
7. `cd hipl-website && python3 build.py && python3 tools/check.py`. Commit `dist/` with the change.
8. Ask the `design-reviewer` agent (and `content-reviewer` if you wrote copy) to review. Fix what they find.
9. Report: what was added, where editors change it in the CMS, and screenshots if you could take them.
