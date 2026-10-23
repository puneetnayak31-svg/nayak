<!-- Converted from the owner's document "HIPL Explorations — Knowledge Library & Write for HIPL (Website Spec)" (originals/). The .docx is the source; this copy is for reading and for AI agents. -->

## HIPL Explorations — Knowledge Library & Write for HIPL

Oct 10, 2026 · @Puneet Nayak

This is the website maker's spec for two parts of the HIPL site: Explorations, HIPL's library of sourced, interactive explainers on Hindu ideas, texts and stories, and Write for HIPL, where anyone can submit an article for publication under the HIPL name. It uses the Sabha identity (Option A).

### 1. What Explorations is

Explorations is HIPL's permanent library: 36 evergreen entries in three connected series, built from three reusable page types. Every claim is sourced and labelled, reading needs no login, and it works beautifully on a phone.

What it should feel like: a mix of a good museum, a smart explainer website and a beautifully illustrated book. Curious, visual and calm, never preachy. A 19-year-old should finish an entry, and a professor should find nothing wrong in it.

Five principles the design and content must serve

- Show, then tell. Lead with a hook: a question, a dilemma or a surprising fact. Explain after that.

- Short pieces. Content comes in chapters and cards of 80–200 words each, never long walls of text.

- Many voices. Show different interpretations side by side; never pretend one reading speaks for all Hindus.

- Sourced and labelled. Every key claim says what kind of claim it is (section 5) and where it comes from.

- Connected. Every entry links to related concepts, stories, texts and modern questions, so a reader can keep exploring.

Where it sits on the website

| Item | Value |
|---|---|
| Menu label | Explorations |
| Hub URL | /explorations |
| Series URLs | /explorations/hindu-universe · /explorations/stories-that-stay · /explorations/ancient-ideas-modern-life |
| Entry URL | /explorations/[series]/[slug], e.g. /explorations/hindu-universe/dharma |
| Concept glossary | /explorations/concepts/[term], e.g. /explorations/concepts/karma |
| Community writing | /voices (section 7) — kept separate from the editorial library |
| Read time per entry | 6–15 minutes; immersive entries 15–25 minutes |

### 2. The three series and 36 entries

The library has three series of 12 entries each. Build the first 12 (marked Start) first, then add the rest in batches. Never show empty pages as finished.

| Series | What it covers | Accent on series page |
|---|---|---|
| The Hindu Universe | Core ideas, texts, philosophical schools, thinkers, traditions, history | Saffron |
| Stories That Stay | Retellings of stories, dilemmas and characters, with context and interpretations | Marigold |
| Ancient Ideas, Modern Life | Hindu ideas in conversation with today's questions | Lotus |

