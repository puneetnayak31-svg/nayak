/**
 * "Upload your logo, get your social kit": turns a logo someone already has
 * (a PNG/JPG/SVG they upload) into a profile picture, launch post, LinkedIn,
 * X and YouTube banners and a one-page brand guidelines sheet.
 *
 * Pure functions: the browser reads the file, samples its pixels for
 * `paletteFromPixels`, and passes the image as a data URL. Nothing is
 * uploaded to a server.
 */
import { contrast, hexToRgb, luminance, onColor } from './brand-system';
import { SOCIAL_ASSETS } from './elements';

export const REPURPOSE_KINDS = ['avatar', 'post', 'linkedin', 'x', 'youtube', 'guidelines'] as const;
export type RepurposeKind = (typeof REPURPOSE_KINDS)[number];

export const REPURPOSE_META: Record<RepurposeKind, { title: string; size: string; w: number; h: number; platform: string | null }> = {
  avatar: { ...SOCIAL_ASSETS.avatar, platform: null },
  post: { ...SOCIAL_ASSETS.post, title: 'Instagram / LinkedIn post', platform: 'instagram' },
  linkedin: { ...SOCIAL_ASSETS.linkedin, platform: 'linkedin' },
  x: { ...SOCIAL_ASSETS.x, platform: 'x' },
  youtube: { ...SOCIAL_ASSETS.youtube, platform: 'youtube' },
  guidelines: { title: 'Brand guidelines (one page)', size: '1600 × 1040', w: 1600, h: 1040, platform: null },
};

/** Fonts offered for the words on the assets (all free Google Fonts). */
export const REPURPOSE_FONTS = ['Space Grotesk', 'Manrope', 'Playfair Display', 'Fraunces', 'Poppins', 'Outfit'] as const;

export interface RepurposeColors {
  brand: string;
  ink: string;
  paper: string;
  accent: string;
}

export interface RepurposeInput {
  name: string;
  tagline?: string;
  website?: string;
  /**
   * The uploaded logo as a data URL, with its pixel size. `bg` is set when the
   * image has no transparency (its corner colour); `main` is its most-used
   * visible colour, so a transparent logo never lands on a surface it vanishes into.
   */
  logo: { href: string; w: number; h: number; bg?: string | null; main?: string | null };
  colors: RepurposeColors;
  font?: string;
  /** `brand`: brand-coloured backgrounds (default). `light`: the paper colour, for logos that only work on white. */
  style?: 'brand' | 'light';
}

const HEX = /^#[0-9A-F]{6}$/i;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f1 = (n: number) => Math.round(n * 10) / 10;
const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

function sat(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return 0;
  return (max - min) / (1 - Math.abs(2 * l - 1));
}

function dist(a: string, b: string): number {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return toHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
}

/**
 * The main colours of an image, most used first. `data` is RGBA pixels (as
 * from canvas `getImageData`). Transparent pixels are ignored; near-identical
 * colours are merged.
 */
export function paletteFromPixels(data: ArrayLike<number>, max = 6): string[] {
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i + 3 < data.length; i += 4) {
    if ((data[i + 3] ?? 255) < 128) continue;
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++;
    e.r += r;
    e.g += g;
    e.b += b;
    buckets.set(key, e);
  }
  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n).map((e) => ({ hex: toHex(e.r / e.n, e.g / e.n, e.b / e.n), n: e.n }));
  const out: string[] = [];
  for (const c of sorted) {
    if (out.every((o) => dist(o, c.hex) > 48)) out.push(c.hex);
    if (out.length >= max) break;
  }
  return out;
}

/** Brand, ink, paper and accent picked from an image palette, with safe defaults. */
export function repurposeColors(palette: string[]): RepurposeColors {
  const valid = palette.filter((p) => HEX.test(p)).map((p) => p.toUpperCase());
  const chroma = valid.filter((p) => sat(p) > 0.28 && luminance(p) > 0.02 && luminance(p) < 0.85);
  const brand = chroma[0] ?? valid.find((p) => luminance(p) < 0.5) ?? '#6D4AFF';
  const darks = valid.filter((p) => luminance(p) < 0.06 && p !== brand);
  const ink = darks[0] ?? '#16161A';
  const lights = valid.filter((p) => luminance(p) > 0.88);
  const paper = lights[0] ?? '#FFFFFF';
  const accent = chroma.find((p) => p !== brand && dist(p, brand) > 90) ?? mix(brand, '#FFFFFF', 0.55);
  return { brand, ink, paper, accent };
}

