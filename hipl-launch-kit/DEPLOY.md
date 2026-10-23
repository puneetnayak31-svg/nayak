# Putting HIPL online

**The current deployment guide is [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)** (one server with Docker and automatic HTTPS, or a static host plus the CMS). The forms are already connected: they post to the CMS at `/api/forms/<kind>`, and submissions land in the CMS Inbox.

The section below is kept for the longer-term plan.

## Growing into the full plan (Next.js + Payload CMS)

The plan asks for an editor-friendly CMS. This static build is the design system and the content model, ready to move into one:

- **Design system:** `assets/css/site.css` holds every token, component and layout rule. Port the tokens into Tailwind's theme and the components into React one to one.
- **Content model:** `src/data/explorations.json` already matches the CMS types in the Explorations spec (series, entries with number, type, level, read time, topics, priority and the sensitive flag, and concepts). Add Payload collections for Exploration, Concept, Source, Voices Article, Contributor, Voices Pitch, Topic and Media, plus Dialogue, Interview, Question, Reading Circle and Dispatch Issue.
- **Components:** each interactive (Knowledge Cards, Meaning Layers, What Would You Do?, Compare Cards, Map, Timeline, Poll, Claim Label, Concept Pop-up, Character Cards, Pull Quote, Chapter) is a self-contained block in `site.js` driven by data attributes, so each becomes a Payload block with the same fields.
- **Workflow:** statuses Draft → Fact-check → Expert review → Ready → Published, roles Admin, Editor, Fact-checker and Contributor coordinator, and a review-due date per entry.

Until then, the built-in CMS (`hipl-website/cms/`) covers editing, the workflow statuses and form submissions.
