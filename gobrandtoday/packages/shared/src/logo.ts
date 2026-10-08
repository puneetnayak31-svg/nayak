/**
 * Logo looks: ten deliberately different constructions (LOGO_STYLES). Every
 * brand is offered four of them (each with its own palette, type and mark or
 * symbol, see symbols.ts) and the user picks one before the full guidelines
 * are built.
 *
 * Logos are rendered as SVG strings from data, so the screen, the
 * guidelines, the exports and the preview all draw the exact same thing.
 * Text width comes from an injected `measure` function: the browser passes
 * a canvas measurer that uses the real web font; tests use `approxMeasure`.
 */
import { FONT_TRIOS, MARK_PATHS, contrast, generatePalette, onColor, swatch, type FontTrio } from './brand-system';
import { SYMBOL_META, drawSymbol, pickFamily, type SymbolFamily, type SymbolSpec } from './symbols';
import { hash32, rng, syllables } from './text';
import type { Look, LogoStyle, MarkShape, PaletteSwatch } from './types';

export interface LogoStyleMeta {
  id: LogoStyle;
  title: string;
  /** One-line description of the construction. */
  construction: string;
  /** Logo type in design terms (wordmark, lettermark, combination mark…) and when it fits. */
  type: string;
  typeNote: string;
  fonts: string[];
  marks: MarkShape[];
  fit: string[];
  usage: { clearSpace: string; minSize: string; do: string; dont: string };
}

