# GoBrandToday launch playbook: how to roll out everything

Everything made so far, and the order to publish it in. Each folder has a `metadata.md` with captions, alt text and posting notes.

## The idea behind the content
Most product accounts post "here's our product" again and again. Ours shows **what happens to an idea**. Almost every piece follows one of three moves:

1. **One sentence → a brand.** (one-sentence posts, trading cards, the grid mural, the Loopa Reel)
2. **The honest bit.** We show the maths, the watch-outs and what we can't check. (checklist, Inside the Score, naming rules, graveyard)
3. **Your turn.** Every set ends by handing the viewer the blank: "Your card is missing", "Your idea goes here", "Drop your idea".

Move 3 also feeds itself: ideas that come in from comments and question stickers become the next round of posts and Reels (see "The loop" below).

## What's ready

| Set | Folder | Best for | Goal |
|---|---|---|---|
| Logo reveal (video) | `gobrandtoday-logo-reveal-*` | Profile intro, pinned post, YouTube intro | Recognition |
| Announcement (video, 54 s, VO) | `gobrandtoday-announcement-*` | Launch day: Reels, YouTube, LinkedIn, X | Reach + clicks |
| Name my brand: Loopa | `name-my-brand-loopa/` | Reels / Shorts | Reach |
| Comment to brand | `comment-to-brand/` | Reels (runs the comment loop) | Comments |
| Nine tabs vs one | `nine-tabs-vs-one/` | Reels, LinkedIn | Reach + relatability |
| Four logos, one name | `four-logos-one-name/` | Reels, Shorts | Shows the 4 looks |
| Inside the Score | `inside-the-score/` | Reels, LinkedIn | Trust |
| Indian roots | `indian-roots/` | India-focused Reels | India-first story |
| Brand book unboxing | `brand-book-unboxing/` | Reels, YouTube Shorts | Shows the depth of what's inside |
| Naming rules (×5) | `naming-rules/` | A weekly series on any platform | Saves + follows |
| **A** GoBrand Collection cards | `statics/cards/` | IG/LinkedIn carousel | Comments ("rate the cards") |
| **B** One sentence posts + A3 poster | `statics/one-sentence/` | Feed posts; print for meetups and campuses | Clear positioning |
| **C** Grid mural | `statics/grid-mural/` | Instagram profile grid | A strong first impression on the profile |
| **D** Brand graveyard | `statics/graveyard/` | Feed + Story | Shares |
| **E** 8 checks checklist | `statics/checklist/` | IG carousel, LinkedIn PDF | Saves |
| **F** Stories (polls, ask, link) | `statics/stories/` | Stories | Taps + replies |
| **G** Banners + link preview | `statics/banners/` | LinkedIn, X, YouTube, website | Consistency |
| **H** 3 a.m. meme | `statics/three-am/` | Feed, Story, X | Shares + tags |

## Before you post anything (one-time setup)
1. Fill in the blanks from section 14 of the brief: the live URL (assumed to be **gobrandtoday.com** everywhere; tell me if it differs), the handles and a contact email.
2. Upload the **banners (G)** to LinkedIn, X and YouTube. Add `og-1200x630.png` as the site's link preview image (the HTML is in its metadata).
3. Set the bio and link-in-bio to gobrandtoday.com (bio lines are in `banners/metadata.md`).
4. Pin the **logo reveal** (or the announcement) to the top of the profile.

## A 4-week plan (about 4 feed posts and daily Stories per week)

**Week 1: Launch, "one sentence → a brand"** (the detailed, all-channel version is in `WEEK-1-LAUNCH.md`)
| Day | Feed | Stories |
|---|---|---|
| Mon | **Announcement** video (Reel + YouTube + LinkedIn + X) | `link-start-free` |
| Tue | **Grid mural** (C), all 3 posts in one sitting, right → left | `poll-3-names` |
| Thu | **One sentence: Wickd** (B-01) | `poll-1-mello-looks` |
| Sat | **Name my brand: Loopa** Reel | share the Reel + `ask-drop-your-idea` |

**Week 2: Show what's inside**
| Day | Feed | Stories |
|---|---|---|
| Mon | **GoBrand Collection cards** (A) | slide 1 + poll "Wickd or Mello?" |
| Wed | **Four logos, one name** Reel | `poll-2-loopa-looks` |
| Fri | **Brand book unboxing** Reel | `link-start-free` |
| Sun | **3 a.m. meme** (H), posted late evening | `story-3am` |

**Week 3: The honest bit**
| Day | Feed | Stories |
|---|---|---|
| Mon | **8 checks checklist** (E), plus the PDF on LinkedIn | one checklist slide per day as a Story |
| Wed | **Inside the Score** Reel | — |
| Fri | **Brand graveyard** (D) | `story-graveyard` + poll |
| Sun | Naming rule: **short beats clever** | — |

**Week 4: India-first + your turn**
| Day | Feed | Stories |
|---|---|---|
| Mon | **Indian roots** Reel | — |
| Wed | **One sentence: Loopa / Pawse** (B-02/03) | `ask-drop-your-idea` |
| Fri | **Comment to brand** Reel ("comment your idea") | reply with the brands you made |
| Sun | **One sentence: your idea goes here** (B-04) | `link-start-free` |

After week 4, keep going: one **naming rule** a week (the other 4 are ready), plus "brands from your comments" posts.

**LinkedIn (founder profile):** the announcement, then the checklist PDF, Inside the Score, the trading cards and the naming rules, once or twice a week. Keep the founder's voice in the first line.
**X:** the 3 a.m. meme, the graveyard, and the naming rules as one-liners with the 16:9 videos.
**YouTube:** the 16:9 versions plus Shorts. Channel art (G) and the logo reveal as the channel trailer intro.
**Offline:** print the **A3 poster** (B) for co-working spaces, college E-cells and hackathons, with a pen and sticky notes beside it.

## The loop (how this turns into a brand people follow)
1. Ask with the `ask-drop-your-idea` Story, the comment-to-brand Reel, or the B-04 post.
2. Pick 2–3 ideas (with permission) and run them through GoBrandToday.
3. Post the results as new **trading cards** (copy a block in `statics/src/deck.js`), a "one sentence" post, or a Reel.
4. Tag or credit the person, and they share it. Repeat.

That's a series nobody else can copy, because it uses your product and your audience.

## Guardrails (from the brief, already followed in every asset)
- Example brands, names and scores are always labelled **example / illustrative**.
- Handles: only GitHub, Reddit and YouTube are checked automatically; the rest are a **one-tap check**. Never say "verified".
- Domains: "honestly checked" and "we tell you how each result was checked". Never "guaranteed".
- The score is "guidance, not a guarantee". Pair it with "run a trademark search before you invest".
- CTAs: **Start free / Create My Brand**. No "Buy Pro" or discount posts until payments are live.
- No made-up testimonials, user counts or press logos. No competitor names. No ™/®.
- If you write new captions, follow the same rules.

## What to measure
- **Saves** (checklist, cards), **shares** (graveyard, 3 a.m.), **comments** (cards, comment-to-brand), **link taps** (link Story, bio).
- Signups or brands created per post, if you add UTM tags to links (for example `?utm_source=instagram&utm_campaign=cards`).
- Double down on whichever of the three moves performs best.

## Making more
- **Statics:** edit `gobrandtoday/statics/src/pieces/<piece>.html`, then run `python3 gobrandtoday/statics/build.py <piece>`.
- **Videos:** see `gobrandtoday/video/` (HyperFrames) and `gobrandtoday/audio/` (signature music and VO).
- Or just ask me: "make a trading card for <idea>", "another naming rule", "a festive version of the poster", and so on.
