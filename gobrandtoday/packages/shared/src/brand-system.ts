/**
 * The brand system GoBrandToday uses for itself (Direction 06 "Twinkle") and
 * the generator that gives every user brand the same kind of kit:
 * a lowercase wordmark whose full stop becomes a signature mark, five named
 * colours with clear roles, a display/body/data type trio from Google Fonts,
 * and a four-step motion story (idle → thinking → mark → done).
 */
import type { MarkShape, PaletteSwatch } from './types';
import { hash32, rng } from './text';

/* ------------------------------------------------------------------ */
/* GoBrandToday's own tokens (from the Twinkle guidelines)             */
/* ------------------------------------------------------------------ */

export const GBT_TOKENS = {
  graphite: '#16161A',
  violet: '#6D4AFF',
  violetHover: '#4527D9',
  violetSoft: '#8F75FF',
  violetMuted: '#B9AEFF',
  aqua: '#19C3B4',
  lilac: '#ECE7FF',
  paper: '#FAFAF7',
  white: '#FFFFFF',
  line: '#E2E0EA',
  lineStrong: '#C9C4DC',
  textSoft: '#36315A',
  textMuted: '#4D4870',
  success: '#1F7A3E',
  danger: '#B42318',
  fonts: { display: 'Space Grotesk', body: 'Manrope', data: 'Space Mono' },
} as const;

/* ------------------------------------------------------------------ */
/* Marks — 64×64 viewBox paths                                         */
/* ------------------------------------------------------------------ */