export const LOGO_STYLE_META: Record<LogoStyle, LogoStyleMeta> = {
  twinkle: {
    id: 'twinkle',
    type: 'Wordmark',
    typeNote: 'The name is the logo; the spark full stop gives it a signature. Best for short, sayable names.',
    title: 'Spark full stop',
    construction: 'A lowercase wordmark whose full stop becomes a signature mark.',
    fonts: ['grotesk', 'swiss', 'avant', 'rounded'],
    marks: ['spark', 'dot', 'diamond', 'sun', 'drop'],
    fit: ['Futuristic', 'Creative', 'Minimal', 'Experimental', 'ai', 'saas', 'creator'],
    usage: {
      clearSpace: 'Space equal to the “o” height on every side.',
      minSize: 'Wordmark 96px wide. Smaller: the icon tile or the mark alone.',
      do: 'Brand-colour mark on light; accent mark on ink.',
      dont: 'One mark only. No capitals, gradients or glows.',
    },
  },
  monogram: {
    id: 'monogram',
    type: 'Combination mark',
    typeNote: 'A lettermark badge beside the name. Good for long or two-word names and trust-led brands.',
    title: 'Signet badge',
    construction: 'A round badge with the initials, beside the name in widely spaced capitals.',
    fonts: ['signet'],
    marks: ['ring', 'dot', 'diamond'],
    fit: ['Premium', 'Trustworthy', 'Luxury', 'Traditional', 'fintech', 'consulting', 'healthcare'],
    usage: {
      clearSpace: 'Half the badge’s width on every side.',
      minSize: 'Full lockup 120px wide. Below that, use the badge alone.',
      do: 'Badge in brand colour with the initials knocked out.',
      dont: 'Don’t tighten the letter-spacing or move the initials out of the badge.',
    },
  },
  editorial: {
    id: 'editorial',
    type: 'Wordmark',
    typeNote: 'A serif logotype with a rule: quiet, premium and timeless. Fashion, media, beauty and services.',
    title: 'Editorial serif',
    construction: 'A high-contrast serif in title case, the first letter in brand colour, set over a fine rule.',
    fonts: ['editorial'],
    marks: ['diamond', 'arc', 'petal'],
    fit: ['Luxury', 'Premium', 'Creative', 'fashion', 'media', 'beauty', 'consulting'],
    usage: {
      clearSpace: 'The cap height on every side.',
      minSize: '110px wide. Smaller: the serif initial on its own.',
      do: 'Title case, first letter in brand colour, rule underneath.',
      dont: 'Don’t swap in a sans-serif or drop the rule.',
    },
  },
  stacked: {
    id: 'stacked',
    type: 'Wordmark in a container',
    typeNote: 'Capitals in a tilted block, like a sticker. Loud consumer, food and fashion on packs and social.',
    title: 'Sticker stack',
    construction: 'Tall condensed capitals stacked in a tilted colour block, like a sticker.',
    fonts: ['poster'],
    marks: ['bolt', 'flame', 'sun', 'heart'],
    fit: ['Bold', 'Youthful', 'Playful', 'food', 'consumer', 'fashion', 'e-commerce'],
    usage: {
      clearSpace: 'A quarter of the block’s height on every side.',
      minSize: 'Block 64px tall. Smaller: the single-letter sticker.',
      do: 'Keep the block, the stack and the tilt together.',
      dont: 'Don’t set it on one line or straighten the tilt.',
    },
  },
  symbol: {
    id: 'symbol',
    type: 'Combination mark',
    typeNote: 'An abstract symbol plus the name. The symbol can later stand alone as the app icon.',
    title: 'Symbol + wordmark',
    construction: 'A generative symbol unique to this name, beside a clean wordmark.',
    fonts: ['trust', 'swiss', 'technical', 'grotesk', 'avant', 'bold'],
    marks: ['square', 'ring', 'arc'],
    fit: ['Technical', 'Futuristic', 'Minimal', 'Trustworthy', 'saas', 'ai', 'fintech', 'education'],
    usage: {
      clearSpace: 'Half a tile on every side.',
      minSize: 'Lockup 100px wide. Smaller: the symbol alone.',
      do: 'Symbol left, name right; use the symbol alone as the app icon.',
      dont: 'Don’t recolour parts of the symbol or rotate it.',
    },
  },
  emblem: {
    id: 'emblem',
    type: 'Stacked combination mark',
    typeNote: 'Symbol above spaced capitals. Works on signage and packaging; add a frame for a classic emblem.',
    title: 'Emblem',
    construction: 'A centred symbol over the name in spaced capitals, like a seal or a badge on a product.',
    fonts: ['signet', 'swiss', 'editorial', 'trust', 'avant'],
    marks: ['ring', 'sun', 'petal'],
    fit: ['Premium', 'Traditional', 'Trustworthy', 'Luxury', 'food', 'beauty', 'fashion', 'hospitality'],
    usage: {
      clearSpace: 'Half the symbol’s height on every side.',
      minSize: 'Full emblem 72px tall. Smaller: the symbol alone.',
      do: 'Centre everything; keep the name in spaced capitals under the symbol.',
      dont: 'Don’t put the name beside the symbol or squash the spacing.',
    },
  },
  lettermark: {
    id: 'lettermark',
    type: 'Lettermark + wordmark',
    typeNote: 'The initial cut from a shape, beside the name. Strongest at 16px: apps, SaaS, education.',
    title: 'Lettermark',
    construction: 'The initial cut out of a bold shape, beside the name: compact enough for an app icon.',
    fonts: ['grotesk', 'bold', 'rounded', 'avant', 'swiss', 'editorial'],
    marks: ['dot', 'square', 'diamond'],
    fit: ['Bold', 'Minimal', 'Trustworthy', 'Youthful', 'saas', 'fintech', 'consumer', 'education'],
    usage: {
      clearSpace: 'A third of the shape’s width on every side.',
      minSize: 'Lockup 96px wide. Smaller: the lettermark alone.',
      do: 'Initial knocked out in the background colour; shape always in brand colour.',
      dont: 'Don’t outline the letter or swap the shape.',
    },
  },
  playful: {
    id: 'playful',
    type: 'Display wordmark',
    typeNote: 'Bouncy letters with character. Short names in kids, food and consumer; weaker at very small sizes.',
    title: 'Bouncy letters',
    construction: 'Rounded lowercase letters that bounce and take turns in the palette colours.',
    fonts: ['bubbly', 'rounded'],
    marks: ['heart', 'sun', 'drop', 'spark'],
    fit: ['Playful', 'Youthful', 'Human', 'food', 'education', 'consumer', 'creator'],
    usage: {
      clearSpace: 'One letter’s width on every side.',
      minSize: '96px wide. Smaller: the first letter in its circle.',
      do: 'Let the letters bounce; up to three colours.',
      dont: 'Don’t straighten the baseline or add a fourth colour.',
    },
  },
  terminal: {
    id: 'terminal',
    type: 'Wordmark with a glyph',
    typeNote: 'A command-line prompt before the name. Developer tools, AI and infrastructure.',
    title: 'Command line',
    construction: 'The name typed at a prompt in a developer’s mono font, with a block cursor.',
    fonts: ['terminal'],
    marks: ['square', 'bolt', 'diamond'],
    fit: ['Technical', 'Experimental', 'Futuristic', 'ai', 'saas'],
    usage: {
      clearSpace: 'Two character widths on every side.',
      minSize: '100px wide. Smaller: the “>_” icon.',
      do: 'Always lowercase, always with the prompt and cursor.',
      dont: 'Don’t remove the cursor or use a proportional font.',
    },
  },
  heritage: {
    id: 'heritage',
    type: 'Wordmark (Devanagari-inspired)',
    typeNote: 'A headline bar over the letters, from the Devanagari script. Indian food, beauty, fashion and craft.',
    title: 'Shirorekha',
    construction: 'Lowercase letters hung from one headline bar, like Devanagari, crowned with a small mark.',
    fonts: ['bharat'],
    marks: ['petal', 'flame', 'sun', 'drop'],
    fit: ['Traditional', 'Human', 'Premium', 'india', 'food', 'beauty', 'fashion'],
    usage: {
      clearSpace: 'The bar’s length divided by six, on every side.',
      minSize: '100px wide. Smaller: the initial under its bar.',
      do: 'One unbroken bar joining every letter; mark above the end.',
      dont: 'Don’t break the bar, use capitals or drop the mark.',
    },
  },
};

/* ----------------------------------- looks ----------------------------------- */

