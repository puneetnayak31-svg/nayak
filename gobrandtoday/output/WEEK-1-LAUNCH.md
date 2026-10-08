# Week 1: launch plan

This plan replaces the "Week 1" table in `PLAYBOOK.md`. It covers every channel, not just Instagram, and it's built around one idea:

> **In week 1, the founder brands people's ideas live, in public, as fast as possible.**

Every post points to one ask: **"Type your idea. Start free at gobrandtoday.com."** Each idea someone shares becomes a brand you post back to them. That's your demo and your social proof (real, not invented), and it's the reason people share.

---

## The 5 things that make it big
1. **Lead with the founder, not just the brand account.** People share people. Post the launch from the founder's LinkedIn and X first, then reshare from the brand pages.
2. **Run the comment-to-brand loop by hand.** For any comment, DM or reply with an idea, run it through GoBrandToday within the hour and reply with a screenshot of the name, score and logo ("here's yours ✦"). Week 1 lives or dies on this.
3. **Reply fast.** Answer every comment within about 30 minutes for the first 2 hours after each post. Algorithms on every platform reward early conversation.
4. **Fix friction every day.** Watch where guests drop off. Fix the top issue daily and say so publicly ("you asked, we shipped"). Building in public earns trust.
5. **One clear ask, and keep to the brief's rules.** "Start free" / "Create My Brand" only. No fake upvotes, reviews or user counts. Examples are labelled. Handles are "one-tap check" (except GitHub, Reddit and YouTube).

---

## Before launch day (2–3 days ahead)
**Product**
- [ ] Run the full guest flow on a phone and a laptop: idea → names → checks → looks → brand book → export. Fix anything broken.
- [ ] Check that the offline fallback generator works and is labelled.
- [ ] Make sure the site can take a traffic spike: caching on, error alerts on, someone on call.

**Tracking**
- [ ] Analytics on the main events: guest started, names generated, brand created, signed up.
- [ ] Use UTM links for every channel, e.g. `gobrandtoday.com/?utm_source=linkedin&utm_medium=social&utm_campaign=launch_w1` (swap the source for instagram / x / producthunt / hn / reddit / whatsapp).

**Profiles**
- [ ] Upload the banners from `statics/banners/`, write the bios, set link-in-bio, and set the OG image on the site.
- [ ] Post the **grid mural** before launch (3 posts, right → left) so the profile looks finished when launch traffic arrives.
- [ ] Pin the logo reveal.

**Content and accounts**
- [ ] Brand **10 real ideas** from friends ahead of time, with permission. They're ready-made replies and first posts.
- [ ] Draft the Product Hunt page (copy below). Gallery: `one-sentence/01–04`, `cards/01`, `banners/og`. Video: the 16:9 announcement on YouTube.
- [ ] Line up **30–50 people you know personally** (founders, students, creators) to message on launch day.
- [ ] Turn on notifications everywhere. Block 2 hours each morning and 1 hour each evening for replies.

---

## The week, day by day
Times are IST and approximate. Shift them to when your audience is online.

### Day 1 (Tue): Launch to your own network
| Time | Do | Asset |
|---|---|---|
| 9:00 | **Founder's LinkedIn post** (draft below) with the 16:9 announcement | `gobrandtoday-announcement-16x9.mp4` |
| 9:30 | Brand-page reshare on LinkedIn | — |
| 10:00 | **Instagram Reel**: announcement (9:16) + Story `link-start-free` | `announcement-9x16`, `stories/link-start-free` |
| 10:30 | **X thread** (draft below) | announcement 16:9 |
| 11:00 | **YouTube**: announcement (16:9) + logo reveal as a Short | — |
| 11:00–13:00 | **Personal messages** to 30–50 people, one by one, not a broadcast (draft below) | — |
| all day | Reply to everything. Brand every idea people share and reply with the screenshot. | the app |
| 20:00 | Story: `poll-3-names` + a "first day" behind-the-scenes Story | `stories/poll-3-names` |