function starPath(points: number, outer: number, inner: number, cx = 32, cy = 32): string {
  const step = Math.PI / points;
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = i * step - Math.PI / 2;
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)} `;
  }
  return `${d}Z`;
}

export const MARK_PATHS: Record<MarkShape, { d: string; evenOdd?: boolean; label: string; meaning: string }> = {
  spark: { d: 'M32 2 Q36 28 62 32 Q36 36 32 62 Q28 36 2 32 Q28 28 32 2Z', label: 'Spark', meaning: 'a moment of magic — something new begins' },
  dot: { d: 'M32 18a14 14 0 1 1 0 28a14 14 0 1 1 0-28Z', label: 'Live dot', meaning: 'a calm, confident full stop — always on' },
  diamond: { d: 'M32 8 Q44 20 56 32 Q44 44 32 56 Q20 44 8 32 Q20 20 32 8Z', label: 'Soft diamond', meaning: 'precision with a soft edge' },
  leaf: { d: 'M12 52 C12 26 30 10 54 10 C54 36 38 52 12 52Z', label: 'Leaf', meaning: 'growth, care and nature' },
  petal: {
    d: 'M32 8 C41 20 41 34 32 46 C23 34 23 20 32 8Z M32 48 C21 47 11 39 6 28 C19 27 28 35 32 48Z M32 48 C43 47 53 39 58 28 C45 27 36 35 32 48Z',
    label: 'Lotus petal',
    meaning: 'rooted in India, opening to the world',
  },
  drop: { d: 'M32 6 C32 6 50 28 50 40 A18 18 0 0 1 14 40 C14 28 32 6 32 6Z', label: 'Drop', meaning: 'purity, flow and freshness' },
  flame: {
    d: 'M33 4 C40 18 50 24 50 39 A18 18 0 0 1 14 39 C14 30 20 25 23 16 C27 23 29 26 31 28 C34 20 34 12 33 4Z',
    label: 'Flame / diya',
    meaning: 'warmth, energy and the first light',
  },
  bolt: { d: 'M38 2 L12 36 H29 L24 62 L52 25 H34 Z', label: 'Bolt', meaning: 'speed and instant results' },
  heart: {
    d: 'M32 55 C10 41 5 29 11 18 C17 8 28 10 32 19 C36 10 47 8 53 18 C59 29 54 41 32 55Z',
    label: 'Heart',
    meaning: 'care and community',
  },
  ring: { d: 'M32 12a20 20 0 1 1 0 40a20 20 0 1 1 0-40Z M32 22a10 10 0 1 0 0 20a10 10 0 1 0 0-20Z', evenOdd: true, label: 'Ring', meaning: 'trust, completeness and loops that close' },
  square: { d: 'M20 14h24a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6Z', label: 'Pixel', meaning: 'a building block — structured and digital' },
  sun: { d: starPath(8, 29, 13), label: 'Sunburst', meaning: 'optimism and a bright start' },
  wave: { d: 'M4 38 C13 25 22 25 32 33 C42 41 51 41 60 28 L60 42 C51 55 42 55 32 47 C22 39 13 39 4 52Z', label: 'Wave', meaning: 'rhythm, flow and momentum' },
  arc: { d: 'M6 46 A26 26 0 0 1 58 46 Z', label: 'Rising arc', meaning: 'a sunrise — a new day, a new brand' },
};

/** The intermediate "thinking" shape used in every motion story. */
export const THINKING_PATH = 'M32 12 Q42 22 52 32 Q42 42 32 52 Q22 42 12 32 Q22 22 32 12Z';
export const IDLE_PATH = MARK_PATHS.dot.d;

const PERSONALITY_MARKS: Record<string, MarkShape[]> = {
  Futuristic: ['spark', 'bolt', 'diamond'],
  Technical: ['square', 'diamond', 'dot'],
  Minimal: ['dot', 'square', 'ring'],
  Premium: ['diamond', 'arc', 'dot'],
  Luxury: ['diamond', 'arc', 'spark'],
  Playful: ['heart', 'sun', 'spark', 'wave'],
  Youthful: ['bolt', 'sun', 'heart'],
  Bold: ['bolt', 'flame', 'square'],
  Human: ['heart', 'leaf', 'drop'],
  Trustworthy: ['ring', 'dot', 'arc'],
  Creative: ['spark', 'wave', 'sun'],
  Traditional: ['petal', 'flame', 'arc'],
  Experimental: ['wave', 'spark', 'diamond'],
};

const INDUSTRY_MARKS: Record<string, MarkShape[]> = {
  ai: ['spark', 'diamond'],
  saas: ['square', 'dot'],
  fintech: ['ring', 'arc', 'diamond'],
  fashion: ['diamond', 'petal'],
  media: ['wave', 'dot'],
  food: ['flame', 'leaf', 'drop'],
  healthcare: ['heart', 'drop', 'leaf'],
  education: ['arc', 'sun', 'spark'],
  creator: ['spark', 'sun'],
  consumer: ['heart', 'sun'],
  'e-commerce': ['bolt', 'square'],
  consulting: ['arc', 'ring'],
};

export function pickMark(opts: { name: string; personalities?: string[]; industry?: string; geography?: string }): MarkShape {
  const pool: MarkShape[] = [];
  for (const p of opts.personalities ?? []) pool.push(...(PERSONALITY_MARKS[p] ?? []));
  const ind = (opts.industry ?? '').toLowerCase();
  pool.push(...(INDUSTRY_MARKS[ind] ?? []));
  if ((opts.geography ?? '').toLowerCase() === 'india' && (opts.personalities ?? []).includes('Traditional')) pool.push('petal', 'flame');
  if (pool.length === 0) pool.push('spark', 'dot', 'diamond', 'arc');
  // Weighted by frequency, seeded by the name so the same brand always gets the same mark.
  const r = rng(hash32(`mark:${opts.name}`))();
  return pool[Math.floor(r * pool.length)]!;
}

/* ------------------------------------------------------------------ */
/* Colour                                                              */
/* ------------------------------------------------------------------ */

export function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.max(0, Math.min(100, s)) / 100;
  const ll = Math.max(0, Math.min(100, l)) / 100;
  const k = (n: number) => (n + hh / 30) % 12;
  const a = ss * Math.min(ll, 1 - ll);
  const f = (n: number) => ll - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`.toUpperCase();
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Readable text colour on top of a fill. */
export function onColor(fill: string): string {
  return contrast(fill, '#FFFFFF') >= contrast(fill, '#16161A') ? '#FFFFFF' : '#16161A';
}

const PERSONALITY_HUES: Record<string, number[]> = {
  Futuristic: [254, 262, 190],
  Technical: [222, 200, 254],
  Minimal: [228, 210],
  Premium: [38, 345, 258],
  Luxury: [42, 345, 285],
  Playful: [330, 18, 48, 280],
  Youthful: [330, 160, 22],
  Bold: [4, 280, 18],
  Human: [18, 28, 350],
  Trustworthy: [214, 205, 160],
  Creative: [290, 20, 170],
  Traditional: [28, 350, 145],
  Experimental: [300, 165, 80],
};