const CONCEPTS: Record<LogoStyle, (name: string, family?: SymbolFamily) => string> = {
  twinkle: (n) => `${n} ends every line with a spark: quiet, lowercase and a little magical.`,
  monogram: (n) => `A signet for ${n}: initials in a badge, spaced capitals beside it. It feels established from day one.`,
  editorial: (n) => `${n} set like a magazine masthead: confident serif, a fine rule and room to breathe.`,
  stacked: (n) => `${n} as a sticker you’d put on your laptop: loud capitals in a tilted block.`,
  symbol: (n, f) => `${SYMBOL_META[f ?? 'tiles'].label}: ${SYMBOL_META[f ?? 'tiles'].idea}. Generated from the letters of ${n}, so no other brand has this exact mark.`,
  emblem: (n, f) => `${n} as an emblem: a ${SYMBOL_META[f ?? 'sprout'].label.toLowerCase()} symbol (${SYMBOL_META[f ?? 'sprout'].idea}) crowning the name in spaced capitals.`,
  lettermark: (n) => `The ${n[0]?.toUpperCase()} of ${n}, cut out of a bold shape. Works at 16 pixels and on a billboard.`,
  playful: (n) => `${n} in letters that bounce and swap colours. Warm, friendly and impossible to take too seriously.`,
  terminal: (n) => `${n}, typed at a prompt. Speaks fluent developer and looks great in a README.`,
  heritage: (n) => `${n} hangs from one headline bar like Devanagari script. Rooted in India, crowned with a small mark.`,
};

export interface LookInput {
  name: string;
  personalities?: string[];
  industry?: string;
  geography?: string;
  seed?: number;
  /** Styles to avoid (e.g. the ones already shown). */
  exclude?: LogoStyle[];
  /** Symbol families already shown. */
  excludeFamilies?: string[];
  count?: number;
}

/**
 * Long names are hard to read small, so they lean on initials and symbols
 * (lettermark, monogram, symbol, emblem); short names can carry a wordmark on
 * their own (docs/LOGO_SCIENCE.md).
 */
function lengthFit(name: string, style: LogoStyle): number {
  const letters = name.replace(/[^a-z]/gi, '').length;
  const words = name.trim().split(/\s+/).length;
  const long = letters > 9 || words > 1;
  const short = letters <= 6 && words === 1;
  if (long) return ['monogram', 'lettermark', 'symbol', 'emblem'].includes(style) ? 1.2 : ['playful', 'stacked'].includes(style) ? -0.8 : 0;
  if (short) return ['twinkle', 'playful', 'stacked', 'terminal'].includes(style) ? 0.6 : 0;
  return 0;
}

/** Pick `count` very different looks that fit the brief, each with its own palette, type and mark. */
export function generateLooks(input: LookInput): Look[] {
  const count = input.count ?? 4;
  const seed = input.seed ?? hash32(input.name);
  const random = rng(hash32(`looks:${input.name}:${seed}`));
  const tags = [...(input.personalities ?? []), (input.industry ?? '').toLowerCase(), (input.geography ?? '').toLowerCase()].filter(Boolean);
  const scored = (Object.keys(LOGO_STYLE_META) as LogoStyle[])
    .map((id) => {
      const fit = LOGO_STYLE_META[id].fit.filter((f) => tags.some((t) => t.toLowerCase() === f.toLowerCase())).length;
      const penalty = input.exclude?.includes(id) ? 3 : 0;
      return { id, score: fit * 1.5 + lengthFit(input.name, id) + random() * 2.2 - penalty };
    })
    .sort((a, b) => b.score - a.score);
  let styles = scored.slice(0, count).map((s) => s.id);
  // At least two looks carry a real symbol, so the set never feels like four wordmarks.
  const SYMBOLIC: LogoStyle[] = ['symbol', 'emblem', 'lettermark'];
  const symbolic = styles.filter((st) => SYMBOLIC.includes(st)).length;
  if (count >= 3 && symbolic < 2) {
    const extra = scored.filter((x) => SYMBOLIC.includes(x.id) && !styles.includes(x.id)).slice(0, 2 - symbolic);
    styles = [...styles.filter((st) => !SYMBOLIC.includes(st)).slice(0, count - symbolic - extra.length), ...styles.filter((st) => SYMBOLIC.includes(st)), ...extra.map((x) => x.id)];
  }
  // Spread hues around the wheel so the four options never look alike.
  const baseHue = Math.floor(random() * 360);
  const step = 360 / count;
  const used: SymbolFamily[] = [...((input.excludeFamilies ?? []) as SymbolFamily[])];
  return styles.map((style, i) => {
    const look = buildLook(input, style, baseHue + i * step + (random() - 0.5) * 30, seed + i, { usedFamilies: used, tags });
    if (look.symbol?.family) used.push(look.symbol.family as SymbolFamily);
    return look;
  });
}

