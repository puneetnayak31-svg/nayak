# HIPL launch checklist

Tick these off in order. Nothing goes live with an unfilled `[PLACEHOLDER]` or an unchecked `VERIFY` marker.

## 1. Content ready (2–3 weeks before)
- [ ] Replace every `[PLACEHOLDER]` on the site: search the `hipl-website/src` folder for `[` and fill or remove each one.
- [ ] Remove the "Sample" labels from anything that is now real; delete sample content that isn't.
- [ ] Explorations: the first entries have been through **Draft → Fact-check → (Expert review for sensitive entries) → Ready → Published**.
- [ ] Every `VERIFY` marker is resolved against the named edition and translation, and every pull quote has a source and translator.
- [ ] Dialogue 01: date, venue, speakers (both sides), moderator and background readings are confirmed in writing.
- [ ] First interview filmed, captioned and uploaded; YouTube ID added.
- [ ] Reading Circle: text, guiding question, 2-page guide (PDF), session dates and facilitator are confirmed.
- [ ] Dispatch Issue 01 is written, and Issue 02 is drafted (never skip a week).
- [ ] About page: team names, roles and contact email.
- [ ] Privacy note has been reviewed by a lawyer; last-updated date set.
- [ ] Hindi lockup is approved by a native reader before any Hindi use.

## 2. Technical (1–2 weeks before)
- [ ] Domain bought and connected; `SITE_URL` in `build.py` is set to the real domain; site rebuilt.
- [ ] HTTPS works on the domain and on `www`.
- [ ] Forms are connected to real endpoints (see `DEPLOY.md`): Dispatch, 100 Questions, RSVP, Dialogue questions, Reading Circle, Write for HIPL pitch, guest suggestions, corrections.
- [ ] Spam protection (for example Cloudflare Turnstile) is on for every form; the honeypot field is kept.
- [ ] Confirmation emails send (for example via Resend) for Dispatch, RSVP, Reading Circle and pitches, including guardian emails for under-18 pitches.
- [ ] The newsletter provider (for example Beehiiv) has double opt-in and an unsubscribe link.
- [ ] Cookieless analytics (for example Plausible) installed; check that events arrive (form submits, filters, dilemma choices, shares).
- [ ] `og-default.png` shows correctly when a link is shared on WhatsApp, X and LinkedIn.
- [ ] Lighthouse on a mid-range phone: 90+ for performance, accessibility, best practices and SEO.
- [ ] Keyboard-only walkthrough of every page: menu, filters, tabs, dilemma, map, polls, forms.
- [ ] Screen reader spot-check (VoiceOver or TalkBack) on Home, an Exploration and the pitch form.
- [ ] `sitemap.xml` submitted to Google Search Console.

## 3. Social (1 week before)
- [ ] Handles reserved: Instagram, X, YouTube, LinkedIn, WhatsApp Channel.
- [ ] Profile picture: `logos/png/hipl-avatar.png`. Headers: `social/x-header.png`, `social/linkedin-banner.png`.
- [ ] Bios pasted from `copy/launch-copy.md`.
- [ ] Launch-week posts scheduled (see the day-by-day table in `copy/launch-copy.md`).

## 4. Launch day
- [ ] Final rebuild and deploy; spot-check five pages on a phone.
- [ ] Publish the launch post, carousel and stories.
- [ ] Send the WhatsApp message to the first circle of supporters.
- [ ] Post on LinkedIn from the founder's account and the HIPL page.
- [ ] Watch the 100 Questions inbox and review new questions within 24 hours.

## 5. Week one
- [ ] Publish Question 001/100 with its status.
- [ ] Reply to every pitch within 10 working days.
- [ ] Dispatch Issue 01 goes out on the fixed day and time.
- [ ] Review analytics: top pages, form completions, where readers drop off in Explorations.
- [ ] Log any errors on the corrections page.