| # | Entry | Series | Page type | Interactive element | Priority |
|---|---|---|---|---|---|
| 01 | Hinduism: Where Do You Even Begin? | Hindu Universe | Interactive | Clickable map of traditions, texts and schools | Start |
| 02 | Dharma: One Word, Many Meanings | Hindu Universe | Explainer | Meaning layers + everyday scenarios | Start |
| 03 | From the Vedas to the Upanishads | Hindu Universe | Interactive | Scrollable timeline + text explorer | Later |
| 04 | The Bhagavad Gita: A Conversation Before a Battle | Hindu Universe | Explainer | Chapter-by-chapter guide | Start |
| 05 | Six Schools, Six Ways of Seeing the World | Hindu Universe | Explainer | Compare-the-schools cards | Start |
| 06 | Atman: Who Are You, Really? | Hindu Universe | Explainer | Contrasting views side by side | Later |
| 07 | Why So Many Gods? | Hindu Universe | Explainer | Visual guide | Later (sensitive) |
| 08 | Samudra Manthan: The Churning of the Ocean | Hindu Universe | Illustrated Story | Story map + character cards | Later |
| 09 | Karma: Is Everything Really Written? | Hindu Universe | Interactive | Everyday scenarios | Later |
| 10 | Bhakti: The Power of Devotion | Hindu Universe | Illustrated Story | Audio-visual poet profiles | Later |
| 11 | Moksha: What Does Freedom Actually Mean? | Hindu Universe | Explainer | Concept comparison cards | Later |
| 12 | One Tradition, Many Traditions | Hindu Universe | Interactive | Cultural map + timeline | Later |
| 13 | Arjuna's Dilemma | Stories That Stay | Interactive | "What would you do?" dilemma | Start |
| 14 | Nachiketa and the King of Death | Stories That Stay | Illustrated Story | Choose-your-question narrative | Start |
| 15 | Savitri's Journey | Stories That Stay | Illustrated Story | Character journey | Later |
| 16 | Ekalavya: Merit, Access and Sacrifice | Stories That Stay | Explainer | Multiple perspectives | Later (sensitive) |
| 17 | The Exile That Changed Everything | Stories That Stay | Illustrated Story | Chapter-based visual story | Later |
| 18 | Krishna and Sudama | Stories That Stay | Illustrated Story | Short illustrated story | Start |
| 19 | Harishchandra and the Cost of Truth | Stories That Stay | Interactive | Ethical choice narrative | Later |
| 20 | The Race Around the World | Stories That Stay | Illustrated Story | Story with interpretations | Later |
| 21 | The Clever Jackal and the Lion | Stories That Stay | Illustrated Story | Illustrated fable | Later |
| 22 | Ashtavakra: Who Gets to Be a Thinker? | Stories That Stay | Illustrated Story | Philosophical encounter | Later |
| 23 | Draupadi's Question | Stories That Stay | Explainer | Source-led multiple perspectives | Later (sensitive) |
| 24 | One Ramayana, Many Ramayanas | Stories That Stay | Interactive | Comparative story map | Start |
| 25 | Dharma in the Age of Career Ambition | Ancient Ideas, Modern Life | Interactive | Workplace scenarios | Start |
| 26 | The Self in the Age of Social Media | Ancient Ideas, Modern Life | Explainer | Visual essay + reflection prompts | Later |
| 27 | Sacred Rivers, Shared Responsibility | Ancient Ideas, Modern Life | Explainer | River story + case study | Later |
| 28 | Seva: From an Idea to an Action | Ancient Ideas, Modern Life | Explainer | Story-led explainer + action challenge | Start |
| 29 | Can You Modernise Tradition Without Losing It? | Ancient Ideas, Modern Life | Explainer | Before/after visual comparison | Later |
| 30 | My Grandparents, My Generation and Faith | Ancient Ideas, Modern Life | Illustrated Story | Intergenerational story (pairs with Interviews) | Start |
| 31 | Ancient Philosophy and Modern Science | Ancient Ideas, Modern Life | Explainer | Evidence-led comparison | Later (sensitive) |
| 32 | Pluralism: How Do We Live With Difference? | Ancient Ideas, Modern Life | Interactive | Scenarios | Start |
| 33 | Who Gets to Interpret Tradition? | Ancient Ideas, Modern Life | Explainer | Multiple perspectives | Later (sensitive) |
| 34 | Ahimsa in a World of Conflict | Ancient Ideas, Modern Life | Interactive | Ethical dilemma with sourced views | Later (sensitive) |
| 35 | What Does a Good Society Owe Its People? | Ancient Ideas, Modern Life | Explainer | Scenario-based explainer | Later |
| 36 | What Will Hindu Culture Look Like in 2050? | Ancient Ideas, Modern Life | Interactive | Future-thinking poll | Later |

The 12 Start entries are four per series and cover all three page types. Entries marked sensitive need an outside expert review before publishing (section 6).

### 3. Page templates and interactive components

Build three page templates and twelve reusable components. Editors assemble every entry from these in the CMS, with no custom code per entry.

#### 3.1 The standard entry structure (all templates)

| Part | What it is | Length |
|---|---|---|
| Cover | Title, one-line hook, series tag, read time, level (Beginner / Deeper), illustration | — |
| Hook | A surprising fact, question or dilemma that pulls the reader in | 40–80 words |
| Context | The story, idea or historical background | 150–300 words |
| Exploration | 3–6 chapters or cards, each with one idea | 80–200 words each |
| Visual layer | Illustration, map, timeline or diagram | — |
| Why it matters today | The bridge to modern life, framed as a question, not a verdict | 100–200 words |
| Reflection | A question, choice, poll or 3-question quiz | — |
| Go deeper | Sources (numbered), further reading, related HIPL content | — |

A sticky progress bar shows chapter position; a "Jump to chapter" menu appears on desktop at the side and on mobile as a bottom sheet.

#### 3.2 The three page templates