export function buildLook(
  input: { name: string; personalities?: string[]; industry?: string },
  style: LogoStyle,
  hue: number,
  seed: number,
  overrides: Partial<Pick<Look, 'title' | 'concept' | 'markShape' | 'fontTrio' | 'symbol' | 'case' | 'origin'>> & { usedFamilies?: SymbolFamily[]; tags?: string[] } = {},
): Look {
  const meta = LOGO_STYLE_META[style];
  const r = rng(hash32(`look:${input.name}:${style}:${seed}`));
  const fontTrio = overrides.fontTrio && FONT_TRIOS[overrides.fontTrio] ? overrides.fontTrio : meta.fonts[Math.floor(r() * meta.fonts.length)]!;
  const markShape = overrides.markShape ?? meta.marks[Math.floor(r() * meta.marks.length)]!;
  const h = ((Math.round(hue) % 360) + 360) % 360;
  const tags = overrides.tags ?? [...(input.personalities ?? []), input.industry ?? ''];
  let symbol: SymbolSpec | undefined = overrides.symbol;
  if (!symbol && (style === 'symbol' || style === 'emblem')) {
    symbol = { family: pickFamily(`${input.name}:${seed}`, tags, overrides.usedFamilies) };
  }
  const family = symbol?.family as SymbolFamily | undefined;
  const wordCase = overrides.case ?? (style === 'symbol' || style === 'lettermark' ? (['lower', 'title', 'title'] as const)[Math.floor(r() * 3)] : undefined);
  const title = overrides.title ?? (style === 'symbol' && family ? SYMBOL_META[family].label : meta.title);
  return {
    id: `${style}-${h}-${seed}`,
    title,
    concept: overrides.concept ?? CONCEPTS[style](input.name, family),
    style,
    hue: h,
    fontTrio,
    markShape,
    seed,
    palette: generatePalette({ name: input.name, personalities: input.personalities, industry: input.industry, hue: h, seed: String(seed) }),
    ...(symbol ? { symbol: symbol as Look['symbol'] } : {}),
    ...(wordCase ? { case: wordCase } : {}),
    origin: overrides.origin ?? 'generative',
  };
}

export function lookFonts(look: Pick<Look, 'fontTrio'>): FontTrio {
  return FONT_TRIOS[look.fontTrio] ?? FONT_TRIOS.grotesk!;
}

/* ------------------------------ SVG rendering ------------------------------ */

export interface FontSpec {
  family: string;
  weight: number;
  size: number;
}
export interface Measurer {
  /** Advance width of `text` with no extra letter-spacing. */
  width(text: string, font: FontSpec): number;
  /** Height of a lowercase "x" (for the shirorekha bar). Optional. */
  xHeight?(font: FontSpec): number;
  /** Height of a capital "H". Optional. */
  capHeight?(font: FontSpec): number;
}

/** Rough metrics for tests and server-side use. */
export const approxMeasure: Measurer = {
  width: (t, f) => {
    let w = 0;
    for (const ch of t) w += /[mw]/i.test(ch) ? 0.82 : /[il.!|]/.test(ch) ? 0.28 : /[A-Z]/.test(ch) ? 0.66 : ch === ' ' ? 0.28 : 0.56;
    return w * f.size;
  },
  xHeight: (f) => 0.52 * f.size,
  capHeight: (f) => 0.72 * f.size,
};

export interface LogoIdentity {
  name: string;
  style: LogoStyle;
  palette: PaletteSwatch[];
  typography: { display: { family: string; weights: number[] }; data: { family: string; weights: number[] } };
  mark: MarkShape;
  seed: number;
  symbol?: SymbolSpec;
  case?: 'lower' | 'title' | 'upper';
  /** Founding year for lockups that show one (editorial). Omitted: no year is drawn. */
  founded?: number;
}

/** light: on paper · dark: on ink (mark colour contrast-checked) · mono: one ink · reverse: all white, for brand-colour or photo backgrounds. */
export type LogoVariant = 'light' | 'dark' | 'mono' | 'reverse';

export function lookToIdentity(name: string, look: Look): LogoIdentity {
  const t = lookFonts(look);
  return { name, style: look.style, palette: look.palette, typography: { display: t.display, data: t.data }, mark: look.markShape, seed: look.seed, symbol: look.symbol as SymbolSpec | undefined, case: look.case };
}

interface Colors {
  bg: string | null;
  text: string;
  brand: string;
  accent: string;
  tint: string;
  ink: string;
  paper: string;
}

function colors(p: PaletteSwatch[], v: LogoVariant): Colors {
  const ink = swatch(p, 'ink');
  const paper = swatch(p, 'paper');
  const brand = swatch(p, 'brand');
  const accent = swatch(p, 'accent');
  const tint = swatch(p, 'tint');
  if (v === 'dark') {
    // The mark must stay visible on ink: take the first palette colour with at least 3:1 contrast.
    const visible = (h: string) => contrast(h, ink) >= 3;
    const mark = [accent, brand, tint, paper].find(visible) ?? paper;
    const second = [brand, accent, tint, paper].find((h) => h !== mark && visible(h)) ?? paper;
    return { bg: ink, text: paper, brand: mark, accent: second, tint, ink, paper };
  }
  if (v === 'mono') return { bg: null, text: ink, brand: ink, accent: ink, tint: '#FFFFFF', ink, paper };
  if (v === 'reverse') return { bg: null, text: '#FFFFFF', brand: '#FFFFFF', accent: '#FFFFFF', tint: brand, ink, paper };
  return { bg: null, text: ink, brand, accent, tint, ink, paper };
}

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);
const f1 = (n: number) => (Math.round(n * 10) / 10).toString();
const f1n = (n: number) => Math.round(n * 10) / 10;
const fam = (f: string, fallback: string) => `'${f}', ${fallback}`;
const markPath = (shape: MarkShape, x: number, y: number, size: number, fill: string) => {
  const m = MARK_PATHS[shape] ?? MARK_PATHS.spark;
  return `<path d="${m.d}" fill="${fill}"${m.evenOdd ? ' fill-rule="evenodd"' : ''} transform="translate(${f1(x)} ${f1(y)}) scale(${(size / 64).toFixed(4)})"/>`;
};

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return (words[0]![0]! + words[1]![0]!).toUpperCase();
  return name.trim()[0]!.toUpperCase();
}

