# Owner's brief and decision log

This file records **what the project owner asked for, and every decision taken while building the site**, so that anyone continuing the work, human or AI, builds what the owner actually wants. The owner is Puneet Nayak.

**Precedence when sources disagree:**
1. The owner's latest instruction (this log, newest first)
2. The specs in [`reference/`](reference/README.md)
3. The brand guidelines ([`reference/brand-guidelines.md`](reference/brand-guidelines.md), implemented in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md))
4. The existing site

Don't reverse a decision recorded here without asking the owner. When the owner makes a new decision, add it to §3.

---

## 1. Standing requirements (always true)

These came from the owner across the whole build. Every change must keep them true.

**Product**
- HIPL is a **modern ideas platform** that makes Hindu thought *interesting and credible* for young people and serious readers. It is **not a religious portal and not a political campaign**.
- The site should feel **"very creative, modern"**, with **immersive, interactive and unique** pages, especially Explorations. Explorations should feel like "a good museum, a smart explainer website and a beautifully illustrated book" (spec §1).
- The site must **follow the Sabha brand guidelines** (Direction A): palette, type, logo rules and voice. See [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
- Pages should be **shareable on social media in different easy forms** (image cards, quote cards, links, captions).
- The site must **run offline from a PC** as well as hosted. It works from `file://` (relative links, `build.py --offline`).
- **"Add anything that adds value and makes the experience better"**, within these rules.

**CMS**
- The CMS must be **"very intelligent and smart"** and **manage pretty much all the dynamic content** on the site.
- For Explorations it must be **"very dynamic"**: from little or a lot of input (notes, media, an article, links, other inputs), or **its own AI deep search**, it must keep producing immersive, interactive, unique pages like the current ones. This is implemented as the block Studio plus the AI Composer.

**Content integrity** (from the specs and the editorial rules)
- Never invent quotations, verses, verse numbers, dates, people, speakers or venues. Unknown facts become `[PLACEHOLDERS]`; uncertain ones are marked `[VERIFY]`.
- Every key claim is sourced and labelled (claim labels). Many interpretations, not one. Modern connections are framed as questions.
- Sample content is labelled "Sample".

## 2. The owner's requests, in order

The owner's words are quoted, lightly trimmed, as given in the chat.

### Request 1: the first build (10 Oct 2026)
> "Create a website for me of HIPL … [using the] brand guidelines and two documents … very creative, modern looking … aligning with the brand guidelines (in both png and zip file) … give me preview of it and also launch kit of it."

The inputs were the Sabha brand guidelines (a PNG and the HTML zip, now in `reference/originals/`), *What We're Building* and the *Explorations & Write for HIPL* spec (both in [`reference/`](reference/README.md)). The output was the website and `hipl-launch-kit/`.

### Request 2: feedback on the first version (with two PDFs by the co-founder)
- **Show the full logo** (symbol + HIPL + "Hinduism in Public Life") in the header and on the homepage.
- **Dialogues** gets a **video/recordings section**, like Interviews.
- **The First 100 Questions**:
  - simple **Q&A**, with **the person answering shown prominently**
  - **video answers**
  - a **comments section**
  - **keep it simple**
  - **remove the links to Explorations**
- **About**: add the founder, **Prannv Dhawan** (spelled as in his byline; the owner wrote "Pranav").
- Use his ideas from **"Hindi, Hindu, Hindustan"** *if contextual, otherwise ignore*. See decision D3.

### Request 3: offline copy
> "Can you give me the code file which I can run offline on my PC?"

Then: "index file is opening without css". This was fixed by inlining CSS/JS in the offline build, plus a warning when a page is opened from inside the zip.

### Request 4: CMS, co-founder, In Person, launch, headline, sun, sharing (with two screenshots)
> "We need a very very intelligent and smart CMS backend to manage all the dynamic content on the frontend, pretty much everything."

> "In the About us section make Shivom Singh Lovell co-founder. He also runs the Delhi Union [and] is a student at King's College London."

> "A new Seva or In-person section [with] the things which you think are logical and easy to execute from the screenshot."

The screenshot listed six formats in two groups:
- **Seva & Community**: Voices, Campus Circles, Seva Saturdays
- **Live & In-person**: Culture Nights, Heritage Walks, HIPL Salons

> "Smartly integrate [the] first event and launch with Delhi Union / Dialogues session details in [the] attached screenshot."

The poster said:
- **Saturday 31 October 2026, 5 PM onwards, Constitution Club of India, New Delhi**
- "In the company of scholars · jurists · writers · thinkers · young voices"
- The evening:
  - 01 the launch of HIPL
  - 02 a short discussion
  - 03 the debate. Motion: **"This House believes that the Constitution should not regulate Hindu temples"**, debate hosted by the **Delhi Union**

> "This line on the top of the homepage is not really reflecting [the] core idea … 'Ask anything. Argue well. Keep the circle open.' This is good but somewhere add [the] Hinduism essence in it as well."

> "Especially for the CMS and for the Explorations section: need the CMS to be very dynamic, with just little or more info/media/article and other types of inputs, or even its own AI deep search. It will have to keep creating such immersive/interactive and unique webpage experience the way it is currently."

> "The sun on the About page pulses/moves very slowly, not smoothly. Fix it. It should be like the way it is on [the] homepage."

> "Try to have the elements on the website shareable for users on their social media in different easy forms."

> "Add/edit anything that you think will add value and make [the] experience better."

### Request 5: developer hand-off (23 Oct 2026)
> "Hand this project off to a developer so he can set it up, deploy it, and make it live on the website and domain … use any LLM like Codex or Claude Code … the code should have all the things needed for an LLM."

> "If the developer builds anything, it should match my instructions and the website's theme."

This produced this file, [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md), `AGENTS.md` and the other docs.

## 3. Decisions (keep these unless the owner changes them)

| # | Decision | Why / source |
|---|---|---|
| D1 | Brand direction **A, "Sabha"**: the circle-of-voices sun mark, Midnight/Saffron palette, Unbounded + Instrument Sans + Mukta | Brand guidelines |
| D2 | The header and footer show the **full horizontal lockup** (symbol + HIPL + "Hinduism in Public Life"), always from the master SVGs in `assets/brand/` | Request 2 |
| D3 | The co-founder's essays are used **only where they fit HIPL's non-partisan purpose**. On About: the "Hindi, Hindu, Hindustan" idea (strengthen the language, deepen the faith, build the country) and the working test *"Does it strengthen the language, deepen the faith, build the country?"*, plus one quote from "The Hinduism We Deserve" ("We do not need adjectives for our Hinduism…"). **The partisan parts of "The Hinduism We Deserve" were deliberately not used.** The PDFs are not in the repo | Request 2: "if contextual, otherwise ignore"; HIPL is not a political campaign |
| D4 | The founder's name is spelled **Prannv Dhawan** (as in his byline). He is a co-founder and an Advocate at the Supreme Court of India; his bio is in `team.json` | Request 2, his byline |
| D5 | **Shivom Singh Lovell** is a co-founder: runs the **Delhi Union** (HIPL's debating partner) and studies at **King's College London** | Request 4 |
| D6 | **100 Questions** stays **simple Q&A**: question → who answers (prominent) → written answer and/or video → approved comments. **No links to Explorations** on question pages. Ask before adding features (the plan mentions upvotes; they're not on the site) | Request 2 |
| D7 | **Dialogues** has a recordings/video section; each Dialogue page gets its video, key moments and before/after vote after the event | Request 2 |
| D8 | Homepage headline: the Rig Veda line **एकं सद्विप्रा बहुधा वदन्ति**, "Truth is one; the wise call it by many names" (Rig Veda 1.164.46), over **"One truth. / Many voices. / Keep the circle open."**. This keeps the owner's "Keep the circle open" and adds the Hindu essence. The line is also the meaning of the sabha mark. Editable in CMS → Site settings | Request 4 |
| D9 | **In Person** page with the six formats from the screenshot. Voices links to Write for HIPL. Culture Nights is marked "coming". Salons, Heritage Walks and Seva Saturdays have planned events | Request 4 |
| D10 | The **launch on 31 Oct 2026** is **Dialogue 01**, featured on Home, Dialogues and In Person, with a countdown, RSVP, add-to-calendar and an announcement bar. Speakers are `[PLACEHOLDERS]` until the owner confirms them. The address "Rafi Marg, New Delhi" must be confirmed | Request 4 poster |
| D11 | The **Delhi Union** is listed as a partner, as a text badge until its logo is supplied | Request 4 |
| D12 | **The sun animates the same everywhere**: smooth breathing bars plus a gentle pointer lean, and still for reduced-motion users | Request 4 |
| D13 | **Sharing**: every shareable card makes on-brand post (1080×1350) and story (1080×1920) images, plus WhatsApp, X, LinkedIn, Facebook, Telegram, copy link and caption. Highlighted text becomes a quote card, and poll and dilemma choices can be shared | Request 4 |
| D14 | The **CMS is built in** (no external SaaS): it edits all content, has an Inbox for every form, an Explorations block Studio with per-block AI, and an AI Composer with web research (Claude). AI drafts are always saved as `draft` for human sign-off | Request 4; spec §6 (writer, fact-checker and editor sign-off) |
| D15 | **Simple, durable stack**: Python stdlib build, JSON content in git, vanilla JS/CSS, no framework, works offline. Don't add frameworks or services without the owner's approval | Requests 3 and 5; maintainability by a small team |
| D16 | Hosting recommendation: **one server**, with the CMS serving the site behind Caddy (HTTPS) | Request 5; keeps forms, the Inbox and Publish working together |

## 4. Spec items not yet done (as of 23 Oct 2026)

Measured against [`reference/explorations-and-write-spec.md`](reference/explorations-and-write-spec.md) §9 and [`reference/what-were-building.md`](reference/what-were-building.md):

| Item | Status |
|---|---|
| Explorations hub, series, entries, concept page, 3 templates, components, 5 sample entries, claim labels, sources, "Suggest a correction" | Done |
| Voices hub, article, contributor page, /write with pitch form; Voices statuses in the CMS | Done |
| **Email notifications** (pitch received, RSVP confirmation) | **Not done**. Submissions land in the CMS Inbox only |
| **CMS roles** (Admin, Editor, Fact-checker, Contributor coordinator) | **Not done**. There is one shared password; workflow statuses exist |
| Version history and preview links | Done (history per file; signed-in preview) |
| Real poll and dilemma percentages | **Not done**. See HANDOFF.md §4 |
| Analytics (cookieless) | Hooks in place; Plausible or Umami needs adding |
| Images in AVIF/WebP, Lighthouse 90+ check | Not verified; there is no image pipeline |
| Newsletter provider for the Dispatch | Not connected; sign-ups land in the Inbox (CSV export) |
| Remaining 31 Explorations entries | Planned in `explorations.json`; to be written with the Studio or Composer |
