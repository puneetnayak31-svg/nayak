import { z } from 'zod';

/**
 * "Work with an expert": bespoke, human-made services on top of the
 * self-serve kit. Prices are starting points ("from"), set per currency like
 * the plans, and every request gets a written scope before any payment.
 */
export interface ExpertService {
  id: string;
  title: string;
  /** One line for cards. */
  pitch: string;
  /** What's included, for the detail view. */
  includes: string[];
  /** Typical turnaround. */
  turnaround: string;
  from: { INR: number; USD: number };
  /** Short label for the price ("from", "per track", "+ govt fees"). */
  priceNote?: string;
  /** Emoji-free glyph id the UI draws. */
  glyph: 'pen' | 'compass' | 'browser' | 'wave' | 'box' | 'play' | 'shield' | 'grid';
  /** When to suggest it first (matched against industry/personality). */
  fit: string[];
}

export const EXPERT_SERVICES: ExpertService[] = [
  {
    id: 'identity',
    title: 'Bespoke logo & identity',
    pitch: 'A senior designer takes your chosen look and crafts it by hand: custom lettering, symbol and a full system.',
    includes: ['Discovery call and moodboard', '3 hand-crafted logo routes, 2 rounds of revisions', 'Custom-drawn symbol and wordmark', 'Final files: SVG, PNG, PDF, favicon, app icon', 'A 20-page brand book'],
    turnaround: '2–3 weeks',
    from: { INR: 24999, USD: 499 },
    glyph: 'pen',
    fit: ['Premium', 'Luxury', 'fashion', 'beauty', 'consumer', 'food'],
  },
  {
    id: 'strategy',
    title: 'Naming & brand strategy workshop',
    pitch: 'A 90-minute live session with a strategist to stress-test your name, positioning and audience before you spend on launch.',
    includes: ['Pre-read of your brief and shortlist', '90-minute video workshop', 'Positioning and messaging rewrite', 'Trademark-risk first pass on up to 5 names', 'Written summary within 48 hours'],
    turnaround: '1 week',
    from: { INR: 14999, USD: 299 },
    glyph: 'compass',
    fit: ['Trustworthy', 'fintech', 'saas', 'consulting', 'healthcare'],
  },
  {
    // Packages and the brief live in website.ts; keep these prices in step with WEBSITE_PACKAGES.
    id: 'website',
    title: 'Website design & build',
    pitch: 'We turn your first-draft website into a real one: a launch page, a full business site or an online store, on your domain.',
    includes: ['Launch page from ₹9,999 / $199 (5–7 days)', 'Business website, up to 6 pages with a CMS, from ₹34,999 / $699 (2–3 weeks)', 'Online store with UPI and card payments from ₹64,999 / $1,299 (3–5 weeks)', 'Basic SEO, analytics, forms and WhatsApp button', 'Domain, email setup help and 30 days of fixes'],
    turnaround: '5 days – 5 weeks',
    from: { INR: 9999, USD: 199 },
    glyph: 'browser',
    fit: ['saas', 'ai', 'consulting', 'education', 'e-commerce'],
  },
  {
    id: 'sonic',
    title: 'Sonic branding & music',
    pitch: 'An audio logo, a jingle and background music composed for your brand, so it sounds as distinct as it looks.',
    includes: ['Sonic mnemonic (2–4 second audio logo)', '30-second brand jingle or theme', 'Reel/Short background track, royalty-free for you', 'Notification and app sounds on request', 'Stems and WAV/MP3 masters'],
    turnaround: '2–3 weeks',
    from: { INR: 19999, USD: 399 },
    glyph: 'wave',
    fit: ['Playful', 'Youthful', 'media', 'creator', 'food', 'consumer'],
  },
  {
    id: 'packaging',
    title: 'Packaging & label design',
    pitch: 'Boxes, pouches, labels and stickers designed for print, with dielines your printer can use straight away.',
    includes: ['Up to 3 SKUs or one hero pack', 'Print-ready dielines and colour specs', 'FSSAI/legal text layout (India)', 'Photo-real mockups for your store', 'Printer handover call'],
    turnaround: '2–4 weeks',
    from: { INR: 19999, USD: 399 },
    glyph: 'box',
    fit: ['food', 'beauty', 'consumer', 'e-commerce', 'fashion'],
  },
  {
    id: 'video',
    title: 'Launch video & motion',
    pitch: 'An animated logo reveal and a 30–45 second launch film for Reels, Shorts and your homepage.',
    includes: ['Animated logo sting (5 s)', '30–45 s launch film with music', 'Vertical and landscape cuts', 'Subtitles in English and Hindi', '2 rounds of revisions'],
    turnaround: '2–3 weeks',
    from: { INR: 29999, USD: 599 },
    glyph: 'play',
    fit: ['Bold', 'Youthful', 'creator', 'media', 'consumer', 'saas'],
  },
  {
    id: 'trademark',
    title: 'Trademark search & filing',
    pitch: 'A registered trademark attorney searches your name and files it in India (and abroad if you need).',
    includes: ['Comprehensive search in your classes', 'Written risk opinion', 'Filing with the Indian Trademark Registry', 'Status tracking until registration', 'Madrid Protocol filing on request'],
    turnaround: 'Filed in 5–7 days',
    from: { INR: 7999, USD: 199 },
    priceNote: '+ government fees',
    glyph: 'shield',
    fit: ['Trustworthy', 'fintech', 'consumer', 'food', 'healthcare'],
  },
  {
    id: 'social',
    title: 'Social launch content',
    pitch: 'Your first month of posts, designed and written in your voice: carousels, Reels covers and Story templates.',
    includes: ['12 designed posts + 4 carousels', 'Reels covers and Story templates (Canva/Figma)', 'Captions and hashtags in your voice', 'Profile setup: bios, highlights, pinned posts', 'A 30-day posting calendar'],
    turnaround: '10 days',
    from: { INR: 12999, USD: 249 },
    glyph: 'grid',
    fit: ['Youthful', 'Playful', 'creator', 'consumer', 'food', 'beauty'],
  },
];

/** Order services so the most relevant ones for this brand come first. */
export function rankExperts(tags: string[]): ExpertService[] {
  const lower = tags.map((t) => t.toLowerCase());
  return [...EXPERT_SERVICES]
    .map((s, i) => ({ s, score: s.fit.filter((f) => lower.includes(f.toLowerCase())).length * 10 - i }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.s);
}

export const EXPERT_BUDGETS = ['Under ₹25k / $500', '₹25k–75k / $500–1.5k', '₹75k–2L / $1.5–4k', '₹2L+ / $4k+', 'Not sure yet'] as const;
export const EXPERT_TIMELINES = ['This week', 'Within a month', '1–3 months', 'Just exploring'] as const;

export const ExpertRequestSchema = z.object({
  service: z.enum(EXPERT_SERVICES.map((s) => s.id) as [string, ...string[]]),
  /** Extra services ticked in the same request. */
  also: z.array(z.string().max(20)).max(8).optional(),
  name: z.string().trim().min(2, 'Tell us your name').max(80),
  email: z.string().trim().email('That email doesn’t look right').max(160),
  phone: z
    .string()
    .trim()
    .max(24)
    .regex(/^[+0-9 ()-]*$/, 'Numbers only, please')
    .optional(),
  budget: z.string().max(40).optional(),
  timeline: z.string().max(40).optional(),
  details: z.string().max(2000).optional(),
  brandId: z.string().uuid().optional(),
  currency: z.enum(['INR', 'USD']).default('INR'),
});
export type ExpertRequest = z.infer<typeof ExpertRequestSchema>;