### Day 2 (Wed): Open call + communities
| Time | Do | Asset |
|---|---|---|
| 9:00 | **Founder LinkedIn: "Drop your idea in one sentence, I'll brand 10 of them today."** This is the biggest lever of the week. | `one-sentence/04-yours` |
| 10:00 | Instagram: **One sentence: Wickd** post + Story `ask-drop-your-idea` | `one-sentence/01-wickd` |
| 14:00 | **Indie Hackers** + **r/SideProject** "I built…" posts (drafts below). Read each community's rules first and answer every question. | screenshots + announcement |
| evening | Reply in comments with the brands you made. Story: `poll-1-mello-looks`. | — |

### Day 3 (Thu): Product Hunt day
| Time | Do | Asset |
|---|---|---|
| 12:31 | **Go live on Product Hunt** (PH days start at 12:01 a.m. Pacific, which is 12:31 p.m. IST until early November and 1:31 p.m. IST after that). Post the maker comment right away. | PH page |
| 12:45 | Share the PH link on LinkedIn, X, WhatsApp and Stories. **Ask for feedback, not upvotes** (PH rules). | `stories/link-start-free` |
| all day | Answer every PH comment in detail, and brand ideas people post there. | — |
| 19:00 | Instagram: **GoBrand Collection cards** carousel | `cards/` |

### Day 4 (Fri): Show HN + the Loopa Reel
| Time | Do | Asset |
|---|---|---|
| 10:00 | Instagram + YouTube Shorts: **Name my brand: Loopa** Reel | `name-my-brand-loopa/` |
| 18:30 | **Show HN** (≈ 9 a.m. US Eastern). HN cares about the honest checks and that it works without signing up. Founder answers every comment. | — |
| evening | Story: `poll-2-loopa-looks` + `ask-drop-your-idea` again | — |

### Day 5 (Sat): Give it back to the community
| Time | Do | Asset |
|---|---|---|
| 11:00 | **"Brands from your comments"**: 3–5 ideas from the week, branded, posted as a carousel and credited (with permission). Copy the card format in `statics/src/deck.js` and I can render them. | new cards |
| afternoon | Offline: put the **A3 poster** up at co-working spaces and college E-cells. Share it in founder and student groups you're actually part of. | `one-sentence/poster-a3.pdf` |
| 22:30 | **3 a.m. meme**, feed + Story, late at night on purpose | `three-am/` |

### Day 6 (Sun): Lighter day + teach
| Time | Do | Asset |
|---|---|---|
| 11:00 | Naming rule: **short beats clever** (Reel + 16:9 on LinkedIn/X) | `naming-rules/` |
| evening | Story recap of the week, with real numbers only if you want to share them. Story `link-start-free`. | — |

### Day 7 (Mon): Review and plan week 2
- Fill in the scorecard below. Find the **one channel** and the **one format** that brought the most brands created, and double down on them in week 2.
- Write down the top 5 questions and objections. Each one becomes a post or FAQ in week 2.
- Ship the top fix and post "you asked, we shipped".
- If you made noticeably more brands from comments than from posts, run the comment-to-brand Reel every week.

---

## Daily routine (every day this week)
- **Morning (2 h):** reply to everything; brand the overnight ideas; answer DMs.
- **Midday:** publish the day's main post. Stay on it for the first 60–90 minutes.
- **Evening (1 h):** Stories, replies, and a look at the numbers (signups, brands created, top source).
- **Before bed:** note the one thing to fix tomorrow.

## Scorecard (fill in daily)
| Day | Visits | Guest starts | Brands created | Sign-ups | Top source | Ideas branded by hand | Top question / complaint |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |
| 2 | | | | | | | |
| 3 | | | | | | | |
| 4 | | | | | | | |
| 5 | | | | | | | |
| 6 | | | | | | | |
| 7 | | | | | | | |

The number that matters most is **brands created**, not likes.

---

## Ready-to-use copy
Replace the [brackets] before posting.

