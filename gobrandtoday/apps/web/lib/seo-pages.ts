import type { RepurposeKind } from '@gbt/shared';

/** Dedicated landing pages for high-intent searches. Each pre-selects a mode in the studio. */
export interface SeoPage {
  slug: string;
  short: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  mode: string;
  example: string;
  points: Array<{ t: string; b: string }>;
  faq: Array<{ q: string; a: string }>;
  /** An interactive widget replaces the naming composer on utility pages. */
  widget?: 'social' | 'domain' | 'bible' | 'repurpose';
  /** For the logo repurpose tool: the asset this page is about, shown first. */
  focus?: RepurposeKind;
}

const commonFaq = [
  {
    q: 'Is domain availability real?',
    a: 'Yes. We ask the domain registries directly (RDAP) or a registrar API. If we cannot verify a domain, we say so — we never guess “available”.',
  },
  {
    q: 'Can you check Instagram and X usernames?',
    a: 'We verify handles automatically where the platform allows it (GitHub, Reddit, YouTube). Instagram, X, TikTok and others don’t offer a public check, so we give you a one-tap link to confirm in two seconds.',
  },
  {
    q: 'Is it free?',
    a: 'Yes — the Spark plan is free forever. Pro (₹499 / $9 a month) unlocks unlimited rounds, the full Brand Bible and the AI Brand Assistant.',
  },
];

const repurposeFaq = [
  { q: 'Is my logo uploaded anywhere?', a: 'No. The files are made in your browser: your logo never leaves your device. A free account is only needed to download.' },
  { q: 'What file should I use?', a: 'A PNG with a transparent background, 1000–2000 px wide, gives the cleanest results. JPG, WebP and SVG work too. If your logo has a solid background, we place it on a matching tile so it never looks cut out.' },
  { q: 'Will the words and logo get cropped?', a: 'No. Every file keeps the logo and words inside the platform’s safe area: the middle of the YouTube banner, clear of the profile photo on LinkedIn and X, and inside the circle on profile pictures.' },
  { q: 'Don’t have a logo yet?', a: 'Start with GoBrandToday’s name and logo generator: you get four logo looks, a full brand book and the same social kit, made around your new brand.' },
];

const repurposePoints = [
  { t: 'Every size, done', b: 'Profile picture, Instagram and LinkedIn post, LinkedIn banner, X header, YouTube banner and a one-page brand guidelines sheet.' },
  { t: 'Your colours, found for you', b: 'We pick the brand, accent, ink and paper colours from your logo. Tap any swatch to change it.' },
  { t: 'Private by design', b: 'Your file stays in your browser. Download PNGs one by one or everything as a ZIP.' },
];

