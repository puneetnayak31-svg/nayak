/**
 * Sectors: which kind of business a brand is, so the brand book shows the
 * objects that business actually makes (a coffee brand sees a cup and a bag of
 * beans, a clothing label sees a neck label and a hang tag, a sweet shop sees
 * a mithai box). Detected from the brief's words first, then its industry.
 */
import type { MockupKind } from './mockups';

export const SECTORS = [
  'coffee',
  'fashion',
  'sweets',
  'bakery',
  'candles',
  'beauty',
  'beverage',
  'food',
  'jewellery',
  'pet',
  'fitness',
  'education',
  'health',
  'fintech',
  'tech',
  'creator',
  'realestate',
  'services',
  'retail',
  'general',
] as const;
export type Sector = (typeof SECTORS)[number];

interface SectorMeta {
  label: string;
  /**
   * Words (or word starts, for 5+ letters) in the brief that point here. A leading "~" marks a
   * generic word ("shop", "app") that counts for less than a specific one ("mithai", "serum").
   */
  words: string[];
  /** Industry options (shared/options.ts) that point here. */
  industries: string[];
  /** The objects to show first, most telling first. */
  mockups: MockupKind[];
}

export const SECTOR_META: Record<Sector, SectorMeta> = {
  coffee: { label: 'Coffee & tea', words: ['coffee', 'cafe', 'café', 'espresso', 'chai', 'tea', 'teas', 'roaster', 'roastery', 'brew', 'latte', 'barista', 'matcha'], industries: [], mockups: ['cup', 'coffeebag', 'menu', 'storefront', 'shoppingbag'] },
  fashion: { label: 'Fashion & apparel', words: ['fashion', 'clothing', 'clothes', 'apparel', 'streetwear', 'activewear', 'athleisure', 'saree', 'sari', 'kurta', 'ethnic', 'tshirt', 't-shirt', 'denim', 'boutique', 'garment', 'dress', 'outfit', 'couture', 'sneaker', 'footwear', 'shoes', 'hoodie', 'menswear', 'womenswear', 'lingerie', 'knitwear'], industries: ['Fashion'], mockups: ['necklabel', 'hangtag', 'shoppingbag', 'tshirt', 'tote'] },
  sweets: { label: 'Sweets & confectionery', words: ['sweet', 'sweets', 'mithai', 'chocolate', 'confection', 'confectionery', 'candy', 'dessert', 'laddoo', 'ladoo', 'halwa', 'barfi', 'toffee', 'mishti', 'gulab', 'jalebi', 'fudge'], industries: [], mockups: ['sweetbox', 'shoppingbag', 'stickers', 'storefront', 'deliverybag'] },
  bakery: { label: 'Bakery', words: ['bakery', 'bakes', 'baked', 'cake', 'cakes', 'bread', 'cookie', 'cookies', 'pastry', 'patisserie', 'donut', 'doughnut', 'brownie', 'cupcake', 'croissant', 'sourdough'], industries: [], mockups: ['sweetbox', 'deliverybag', 'cup', 'menu', 'storefront'] },
  candles: { label: 'Candles & home fragrance', words: ['candle', 'candles', 'fragrance', 'scent', 'scented', 'incense', 'agarbatti', 'aroma', 'diffuser', 'wax'], industries: [], mockups: ['candle', 'mailer', 'hangtag', 'shoppingbag', 'stickers'] },
  beauty: { label: 'Beauty & skincare', words: ['skincare', 'skin', 'beauty', 'cosmetic', 'cosmetics', 'serum', 'makeup', 'haircare', 'salon', 'ayurveda', 'ayurvedic', 'soap', 'lipstick', 'perfume', 'nail', 'nails', 'grooming', 'beard'], industries: [], mockups: ['dropper', 'mailer', 'shoppingbag', 'stickers', 'tote'] },
  beverage: { label: 'Drinks', words: ['juice', 'drink', 'drinks', 'beverage', 'soda', 'kombucha', 'beer', 'brewery', 'wine', 'cola', 'smoothie', 'lemonade', 'spirits', 'gin', 'whisky', 'cider', 'sparkling', 'lassi', 'nimbu'], industries: [], mockups: ['can', 'bottle', 'stickers', 'tshirt', 'storefront'] },
  food: { label: 'Food & restaurants', words: ['restaurant', 'food', 'kitchen', 'biryani', 'dhaba', 'meal', 'meals', 'tiffin', 'catering', 'pizza', 'burger', 'snack', 'snacks', 'eatery', 'thali', 'dosa', 'momos', 'noodles', 'sushi', 'diner', 'bistro', 'grill', 'cafeteria', 'masala', 'spices', 'pickle'], industries: ['Food'], mockups: ['deliverybag', 'menu', 'storefront', 'stickers', 'cup'] },
  jewellery: { label: 'Jewellery', words: ['jewel', 'jewels', 'jewellery', 'jewelry', 'gold', 'diamond', 'diamonds', 'silver', 'ring', 'rings', 'necklace', 'earring', 'earrings', 'bangle', 'bangles', 'pendant'], industries: [], mockups: ['jewelbox', 'hangtag', 'shoppingbag', 'card', 'social'] },
  pet: { label: 'Pets', words: ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'puppy', 'kitten', 'vet', 'paw', 'paws'], industries: [], mockups: ['pettag', 'mailer', 'stickers', 'shoppingbag', 'tote'] },
  fitness: { label: 'Fitness & sport', words: ['fitness', 'gym', 'yoga', 'workout', 'sport', 'sports', 'running', 'runner', 'athlete', '~training', 'pilates', 'cycling', 'protein', 'cricket', 'football', 'marathon'], industries: [], mockups: ['waterbottle', 'tshirt', 'phone', 'tote', 'stickers'] },
  education: { label: 'Education', words: ['education', 'school', 'course', 'courses', 'tutor', 'tutoring', '~learn', '~learning', 'edtech', 'coaching', 'academy', '~class', '~classes', 'teach', 'teacher', 'student', 'students', 'exam', 'exams', 'university', 'college'], industries: ['Education'], mockups: ['notebook', 'badge', 'web', 'tote', 'stickers'] },
  health: { label: 'Health & care', words: ['health', 'healthcare', 'clinic', 'doctor', 'doctors', 'hospital', 'medical', 'pharma', 'pharmacy', 'dental', 'dentist', 'therapy', 'therapist', 'diagnostic', 'diagnostics', 'physio', 'nutrition', '~wellness', 'mental', 'patients', '~care'], industries: ['Healthcare'], mockups: ['badge', 'signboard', 'phone', 'letterhead', 'web'] },
  fintech: { label: 'Fintech', words: ['fintech', 'payment', 'payments', 'bank', 'banking', 'lending', 'loan', 'loans', 'invest', 'investing', 'investment', 'wealth', 'insurance', 'upi', 'credit', 'wallet', 'finance', 'trading', 'crypto', 'savings', 'neobank'], industries: ['Fintech'], mockups: ['paycard', 'phone', 'dashboard', 'web', 'card'] },
  tech: { label: 'Software & AI', words: ['saas', 'software', '~app', '~apps', '~platform', 'ai', 'api', 'developer', 'developers', 'automation', 'analytics', '~cloud', '~data', 'ml', 'agent', 'agents', 'crm', 'devtools', 'b2b', '~tool', '~tools', '~startup', 'chatbot', 'llm', '~dashboard'], industries: ['AI', 'SaaS'], mockups: ['dashboard', 'phone', 'web', 'stickers', 'tshirt'] },
  creator: { label: 'Creators & media', words: ['creator', 'creators', 'youtube', 'podcast', 'newsletter', 'channel', 'influencer', '~content', 'vlog', 'vlogger', 'streamer', '~music', 'artist', 'band', '~media', 'magazine', 'blog', 'comedy'], industries: ['Creator', 'Media'], mockups: ['banner', 'social', 'phone', 'tshirt', 'stickers'] },
  realestate: { label: 'Property', words: ['realestate', 'real estate', 'property', 'properties', 'realty', '~homes', 'apartment', 'apartments', '~interior', '~interiors', 'architect', 'architecture', 'construction', 'broker', 'rental', 'rentals', 'villa'], industries: [], mockups: ['signboard', 'card', 'letterhead', 'web', 'social'] },
  services: { label: 'Professional services', words: ['consulting', 'consultancy', 'consultant', 'agency', 'legal', 'law', 'lawyer', 'lawyers', 'advisory', 'accounting', 'accountant', 'recruitment', 'recruiting', 'hiring', '~marketing', '~studio', '~freelance', 'audit', 'tax'], industries: ['Consulting'], mockups: ['letterhead', 'card', 'web', 'badge', 'social'] },
  retail: { label: 'Retail & e-commerce', words: ['ecommerce', 'e-commerce', 'd2c', '~store', '~shop', 'marketplace', 'retail', '~gift', '~gifts', '~gifting', '~subscription', 'decor', 'furniture', 'toys', '~handmade', 'crafts', 'stationery', 'homeware'], industries: ['E-commerce', 'Consumer'], mockups: ['mailer', 'shoppingbag', 'stickers', 'packaging', 'phone'] },
  general: { label: 'General', words: [], industries: ['Other'], mockups: ['card', 'phone', 'social', 'web', 'packaging'] },
};

