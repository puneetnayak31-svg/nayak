/**
 * Generative symbols. Each family is a small parametric design: the seed
 * decides counts, angles, proportions and colour order, so two brands never
 * get the same mark, and one family can look very different from seed to
 * seed. Symbols are drawn in a 100×100 box and placed by the caller.
 *
 * A symbol can also be a custom SVG drawn by an AI model. That markup is
 * sanitised (allow-listed shapes and attributes, colours as palette roles)
 * before it is ever stored or rendered.
 */
import { hash32, rng } from './text';

export const SYMBOL_FAMILIES = ['tiles', 'orbit', 'petals', 'stripes', 'blob', 'pixels', 'chevrons', 'crescent', 'burst', 'interlock', 'sprout', 'layers', 'arcs'] as const;
export type SymbolFamily = (typeof SYMBOL_FAMILIES)[number];

/** label, the idea it carries, where it fits, plus how the shape is perceived (`feel`) and what to watch (`caution`), see docs/LOGO_SCIENCE.md. */
export const SYMBOL_META: Record<SymbolFamily, { label: string; idea: string; fit: string[]; feel: string; caution: string }> = {
  tiles: { label: 'Bauhaus tiles', idea: 'four geometric tiles, built like a modular system', fit: ['Technical', 'Minimal', 'Creative', 'saas', 'education'], feel: 'Mixed shapes on a strict grid: order with a creative streak.', caution: 'Same-colour tiles merge in one-colour print.' },
  orbit: { label: 'Orbit', idea: 'a planet and its satellite: a core product with everything around it', fit: ['Futuristic', 'Technical', 'ai', 'saas', 'fintech'], feel: 'Curves around a core: an ecosystem, a centre with satellites.', caution: 'Thin rings vanish at 16px; a common space cliché in AI.' },
  petals: { label: 'Bloom', idea: 'petals opening around a centre: growth, care and many voices', fit: ['Human', 'Premium', 'beauty', 'healthcare', 'india', 'wellness'], feel: 'Radial curves: care, growth and wellness.', caution: 'A lotus can read as political in India; avoid saffron with eight petals.' },
  stripes: { label: 'Banded sun', idea: 'a sun cut into bands: warmth with a sense of order', fit: ['Bold', 'Creative', 'food', 'travel', 'media'], feel: 'A banded circle: warmth with order.', caution: 'The gaps close up at small sizes.' },
  blob: { label: 'Living shape', idea: 'a soft organic form with an eye of colour: friendly and alive', fit: ['Playful', 'Youthful', 'Human', 'consumer', 'creator'], feel: 'Organic and soft: friendly and alive.', caution: 'Can feel too casual for finance or premium brands.' },
  pixels: { label: 'Pixel crest', idea: 'a symmetric pixel crest unique to the name: digital and crafted', fit: ['Technical', 'Experimental', 'Playful', 'gaming', 'ai', 'saas'], feel: 'Square and symmetric: digital and crafted.', caution: 'Can look like a generic avatar; busy at 16px.' },
  chevrons: { label: 'Momentum', idea: 'stacked chevrons that point forward: progress you can see', fit: ['Bold', 'Trustworthy', 'fintech', 'logistics', 'fitness'], feel: 'Angular and directional: progress and ambition.', caution: 'Pointing down reads as decline; keep it rising or forward.' },
  crescent: { label: 'Crescent', idea: 'a crescent and a spark: something new rising', fit: ['Premium', 'Luxury', 'Minimal', 'beauty', 'wellness', 'india'], feel: 'A curve opening up: new beginnings, calm and premium.', caution: 'A crescent with a star carries religious and flag meanings.' },
  burst: { label: 'Burst', idea: 'a many-pointed burst: energy and celebration', fit: ['Playful', 'Bold', 'Youthful', 'food', 'events', 'consumer'], feel: 'Angular and radial: energy and celebration.', caution: 'Too many points looks like a discount sticker.' },
  interlock: { label: 'Interlock', idea: 'two rings linked together: partnership and trust', fit: ['Trustworthy', 'Human', 'consulting', 'fintech', 'community'], feel: 'Overlapping forms: partnership and trust.', caution: 'Close to famous ring logos; the rings merge in one colour.' },
  sprout: { label: 'Sprout', idea: 'leaves from one stem: natural growth', fit: ['Human', 'Traditional', 'food', 'agritech', 'wellness', 'education'], feel: 'Organic growth: nature and new life.', caution: 'A cliché in agriculture and wellness; pair with a distinctive wordmark.' },
  layers: { label: 'Layers', idea: 'stacked layers: a platform others build on', fit: ['Technical', 'Trustworthy', 'saas', 'ai', 'devtools'], feel: 'Stacked planes: a platform others build on.', caution: 'Common in developer tools; the gaps vanish small.' },
  arcs: { label: 'Rainbow arcs', idea: 'nested arcs: range, inclusion and a sunrise', fit: ['Creative', 'Human', 'Youthful', 'education', 'media', 'creator'], feel: 'Nested curves: inclusion and optimism.', caution: 'Can read as a rainbow or Pride flag, or feel child-like.' },
};

