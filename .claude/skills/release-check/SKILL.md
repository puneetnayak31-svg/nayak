---
name: release-check
description: Walk through the HIPL go-live checklist (technical and content) and report what is done, what is missing and who must act. Use before launch, before a deploy, or when asked "are we ready to go live?".
---

Check each item and report a table of item, status (done / missing / needs a human) and evidence:

1. `cd hipl-website && python3 tools/check.py --dist` passes.
2. `src/data/site.json`:
   - `site_url` is not `https://hipl.example`
   - `contact_email` is not a placeholder
   - social links are set
   - `forms_endpoint` is right for the chosen deployment (`/api/forms/` when the CMS serves the site)
3. `python3 tools/find_placeholders.py --where`: list the markers outside pages and entries with `"status": "sample"`, especially the launch event (`events.json` → `launch-2026`: speakers, moderator, venue address).
4. `team.json` has no unresolved `[... NAME]` entries, or the owner has accepted them.
5. Poll and "What would you do?" percentages: `docs/HANDOFF.md` §4. Either the vote endpoint exists, or the seeded `data-base` numbers are removed.
6. Deployment (`docs/DEPLOYMENT.md` go-live checklist): HTTPS, www redirect, password changed, each form type reaching the Inbox, Publish working, sync and backup crons, uptime monitor. These need the human or server access, so list them as "needs a human" with the exact command or check.
7. The AI Composer has been tried once against the live API (ask the human).
8. `hipl-launch-kit/LAUNCH-CHECKLIST.md`: summarise the open items.

End with the three most important blockers, in order. Don't change files during this check unless asked.