A. Explainer — for concepts, texts and schools. Layout: cover → hook → chapters, each a numbered section with a large heading and optional pull quote → Knowledge Cards carousel summarising the key ideas → why it matters → reflection → go deeper. Mood: editorial, Chalk background, Midnight text, saffron chapter numbers.

B. Illustrated Story — for narratives. Layout: full-width illustration per chapter ("scenes"), short text beside or below, character cards that open on tap, "Pause and think" boxes between scenes, then an interpretations panel ("How different traditions read this story"). Mood: Midnight background for scenes, warm illustration style, marigold highlights.

C. Interactive — for maps, timelines and dilemmas. Layout: short intro → the interactive as the centrepiece, filling the screen on mobile → a plain-text version of the same content below it (for accessibility and search) → why it matters → go deeper.

#### 3.3 Reusable components

| Component | What the reader does | Content editors enter | Build notes |
|---|---|---|---|
| Knowledge Cards | Swipes or clicks through 4–10 cards, one idea each | Card title, 40–60 words, optional icon or image, source | Shareable as a 1080×1350 image for Instagram |
| Chapter | Reads a numbered section | Heading, rich text, optional pull quote | Anchor link per chapter |
| Pull Quote | Reads a highlighted quotation | Quote text, source (required), translator, verse reference | Won't publish without a source |
| Character Cards | Taps a character to open their card | Name, Devanagari name, role in story, 2–3 lines, illustration | Grid on desktop, carousel on mobile |
| Explore the Map | Taps points on a map or diagram | Background image or map, points (x/y or lat/long), title and text per point | Keyboard-navigable points; list fallback |
| Timeline | Scrolls through dated events | Events: label, date or date range, confidence ("approximate", "debated"), text, source | Date ranges, not false precision |
| What Would You Do? | Reads a dilemma, picks an option, then sees perspectives on every option | Scenario, 2–4 options, a perspective for each (with source or label) | No score, no "correct" answer; shows the share who chose each |
| Compare Cards | Compares 2–6 items on the same questions | Items × rows (e.g. schools × "What is real?") | Table on desktop, swipe cards on mobile |
| Meaning Layers | Taps through layers of a word's meaning | Term, layers (e.g. literal → ethical → cosmic), text per layer | Good for Sanskrit terms |
| Claim Label | Sees a small tag on a passage | One of five labels (section 5) | Tag sits before the passage; tooltip explains it |
| Poll / Reflection | Answers a question, sees aggregate results | Question, 2–5 options or open reflection prompt | Anonymous, rate-limited; results after voting |
| Concept Pop-up | Taps an underlined term (dharma, karma) | Linked Concept entry | Opens a short definition with a link to the full concept page |

Interaction rules: everything works by keyboard and screen reader; no interaction requires a login; animations respect reduced-motion settings; each interactive loads only when it scrolls into view; every interactive has a plain-text fallback.

### 4. Worked sample entries

Five sample entries, one for each main format. Use them as models for the build and as seed content. They are outlines for the editorial team to write up; any quotation shown as [VERIFY] must be checked against the named edition and translation before publishing.

#### 4.1 Dharma: One Word, Many Meanings (Explainer + Meaning Layers)

Hook: "Your grandmother, a judge and a Buddhist monk might all use the word dharma, and mean three different things. Why does one word carry so much?"

| Chapter | Content | Component |
|---|---|---|
| 1. Where the word comes from | From the Sanskrit root dhṛ, "to hold, to support": dharma is what holds things together | Meaning Layers (layer 1) |
| 2. Order of the universe | Cosmic order; its link to the older Vedic idea of ṛta | Meaning Layers (layer 2) · claim label: Historians find |
| 3. Right conduct | Ethics, law and social duty; texts on dharma (Dharmaśāstra) and how their rules were debated and changed over time | Claim label: Scholars debate |
| 4. Your own dharma | Svadharma: the Gita's idea of one's own path (Gita 3.35 [VERIFY translation]) | Pull Quote |
| 5. One of four aims of life | Dharma alongside artha (prosperity), kāma (desire) and mokṣa (liberation) | Knowledge Cards (4 cards) |
| 6. Same word, other traditions | In Buddhism and Jainism, dharma carries different meanings | Claim label: Tradition holds |

Everyday scenarios (interactive): (1) a friend asks to copy your exam answers; (2) a job abroad, or staying home to care for parents; (3) you spot your manager fudging numbers. Each shows how different understandings of dharma would weigh the choice. There is no correct answer.