const INDUSTRY_HUES: Record<string, number[]> = {
  ai: [254, 262],
  saas: [228, 254],
  fintech: [155, 214, 238],
  fashion: [340, 20, 280],
  media: [4, 280],
  food: [22, 40, 8],
  healthcare: [168, 205],
  education: [44, 214],
  creator: [300, 330],
  consumer: [18, 330],
  'e-commerce': [22, 262],
  consulting: [214, 160],
};

const HUE_NAMES: Array<[number, string, string]> = [
  // [upper bound, colour name, tint name]
  [12, 'Red', 'Blush'],
  [24, 'Coral', 'Peach'],
  [38, 'Saffron', 'Apricot'],
  [55, 'Marigold', 'Cream'],
  [80, 'Lime', 'Butter'],
  [140, 'Leaf', 'Mint'],
  [165, 'Jade', 'Mint'],
  [185, 'Aqua', 'Seafoam'],
  [200, 'Teal', 'Mist'],
  [225, 'Blue', 'Sky'],
  [245, 'Indigo', 'Periwinkle'],
  [272, 'Violet', 'Lilac'],
  [296, 'Purple', 'Lavender'],
  [322, 'Orchid', 'Orchid Mist'],
  [345, 'Rani Pink', 'Blush'],
  [361, 'Rose', 'Blush'],
];

const ACCENT_ADJECTIVES: Record<string, string> = {
  Futuristic: 'Signal',
  Technical: 'Circuit',
  Minimal: 'Clear',
  Premium: 'Royal',
  Luxury: 'Velvet',
  Playful: 'Pop',
  Youthful: 'Fresh',
  Bold: 'Bold',
  Human: 'Warm',
  Trustworthy: 'True',
  Creative: 'Studio',
  Traditional: 'Heritage',
  Experimental: 'Flux',
};

function hueName(h: number): [string, string] {
  const hh = ((h % 360) + 360) % 360;
  const row = HUE_NAMES.find(([max]) => hh < max) ?? HUE_NAMES[HUE_NAMES.length - 1]!;
  return [row[1], row[2]];
}

/** Darken/lighten in HSL until white text passes WCAG AA (4.5:1). */
function ensureContrastWithWhite(h: number, s: number, l: number): string {
  let light = l;
  let hex = hslToHex(h, s, light);
  while (contrast(hex, '#FFFFFF') < 4.5 && light > 20) {
    light -= 2;
    hex = hslToHex(h, s, light);
  }
  return hex;
}

export function generatePalette(opts: { name: string; personalities?: string[]; industry?: string; seed?: string; dark?: boolean; hue?: number }): PaletteSwatch[] {
  const random = rng(hash32(`palette:${opts.name}:${opts.seed ?? ''}`));
  const pool: number[] = [];
  for (const p of opts.personalities ?? []) pool.push(...(PERSONALITY_HUES[p] ?? []));
  pool.push(...(INDUSTRY_HUES[(opts.industry ?? '').toLowerCase()] ?? []));
  if (pool.length === 0) pool.push(254, 214, 18, 160, 330);
  const picked = pool[Math.floor(random() * pool.length)]! + Math.round((random() - 0.5) * 10);
  const baseHue = opts.hue !== undefined && Number.isFinite(opts.hue) ? ((opts.hue % 360) + 360) % 360 : picked;
  const warm = baseHue < 60 || baseHue > 320;

  const brand = ensureContrastWithWhite(baseHue, 88, opts.dark ? 46 : 60);
  const roll = random();
  // Accent sits ~80–110° away (violet → aqua in our own system) — lively, never clashing.
  const accentHue = baseHue + (roll < 0.55 ? -80 : -110);
  const accent = hslToHex(accentHue, 68, 42);
  const tint = hslToHex(baseHue, 100, 95);
  const ink = hslToHex(baseHue, warm ? 14 : 12, opts.dark ? 6 : 9);
  const paper = warm ? hslToHex(36, 33, 97.5) : hslToHex(60, 20, 97.5);

  const [brandHueName, tintName] = hueName(baseHue);
  const [accentHueName] = hueName(accentHue);
  const personality = (opts.personalities ?? [])[0];
  const accentAdj = (personality && ACCENT_ADJECTIVES[personality]) || 'Bright';
  const display = opts.name.trim().split(/\s+/)[0] ?? opts.name;
  const brandLabel = `${display[0]!.toUpperCase()}${display.slice(1)} ${brandHueName}`;
  const inkName = warm ? 'Espresso' : baseHue > 200 && baseHue < 250 ? 'Midnight' : 'Graphite';
  const paperName = warm ? 'Rice Paper' : 'Paper';

  return [
    { role: 'ink', name: inkName, hex: ink, usage: 'Primary · wordmark, text' },
    { role: 'brand', name: brandLabel, hex: brand, usage: 'The mark · CTAs' },
    { role: 'accent', name: `${accentAdj} ${accentHueName}`, hex: accent, usage: 'Accent · mark on dark, "done"' },
    { role: 'tint', name: tintName, hex: tint, usage: 'Secondary · tints, selected' },
    { role: 'paper', name: paperName, hex: paper, usage: 'Background' },
  ];
}