export interface SymbolColors {
  brand: string;
  accent: string;
  ink: string;
  tint: string;
  paper: string;
}

export interface SymbolSpec {
  /** A SymbolFamily; unknown names fall back to tiles. */
  family?: string;
  /** Sanitised SVG markup in a 0 0 100 100 box, colours as palette roles. */
  svg?: string;
  /** Optional raster concept (from an image model) shown alongside the vector logo. */
  imageUrl?: string;
}

const n1 = (v: number) => (Math.round(v * 10) / 10).toString();
const pt = (x: number, y: number) => `${n1(x)} ${n1(y)}`;
const TAU = Math.PI * 2;

type Draw = (r: () => number, c: SymbolColors) => string;

function pick<T>(r: () => number, xs: readonly T[]): T {
  return xs[Math.floor(r() * xs.length) % xs.length]!;
}

/** Smooth closed curve through points (Catmull-Rom → cubic Bézier). */
function smoothClosed(points: Array<[number, number]>): string {
  const n = points.length;
  let d = `M${pt(...points[0]!)}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]!;
    const p1 = points[i]!;
    const p2 = points[(i + 1) % n]!;
    const p3 = points[(i + 2) % n]!;
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(...c1)} ${pt(...c2)} ${pt(...p2)}`;
  }
  return `${d}Z`;
}