Why it matters today: dharma is a way of thinking about duty that weighs context, role and consequence, rather than following one fixed rule.

Reflection: "Which meaning of dharma is closest to how you use the word?" (poll). Related: Arjuna's Dilemma, The Bhagavad Gita, Dharma in the Age of Career Ambition, concept pages for karma and svadharma.

#### 4.2 Nachiketa and the King of Death (Illustrated Story + choose-your-question)

Source: Katha Upanishad. Name the translation used, for example from the Gita Supersite's Upanishad texts or a university-press translation.

Hook: "A teenager is sent to Death — and refuses every reward Death offers, until he gets an answer."

| Scene | What happens | Component |
|---|---|---|
| 1. The father's gift | Vajashravas gives away old, worn-out cows as ritual gifts; his son Nachiketa questions this | Illustration + character cards (Nachiketa, Vajashravas, Yama) |
| 2. "To whom will you give me?" | Asked repeatedly, the father says in anger: "To Death" | Pause and think: "Was Nachiketa being disrespectful, or honest?" |
| 3. Three nights at Death's door | Yama is away; Nachiketa waits three nights without food; Yama offers three boons to make amends | Illustration |
| 4. Three boons | 1) His father's peace of mind; 2) knowledge of a sacred fire ritual; 3) what happens after death | Choose-your-question: the reader picks which boon to ask first and sees how the story treats each |
| 5. The temptation | Yama offers wealth, long life and pleasures instead of the answer; Nachiketa refuses | "What would you take?" poll |
| 6. The answer | The difference between the good (śreyas) and the pleasant (preyas); the teaching on the self, including the chariot image [VERIFY verse numbers] | Pull Quote + Knowledge Cards |

Interpretations panel: Vedanta schools read the teaching on the self differently (Advaita, Vishishtadvaita, Dvaita); the story is also told as a lesson on courage and questioning elders. Why it matters today: choosing what is good over what is merely pleasant, in an attention economy built on the pleasant.

#### 4.3 Arjuna's Dilemma (Interactive: What Would You Do?)