/** Text that fits a box: wraps to at most `maxLines`, shrinking from `big` to `small`. Widths are estimated. */
function fit(text: string, width: number, maxLines: number, big: number, small: number): { size: number; lines: string[] } {
  const words = text.split(/\s+/).filter(Boolean);
  for (let size = big; size >= small; size -= Math.max(1, Math.round(big / 24))) {
    const cw = size * 0.56;
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (next.length * cw > width && cur) {
        lines.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    if (lines.length <= maxLines && lines.every((l) => l.length * cw <= width)) return { size, lines };
  }
  const size = small;
  const per = Math.max(4, Math.floor(width / (size * 0.56)));
  const flat = text.slice(0, per * maxLines);
  const lines: string[] = [];
  for (let i = 0; i < flat.length; i += per) lines.push(flat.slice(i, i + per));
  return { size, lines: lines.slice(0, maxLines) };
}

/**
 * Draw the logo inside a box, keeping its proportions. When the logo has its
 * own solid background and the surface is a different colour, it sits on a
 * rounded tile of its own colour so it never looks cut out.
 */
function logoIn(i: RepurposeInput, surface: string, x: number, y: number, w: number, h: number, align: 'center' | 'left' = 'center'): string {
  const ar = i.logo.w / Math.max(1, i.logo.h);
  const lowContrast = !i.logo.bg && !!i.logo.main && contrast(i.logo.main, surface) < 2;
  const bg = i.logo.bg ?? (lowContrast ? (contrast(i.logo.main!, i.colors.paper) >= 2 ? i.colors.paper : onColor(i.logo.main!)) : null);
  const tiled = !!bg && dist(bg, surface) > 24;
  const pad = tiled ? Math.min(w, h) * 0.12 : 0;
  let lw = w - pad * 2;
  let lh = lw / ar;
  if (lh > h - pad * 2) {
    lh = h - pad * 2;
    lw = lh * ar;
  }
  const tw = lw + pad * 2;
  const th = lh + pad * 2;
  const tx = align === 'left' ? x : x + (w - tw) / 2;
  const ty = y + (h - th) / 2;
  const tile = tiled ? `<rect x="${f1(tx)}" y="${f1(ty)}" width="${f1(tw)}" height="${f1(th)}" rx="${f1(Math.min(tw, th) * 0.14)}" fill="${bg}"/>` : '';
  return `${tile}<image href="${esc(i.logo.href)}" x="${f1(tx + pad)}" y="${f1(ty + pad)}" width="${f1(lw)}" height="${f1(lh)}" preserveAspectRatio="xMidYMid meet"/>`;
}

/** Soft geometric shapes in the accent colour, used behind banners and posts. */
function shapes(c: RepurposeColors, surface: string, cx: number, cy: number, r: number): string {
  const a = dist(c.accent, surface) > 40 ? c.accent : mix(surface, onColor(surface), 0.18);
  return (
    `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${a}" fill-opacity="0.35"/>` +
    `<circle cx="${f1(cx + r * 0.55)}" cy="${f1(cy + r * 0.45)}" r="${f1(r * 0.55)}" fill="${a}" fill-opacity="0.55"/>` +
    `<circle cx="${f1(cx - r * 0.7)}" cy="${f1(cy - r * 0.6)}" r="${f1(r * 0.16)}" fill="${onColor(surface)}" fill-opacity="0.18"/>`
  );
}

/** One asset as a standalone SVG (the logo is embedded as an image). */
export function repurposeSVG(kind: RepurposeKind, i: RepurposeInput): string {
  const { w, h, title } = REPURPOSE_META[kind];
  const c = i.colors;
  const font = `font-family="'${esc(i.font || 'Space Grotesk')}', Manrope, Arial, sans-serif"`;
  const mono = `font-family="'Space Mono', ui-monospace, monospace"`;
  const surface = i.style === 'light' ? c.paper : c.brand;
  const on = onColor(surface);
  const tagline = (i.tagline || '').trim();
  const site = (i.website || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const name = i.name.trim() || 'Your brand';
  let body = '';

  if (kind === 'avatar') {
    // Platforms crop to a circle: keep the logo inside the middle 64%.
    const bg = i.logo.bg ?? c.paper;
    body = `<rect width="${w}" height="${h}" fill="${bg}"/>` + logoIn(i, bg, w * 0.18, h * 0.18, w * 0.64, h * 0.64);
  } else if (kind === 'post') {
    const head = tagline || `Say hello to ${name}.`;
    const t = fit(head, 880, 4, 112, 60);
    body =
      `<rect width="${w}" height="${h}" fill="${surface}"/>` +
      shapes(c, surface, 900, 930, 260) +
      logoIn(i, surface, 90, 80, 360, 150, 'left') +
      t.lines.map((l, k) => `<text x="90" y="${f1(420 + t.size * 0.85 + k * t.size * 1.05)}" ${font} font-weight="700" font-size="${t.size}" letter-spacing="${f1(-t.size * 0.025)}" fill="${on}">${esc(l)}</text>`).join('') +
      (site ? `<text x="90" y="1000" ${mono} font-size="28" letter-spacing="3" fill="${on}" fill-opacity="0.85">${esc(site.toUpperCase())}</text>` : '');
  } else if (kind === 'guidelines') {
    body = guidelinesBody(i, w, h, font, mono);
  } else {
    // Banners: everything inside the safe area (YouTube shows only the centre 1546 × 423 on every device;
    // LinkedIn and X cover the lower left with the profile picture).
    const safe = kind === 'youtube' ? { x: 507, y: 508, w: 1546, h: 423 } : kind === 'linkedin' ? { x: 470, y: 70, w: 1040, h: 256 } : { x: 380, y: 90, w: 1040, h: 300 };
    const logoW = safe.w * 0.34;
    const textX = safe.x + logoW + safe.w * 0.06;
    const textW = safe.x + safe.w - textX;
    const words = tagline || name;
    const t = fit(words, textW, 2, Math.round(safe.h * 0.26), Math.round(safe.h * 0.12));
    const block = t.lines.length * t.size * 1.08 + (site ? safe.h * 0.2 : 0);
    const top = safe.y + (safe.h - block) / 2;
    body =
      `<rect width="${w}" height="${h}" fill="${surface}"/>` +
      shapes(c, surface, w * 0.98, h * 0.04, h * 0.5) +
      logoIn(i, surface, safe.x, safe.y + safe.h * 0.12, logoW, safe.h * 0.76, 'left') +
      t.lines.map((l, k) => `<text x="${f1(textX)}" y="${f1(top + t.size * 0.85 + k * t.size * 1.08)}" ${font} font-weight="700" font-size="${t.size}" letter-spacing="${f1(-t.size * 0.02)}" fill="${on}">${esc(l)}</text>`).join('') +
      (site ? `<text x="${f1(textX)}" y="${f1(top + t.lines.length * t.size * 1.08 + safe.h * 0.14)}" ${mono} font-size="${f1(safe.h * 0.075)}" letter-spacing="2" fill="${on}" fill-opacity="0.8">${esc(site.toUpperCase())}</text>` : '');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"><title>${esc(name)} — ${esc(title)}</title>${body}</svg>`;
}

function swatch(x: number, y: number, label: string, hex: string, mono: string, font: string): string {
  const [r, g, b] = hexToRgb(hex);
  const on = onColor(hex);
  return (
    `<rect x="${x}" y="${y}" width="210" height="150" rx="16" fill="${hex}" stroke="#16161A" stroke-opacity="0.08"/>` +
    `<text x="${x + 18}" y="${y + 36}" ${font} font-weight="700" font-size="20" fill="${on}">${esc(label)}</text>` +
    `<text x="${x + 18}" y="${y + 112}" ${mono} font-size="17" fill="${on}">${hex}</text>` +
    `<text x="${x + 18}" y="${y + 134}" ${mono} font-size="14" fill="${on}" fill-opacity="0.8">RGB ${r} ${g} ${b}</text>`
  );
}

function guidelinesBody(i: RepurposeInput, w: number, h: number, font: string, mono: string): string {
  const c = i.colors;
  const name = i.name.trim() || 'Your brand';
  const fam = i.font || 'Space Grotesk';
  const ink = '#16161A';
  const muted = '#6B6880';
  const card = (x: number, y: number, cw: number, ch: number, fill = '#FFFFFF') => `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="20" fill="${fill}" stroke="#E7E4F0"/>`;
  const label = (x: number, y: number, t: string) => `<text x="${x}" y="${y}" ${mono} font-size="14" letter-spacing="2" fill="${muted}">${esc(t.toUpperCase())}</text>`;
  const cross = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="15" fill="#E5484D"/><path d="M${x - 6} ${y - 6}l12 12M${x + 6} ${y - 6}l-12 12" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
  const tick = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="15" fill="#19A974"/><path d="M${x - 7} ${y}l5 5 9-10" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const pairs = [
    { a: c.ink, b: c.paper },
    { a: onColor(c.brand), b: c.brand },
  ].map((p) => contrast(p.a, p.b));
  // Clear space: a quarter of the logo's height, shown as a dashed box around it.
  const lx = 80;
  const ly = 200;
  const lw = 680;
  const lh = 330;
  const ar = i.logo.w / Math.max(1, i.logo.h);
  let iw = 400;
  let ih = iw / ar;
  if (ih > 140) {
    ih = 140;
    iw = ih * ar;
  }
  const ix = lx + (lw - iw) / 2;
  const iy = ly + 64 + (lh - 64 - 52 - ih) / 2;
  const cs = ih * 0.25;
  const small = (x: number, y: number, extra: string) => {
    const sw = 150;
    const sh = Math.min(90, sw / ar);
    const sx = x + (200 - sw) / 2;
    const sy = y + (130 - sh) / 2;
    return `<image href="${esc(i.logo.href)}" x="${f1(sx)}" y="${f1(sy)}" width="${f1(sw)}" height="${f1(sh)}" preserveAspectRatio="${extra === 'stretch' ? 'none' : 'xMidYMid meet'}"${extra === 'rotate' ? ` transform="rotate(-14 ${f1(x + 100)} ${f1(y + 65)})"` : ''}${extra === 'faint' ? ' opacity="0.25"' : ''}/>`;
  };
  return (
    `<rect width="${w}" height="${h}" fill="#F7F6FB"/>` +
    `<rect width="${w}" height="12" fill="${c.brand}"/>` +
    `<text x="80" y="104" ${font} font-weight="700" font-size="52" letter-spacing="-1.5" fill="${ink}">${esc(name)}</text>` +
    `<text x="82" y="146" ${mono} font-size="17" letter-spacing="2" fill="${muted}">BRAND GUIDELINES · ONE PAGE</text>` +
    (i.tagline ? `<text x="${w - 80}" y="104" text-anchor="end" ${font} font-size="24" fill="${muted}">${esc(i.tagline.slice(0, 60))}</text>` : '') +
    // Logo and clear space
    card(lx, ly, lw, lh, i.logo.bg ?? c.paper) +
    label(lx + 28, ly + 40, 'Logo · clear space') +
    `<rect x="${f1(ix - cs)}" y="${f1(iy - cs)}" width="${f1(iw + cs * 2)}" height="${f1(ih + cs * 2)}" fill="none" stroke="${c.brand}" stroke-dasharray="8 7" stroke-width="2"/>` +
    `<image href="${esc(i.logo.href)}" x="${f1(ix)}" y="${f1(iy)}" width="${f1(iw)}" height="${f1(ih)}" preserveAspectRatio="xMidYMid meet"/>` +
    `<text x="${lx + lw - 28}" y="${ly + lh - 24}" text-anchor="end" ${font} font-size="16" fill="${muted}">Keep ¼ of the logo’s height clear on every side</text>` +
    // Logo on brand colour
    card(800, ly, 720, lh, c.brand) +
    `<text x="828" y="${ly + 40}" ${mono} font-size="14" letter-spacing="2" fill="${onColor(c.brand)}" fill-opacity="0.8">ON BRAND COLOUR</text>` +
    logoIn(i, c.brand, 860, ly + 70, 600, 220) +
    // Colours
    label(80, 584, 'Colours') +
    swatch(80, 604, 'Brand', c.brand, mono, font) +
    swatch(306, 604, 'Accent', c.accent, mono, font) +
    swatch(532, 604, 'Ink', c.ink, mono, font) +
    swatch(758, 604, 'Paper', c.paper, mono, font) +
    `<text x="80" y="790" ${font} font-size="16" fill="${muted}">Contrast: ink on paper ${pairs[0]!.toFixed(1)}:1 · text on brand ${pairs[1]!.toFixed(1)}:1 (4.5:1 or more reads well)</text>` +
    // Type
    card(1000, 584, 520, 210) +
    label(1028, 622, 'Typeface') +
    `<text x="1026" y="716" ${font} font-weight="700" font-size="84" fill="${ink}">Aa</text>` +
    `<text x="1150" y="680" ${font} font-weight="700" font-size="30" fill="${ink}">${esc(fam)}</text>` +
    `<text x="1150" y="716" ${font} font-size="18" fill="${muted}">Headlines bold, body regular.</text>` +
    `<text x="1150" y="744" ${font} font-size="18" fill="${muted}">Free on Google Fonts.</text>` +
    // Do and don't
    label(80, 850, 'Do / don’t') +
    `<g>${card(80, 866, 200, 130, i.logo.bg ?? c.paper)}${small(80, 866, '')}${tick(262, 884)}</g>` +
    `<g>${card(300, 866, 200, 130, i.logo.bg ?? c.paper)}${small(300, 866, 'stretch')}${cross(482, 884)}</g>` +
    `<g>${card(520, 866, 200, 130, i.logo.bg ?? c.paper)}${small(520, 866, 'rotate')}${cross(702, 884)}</g>` +
    `<g>${card(740, 866, 200, 130, i.logo.bg ?? c.paper)}${small(740, 866, 'faint')}${cross(922, 884)}</g>` +
    `<text x="980" y="900" ${font} font-size="18" fill="${ink}">Use the logo as supplied.</text>` +
    `<text x="980" y="930" ${font} font-size="18" fill="${muted}">Don’t stretch, rotate, fade or recolour it,</text>` +
    `<text x="980" y="958" ${font} font-size="18" fill="${muted}">or add shadows and outlines.</text>`
  );
}
