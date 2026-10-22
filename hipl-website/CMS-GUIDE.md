# HIPL CMS guide

The HIPL CMS edits everything on the website: the homepage headline, the announcement bar, events and Dialogues, the In Person programmes, the 100 Questions and their answers, the Explorations library, Interviews, Voices, the Weekly Dispatch, the Reading Circle, the team and partners. It also collects everything people send through the website forms, and drafts new Explorations with AI.

## Start it

**On your computer.** Double-click `Start HIPL CMS` (Windows `.bat`, Mac `.command`) in the offline package, or run:

```bash
python cms/server.py          # Mac: python3 cms/server.py
```

Your browser opens at http://localhost:8800/admin. The first time, the password is printed in the CMS window (and shown once on the dashboard). Change it under **Settings**.

Leave the window open while you work. The website itself is served at http://localhost:8800/ and its forms send submissions straight into your Inbox.

Needs Python 3.9 or newer (free from python.org). Nothing else, except the AI Composer (below).

## What's where

| Menu | What you edit |
|---|---|
| Dashboard | New submissions, upcoming events, the Explorations workflow, AI status |
| Inbox | Questions, RSVPs, pitches, comments, sign-ups, corrections. Approve a question to publish it in the 100 Questions; approve a comment to add it under its question. Download any list as CSV. |
| AI Composer | Draft a new Explorations entry from a topic, notes, an article, links, images and PDFs |
| Site settings & homepage | Headline, Sanskrit line, announcement bar, ticker, partners, social links |
| Events & Dialogues | The launch, every Dialogue, Salon, Heritage Walk, Seva Saturday. Give an event a Dialogue number to list it under Dialogues. Add the YouTube video, key moments and vote result after the event. |
| In Person programmes | The six formats on the In Person page |
| 100 Questions | Who is answering, the written answer, a video answer, approved comments |
| Explorations | The library. Opens in the **Studio**: build a page from blocks, check it, move it through the workflow |
| Interviews, Voices, Weekly Dispatch, Reading Circle, Team | As named |
| Page text (HTML) | Long pages such as Write for HIPL and Privacy |
| Media library | Upload images and PDFs |
| Preview & publish | Preview (includes drafts, only you can see it), Publish, and optionally Deploy |
| Settings | Password, Anthropic API key, AI model, deploy hook |

Every save keeps the previous version. Use **History** on any section to restore one.

## Build an Exploration in the Studio

1. Open **Explorations**, pick an entry (or **Add new**).
2. Add blocks in reading order with **+ Add a block**: Hook, Context, Chapter, Pull quote, Knowledge cards, Meaning layers, Everyday scenarios, What would you do?, Compare cards, Character cards, Illustrated scene, Explore the map, Timeline, Poll, Interpretations, Why it matters, Image, Video, Callout, Text section.
3. In text, use `[[dharma]]` for a glossary pop-up, `[^1]` to cite source 1, and `[VERIFY]` for anything still to check.
4. Each block has an **Ask AI** box: "shorter", "add two cards on artha and kama", "turn this into a workplace dilemma".
5. **Save & preview** to see the real page. The panel on the right lists what must be fixed before publishing (missing sources, quotes without a source, images without alt text, VERIFY markers).
6. Move it through **draft → fact-check → expert-review → ready → published**, then **Publish**.

## The AI Composer

One-time setup:
1. Install the Anthropic SDK: double-click `Install AI support`, or run `pip install anthropic`.
2. Create an API key at console.anthropic.com and paste it under **Settings → AI Composer**. It's stored only on this computer.

Then open **AI Composer**: pick a planned entry (or start a new one), add your notes, paste an article, drop in images or PDFs, list links you trust, and press **Draft the page**. With **Deep research** on, Claude searches and reads the web first, preferring original texts, named translations and peer-reviewed sources. The draft arrives in the Studio as **draft**, with a checklist for the fact-checker.

The Composer follows HIPL's editorial rules: it never invents quotes, verses, dates or people, marks anything uncertain `VERIFY`, names the version of every text, shows more than one interpretation, and puts a claim label on key passages. A writer, a fact-checker and an editor still sign off every entry.

The Composer uses Claude Opus 5.5 by default (change it in Settings), and turns on Anthropic's server-side fallback, so if a request is declined it can be retried on another model automatically. Costs depend on length and research; check usage in your Anthropic console.

## Publishing

- **On your computer:** Publish rebuilds the site in `dist/`. Upload `dist/` to any host, or let Vercel build it from GitHub.
- **Hosted CMS:** run the CMS on a small server (any VPS, Render or Railway) so the website, its forms and the admin live together:
  ```bash
  HIPL_CMS_PASSWORD='a-long-password' python cms/server.py --host 0.0.0.0 --port 8800
  ```
  Put it behind HTTPS (for example Caddy or the host's built-in TLS). Then Publish updates the live site directly, and every form submission lands in the Inbox.
- **Vercel or Netlify for the public site:** paste the deploy hook URL under Settings, and **Publish & deploy** triggers a deploy. (Forms then need a backend; see DEPLOY.md.)

## Where data lives

- Content: `src/data/*.json` (commit these to git).
- Uploads: `assets/uploads/`.
- CMS state (password hash, API key, inbox, history): `cms/state/`. Not committed. Back it up.