/** Read a palette swatch by role with a sensible fallback. */
export function swatch(palette: PaletteSwatch[], role: PaletteSwatch['role']): string {
  return palette.find((p) => p.role === role)?.hex ?? (role === 'paper' ? '#FAFAF7' : role === 'ink' ? '#16161A' : '#6D4AFF');
}

/* ------------------------------------------------------------------ */
/* Typography — Google Fonts (free, open licences)                     */
/* ------------------------------------------------------------------ */

export interface FontTrio {
  id: string;
  display: { family: string; weights: number[]; why: string };
  body: { family: string; weights: number[]; why: string };
  data: { family: string; weights: number[]; why: string };
}

export const FONT_TRIOS: Record<string, FontTrio> = {
  grotesk: {
    id: 'grotesk',
    display: { family: 'Space Grotesk', weights: [500, 700], why: 'A playful grotesk with tech DNA — confident in lowercase.' },
    body: { family: 'Manrope', weights: [400, 500, 700], why: 'Soft and modern; keeps long copy friendly.' },
    data: { family: 'Space Mono', weights: [400], why: 'For domains, handles and numbers.' },
  },
  editorial: {
    id: 'editorial',
    display: { family: 'Fraunces', weights: [600, 700], why: 'A soft, high-contrast serif — premium without being stiff.' },
    body: { family: 'DM Sans', weights: [400, 500, 700], why: 'Clean and calm, lets the display face lead.' },
    data: { family: 'DM Mono', weights: [400], why: 'Quiet monospace for details and prices.' },
  },
  rounded: {
    id: 'rounded',
    display: { family: 'Bricolage Grotesque', weights: [600, 800], why: 'Characterful and bouncy — instantly friendly.' },
    body: { family: 'Nunito', weights: [400, 600, 700], why: 'Rounded terminals keep everything warm.' },
    data: { family: 'JetBrains Mono', weights: [400], why: 'Legible mono for codes, handles and stats.' },
  },
  swiss: {
    id: 'swiss',
    display: { family: 'Inter Tight', weights: [600, 700], why: 'Tight, neutral and precise — minimal done right.' },
    body: { family: 'Inter', weights: [400, 500, 600], why: 'The most legible UI face on every screen.' },
    data: { family: 'JetBrains Mono', weights: [400], why: 'Crisp mono for data and code.' },
  },
  trust: {
    id: 'trust',
    display: { family: 'Plus Jakarta Sans', weights: [600, 800], why: 'Open and geometric — modern and trustworthy.' },
    body: { family: 'Source Sans 3', weights: [400, 600], why: 'Workhorse readability for long explanations.' },
    data: { family: 'IBM Plex Mono', weights: [400], why: 'Precise and accountable for numbers.' },
  },
  bharat: {
    id: 'bharat',
    display: { family: 'Rozha One', weights: [400], why: 'Indian-designed display face with Devanagari — heritage with swagger.' },
    body: { family: 'Mukta', weights: [400, 500, 700], why: 'Latin + Devanagari body text by Ek Type — bilingual by default.' },
    data: { family: 'IBM Plex Mono', weights: [400], why: 'Neutral mono for prices and handles.' },
  },
  bold: {
    id: 'bold',
    display: { family: 'Unbounded', weights: [600, 800], why: 'Wide, loud and unmistakable.' },
    body: { family: 'Manrope', weights: [400, 500, 700], why: 'Balances the loud display with calm body copy.' },
    data: { family: 'Space Mono', weights: [400], why: 'Techy mono for numbers and handles.' },
  },
  avant: {
    id: 'avant',
    display: { family: 'Syne', weights: [600, 800], why: 'Experimental, art-school energy.' },
    body: { family: 'Manrope', weights: [400, 500, 700], why: 'Grounds the expressive display face.' },
    data: { family: 'Space Mono', weights: [400], why: 'Mono for captions and data.' },
  },
  signet: {
    id: 'signet',
    display: { family: 'Outfit', weights: [500, 700], why: 'Clean geometric capitals — made for monograms and spaced lettering.' },
    body: { family: 'Inter', weights: [400, 500, 600], why: 'Neutral and highly legible, so the badge does the talking.' },
    data: { family: 'DM Mono', weights: [400], why: 'Quiet mono for numbers and handles.' },
  },
  poster: {
    id: 'poster',
    display: { family: 'Anton', weights: [400], why: 'Tall, condensed poster capitals — loud on a sticker or a shop front.' },
    body: { family: 'Manrope', weights: [400, 500, 700], why: 'Calm body copy to balance the shouty display face.' },
    data: { family: 'Space Mono', weights: [400], why: 'Mono for prices, handles and drops.' },
  },
  bubbly: {
    id: 'bubbly',
    display: { family: 'Fredoka', weights: [600, 700], why: 'Soft, round letters that bounce — friendly at any size.' },
    body: { family: 'Nunito', weights: [400, 600, 700], why: 'Rounded body text that keeps the warmth going.' },
    data: { family: 'JetBrains Mono', weights: [400], why: 'Legible mono for codes and stats.' },
  },
  terminal: {
    id: 'terminal',
    display: { family: 'JetBrains Mono', weights: [700, 800], why: 'A developer’s typeface — the brand reads like a command.' },
    body: { family: 'IBM Plex Sans', weights: [400, 500], why: 'Engineered and calm for docs and long reads.' },
    data: { family: 'JetBrains Mono', weights: [400], why: 'The same mono for code, data and handles.' },
  },
  technical: {
    id: 'technical',
    display: { family: 'IBM Plex Sans', weights: [600, 700], why: 'Engineered, rational and dependable.' },
    body: { family: 'IBM Plex Sans', weights: [400, 500], why: 'One family keeps a technical brand consistent.' },
    data: { family: 'IBM Plex Mono', weights: [400], why: 'Made for code, data and specs.' },
  },
};