export const SEO_PAGES: SeoPage[] = [
  {
    slug: 'ai-brand-name-generator',
    short: 'AI brand name generator',
    title: 'AI Brand Name Generator — names with domains & handles checked',
    h1: 'AI brand name generator',
    description: 'Describe your idea in one sentence. Get brandable names with live domain checks, social handle checks and a transparent GoBrand Score.',
    intro: 'Most name generators give you a hundred names you can’t use. We give you fewer, better ones — and show you which domains and handles are actually free.',
    mode: 'smart',
    example: 'An AI platform that helps Indian small businesses automate customer support',
    points: [
      { t: 'Names with a reason', b: 'Every name comes with its meaning, pronunciation and why it fits your idea.' },
      { t: 'Checked, not guessed', b: '.com, .in, .ai, .io and more — verified with the registries.' },
      { t: 'Scored out of 10', b: 'Brandability, memorability, pronunciation, SEO and availability in one number.' },
    ],
    faq: commonFaq,
  },
  {
    slug: 'startup-name-generator',
    short: 'Startup name generator',
    title: 'Startup Name Generator — short, ownable names for founders',
    h1: 'Startup name generator',
    description: 'Short, ownable startup names with available domains. Refine in plain English: “shorter”, “less techy”, “starts with K”.',
    intro: 'Your startup name will be said in pitches, typed into browsers and printed on hoodies. Pick one that works everywhere.',
    mode: 'short',
    example: 'Fintech company for freelancers',
    points: [
      { t: 'Short & punchy', b: 'Four to seven letters, easy to say on a call.' },
      { t: 'Refine like you talk', b: '“Too corporate” is a valid instruction here.' },
      { t: 'Compare side by side', b: 'Shortlist three, compare every factor, then decide.' },
    ],
    faq: commonFaq,
  },
  {
    slug: 'domain-name-generator',
    short: 'Domain name generator',
    title: 'Domain Name Generator — only names you can register today',
    h1: 'Domain name generator',
    description: 'Domain-First search: we generate names and keep only the ones whose .com (or .in, .ai) is free right now.',
    intro: 'The best name is the one you can actually buy. Domain-First mode checks availability while it generates.',
    mode: 'domain_first',
    example: 'A cosy candle brand for Gen Z',
    points: [
      { t: 'Domain-First', b: 'Names are filtered by real registry checks before you see them.' },
      { t: 'India-ready', b: '.in and .co.in alongside .com, .ai and .io.' },
      { t: 'Buy in one click', b: 'Straight to Hostinger, GoDaddy or Namecheap with the domain pre-filled.' },
    ],
    faq: commonFaq,
  },
  {
    slug: 'business-name-generator',
    short: 'Business name generator',
    title: 'AI Business Name Generator for India & the world',
    h1: 'AI business name generator',
    description: 'Business names that work in India and abroad, checked for unfortunate meanings in Hindi, English and other major languages.',
    intro: 'From a kirana-tech startup to a D2C label — find a name your customers can say, spell and remember.',
    mode: 'global',
    example: 'Premium sustainable clothing brand for Gen Z in India',
    points: [
      { t: 'Global & local', b: 'Easy to say in Indian English, Hindi and US English.' },
      { t: 'Risk check', b: 'Flags names with awkward meanings or look-alikes of famous brands.' },
      { t: 'Save & share', b: 'Shortlist names and share them with your co-founder.' },
    ],
    faq: commonFaq,
  },
  {
    slug: 'brand-name-generator',
    short: 'Brand name generator',
    title: 'Brand Name Generator — then build the whole brand',
    h1: 'Brand name generator',
    description: 'Find the name, then turn it into a brand: logo direction, colours, fonts, tagline, story and launch posts.',
    intro: 'Don’t just find a name. Build the brand — in the same place, in minutes.',
    mode: 'smart',
    example: 'A chai subscription for remote teams',
    points: [
      { t: 'Name → brand', b: 'One click from a name to a complete Brand Bible.' },
      { t: 'Real identity', b: 'Wordmark, signature mark, five-colour palette and a Google Fonts trio.' },
      { t: 'Launch-ready', b: 'Bios, launch posts and 10 content ideas for your first month.' },
    ],
    faq: commonFaq,
  },
  {
    slug: 'ai-brand-kit-generator',
    short: 'AI brand kit generator',
    title: 'AI Brand Kit Generator — logo direction, colours, fonts & voice',
    h1: 'AI brand kit generator',
    description: 'Generate a complete starter brand kit: wordmark, mark, colour palette with HEX codes, typography, voice and usage rules.',
    intro: 'Get the kind of brand guidelines agencies charge lakhs for — as a living starting point you can refine with the AI assistant.',
    mode: 'smart',
    example: 'A neighbourhood bakery going online',
    points: [
      { t: 'Guidelines, not just a logo', b: 'Colour roles, type, motion, voice and do’s and don’ts.' },
      { t: 'Export anywhere', b: 'PDF, PNG, SVG, JSON and Markdown.' },
      { t: 'Edit by chatting', b: '“Make it darker”, “more premium tagline” — done.' },
    ],
    faq: commonFaq,
  },
  {
    slug: 'startup-branding-tool',
    short: 'Startup branding tool',
    title: 'Startup Branding Tool — from idea to identity in minutes',
    h1: 'Startup branding tool',
    description: 'Idea → name → domain → handles → score → identity → launch. One simple, India-first tool.',
    intro: 'Stop juggling a thesaurus, three registrar tabs, Instagram and Canva. Do it all in one place.',
    mode: 'smart',
    example: 'A mental-wellness app for college students',
    points: [
      { t: 'One flow', b: 'Every step in order, nothing to set up.' },
      { t: 'Priced for India', b: 'Free to start; Pro is ₹499 a month.' },
      { t: 'Yours to keep', b: 'Export everything — no lock-in.' },
    ],
    faq: commonFaq,
  },
  {
    slug: 'social-media-username-checker',
    short: 'Username checker',
    title: 'Social Media Username Checker — Instagram, X, YouTube, LinkedIn & more',
    h1: 'Social media username checker',
    description: 'Check one username across Instagram, X, YouTube, LinkedIn, TikTok, GitHub, Reddit and more. Verified where platforms allow it, one-tap links everywhere else, plus smart alternatives.',
    intro: 'Type a handle once. We verify it where platforms offer a public check, give you one-tap links where they don’t, and suggest clean alternatives if it’s gone.',
    mode: 'smart',
    example: 'lumora',
    widget: 'social',
    points: [
      { t: 'Ten platforms at once', b: 'Instagram, X, YouTube, LinkedIn, TikTok, Facebook, Threads, Pinterest, Reddit and GitHub.' },
      { t: 'Honest results', b: 'Verified where a public check exists. Everywhere else, a one-tap link: we never guess.' },
      { t: 'The core five', b: 'One tag tells you whether .com, Instagram, X, YouTube and LinkedIn are clear.' },
    ],
    faq: [
      { q: 'Why can’t you verify Instagram or X automatically?', a: 'They don’t offer a public availability check, and scraping them breaks their terms. We give you a direct link to the profile URL instead: if it shows “page not found”, the handle is likely free.' },
      { q: 'What are the rules for usernames?', a: 'Each platform differs: Instagram allows letters, numbers, dots and underscores up to 30 characters; X allows up to 15 letters, numbers and underscores; YouTube handles can be 3–30 characters. We validate each one for you.' },
      ...commonFaq.slice(0, 1),
    ],
  },
  {
    slug: 'domain-availability-checker',
    short: 'Domain checker',
    title: 'Domain Availability Checker with Prices — .com, .in, .ai, .io (India)',
    h1: 'Domain availability checker',
    description: 'Check .com, .in, .co.in, .ai, .io, .co, .app and more in one go, straight from the registries. See typical first-year and renewal prices in ₹ or $, then buy at Hostinger, GoDaddy or Namecheap.',
    intro: 'We ask the registries directly, then a registrar confirms it can actually be bought. You see the price before you click, in rupees or dollars.',
    mode: 'domain_first',
    example: 'kettlo',
    widget: 'domain',
    points: [
      { t: 'Straight from the registry', b: 'RDAP lookups at Verisign, NIXI and others: the source of truth, not a cached guess.' },
      { t: 'Prices up front', b: 'Live registrar prices where connected; clearly labelled estimates otherwise. Renewal prices too.' },
      { t: 'Buy anywhere', b: 'One click to Hostinger, GoDaddy or Namecheap with the name already filled in.' },
    ],
    faq: [
      { q: 'Why does a registrar sometimes show a different result?', a: 'A name can be unregistered at the registry but still reserved or priced as “premium” by the registry. That’s why we confirm with a registrar where possible and label registry-only results “Likely free”.' },
      { q: 'Are the prices exact?', a: 'Live prices come from the registrar. Where we show “est.”, it’s the typical first-year price at Indian/US registrars; the final price, taxes and any promotion are shown at checkout.' },
      ...commonFaq.slice(2),
    ],
  },
  {
    slug: 'brand-bible-generator',
    short: 'Brand bible generator',
    title: 'Brand Bible Generator — free brand guidelines with logo, colours & voice',
    h1: 'Brand bible generator',
    description: 'Turn your brand name into a complete brand bible: story, positioning, voice, four logo looks, colour palette, Google Fonts pairing, mockups and launch content. Free to start.',
    intro: 'Got a name? In about a minute you get a studio-style brand book: essence, logo system, colours with HEX/RGB/CMYK, type scale, voice, imagery and real mockups.',
    mode: 'smart',
    example: 'Chaiwala',
    widget: 'bible',
    points: [
      { t: 'Four looks first', b: 'Pick from four genuinely different logo directions before the book is built around your choice.' },
      { t: 'A real brand book', b: 'Clear space, minimum sizes, misuse, accessible colour pairings, type scale and mockups.' },
      { t: 'Launch-ready', b: 'Bios, launch posts, an X thread, 10 content ideas and homepage copy in your voice.' },
    ],
    faq: [
      { q: 'What is a brand bible?', a: 'A single document that defines how your brand looks, sounds and behaves: logo, colours, type, voice and examples. It keeps everyone (and every freelancer) consistent.' },
      { q: 'Can I edit it?', a: 'Yes. Edit any text, switch looks, regenerate sections or ask the AI Brand Assistant (“make it more premium”). Every change is versioned.' },
      ...commonFaq.slice(2),
    ],
  },
  {
    slug: 'logo-to-social-kit',
    short: 'Logo to social kit',
    title: 'Upload Your Logo, Get Your Social Media Kit — banners, profile picture & brand guidelines',
    h1: 'Turn your logo into a social media kit',
    description: 'Upload the logo you already have. Get a profile picture, LinkedIn banner, X header, YouTube banner, a launch post and one-page brand guidelines, each at the exact size. Free, in your browser.',
    intro: 'Already have a logo? Drop it in. We pick your colours from it and make every profile picture, banner and post you need to launch, plus a one-page brand guidelines sheet.',
    mode: 'smart',
    example: 'tealeaf',
    widget: 'repurpose',
    points: repurposePoints,
    faq: repurposeFaq,
  },
  {
    slug: 'linkedin-banner-maker',
    short: 'LinkedIn banner maker',
    title: 'LinkedIn Banner Maker — upload your logo, get a 1584 × 396 banner',
    h1: 'LinkedIn banner maker',
    description: 'Make a LinkedIn company or profile banner (1584 × 396) from your logo in seconds. Your colours, your tagline, kept clear of the profile photo. Free.',
    intro: 'Upload your logo and add a line about what you do. You get a LinkedIn banner at the exact size, with everything kept clear of the profile photo, plus the rest of your social kit.',
    mode: 'smart',
    example: 'tealeaf',
    widget: 'repurpose',
    focus: 'linkedin',
    points: repurposePoints,
    faq: repurposeFaq,
  },
  {
    slug: 'youtube-banner-maker',
    short: 'YouTube banner maker',
    title: 'YouTube Banner Maker — channel art from your logo (2560 × 1440)',
    h1: 'YouTube banner maker',
    description: 'Create YouTube channel art (2560 × 1440) from your logo, with the logo and words inside the 1546 × 423 safe area so they show on TV, desktop and phone.',
    intro: 'YouTube crops channel art differently on every screen. Upload your logo and we keep everything inside the safe area, so it looks right on phones, laptops and TVs.',
    mode: 'smart',
    example: 'tealeaf',
    widget: 'repurpose',
    focus: 'youtube',
    points: repurposePoints,
    faq: repurposeFaq,
  },
  {
    slug: 'x-header-maker',
    short: 'X header maker',
    title: 'X (Twitter) Header Maker — 1500 × 500 header from your logo',
    h1: 'X header maker',
    description: 'Make an X (Twitter) header at 1500 × 500 from your logo and tagline, in your colours, clear of the profile photo. Free, no design skills needed.',
    intro: 'Upload your logo, add your line, and get an X header at the exact size, with your profile picture and the rest of your social kit alongside.',
    mode: 'smart',
    example: 'tealeaf',
    widget: 'repurpose',
    focus: 'x',
    points: repurposePoints,
    faq: repurposeFaq,
  },
  {
    slug: 'profile-picture-maker',
    short: 'Profile picture maker',
    title: 'Logo Profile Picture Maker — circle-safe 1080 × 1080 for every platform',
    h1: 'Logo profile picture maker',
    description: 'Turn your logo into a crisp 1080 × 1080 profile picture that survives the circle crop on Instagram, LinkedIn, X, YouTube and WhatsApp. Free, in your browser.',
    intro: 'Most logos get their edges cut off by the circle crop. Upload yours and we centre it in the safe middle, on the right background, at 1080 × 1080.',
    mode: 'smart',
    example: 'tealeaf',
    widget: 'repurpose',
    focus: 'avatar',
    points: repurposePoints,
    faq: repurposeFaq,
  },
  {
    slug: 'brand-guidelines-from-logo',
    short: 'Guidelines from your logo',
    title: 'Brand Guidelines From Your Logo — free one-page brand sheet',
    h1: 'Brand guidelines from your logo',
    description: 'Upload your logo and get a one-page brand guidelines sheet: clear space, logo on colour, your palette with HEX and RGB, typeface and do/don’t examples.',
    intro: 'Give every freelancer and printer the same rules. Upload your logo and get a one-page brand sheet with clear space, colours, type and do/don’t examples.',
    mode: 'smart',
    example: 'tealeaf',
    widget: 'repurpose',
    focus: 'guidelines',
    points: repurposePoints,
    faq: repurposeFaq,
  },
];
