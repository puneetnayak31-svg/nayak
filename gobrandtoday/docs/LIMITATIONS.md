# Known limitations (honest list)

1. **Instagram, X, TikTok, LinkedIn, Facebook, Threads and Pinterest handles can't be verified automatically.** These platforms offer no compliant public check, so we show a one-tap link instead of scraping. A licensed aggregator can be plugged in via `SocialChecker`.
2. **RDAP can't see premium pricing.** “Available” from RDAP means *not registered*; the registrar confirms the price at checkout. Use GoDaddy or Namecheap to get prices and premium flags.
3. **Some ccTLDs have no RDAP.** We fall back to DNS, which can prove a domain is *taken* but never that it's *available*. Those show as **Unverified**.
4. **The GoBrand Score is a heuristic.** It's transparent and deterministic, but it isn't a trademark search, a ranking prediction or a promise of success. The UI says so wherever the score appears.
5. **Risk detection uses a curated word list.** It covers common problem words in English, Hindi, Spanish, French, German, Portuguese, Italian, Arabic and Japanese. It isn't exhaustive, and it isn't legal clearance.
6. **Logos are system-generated** from eight hand-designed families (with a generative symbol for one of them), not free-form AI images. That's deliberate: they're crisp, consistent, editable and exportable as SVG. An image-generation provider could be added as a ninth family.
7. **PDF export uses the browser's print dialog** on a print-optimised guidelines page. Server-side PDF (e.g. Playwright) is an easy extension.
8. **Payments aren't live.** Plans, prices and quotas are; checkout is stubbed (Razorpay/Stripe adapters to implement).
9. **The offline generator is rule-based.** It's good for development and as a fallback; add an AI key for the real experience.
10. **Brand generation runs in-process.** If the API restarts mid-generation, that brand shows **Try again**. Move to a job queue at scale.
11. **Domain watchlist re-checks are manual.** Scheduled monitoring and alerts are on the roadmap.

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
| Generate an actual website | `website` kit section → static site generator |
| PPTX / DOCX export | Render from the same `BrandKit` JSON |