const PERSONALITY_FONTS: Record<string, string[]> = {
  Futuristic: ['grotesk'],
  Technical: ['technical', 'swiss'],
  Minimal: ['swiss'],
  Premium: ['editorial'],
  Luxury: ['editorial'],
  Playful: ['rounded'],
  Youthful: ['rounded', 'bold'],
  Bold: ['bold'],
  Human: ['trust', 'rounded'],
  Trustworthy: ['trust'],
  Creative: ['avant', 'grotesk'],
  Traditional: ['bharat', 'editorial'],
  Experimental: ['avant'],
};

export function pickFonts(opts: { name: string; personalities?: string[]; geography?: string; styles?: string[] }): FontTrio {
  const pool: string[] = [];
  for (const p of opts.personalities ?? []) pool.push(...(PERSONALITY_FONTS[p] ?? []));
  if ((opts.styles ?? []).includes('Indian-inspired')) pool.push('bharat');
  if (pool.length === 0) pool.push('grotesk', 'swiss', 'trust');
  const pick = pool[Math.floor(rng(hash32(`fonts:${opts.name}`))() * pool.length)]!;
  return FONT_TRIOS[pick] ?? FONT_TRIOS.grotesk!;
}

export function googleFontsHref(families: Array<{ family: string; weights: number[] }>): string {
  const seen = new Map<string, Set<number>>();
  for (const f of families) {
    const set = seen.get(f.family) ?? new Set<number>();
    f.weights.forEach((w) => set.add(w));
    seen.set(f.family, set);
  }
  const params = [...seen.entries()]
    .map(([family, weights]) => {
      const ws = [...weights].sort((a, b) => a - b);
      const fam = family.replace(/ /g, '+');
      // Single-weight families (e.g. Rozha One) must be requested without a weight axis.
      return ws.length === 1 && ws[0] === 400 ? `family=${fam}` : `family=${fam}:wght@${ws.join(';')}`;
    })
    .join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/** Wordmark text following the system rule: lowercase, no spaces. */
export function wordmarkText(name: string, mode: 'lower' | 'title' = 'lower'): string {
  const compact = name.trim().replace(/\s+/g, mode === 'lower' ? '' : ' ');
  return mode === 'lower' ? compact.toLowerCase() : compact;
}