function titleCase(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function splitStack(name: string): string[] {
  const words = name.trim().toUpperCase().split(/\s+/);
  if (words.length > 1) return [words[0]!, words.slice(1).join(' ')];
  const w = words[0]!;
  if (w.length < 7) return [w];
  const syl = syllables(w.toLowerCase());
  if (syl.length < 2) return [w.slice(0, Math.ceil(w.length / 2)), w.slice(Math.ceil(w.length / 2))];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < syl.length; i++) {
    const left = syl.slice(0, i).join('').length;
    const diff = Math.abs(left - w.length / 2);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = left;
    }
  }
  return [w.slice(0, best), w.slice(best)];
}

/** The brand symbol (generative family or AI-drawn) at (x, y). */
function symbolAt(id: LogoIdentity, c: Colors, x: number, y: number, size: number): string {
  return drawSymbol(id.symbol ?? { family: 'tiles' }, `${id.name}:${id.seed}`, { brand: c.brand, accent: c.accent, ink: c.text, tint: c.tint, paper: c.bg ?? c.paper }, x, y, size);
}

/** The small signature mark: the AI-drawn symbol when there is one, else the classic mark shape. */
function signatureMark(id: LogoIdentity, c: Colors, x: number, y: number, size: number, fill: string): string {
  if (id.symbol?.svg) return symbolAt(id, { ...c, brand: fill }, x, y, size);
  return markPath(id.mark, x, y, size, fill);
}

function cased(name: string, mode: 'lower' | 'title' | 'upper' | undefined, fallback: 'lower' | 'title' | 'upper'): string {
  const m = mode ?? fallback;
  return m === 'upper' ? name.trim().toUpperCase() : m === 'title' ? titleCase(name) : name.trim().toLowerCase();
}

/** Container shapes for lettermarks, in a 100×100 box. */
const CONTAINERS = [
  (fill: string) => `<circle cx="50" cy="50" r="50" fill="${fill}"/>`,
  (fill: string) => `<path d="M50 0C88 0 100 12 100 50S88 100 50 100 0 88 0 50 12 0 50 0Z" fill="${fill}"/>`,
  (fill: string) => `<path d="M50 2L93 26V74L50 98L7 74V26Z" fill="${fill}" stroke="${fill}" stroke-width="4" stroke-linejoin="round"/>`,
  (fill: string) => `<path d="M8 6H92V52C92 76 72 92 50 98C28 92 8 76 8 52Z" fill="${fill}"/>`,
  (fill: string) => `<rect width="100" height="100" rx="22" fill="${fill}"/>`,
  (fill: string) => `<path d="M0 50A50 50 0 0 1 100 50V100H0Z" fill="${fill}"/>`,
];

function containerFor(id: LogoIdentity): (fill: string) => string {
  return CONTAINERS[hash32(`container:${id.name}:${id.seed}`) % CONTAINERS.length]!;
}

export interface SvgResult {
  svg: string;
  width: number;
  height: number;
}

function wrap(width: number, height: number, c: Colors, body: string, opts: { css?: string; background?: boolean; title?: string }): SvgResult {
  const bg = opts.background && c.bg ? `<rect width="100%" height="100%" fill="${c.bg}"/>` : '';
  const style = opts.css ? `<defs><style>${opts.css}</style></defs>` : '';
  const title = opts.title ? `<title>${esc(opts.title)}</title>` : '';
  return {
    width,
    height,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f1(width)} ${f1(height)}" width="${f1(width)}" height="${f1(height)}" role="img">${title}${style}${bg}${body}</svg>`,
  };
}