### Founder LinkedIn (Day 1)
> Naming my last project took nine browser tabs and three weekends: a thesaurus, a domain site, Instagram one handle at a time, a design tool, a font site, a colour site, and notes everywhere.
>
> So we built GoBrandToday. You type one sentence ("a cosy candle brand for Gen Z") and get names with meanings, honest domain and handle checks, a GoBrand Score that shows its maths, four logo looks, and a full brand book and launch kit. All in one tab.
>
> Two things we care about:
> • It never pretends something is free. Every domain result tells you how it was checked. Instagram and X don't allow automated checks, so you get a one-tap link instead of a guess.
> • Logos are real vector constructions with real fonts, not blurry AI images.
>
> It's free to start, no sign-up needed. Tell me your idea in one sentence in the comments and I'll reply with the brand.
>
> gobrandtoday.com [UTM link]

### Open call (Day 2, LinkedIn/X)
> Drop your startup or side-project idea in ONE sentence below 👇
> I'll run 10 of them through GoBrandToday today and reply with the name, score and logo. ✦

### X thread (Day 1)
> 1/ Naming a brand usually takes 9 tabs and 3 weekends. We made it one tab. ✦ [announcement video]
> 2/ Type one sentence. Get names with meanings, three reasons each works, and one honest watch-out.
> 3/ Domains across 10 endings, honestly checked: every result says how it was checked. Handles on 10 platforms (GitHub, Reddit and YouTube automatically; the rest get a one-tap check, no scraping).
> 4/ A GoBrand Score out of 10 from 8 weighted parts, and you can see every part.
> 5/ Then the brand: 4 logo looks, colours, fonts, a brand book with 9 mockups, and launch posts.
> 6/ Free to start, no sign-up needed. Reply with your idea and I'll brand it → gobrandtoday.com

### Personal message (Day 1, one by one)
> Hey [name]! I just launched GoBrandToday: type a business idea in one sentence and it gives you a name, domain and handle checks, a logo and a brand book. Would love your honest take (what confused you, what you'd change). No sign-up needed: [UTM link] 🙏

### Product Hunt
- **Name:** GoBrandToday
- **Tagline:** Turn a one-sentence idea into a launch-ready brand
- **Description:** Type your idea in one sentence. GoBrandToday suggests names with meanings, honestly checks domains (10 endings) and handles (10 platforms), scores every name with a transparent GoBrand Score, and builds the identity: 4 vector logo looks, colours, fonts, a brand book with mockups, and launch posts. Free to start.
- **Maker comment:**
> Hi PH 👋 I'm [name], maker of GoBrandToday.
> Naming my own projects meant nine tabs and three weekends, so we put the whole flow in one tab: idea → names → domains & handles → score → identity → launch kit.
> What we're proudest of is honesty. Every domain result says how it was checked; Instagram and X get a one-tap check instead of a guess; and the score shows its maths. It's guidance, not a guarantee, so please still run a trademark search before you invest.
> Try it without signing up, and tell me what's missing. Drop your idea below and I'll reply with the brand ✦

### Show HN (Day 4)
- **Title:** Show HN: GoBrandToday – one sentence in, name + domain checks + vector logo out
- **Text:**
> Type an idea; get names, domain availability across 10 endings (RDAP lookups, confirmed by a registrar where configured; each result is labelled with how it was checked), handle checks (automatic only where platforms allow it, otherwise a link to the exact profile URL), a weighted 8-part score you can inspect, and vector logo constructions with real fonts (not image-model output). No sign-up needed to try it. I'd love feedback on the scoring weights and the naming quality.

### Indie Hackers / r/SideProject (Day 2)
> **I built a tool that turns a one-sentence idea into a full brand (name, domain checks, logo, brand book)**
> What it does, why I built it (the nine-tabs story), what was hard (honest availability checks, vector logos), and what I'd like feedback on. Link at the end. Happy to brand anyone's idea in the comments.

*(On Reddit, write it as a maker's story, not an ad. Check each subreddit's self-promotion rules first, and post in only one or two places.)*

---

## Don'ts for launch week
- Don't ask for upvotes or use upvote groups (Product Hunt and HN penalise it). Ask for feedback.
- Don't post a link-only message in groups you're not part of.
- Don't quote numbers you can't back up. Share real ones later, once you have them.
- Don't promote Pro pricing or discounts until payments are live.
- Don't launch everything at once. Product Hunt and Show HN are on separate days so the founder can be present for each.