/** Generic applications that fill the set after the sector's own objects. */
const ESSENTIALS: MockupKind[] = ['card', 'social', 'web', 'phone', 'letterhead', 'stickers', 'tote', 'storefront', 'packaging'];

/** How many applications the brand book shows before "Show all". */
export const PRIMARY_MOCKUPS = 9;

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9à-ÿ\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** True when `word` appears in the text: exact for short words, as a word start for 5+ letters. */
function hits(toks: string[], joined: string, word: string): boolean {
  if (word.includes(' ')) return joined.includes(` ${word} `);
  if (word.length >= 5) return toks.some((t) => t.startsWith(word));
  return toks.some((t) => t === word || t === `${word}s`);
}

/** Work out the sector from what the founder wrote, falling back to their industry pick. */
export function detectSector(input: { description?: string; industry?: string | null }): Sector {
  const toks = tokens(input.description ?? '');
  const joined = ` ${toks.join(' ')} `;
  let best: Sector = 'general';
  let bestScore = 0;
  for (const s of SECTORS) {
    const meta = SECTOR_META[s];
    let score = 0;
    for (const w of meta.words) if (hits(toks, joined, w.replace(/^~/, ''))) score += w.startsWith('~') ? 1 : 3;
    if (input.industry && meta.industries.includes(input.industry)) score += 2;
    if (score > bestScore) {
      best = s;
      bestScore = score;
    }
  }
  return best;
}

/** The sector for a stored kit: its saved value, or a guess from its own words for kits made before sectors existed. */
export function sectorForKit(kit: { sector?: string; positioning: string; story: string; audience: { primary: string }; messaging: { short: string } }): Sector {
  if (kit.sector && (SECTORS as readonly string[]).includes(kit.sector)) return kit.sector as Sector;
  return detectSector({ description: [kit.positioning, kit.messaging.short, kit.story, kit.audience.primary].join(' ') });
}

/** Every application, the sector's own objects first, then the essentials, then the rest. */
export function mockupsForSector(sector: Sector, all: readonly MockupKind[]): MockupKind[] {
  const order = [...SECTOR_META[sector].mockups, ...ESSENTIALS, ...all];
  return [...new Set(order)].filter((k) => all.includes(k));
}
