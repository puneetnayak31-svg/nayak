# Banners: profile headers and the link preview

Behind each banner runs a ticker of one-line ideas, each ending in our spark. It says "people bring us one sentence" without a single feature bullet. In front, the site headline **Your idea deserves a brand✦**, the wordmark and the URL sit inside each platform's safe area.

| File | Size | Where | Safe-area handling |
|---|---|---|---|
| `linkedin-profile-1584x396.png` | 1584×396 | LinkedIn personal profile (founder) | Text kept right of x≈600, because the profile photo covers the lower left |
| `linkedin-company-1128x191.png` | 1128×191 | LinkedIn company page | Text kept right of x≈330, because the page logo covers the lower left |
| `x-header-1500x500.png` | 1500×500 | X (Twitter) header | Text kept right of x≈480 (clear of the avatar) and inside the middle band (phones crop top and bottom) |
| `youtube-2560x1440.png` | 2560×1440 | YouTube channel banner | Everything important is inside the centre 1546×423 that shows on every device. On TV, the ticker fills the rest of the frame. |
| `og-1200x630.png` | 1200×630 | Link preview (Open Graph / Twitter card) for gobrandtoday.com and shared links | Full composition, plus one line on what's inside |

## Using the link preview (for the web team)
```html
<meta property="og:image" content="https://gobrandtoday.com/og-1200x630.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:title" content="GoBrandToday · Your idea deserves a brand">
<meta property="og:description" content="Type one sentence. Get a name, honestly checked domains and handles, a GoBrand Score, logo, brand book and launch kit. Start free.">
<meta name="twitter:card" content="summary_large_image">
```

## Bio lines to pair with the banners
- **X / Instagram bio:** AI brand studio ✦ One sentence → name, domain, handles, logo & brand book. Start free ↓
- **LinkedIn company tagline:** Your idea deserves a brand. Name, domain, handles and identity, all in one tab.
- **YouTube channel description (first line):** Watch one-sentence ideas turn into brands. Naming rules, logo builds and brand books, from GoBrandToday.

## Alt text
A light background filled with faint one-line ideas, each ending in a spark (for example "A cosy candle brand for Gen Z" and "A chai subscription for remote teams"). In front: "Your idea deserves a brand✦", the gobrandtoday✦ wordmark and "Start free · gobrandtoday.com".
