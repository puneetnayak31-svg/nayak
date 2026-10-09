# Known limitations (honest list)

1. **Instagram, X, TikTok, LinkedIn, Facebook, Threads and Pinterest handles can't be verified automatically.** These platforms offer no compliant public check, so we show a one-tap link instead of scraping. A licensed aggregator can be plugged in via `SocialChecker`.
2. **RDAP can't see premium or reserved names.** A registry-only answer is shown as **Likely free**, never “Available”, with a labelled price estimate. Configure a registrar (Name.com, Porkbun, GoDaddy, Namecheap or Hostinger) to confirm availability and get real prices.
3. **Some ccTLDs have no RDAP.** We fall back to DNS, which can prove a domain is *taken* but never that it's *available*. Those show as **Unverified**.
4. **The GoBrand Score is a heuristic.** It's transparent and deterministic, but it isn't a trademark search, a ranking prediction or a promise of success. The UI says so wherever the score appears.
5. **Risk detection uses a curated word list.** It covers common problem words in English, Hindi, Spanish, French, German, Portuguese, Italian, Arabic and Japanese. It isn't exhaustive, and it isn't legal clearance.
6. **Logos are vector, not AI images.** Ten constructions, thirteen generative symbol families and AI-drawn SVG symbols give every brand its own mark, crisp and exportable as SVG. Image models (FLUX via Pollinations and friends) are used for moodboards and raster concept sketches, which are inspiration rather than final artwork. Bespoke hand-drawn logos are offered through the Experts service.
7. **PDF export uses the browser's print dialog** on a print-optimised guidelines page. Server-side PDF (e.g. Playwright) is an easy extension.
8. **Payments aren't live.** Plans, prices and quotas are; checkout is stubbed (Razorpay/Stripe adapters to implement).
9. **The offline generator is rule-based.** It's good for development and as a fallback; add an AI key for the real experience.
10. **Brand generation runs in-process.** If the API restarts mid-generation, that brand shows **Try again**. Move to a job queue at scale.
11. **Estimated prices are typical, not quotes.** Without a registrar API the price table in `domain-pricing.ts` is used and labelled “est.”; promotions, taxes and premium prices appear at checkout.
12. **The preview build can't check anything live.** It runs in a sandbox with no network, so every domain and handle is “not checked” with a link; it uses Claude (with the viewer's consent) for names, kits and symbols when available.
13. **Domain watchlist re-checks are manual.** Scheduled monitoring and alerts are on the roadmap.
14. **Gmail won't show a pasted signature logo.** The email signature embeds the brand icon as a data URL, which Apple Mail and Outlook keep but Gmail drops; the founder must host the PNG and paste its link (the Downloads card explains this).
15. **The logo repurpose tool works with the image it's given.** It can't redraw a low-resolution logo, recolour a raster logo or remove a background; a logo that would vanish on a colour is placed on a tile instead.
16. **Landing-page examples are illustrative.** The hero's "magic" shows three fixed worked examples (labelled Example), not live results.

# Future extension points

| Feature | Where it plugs in |
|---|---|
| Trademark search (preliminary) | New provider plus `risks` on the score |
| Competitor analysis | New AI section using the same `completeJSON` pattern |
| Multi-language name analysis | Extend `detectRisks` / add an AI check |
| Domain price comparison | Ask several `DomainProvider`s in parallel and merge prices |
| Domain and handle monitoring | Cron over `domain_watch` → email/push |
| Team collaboration, agency mode, approvals | `projects` / `brands` → add an `organisations` and `members` table |
| Payments | `BillingProvider` + `subscriptions` |
| Publish the website draft | `websiteFile` (already generated) → hosting/deploy provider and a custom domain |
| PPTX / DOCX export | Render from the same `BrandKit` JSON |