/** The primary logo lockup for an identity. */
export function logoSVG(id: LogoIdentity, opts: { variant?: LogoVariant; measure?: Measurer; css?: string; background?: boolean } = {}): SvgResult {
  const v = opts.variant ?? 'light';
  const M = opts.measure ?? approxMeasure;
  const c = colors(id.palette, v);
  const F = 100;
  const display = id.typography.display;
  const dw = Math.max(...display.weights);
  const dfam = fam(display.family, 'sans-serif');
  const w = (text: string, size: number, weight = dw, family = display.family) => M.width(text, { family, weight, size });
  const o = { css: opts.css, background: opts.background, title: id.name };

  switch (id.style) {
    case 'monogram': {
      const pad = 0.2 * F;
      const D = 1.3 * F;
      const ini = initials(id.name);
      const capSize = 0.4 * F;
      const ls = 0.24 * capSize;
      const caps = id.name.trim().toUpperCase();
      const capsW = w(caps, capSize, Math.min(...display.weights)) + ls * (caps.length - 1);
      const gap = 0.36 * F;
      const width = pad * 2 + D + gap + capsW;
      const height = pad * 2 + D;
      const cx = pad + D / 2;
      const cy = pad + D / 2;
      const iniSize = ini.length > 1 ? 0.5 * F : 0.64 * F;
      const badgeText = onColor(c.brand);
      const body =
        `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(D / 2)}" fill="${c.brand}"/>` +
        `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(D / 2 - 0.07 * F)}" fill="none" stroke="${v === 'mono' ? '#FFFFFF' : badgeText}" stroke-opacity="0.35" stroke-width="${f1(0.02 * F)}"/>` +
        `<text x="${f1(cx)}" y="${f1(cy + iniSize * 0.35)}" text-anchor="middle" font-family="${dfam}" font-weight="${dw}" font-size="${f1(iniSize)}" fill="${v === 'mono' ? '#FFFFFF' : badgeText}">${esc(ini)}</text>` +
        `<text x="${f1(pad + D + gap)}" y="${f1(cy + capSize * 0.36)}" font-family="${dfam}" font-weight="${Math.min(...display.weights)}" font-size="${f1(capSize)}" letter-spacing="${f1(ls)}" fill="${c.text}">${esc(caps)}</text>`;
      return wrap(width, height, c, body, o);
    }
    case 'editorial': {
      const pad = 0.28 * F;
      const t = titleCase(id.name);
      const tw = w(t, F) - 0.01 * F * (t.length - 1);
      const ascent = 0.78 * F;
      const baseline = pad + ascent;
      const ruleY = baseline + 0.2 * F;
      // A fixed founding year only when the brand gives one: a logo must not change by itself every January.
      const est = id.founded ? `EST. ${id.founded}` : '';
      const estSize = est ? 0.13 * F : 0;
      const width = pad * 2 + tw;
      const height = ruleY + 0.08 * F + estSize * 1.6 + pad;
      const dataFam = fam(id.typography.data.family, 'monospace');
      const body =
        `<text x="${f1(pad)}" y="${f1(baseline)}" font-family="${fam(display.family, 'serif')}" font-weight="${dw}" font-size="${F}" letter-spacing="${f1(-0.01 * F)}" fill="${c.text}"><tspan fill="${c.brand}">${esc(t[0]!)}</tspan>${esc(t.slice(1))}</text>` +
        `<rect x="${f1(pad)}" y="${f1(ruleY)}" width="${f1(tw)}" height="${f1(0.02 * F)}" fill="${c.text}"/>` +
        (est ? `<text x="${f1(pad + tw / 2)}" y="${f1(ruleY + 0.08 * F + estSize)}" text-anchor="middle" font-family="${dataFam}" font-size="${f1(estSize)}" letter-spacing="${f1(estSize * 0.35)}" fill="${c.text}" fill-opacity="0.7">${esc(est)}</text>` : '');
      return wrap(width, height, c, body, o);
    }
    case 'stacked': {
      const lines = splitStack(id.name);
      const size = F;
      const cap = M.capHeight?.({ family: display.family, weight: dw, size }) ?? 0.74 * F;
      const lineGap = 0.12 * F;
      const widths = lines.map((l) => w(l, size));
      const padX = 0.26 * F;
      const padY = 0.22 * F;
      const blockW = Math.max(...widths) + padX * 2;
      const blockH = lines.length * cap + (lines.length - 1) * lineGap + padY * 2;
      const margin = 0.2 * F + blockW * 0.05;
      const width = blockW + margin * 2;
      const height = blockH + margin * 2;
      const bx = margin;
      const by = margin;
      const fill = c.brand;
      const txt = v === 'mono' ? '#FFFFFF' : onColor(fill);
      const texts = lines
        .map((l, i) => `<text x="${f1(bx + padX)}" y="${f1(by + padY + cap * (i + 1) + lineGap * i)}" font-family="${fam(display.family, 'Impact, sans-serif')}" font-weight="${dw}" font-size="${f1(size)}" fill="${txt}">${esc(l)}</text>`)
        .join('');
      const body = `<g transform="rotate(-4 ${f1(width / 2)} ${f1(height / 2)})"><rect x="${f1(bx)}" y="${f1(by)}" width="${f1(blockW)}" height="${f1(blockH)}" rx="${f1(0.12 * F)}" fill="${fill}"/>${texts}</g>`;
      return wrap(width, height, c, body, o);
    }
    case 'symbol': {
      const pad = 0.2 * F;
      const S = 1.1 * F;
      const size = 0.58 * F;
      const t = cased(id.name, id.case, 'title');
      const tw = w(t, size) - 0.02 * size * (t.length - 1);
      const gap = 0.3 * F;
      const width = pad * 2 + S + gap + tw;
      const height = pad * 2 + S;
      const body =
        symbolAt(id, c, pad, pad, S) +
        `<text x="${f1(pad + S + gap)}" y="${f1(pad + S / 2 + size * 0.36)}" font-family="${dfam}" font-weight="${dw}" font-size="${f1(size)}" letter-spacing="${f1(-0.02 * size)}" fill="${c.text}">${esc(t)}</text>`;
      return wrap(width, height, c, body, o);
    }
    case 'emblem': {
      const pad = 0.24 * F;
      const S = 1.25 * F;
      const size = 0.34 * F;
      const ls = 0.22 * size;
      const t = cased(id.name, id.case, 'upper');
      const tw = w(t, size) + ls * (t.length - 1);
      const width = pad * 2 + Math.max(S, tw);
      const gap = 0.22 * F;
      const baseline = pad + S + gap + size * 0.74;
      const height = baseline + pad + 0.04 * F;
      const cx = width / 2;
      const body =
        symbolAt(id, c, cx - S / 2, pad, S) +
        `<text x="${f1(cx + ls / 2)}" y="${f1(baseline)}" text-anchor="middle" font-family="${dfam}" font-weight="${dw}" font-size="${f1(size)}" letter-spacing="${f1(ls)}" fill="${c.text}">${esc(t)}</text>`;
      return wrap(width, height, c, body, o);
    }
    case 'lettermark': {
      const pad = 0.2 * F;
      const S = 1.1 * F;
      const size = 0.56 * F;
      const t = cased(id.name, id.case, 'lower');
      const tw = w(t, size) - 0.02 * size * (t.length - 1);
      const gap = 0.3 * F;
      const width = pad * 2 + S + gap + tw;
      const height = pad * 2 + S;
      const letter = initials(id.name).slice(0, 1);
      const knock = v === 'mono' ? '#FFFFFF' : onColor(c.brand);
      const body =
        `<g transform="translate(${f1(pad)} ${f1(pad)}) scale(${(S / 100).toFixed(4)})">${containerFor(id)(c.brand)}` +
        `<text x="50" y="${f1(50 + 62 * 0.36)}" text-anchor="middle" font-family="${dfam}" font-weight="${dw}" font-size="62" fill="${knock}">${esc(letter)}</text></g>` +
        `<text x="${f1(pad + S + gap)}" y="${f1(pad + S / 2 + size * 0.36)}" font-family="${dfam}" font-weight="${dw}" font-size="${f1(size)}" letter-spacing="${f1(-0.02 * size)}" fill="${c.text}">${esc(t)}</text>`;
      return wrap(width, height, c, body, o);
    }
    case 'playful': {
      const pad = 0.28 * F;
      const t = id.name.trim().toLowerCase().replace(/\s+/g, '');
      const palette = v === 'mono' ? [c.text] : [c.brand, c.accent, c.text];
      let x = pad;
      const baseline = pad + 0.86 * F;
      const parts: string[] = [];
      [...t].forEach((ch, i) => {
        const adv = w(ch, F) * 1.06;
        const dy = i % 2 ? -0.06 * F : 0.03 * F;
        const rot = i % 2 ? -6 : 5;
        const cx = x + adv / 2;
        parts.push(`<text x="${f1(cx)}" y="${f1(baseline + dy)}" text-anchor="middle" transform="rotate(${rot} ${f1(cx)} ${f1(baseline + dy - 0.3 * F)})" font-family="${fam(display.family, 'sans-serif')}" font-weight="${dw}" font-size="${F}" fill="${palette[i % palette.length]}">${esc(ch)}</text>`);
        x += adv;
      });
      const width = x + pad;
      const height = baseline + 0.3 * F + pad;
      return wrap(width, height, c, parts.join(''), o);
    }
    case 'terminal': {
      const pad = 0.26 * F;
      const size = 0.78 * F;
      const name = id.name.trim().toLowerCase().replace(/\s+/g, '_');
      const pw = w('>', size);
      const gap = 0.3 * size;
      const nw = w(name, size);
      const curW = 0.46 * size;
      const baseline = pad + 0.78 * size;
      const nx = pad + pw + gap;
      const width = nx + nw + 0.08 * F + curW + pad;
      const height = pad * 2 + size;
      const tf = `font-family="${fam(display.family, 'monospace')}" font-weight="${dw}" font-size="${f1(size)}"`;
      const body =
        `<text x="${f1(pad)}" y="${f1(baseline)}" ${tf} fill="${c.accent}">&gt;</text>` +
        `<text x="${f1(nx)}" y="${f1(baseline)}" ${tf} fill="${c.text}">${esc(name)}</text>` +
        `<rect class="gbt-cursor" x="${f1(nx + nw + 0.08 * F)}" y="${f1(baseline - 0.72 * size)}" width="${f1(curW)}" height="${f1(0.86 * size)}" fill="${c.brand}"/>`;
      return wrap(width, height, c, body, o);
    }
    case 'heritage': {
      const pad = 0.26 * F;
      const t = id.name.trim().toLowerCase().replace(/\s+/g, '');
      const tw = w(t, F, dw);
      const xh = M.xHeight?.({ family: display.family, weight: dw, size: F }) ?? 0.52 * F;
      const markS = 0.36 * F;
      const top = pad + markS + 0.06 * F;
      const ascentAbove = 0.3 * F; // ascenders poke above the bar
      const baseline = top + ascentAbove + xh;
      const barH = 0.075 * F;
      const barY = baseline - xh - barH * 0.55;
      const over = 0.06 * F;
      const width = pad * 2 + tw + over * 2;
      const height = baseline + 0.3 * F + pad;
      const body =
        `<text x="${f1(pad + over)}" y="${f1(baseline)}" font-family="${fam(display.family, 'serif')}" font-weight="${dw}" font-size="${F}" fill="${c.text}">${esc(t)}</text>` +
        `<rect x="${f1(pad)}" y="${f1(barY)}" width="${f1(tw + over * 2)}" height="${f1(barH)}" fill="${c.text}"/>` +
        signatureMark(id, c, pad + tw + over * 2 - markS * 1.05, barY - markS - 0.04 * F, markS, c.brand);
      return wrap(width, height, c, body, o);
    }
    case 'twinkle':
    default: {
      const pad = 0.3 * F;
      const t = id.name.trim().toLowerCase().replace(/\s+/g, '');
      const ls = (/Space Grotesk|Inter Tight|Syne/.test(display.family) ? -0.05 : -0.025) * F;
      const tw = w(t, F) + ls * (t.length - 1);
      const markS = 0.46 * F;
      const gap = F / 12;
      const ascent = 0.78 * F;
      const baseline = pad + ascent;
      const width = pad * 2 + tw + gap + markS;
      const height = baseline + 0.24 * F + pad;
      const body =
        `<text x="${f1(pad)}" y="${f1(baseline)}" font-family="${dfam}" font-weight="${dw}" font-size="${F}" letter-spacing="${f1(ls)}" fill="${c.text}">${esc(t)}</text>` +
        signatureMark(id, c, pad + tw + gap, baseline - markS, markS, c.brand);
      return wrap(width, height, c, body, o);
    }
  }
}