const DRAW: Record<SymbolFamily, Draw> = {
  tiles(r, c) {
    const cell = 50;
    const fills = [c.brand, c.accent, c.ink, c.brand];
    const out: string[] = [];
    for (let i = 0; i < 4; i++) {
      const x = (i % 2) * cell;
      const y = Math.floor(i / 2) * cell;
      const kind = Math.floor(r() * 4);
      const rot = Math.floor(r() * 4) * 90;
      const fill = fills[(i + Math.floor(r() * 4)) % 4]!;
      const mid = pt(x + cell / 2, y + cell / 2);
      if (kind === 0) out.push(`<path d="M${pt(x, y)}H${n1(x + cell)}A${cell} ${cell} 0 0 1 ${pt(x, y + cell)}Z" fill="${fill}" transform="rotate(${rot} ${mid})"/>`);
      else if (kind === 1) out.push(`<path d="M${pt(x, y + cell)}A${cell / 2} ${cell / 2} 0 0 1 ${pt(x + cell, y + cell)}Z" fill="${fill}" transform="rotate(${rot} ${mid})"/>`);
      else if (kind === 2) out.push(`<circle cx="${x + 25}" cy="${y + 25}" r="23" fill="${fill}"/>`);
      else out.push(`<rect x="${x + 2}" y="${y + 2}" width="46" height="46" rx="6" fill="${fill}"/>`);
    }
    if (!out.some((s) => s.includes(c.brand))) out[0] = out[0]!.replace(/fill="[^"]+"/, `fill="${c.brand}"`);
    return out.join('');
  },
  orbit(r, c) {
    const a = r() * TAU;
    const R = 40 + r() * 6;
    const core = 22 + r() * 8;
    const arc = 0.55 + r() * 0.35; // fraction of the ring drawn
    const start = a + 0.5;
    const end = start + arc * TAU;
    const sx = 50 + R * Math.cos(start);
    const sy = 50 + R * Math.sin(start);
    const ex = 50 + R * Math.cos(end);
    const ey = 50 + R * Math.sin(end);
    const sat = 7 + r() * 4;
    const tilt = Math.round((r() - 0.5) * 50);
    return (
      `<g transform="rotate(${tilt} 50 50)">` +
      `<path d="M${pt(sx, sy)}A${n1(R)} ${n1(R)} 0 ${arc > 0.5 ? 1 : 0} 1 ${pt(ex, ey)}" fill="none" stroke="${c.accent}" stroke-width="5" stroke-linecap="round"/>` +
      `<circle cx="50" cy="50" r="${n1(core)}" fill="${c.brand}"/>` +
      `<circle cx="${n1(50 + R * Math.cos(a))}" cy="${n1(50 + R * Math.sin(a))}" r="${n1(sat)}" fill="${c.ink}"/></g>`
    );
  },
  petals(r, c) {
    const n = 3 + Math.floor(r() * 6);
    const ry = 26 + r() * 10;
    const rx = Math.max(8, Math.min(20, 70 / n + r() * 6));
    const off = 20 + r() * 6;
    const rot0 = r() * 360;
    const two = r() > 0.4;
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const ang = rot0 + (360 / n) * i;
      out.push(`<ellipse cx="50" cy="${n1(50 - off)}" rx="${n1(rx)}" ry="${n1(ry)}" fill="${two && i % 2 ? c.accent : c.brand}" fill-opacity="0.88" transform="rotate(${n1(ang)} 50 50)"/>`);
    }
    out.push(`<circle cx="50" cy="50" r="${n1(7 + r() * 5)}" fill="${c.paper}"/>`);
    return out.join('');
  },
  stripes(r, c) {
    const R = 46;
    const k = 3 + Math.floor(r() * 3);
    const gap = 3 + r() * 3;
    const h = (2 * R - gap * (k - 1)) / k;
    const out: string[] = [];
    const colors = [c.brand, c.accent, c.ink];
    const shift = Math.floor(r() * 3);
    for (let i = 0; i < k; i++) {
      const y1 = 50 - R + i * (h + gap);
      const y2 = y1 + h;
      const half = (y: number) => Math.sqrt(Math.max(0, R * R - (y - 50) ** 2));
      const a1 = half(y1);
      const a2 = half(y2);
      const d = `M${pt(50 - a1, y1)}L${pt(50 + a1, y1)}A${R} ${R} 0 0 1 ${pt(50 + a2, y2)}L${pt(50 - a2, y2)}A${R} ${R} 0 0 1 ${pt(50 - a1, y1)}Z`;
      out.push(`<path d="${d}" fill="${colors[(i + shift) % (r() > 0.7 ? 3 : 2)]}"/>`);
    }
    return `<g transform="rotate(${Math.round((r() - 0.5) * 70)} 50 50)">${out.join('')}</g>`;
  },
  blob(r, c) {
    const n = 5 + Math.floor(r() * 4);
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + r() * 0.3;
      const rad = 32 + r() * 12;
      pts.push([50 + rad * Math.cos(a), 50 + rad * Math.sin(a)]);
    }
    const ex = 50 + (r() - 0.5) * 22;
    const ey = 44 + (r() - 0.5) * 14;
    return `<path d="${smoothClosed(pts)}" fill="${c.brand}"/><circle cx="${n1(ex)}" cy="${n1(ey)}" r="${n1(7 + r() * 5)}" fill="${c.paper}"/><circle cx="${n1(ex + 2)}" cy="${n1(ey + 1)}" r="${n1(3 + r() * 2)}" fill="${c.ink}"/>`;
  },
  pixels(r, c) {
    const N = 5;
    const cell = 100 / N;
    const out: string[] = [];
    const round = r() > 0.5;
    let count = 0;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < Math.ceil(N / 2); x++) {
        const on = r() > 0.45 || (x === 2 && y === 2);
        if (!on) continue;
        const fill = r() > 0.82 ? c.accent : c.brand;
        for (const xx of x === N - 1 - x ? [x] : [x, N - 1 - x]) {
          count++;
          out.push(round ? `<circle cx="${n1(xx * cell + cell / 2)}" cy="${n1(y * cell + cell / 2)}" r="${n1(cell * 0.44)}" fill="${fill}"/>` : `<rect x="${n1(xx * cell + 1)}" y="${n1(y * cell + 1)}" width="${n1(cell - 2)}" height="${n1(cell - 2)}" rx="3" fill="${fill}"/>`);
        }
      }
    }
    if (count < 8) out.push(`<rect x="20" y="20" width="60" height="60" rx="8" fill="${c.brand}" fill-opacity="0.25"/>`);
    return out.join('');
  },
  chevrons(r, c) {
    const k = 2 + Math.floor(r() * 2);
    const w = 11 + r() * 5;
    const depth = 18 + r() * 12;
    const step = (70 - w) / Math.max(1, k);
    const colors = [c.ink, c.brand, c.accent];
    const out: string[] = [];
    for (let i = 0; i < k; i++) {
      const y = 22 + depth + i * step;
      out.push(`<path d="M${pt(16, y)}L50 ${n1(y - depth)}L${pt(84, y)}" fill="none" stroke="${colors[(i + (k === 2 ? 1 : 0)) % 3]}" stroke-width="${n1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
    const rot = pick(r, [0, 90, 0, 45]);
    return `<g transform="rotate(${rot} 50 50)">${out.join('')}</g>`;
  },
  crescent(r, c) {
    const R = 40;
    const rr = 30 + r() * 6;
    const d = 16 + r() * 8;
    const th = -Math.PI / 4 + (r() - 0.5) * 1.2;
    const cx2 = 50 + d * Math.cos(th);
    const cy2 = 50 + d * Math.sin(th);
    // Intersections of the two circles.
    const a = (R * R - rr * rr + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, R * R - a * a));
    const mx = 50 + a * Math.cos(th);
    const my = 50 + a * Math.sin(th);
    const p1: [number, number] = [mx + h * Math.sin(th), my - h * Math.cos(th)];
    const p2: [number, number] = [mx - h * Math.sin(th), my + h * Math.cos(th)];
    const path = `M${pt(...p1)}A${R} ${R} 0 1 0 ${pt(...p2)}A${n1(rr)} ${n1(rr)} 0 0 1 ${pt(...p1)}Z`;
    const sx = cx2 + (rr * 0.25) * Math.cos(th);
    const sy = cy2 + (rr * 0.25) * Math.sin(th);
    const s = 9 + r() * 4;
    return `<path d="${path}" fill="${c.brand}"/><path d="M${pt(sx, sy - s)}Q${pt(sx + s * 0.18, sy - s * 0.18)} ${pt(sx + s, sy)}Q${pt(sx + s * 0.18, sy + s * 0.18)} ${pt(sx, sy + s)}Q${pt(sx - s * 0.18, sy + s * 0.18)} ${pt(sx - s, sy)}Q${pt(sx - s * 0.18, sy - s * 0.18)} ${pt(sx, sy - s)}Z" fill="${c.accent}"/>`;
  },
  burst(r, c) {
    const n = 5 + Math.floor(r() * 8);
    const outer = 46;
    const inner = outer * (0.42 + r() * 0.3);
    const rot = r() * 360;
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const rad = i % 2 ? inner : outer;
      const a = (i / (n * 2)) * TAU + (rot * Math.PI) / 180;
      d += `${i ? 'L' : 'M'}${pt(50 + rad * Math.cos(a), 50 + rad * Math.sin(a))}`;
    }
    const hole = r() > 0.5;
    return `<path d="${d}Z" fill="${c.brand}" stroke="${c.brand}" stroke-width="5" stroke-linejoin="round"/>` + (hole ? `<circle cx="50" cy="50" r="${n1(inner * 0.5)}" fill="${c.accent}"/>` : '');
  },
  interlock(r, c) {
    const R = 22 + r() * 4;
    const sep = 13 + r() * 6;
    const w = 8 + r() * 4;
    const rot = Math.round(r() * 180);
    const square = r() > 0.6;
    const shape = (cx: number, color: string) =>
      square
        ? `<rect x="${n1(cx - R)}" y="${n1(50 - R)}" width="${n1(R * 2)}" height="${n1(R * 2)}" rx="${n1(R * 0.35)}" fill="none" stroke="${color}" stroke-width="${n1(w)}"/>`
        : `<circle cx="${n1(cx)}" cy="50" r="${n1(R)}" fill="none" stroke="${color}" stroke-width="${n1(w)}"/>`;
    return `<g transform="rotate(${rot} 50 50)">${shape(50 - sep, c.brand)}${shape(50 + sep, c.accent)}</g>`;
  },
  sprout(r, c) {
    const n = 2 + Math.floor(r() * 2);
    const len = 30 + r() * 8;
    const wid = 13 + r() * 5;
    const leaf = (ang: number, color: string) =>
      `<path d="M50 66C${pt(50 - wid, 66 - len * 0.5)} ${pt(50 - wid * 0.4, 66 - len)} 50 ${n1(66 - len - 6)}C${pt(50 + wid * 0.4, 66 - len)} ${pt(50 + wid, 66 - len * 0.5)} 50 66Z" fill="${color}" transform="rotate(${n1(ang)} 50 66)"/>`;
    const spread = 34 + r() * 20;
    const out: string[] = [`<path d="M50 92V60" stroke="${c.ink}" stroke-width="6" stroke-linecap="round"/>`];
    if (n === 2) out.push(leaf(-spread, c.brand), leaf(spread, c.accent));
    else out.push(leaf(-spread * 1.3, c.brand), leaf(0, c.accent), leaf(spread * 1.3, c.brand));
    return out.join('');
  },
  layers(r, c) {
    const k = 3;
    const w = 40;
    const hgt = 20 + r() * 4;
    const gap = 13 + r() * 5;
    const colors = r() > 0.5 ? [c.accent, c.brand, c.ink] : [c.brand, c.accent, c.brand];
    const out: string[] = [];
    for (let i = k - 1; i >= 0; i--) {
      const cy = 30 + i * gap;
      out.push(`<path d="M50 ${n1(cy - hgt)}L${n1(50 + w)} ${n1(cy)}L50 ${n1(cy + hgt)}L${n1(50 - w)} ${n1(cy)}Z" fill="${colors[i]}" stroke="${c.paper}" stroke-width="3" stroke-linejoin="round"/>`);
    }
    return out.join('');
  },
  arcs(r, c) {
    const k = 3;
    const w = 9 + r() * 4;
    const rot = pick(r, [0, 90, 180, 270, 45]);
    const colors = [c.brand, c.accent, c.ink];
    const out: string[] = [];
    for (let i = 0; i < k; i++) {
      const R = 44 - i * (w + 3);
      out.push(`<path d="M${pt(50 - R, 74)}A${n1(R)} ${n1(R)} 0 0 1 ${pt(50 + R, 74)}" fill="none" stroke="${colors[i]}" stroke-width="${n1(w)}" stroke-linecap="round"/>`);
    }
    out.push(`<circle cx="50" cy="74" r="${n1(Math.max(4, 44 - k * (w + 3) - 2))}" fill="${colors[0]}"/>`);
    return `<g transform="rotate(${rot} 50 50) translate(0 -12)">${out.join('')}</g>`;
  },
};

/** Symbol markup for a family, in a 100×100 box. */
export function familySymbol(family: string, seed: string | number, c: SymbolColors): string {
  const r = rng(hash32(`sym:${family}:${seed}`));
  return (DRAW[family as SymbolFamily] ?? DRAW.tiles)(r, c);
}

/** Replace palette-role colour tokens in sanitised AI markup with real colours. */
export function resolveSymbolColors(svg: string, c: SymbolColors): string {
  return svg.replace(/(fill|stroke)="(brand|accent|ink|tint|paper)"/g, (_m, attr: string, role: keyof SymbolColors) => `${attr}="${c[role]}"`);
}

/** Draw any symbol spec at (x, y) with the given size. */
export function drawSymbol(spec: SymbolSpec | undefined, seed: string | number, c: SymbolColors, x: number, y: number, size: number): string {
  const inner = spec?.svg ? resolveSymbolColors(spec.svg, c) : familySymbol(spec?.family ?? 'tiles', seed, c);
  return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${(size / 100).toFixed(4)})">${inner}</g>`;
}

/** Pick a family that fits the brief, avoiding the ones already used. */
export function pickFamily(seed: string, tags: string[], exclude: SymbolFamily[] = []): SymbolFamily {
  const r = rng(hash32(`family:${seed}`));
  const lower = tags.map((t) => t.toLowerCase());
  const scored = SYMBOL_FAMILIES.filter((f) => !exclude.includes(f)).map((f) => ({
    f,
    s: SYMBOL_META[f].fit.filter((x) => lower.includes(x.toLowerCase())).length * 1.2 + r() * 2.4,
  }));
  scored.sort((a, b) => b.s - a.s);
  return scored[0]?.f ?? 'tiles';
}

/* ------------------------------------------------------------------ */
/* Sanitiser for AI-drawn SVG                                          */
/* ------------------------------------------------------------------ */

const ALLOWED_TAGS = new Set(['g', 'path', 'circle', 'ellipse', 'rect', 'polygon', 'polyline', 'line']);
const ALLOWED_ATTRS = new Set([
  'd',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'width',
  'height',
  'points',
  'x1',
  'y1',
  'x2',
  'y2',
  'transform',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'fill-rule',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
]);
const ROLES = new Set(['brand', 'accent', 'ink', 'tint', 'paper', 'none']);
const NUMERIC = /^-?[0-9.]+(e-?[0-9]+)?$/i;
const PATH_DATA = /^[0-9eE.,\s+\-MmLlHhVvCcSsQqTtAaZz]*$/;
const TRANSFORM = /^(\s*(translate|rotate|scale|matrix|skewX|skewY)\(\s*[-0-9.eE,\s]+\)\s*)+$/;

/**
 * Keep only simple vector shapes with safe attributes. Colours must be a
 * palette role (brand, accent, ink, tint, paper, none); anything else becomes
 * "brand". Returns null when nothing usable is left.
 */
export function sanitizeSymbolSvg(input: string, maxLength = 6000): string | null {
  if (!input || input.length > 20000) return null;
  // Take the inside of an <svg> wrapper if the model sent one.
  const inner = input.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>[\s\S]*$/i, '');
  const out: string[] = [];
  const stack: string[] = [];
  const tagRe = /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9-]*)([^<>]*?)(\/?)\s*>/g;
  let m: RegExpExecArray | null;
  let shapes = 0;
  while ((m = tagRe.exec(inner))) {
    const [, closing, rawTag, rawAttrs, selfClose] = m;
    const tag = rawTag!.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) continue;
    if (closing) {
      if (tag === 'g' && stack[stack.length - 1] === 'g') {
        stack.pop();
        out.push('</g>');
      }
      continue;
    }
    const attrs: string[] = [];
    const attrRe = /([a-zA-Z][a-zA-Z0-9:-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let a: RegExpExecArray | null;
    while ((a = attrRe.exec(rawAttrs ?? ''))) {
      const name = a[1]!.toLowerCase();
      const value = (a[3] ?? a[4] ?? '').trim();
      if (!ALLOWED_ATTRS.has(name)) continue;
      if (/[<>&"'`]|url\s*\(|script/i.test(value)) continue;
      if (name === 'fill' || name === 'stroke') {
        attrs.push(`${name}="${ROLES.has(value) ? value : 'brand'}"`);
      } else if (name === 'd' || name === 'points') {
        if (PATH_DATA.test(value) && value.length < 4000) attrs.push(`${name}="${value.replace(/\s+/g, ' ')}"`);
      } else if (name === 'transform') {
        if (TRANSFORM.test(value)) attrs.push(`${name}="${value}"`);
      } else if (name === 'stroke-linecap' || name === 'stroke-linejoin' || name === 'fill-rule') {
        if (/^(round|square|butt|miter|bevel|evenodd|nonzero)$/.test(value)) attrs.push(`${name}="${value}"`);
      } else if (NUMERIC.test(value)) {
        attrs.push(`${name}="${value}"`);
      }
    }
    if (tag === 'g') {
      if (selfClose) continue;
      stack.push('g');
      out.push(`<g${attrs.length ? ` ${attrs.join(' ')}` : ''}>`);
      continue;
    }
    if (tag === 'path' && !attrs.some((x) => x.startsWith('d='))) continue;
    if (tag === 'polygon' || tag === 'polyline') {
      if (!attrs.some((x) => x.startsWith('points='))) continue;
    }
    // Default fill for shapes the model left uncoloured.
    if (!attrs.some((x) => x.startsWith('fill='))) attrs.push('fill="brand"');
    shapes++;
    out.push(`<${tag} ${attrs.join(' ')}/>`);
  }
  while (stack.pop()) out.push('</g>');
  if (!shapes) return null;
  const svg = out.join('');
  return svg.length <= maxLength ? svg : null;
}
