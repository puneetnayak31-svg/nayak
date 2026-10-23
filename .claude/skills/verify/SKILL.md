---
name: verify
description: Run every HIPL check (compile, build, links, content, renderer XSS, CMS API) and explain any failure with the fix. Use after any change, before committing, or when asked whether the project is healthy.
---

Run from `hipl-website/`:

```bash
python3 tools/check.py --dist
```

- If everything passes, say so in one line, with the test count.
- If `dist/ matches the sources` fails, run `python3 build.py`, check that `git diff --stat -- dist` only shows files the change should affect, and tell the user to commit `dist/`.
- For a failing test:
  1. Rerun it alone with `python3 -m unittest <module>.<Class>.<test> -v`.
  2. Read the assertion and the code it covers.
  3. Find the root cause and fix it in the source, not the test, unless the test is wrong.
  4. Rerun the full check.
- Never skip, delete or weaken a test to get green.
- Also run `python3 tools/find_placeholders.py` and mention the count if the change touched content.

Report: pass/fail per step, what you fixed, and anything still failing with the exact output.