/** Square app icon (128×128) in the same family. */
export function iconSVG(id: LogoIdentity, opts: { measure?: Measurer; css?: string } = {}): SvgResult {
  const c = colors(id.palette, 'light');
  const S = 128;
  const display = id.typography.display;
  const dw = Math.max(...display.weights);
  const letter = id.name.trim()[0] ?? 'g';
  const tile = (fill: string, body: string, r = 30) => `<rect width="${S}" height="${S}" rx="${r}" fill="${fill}"/>${body}`;
  const text = (s: string, size: number, fill: string, family = display.family, fallback = 'sans-serif', y = S / 2 + size * 0.35) =>
    `<text x="${S / 2}" y="${f1(y)}" text-anchor="middle" font-family="${fam(family, fallback)}" font-weight="${dw}" font-size="${f1(size)}" fill="${fill}">${esc(s)}</text>`;
  let body: string;
  switch (id.style) {
    case 'monogram':
      body = tile(c.tint, `<circle cx="64" cy="64" r="46" fill="${c.brand}"/>` + text(initials(id.name), initials(id.name).length > 1 ? 34 : 44, onColor(c.brand)));
      break;
    case 'editorial':
      body = tile(c.paper, `<rect x="6" y="6" width="116" height="116" rx="24" fill="none" stroke="${c.ink}" stroke-opacity="0.12"/>` + text(letter.toUpperCase(), 80, c.brand, display.family, 'serif', 92) + `<rect x="34" y="104" width="60" height="3" fill="${c.ink}"/>`);
      break;
    case 'stacked':
      body = `<g transform="rotate(-6 64 64)">${tile(c.brand, text(letter.toUpperCase(), 84, onColor(c.brand), display.family, 'Impact, sans-serif', 94), 22)}</g>`;
      return wrap(S, S, c, body, { css: opts.css });
    case 'symbol':
      body = tile('#FFFFFF', symbolAt(id, { ...c, bg: '#FFFFFF' }, 20, 20, 88));
      break;
    case 'emblem':
      body = tile(c.tint, symbolAt(id, { ...c, bg: c.tint }, 20, 20, 88));
      break;
    case 'lettermark':
      body = tile(c.paper, `<g transform="translate(18 18) scale(0.92)">${containerFor(id)(c.brand)}<text x="50" y="${f1(50 + 62 * 0.36)}" text-anchor="middle" font-family="${fam(display.family, 'sans-serif')}" font-weight="${dw}" font-size="62" fill="${onColor(c.brand)}">${esc(initials(id.name).slice(0, 1))}</text></g>`);
      break;
    case 'playful':
      body = tile(c.tint, text(letter.toLowerCase(), 86, c.brand, display.family, 'sans-serif', 92), 64);
      break;
    case 'terminal':
      body = tile(c.ink, `<text x="24" y="82" font-family="${fam(display.family, 'monospace')}" font-weight="${dw}" font-size="50" fill="${c.accent}">&gt;</text><rect x="62" y="44" width="26" height="42" fill="${c.paper}"/>`);
      break;
    case 'heritage':
      {
        const xh = (opts.measure ?? approxMeasure).xHeight?.({ family: display.family, weight: dw, size: 76 }) ?? 0.52 * 76;
        body = tile(c.tint, text(letter.toLowerCase(), 76, c.ink, display.family, 'serif', 98) + `<rect x="26" y="${f1(98 - xh - 4)}" width="76" height="6" fill="${c.ink}"/>` + signatureMark(id, c, 74, f1n(98 - xh - 32), 24, c.brand));
      }
      break;
    case 'twinkle':
    default:
      body = tile(c.ink, text(letter.toLowerCase(), 72, c.paper, display.family, 'sans-serif', 84).replace(`x="${S / 2}"`, 'x="56"') + signatureMark(id, { ...c, bg: c.ink }, 82, 70, 22, c.accent));
  }
  return wrap(S, S, c, body, { css: opts.css });
}