Source: Bhagavad Gita, chapters 1–2 (part of the Mahabharata's Bhishma Parva).

Setup: Arjuna stands between two armies and sees teachers, cousins and elders on the other side. He puts down his bow.

Reader choice: "You are Arjuna. What do you do?"

| Option | Perspectives shown after choosing |
|---|---|
| Fight | Krishna's arguments in chapter 2: duty (svadharma), acting without attachment to results (Gita 2.47 [VERIFY]), and the self that does not die (Gita 2.20 [VERIFY]) — claim label: The text says |
| Walk away | Arjuna's own reasons in chapter 1: grief, the collapse of families, the sin of killing kin — The text says |
| Negotiate again | The Mahabharata's earlier peace missions that failed — The text says; HIPL asks: when is compromise still possible? |
| Treat it as an inner battle | The allegorical reading made famous by Gandhi, where the battlefield is the human heart — Tradition holds / Scholars debate |

Then: "How great commentators read it" — short cards on Shankara, Ramanuja, a bhakti reading and modern readers, each labelled. The results bar shows what share of readers picked each option.

#### 4.4 Six Schools, Six Ways of Seeing the World (Explainer + Compare Cards)

|  | Nyāya | Vaiśeṣika | Sāṃkhya | Yoga | Mīmāṃsā | Vedānta |
|---|---|---|---|---|---|---|
| Big question | How do we know anything for sure? | What is the world made of? | How do spirit and matter relate? | How do we still the mind? | How should the Vedas be understood and acted on? | What is ultimate reality? |
| Key text | Nyāya Sūtra (Gautama) | Vaiśeṣika Sūtra (Kaṇāda) | Sāṃkhya Kārikā (Īśvarakṛṣṇa) | Yoga Sūtra (Patañjali) | Mīmāṃsā Sūtra (Jaimini) | Brahma Sūtra (Bādarāyaṇa) |
| One-line idea | Logic and valid means of knowledge | Categories and atoms | Puruṣa (consciousness) and prakṛti (matter) | Discipline of mind and body | Ritual action and interpretation | Brahman; several sub-schools (Advaita, Viśiṣṭādvaita, Dvaita) |

Check the names and attributions in the table against the Internet Encyclopedia of Philosophy entries before publishing. Note card: these six are called āstika because they accept Vedic authority; Buddhist, Jain and Cārvāka (materialist) schools are nāstika, and are just as much part of India's philosophical conversation. Reflection: "Which school asks the question you care about most?" (poll).

#### 4.5 One Ramayana, Many Ramayanas (Interactive: Explore the Map)

Hook: "There is no single Ramayana. There are hundreds, and they don't all agree."

Map points (each opens a card: language, author, approximate period, one way it differs, one image):

| Version | Language / region | Card angle |
|---|---|---|
| Vālmīki Rāmāyaṇa | Sanskrit | The earliest full telling; the reference point |
| Kamban's Rāmāvatāram | Tamil | Different emphases in character and poetry |
| Tulsidas's Rāmcharitmānas | Awadhi | Devotional retelling central to North Indian bhakti and Rāmlīlā |
| Kṛttibāsī Rāmāyaṇa | Bengali | Regional storytelling tradition |
| Adhyātma Rāmāyaṇam Kilippāṭṭu (Ezhuthachan) | Malayalam | Philosophical, devotional framing |
| Paumacariya (Vimalasūri) | Prakrit, Jain tradition | A Jain retelling with a different ending for Rāvaṇa |
| Ramakien | Thai | National epic of Thailand |
| Kakawin Rāmāyaṇa and wayang | Javanese | Shadow-puppet performance tradition |

Editors must verify periods and authorship for each card with a scholarly source, and label dates "approximate". Why it matters today: a story can belong to many communities at once; retelling is part of the tradition, not a threat to it. Go deeper: a scholarly reading on Ramayana traditions (for example, A. K. Ramanujan's essay "Three Hundred Ramayanas" — widely cited and also contested, so present it as one scholarly view).

### 5. Sources: where the knowledge comes from

Every entry is built on named, checkable sources, used in four tiers. The website shows them in a numbered "Sources" list at the foot of each entry, with footnote numbers in the text.

#### 5.1 The source library

| Tier | Use it for | Source | What it offers | Access |
|---|---|---|---|---|
| 1. Original texts | What a text actually says | Mahabharata critical edition, BORI Pune | 19 volumes covering all 18 parvas, collated from 1,259 manuscripts; completed 1966 | Print / libraries |
| 1. Original texts | Gita, Ramayana, Upanishads with commentaries | Gita Supersite | Sanskrit texts with classical commentaries and translations in eleven Indian languages: Bhagavad Gita, Valmiki Ramayana, Ramcharitmanas, Upanishads, Brahma Sutra (with Shankara's commentary), Yoga Sutra (with Vyasa's commentary) | Free online |
| 1. Original texts | Sanskrit e-texts | GRETIL | Register of freely available Sanskrit and Indian-language e-texts; archived as of June 2019, for reference use | Free online |
| 2. Translations | Quotable English renderings | Murty Classical Library of India | Harvard University Press; original text and English translation on facing pages, many Indian languages | Books |
| 2. Translations | Quotable English renderings | University-press translations (Oxford, Penguin Classics, Motilal Banarsidass and similar) | Always cite the translator and edition | Books |
| 3. Scholarly reference | Philosophy, schools, thinkers | Internet Encyclopedia of Philosophy: Indian philosophy | Peer-reviewed entries on the Bhagavad Gita, Upanisads, Advaita Vedanta, Nyaya, Sankhya, Yoga Sutras, Ramanuja, Madhva and more | Free online |
| 3. Scholarly reference | History, traditions, debates | Brill's Encyclopedia of Hinduism Online | Major academic reference work | Via a university library |
| 3. Scholarly reference | Reading lists | Oxford Bibliographies: Hindu Studies | Expert-curated bibliographies by topic | Via a university library |
| 3. Scholarly reference | Depth on any topic | Peer-reviewed books and journal articles | Cite author, title, publisher, year, page | Libraries |
| 4. Lived tradition | How people practise and interpret today | HIPL interviews with practitioners, priests, artists and scholars; community and regional sources | Always labelled as one person's or community's view | HIPL |

Never cite: blogs, social media posts, WhatsApp forwards, quote websites without references, AI-generated text, or devotional sites as evidence for historical claims. Wikipedia can be a starting point for finding sources, but it is never the citation.

Tip for the team: a university library login (through an advisor or a scholar on the team) unlocks Brill and Oxford Bibliographies.

#### 5.2 How to cite

- Primary text: Text, chapter.verse — edition; translator. Example: Bhagavad Gita 2.47 — Gita Supersite Sanskrit text; trans. [translator].

- Book: Author, Title (Publisher, Year), page.

- Online reference: Author, "Entry title", Site, URL, accessed date.

- Interview: Name, role, interview with HIPL, date.

Every quotation names its version: "Tulsidas's Ramcharitmanas", not just "the Ramayana"; "BORI critical edition", not just "the Mahabharata".

#### 5.3 Five claim labels

A small tag shows readers what kind of claim each key passage is making. The website renders each label as a pill with a tooltip.

| Label | Means | Colour |
|---|---|---|
| The text says | Directly from a named text and edition | Midnight outline |
| Tradition holds | Belief or practice of a named tradition or community | Saffron |
| Historians find | Evidence-based historical scholarship | Marigold |
| Scholars debate | A live disagreement among experts; both sides shown | Lotus |
| HIPL asks | HIPL's own reflection or question to the reader | Midnight filled |

### 6. Editorial and review rules

No entry goes live without a writer, a fact-checker and an editor signing off. The CMS enforces this with workflow statuses.

Six rules for every entry

- Separate the layers: original text, later retellings, regional traditions, historical evidence and modern interpretation are never mixed together.

- Never invent anything: no made-up quotations, verses, dialogue, dates or "scholars agree" claims.

- Name the version: say which text, edition, translation, tradition or region is meant.

- Many traditions: show more than one interpretation where they exist; no single reading speaks for all Hindus.

- Explore, don't prescribe: modern connections are framed as questions; no claims that ancient texts "proved" modern science.

- Respect people: caste, gender and other hard topics are handled honestly and without demeaning any community.

Review steps (CMS status in brackets)

- Writer drafts using the template and adds a source for every key claim (Draft).

- Fact-checker checks every quote, verse number, date and name against the source (Fact-check).

- Sensitive entries (07, 16, 23, 31, 33, 34, and any entry touching caste, gender or communal history) go to an outside expert reader, named in the CMS (Expert review).

- Editor does the final edit, checks alt text and accessibility, then publishes (Ready → Published).

- Every entry is re-checked once a year (Review due date in the CMS).

Corrections: fix the error, add a dated note at the foot of the entry ("Corrected on [date]: …"), and log it on the site's corrections page.

AI use: AI tools can help with research leads, transcription or first drafts, but a person checks every claim against the original source. AI images are not used for sacred figures; illustrations are commissioned or properly licensed.

### 7. Write for HIPL — community articles

Anyone can write for HIPL. Readers pitch an idea through the website; accepted pieces are edited with the writer and published under HIPL's name with the writer's byline. The section is called Voices, at /voices, and is kept separate from the editorial Explorations library.

Write for HIPL · pitch to publication

The editor replies to every pitch within 10 working days. Edits always go back to the writer, and nothing is published until the writer approves the final version.

#### 7.1 What we publish

| Format | What it is | Length |
|---|---|---|
| Essay | An argument or idea about Hindu thought and public life | 800–1,500 words |
| My Hinduism | A personal story: faith, family, doubt, practice, identity | 600–1,000 words |
| Explainer pitch | A topic for the Explorations library, which the HIPL team develops with the writer | 300-word pitch |
| Response | A reply to a Dialogue, Interview or another Voices piece | 500–800 words |
| Review | A book, film, music album, exhibition or performance | 500–900 words |
| Local story | A temple, festival, craft, seva project or tradition from your town | 500–1,000 words + photos |

#### 7.2 Who can write

Anyone 18 or older, from any background, belief or none. Writers under 18 can submit with a parent's or guardian's consent (a checkbox plus the guardian's email) — this suits school and college students. Hindi submissions are welcome and will be published once the Hindi section opens.

#### 7.3 Writer guidelines (shown on the /write page)

- Original, unpublished work only. No plagiarism; quotes must be attributed.

- Cite sources for factual claims; follow the source rules in section 5.

- Disagreement is welcome; hate, personal attacks, and party-political campaigning are not.

- Tell us if you used AI tools, and how. AI-written articles are not accepted.

- Write clearly for a general reader; explain Sanskrit terms the first time you use them.

- Include a 2-line bio and, optionally, a photo.

#### 7.4 Rights, credit and payment

- The writer keeps copyright and gives HIPL a non-exclusive licence to publish, edit, translate and share the piece with credit. The writer must agree to this when submitting.

- Byline format: writer's name, then "for HIPL", with their bio and a link to their contributor page.

- Every published Voices piece carries a note: "Views are the writer's own. HIPL publishes a range of perspectives."

- Payment: unpaid at launch, and the /write page says so honestly. Revisit once HIPL has funding; consider a small honorarium or an annual "Best of Voices" prize.

#### 7.5 Website pages

| Page | URL | Contents |
|---|---|---|
| Write for HIPL | /write | Why write for us, what we publish (7.1), guidelines (7.3), rights (7.4), pitch form, FAQ |
| Voices hub | /voices | Latest pieces, filters by format and topic, featured pieces |
| Voices article | /voices/[slug] | Article, writer byline and bio, "Views are the writer's own" note, sources, related content, "Write a response" button |
| Contributor page | /contributors/[name] | Photo, bio, links, all their pieces |

Link "Write for HIPL" from the main menu (or under About), from the footer, and at the end of every Voices and Explorations piece.

#### 7.6 Pitch form fields

Name · email · city · age range (with guardian consent if under 18) · format (from 7.1) · working title · pitch (100–300 words) · why you (50 words) · links to past writing (optional) · draft upload (optional, .docx or .pdf, 5 MB maximum) · language (English or Hindi) · checkboxes: original work, licence agreement, privacy consent. Add spam protection, then show a confirmation page and send a confirmation email.

#### 7.7 CMS workflow

Pitches arrive in a Voices inbox in the CMS with these statuses: Received → Under review → Accepted or Declined → Drafting → In edit → Writer approval → Scheduled → Published. Each status change can send the writer a templated email. Editors can comment privately on a pitch, assign it to an editor, and turn an accepted pitch into a Voices article draft in one click.

### 8. Website requirements

The library and Voices need a hub page, filters, search, related links, an editor-friendly CMS and fast, accessible pages. Everything below is required for the first release unless it is marked later.

#### 8.1 Explorations hub (/explorations)

- Hero: "Explore Hindu ideas, stories and questions" with a search box.

- Three series cards: name, one line, entry count, accent colour, link.

- Start here: three beginner entries (01, 02, 14).

- All entries grid with filters: series, topic, page type (Explainer / Story / Interactive), level (Beginner / Deeper), read time (under 10 / 10–20 / 20+ minutes). Filters update the URL so filtered views can be shared.

- Concept glossary strip: A–Z of terms (dharma, karma, moksha, seva…).

- From Voices: three latest community pieces with a "Write for HIPL" button.

Series page: intro, entries in recommended reading order, related concepts.

Entry page: as in section 3, plus share buttons (WhatsApp first, then X, LinkedIn and copy link), a "Suggest a correction" link, and "Next in this series" at the end.

Concept page: term, Devanagari, transliteration, audio pronunciation (later), a 40-word definition, a longer note, sources, and the entries that use it.

#### 8.2 Related content

Every entry, concept and Voices piece links to related items chosen by editors (3–6), with automatic suggestions from shared topics. Show these as "Keep exploring" cards at the end of the page and as concept pop-ups in the text.

#### 8.3 CMS content types

| Type | Main fields |
|---|---|
| Exploration | title, slug, number, series, page type, hook, cover illustration, level, read time, topics, blocks (components from 3.3), why it matters, reflection, sources, related items, sensitive flag, expert reviewer, status, review-due date, SEO fields |
| Concept | term, Devanagari, IAST transliteration, audio, short definition, long note, sources, related |
| Source | type (text, translation, scholarly, reference, interview), title, author/translator, edition, publisher, year, URL, access note, tier |
| Voices Article | title, slug, format, writer (Contributor), body, sources, topics, cover image, response-to (optional link), status, SEO fields |
| Contributor | name, photo, bio, links, city, consent flags |
| Voices Pitch (inbox) | all form fields from 7.6, status, assigned editor, private notes |
| Topic | name, description |
| Media | image, alt text (required), credit, licence |

Workflow statuses, version history, scheduled publishing and preview links are required. Roles: Admin, Editor, Fact-checker (can comment and approve, cannot publish), Contributor coordinator (Voices inbox only).

#### 8.4 Design

Use the Sabha identity: Chalk #F7F3EC page background, Midnight #14123A text and story scenes, Saffron #FF8A1F accents (#B4530A for small text on light backgrounds), Marigold #FFC93C and Lotus #FF6FA3 for series accents and labels. Use Unbounded for headlines, Instrument Sans for reading text at 18px+ with a line height of 1.6, and Mukta for Devanagari. Keep the reading column to 680px max. Illustrations should be commissioned in one consistent style (flat, warm, contemporary); avoid stock photos and clichéd religious clip art.

#### 8.5 Accessibility and performance

- WCAG 2.2 AA; full keyboard use; visible focus; alt text required; captions on all video and audio.

- Each interactive has a plain-text fallback and respects reduced motion.

- Mobile-first; a Lighthouse score of 90+ on a mid-range phone; interactives load only when scrolled into view; images in AVIF/WebP.

- Correct language tags on Sanskrit and Hindi passages.

#### 8.6 Analytics (cookieless)

Track: entry views, scroll depth and completion, chapter reached, interactive used, dilemma choices (anonymous), related-content clicks, shares, Voices pitches submitted and published, and filter use. A monthly dashboard should show the 10 most-completed entries and where readers drop off.

### 9. Handover checklist and build prompt

The website maker is done when every item below works on a phone and on a desktop.

- ☐ Explorations hub, three series pages, entry page, concept page

- ☐ Three page templates: Explainer, Illustrated Story, Interactive

- ☐ All 12 components from 3.3, each usable from the CMS without code

- ☐ The five sample entries from section 4 built as "Sample" drafts to test every component

- ☐ Claim labels, numbered sources and "Suggest a correction" on every entry

- ☐ Filters, search and related-content cards

- ☐ Voices hub, Voices article page, contributor page, /write page with pitch form

- ☐ Voices inbox in the CMS with statuses and email notifications

- ☐ CMS roles, workflow statuses, version history, preview links

- ☐ Accessibility, performance and analytics as in 8.5–8.6

- ☐ A short guide for editors: how to build an entry, add sources and handle a pitch

Prompt for Claude (or brief for a developer) — attach this document.

Add two sections to the HIPL website, following the attached spec exactly.1) EXPLORATIONS — a knowledge library at /explorations with three series (The Hindu Universe; Stories That Stay; Ancient Ideas, Modern Life), 36 planned entries, and a concept glossary. Build three page templates (Explainer, Illustrated Story, Interactive) and these reusable CMS components: Knowledge Cards (shareable as images), Chapter, Pull Quote (source required), Character Cards, Explore the Map, Timeline (date ranges with confidence), What Would You Do? dilemma (no scoring; show perspectives and anonymous results), Compare Cards, Meaning Layers, Claim Label (The text says / Tradition holds / Historians find / Scholars debate / HIPL asks), Poll/Reflection, Concept Pop-up. Every entry: cover, hook, context, 3-6 chapters, visual, why it matters today, reflection, numbered sources, related content, "Suggest a correction". Hub with series cards, Start here, filters (series, topic, page type, level, read time) reflected in the URL, search, glossary. Build the five sample entries in section 4 as drafts labelled "Sample", with [VERIFY] markers kept.2) VOICES / WRITE FOR HIPL — /write page (what we publish, guidelines, rights, FAQ, pitch form with the fields in 7.6, spam protection, guardian consent for under-18s, confirmation email), /voices hub with filters, article pages with byline, bio, "Views are the writer's own" note and "Write a response" button, /contributors/[name] pages, and a CMS Voices inbox with statuses Received > Under review > Accepted/Declined > Drafting > In edit > Writer approval > Scheduled > Published and templated emails per status.CMS content types: Exploration, Concept, Source, Voices Article, Contributor, Voices Pitch, Topic, Media (fields in 8.3). Roles: Admin, Editor, Fact-checker, Contributor coordinator. Workflow statuses, versions, previews, scheduled publishing.Design: Sabha identity — chalk #F7F3EC, midnight #14123A, saffron #FF8A1F (#B4530A for small text on light), marigold #FFC93C, lotus #FF6FA3; Unbounded headlines, Instrument Sans body (18px, 1.6 line height, 680px column), Mukta for Devanagari. Mobile-first, WCAG 2.2 AA, keyboard-accessible interactives with text fallbacks, reduced-motion support, lazy-loaded interactives, cookieless analytics events from 8.6.Never invent quotes, verses, dates, people or facts; use placeholders. Work in steps (CMS model > templates and components > hub, filters, search > Voices and forms > samples, tests, editor guide) and stop for my approval after each.
