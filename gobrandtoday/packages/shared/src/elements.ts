/**
 * The brand toolkit: the graphic elements a studio hands over beside the logo,
 * all generated from the brand's one graphic device (its symbol or mark) and
 * palette, following the rules in docs/DESIGN_RESEARCH.md:
 *
 * - one device per surface, cropped big (25–60% visible) rather than repeated small;
 * - quiet (product) and loud (campaign) colour modes with fixed proportions;
 * - icons drawn on a 24px grid in the logo's stroke character, one signature dot;
 * - type set big, two weights at most, the data font only for details.
 *
 * Every element is a self-contained SVG string, so it can be shown in the
 * brand book, downloaded on its own and packed into the ZIP.
 */
import { sceneContext, type MockupInput } from './mockups';
import type { SceneCtx } from './scenes';

export const ELEMENT_KINDS = ['poster', 'pattern', 'icons', 'seal', 'typewall', 'colourmodes', 'frames', 'dividers', 'progress'] as const;
export type ElementKind = (typeof ELEMENT_KINDS)[number];

export const ELEMENT_META: Record<ElementKind, { title: string; note: string; w: number; h: number }> = {
  poster: { title: 'Supergraphic', note: 'The device cropped big off two edges, the lockup in the opposite corner. For posters, covers and bags.', w: 600, h: 800 },
  pattern: { title: 'Pattern', note: 'The device on a grid, turned in quarter steps. For secondary surfaces: tissue, box insides, backgrounds.', w: 600, h: 400 },
  icons: { title: 'Icon set', note: 'Eight interface icons on a 24px grid with the logo’s stroke and a signature dot in the accent colour.', w: 600, h: 320 },
  seal: { title: 'Seal & sticker', note: 'A round seal with the name around the edge. For packaging, stickers and certificates.', w: 400, h: 400 },
  typewall: { title: 'Type wall', note: 'The name repeated in solid and outline rows. For merch, event walls and social headers.', w: 600, h: 400 },
  colourmodes: { title: 'Quiet & loud', note: 'Two colour modes: quiet for the product, loud for campaigns. Same five colours, different amounts.', w: 600, h: 320 },
  frames: { title: 'Photo frames', note: 'Shapes to crop photos into, so imagery feels part of the brand.', w: 600, h: 300 },
  dividers: { title: 'Dividers & details', note: 'Small rules and corners built from the device for documents, menus and slides.', w: 600, h: 240 },
  progress: { title: 'Data device', note: 'A segmented ring for progress, scores and stats, numbers in the data font.', w: 400, h: 400 },
};

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

/** Stroke character for icons, taken from the logo construction. */
function iconStroke(style: string, personalities: string[] = []): { width: number; cap: 'round' | 'square'; join: 'round' | 'miter' } {
  const sharp = ['terminal', 'editorial', 'monogram', 'heritage'].includes(style);
  const bold = ['stacked', 'playful', 'emblem'].includes(style) || personalities.some((p) => /bold|youthful|playful/i.test(p));
  return { width: bold ? 2.3 : 1.8, cap: sharp ? 'square' : 'round', join: sharp ? 'miter' : 'round' };
}

const ICONS: Array<[string, string]> = [
  ['Home', 'M4 11 L12 4 L20 11 M6 9.5 V20 H18 V9.5 M10 20 V14.5 H14 V20'],
  ['Search', 'M15.2 15.2 L20 20 M16.5 10.5 A6 6 0 1 1 4.5 10.5 A6 6 0 1 1 16.5 10.5 Z'],
  ['Bag', 'M5 8 H19 L18 20 H6 Z M9 8 V7 A3 3 0 0 1 15 7 V8'],
  ['Profile', 'M16 8 A4 4 0 1 1 8 8 A4 4 0 1 1 16 8 Z M4 20 C5.5 16 8.5 14 12 14 C15.5 14 18.5 16 20 20'],
  ['Saved', 'M12 20 C5 15 3 11.5 3 8.8 A4.3 4.3 0 0 1 12 7 A4.3 4.3 0 0 1 21 8.8 C21 11.5 19 15 12 20 Z'],
  ['Chat', 'M4 6 H20 V16 H10 L6 20 V16 H4 Z'],
  ['Rated', 'M12 3.5 L14.6 9 L20.5 9.6 L16 13.6 L17.3 19.5 L12 16.5 L6.7 19.5 L8 13.6 L3.5 9.6 L9.4 9 Z'],
  ['Alerts', 'M6 16 V11 A6 6 0 0 1 18 11 V16 L19.5 18 H4.5 Z M10 20.5 A2 2 0 0 0 14 20.5'],
];

type Build = (c: SceneCtx, m: MockupInput & { personalities?: string[]; year?: number }) => string;

const BUILD: Record<ElementKind, Build> = {
  poster: (c) => {
    const { size, lines } = c.fit(c.tagline, 470, 4, 76, 40);
    const clip = `pc-${c.uid}`;
    return (
      `<rect width="600" height="800" fill="${c.brand}"/>` +
      `<clipPath id="${clip}"><rect width="600" height="800"/></clipPath>` +
      `<g clip-path="url(#${clip})">${c.device(250, 400, 620, c.accent)}</g>` +
      c.place(c.logoOn(c.brand), 48, 44, 250, 80, 'xMinYMid') +
      lines.map((l, i) => `<text x="48" y="${f1(190 + size * 0.9 + i * size * 0.98)}" ${c.D} font-weight="${c.dw}" font-size="${size}" letter-spacing="${f1(-size * 0.03)}" fill="${c.on(c.brand)}">${c.esc(l)}</text>`).join('') +
      `<text x="48" y="752" ${c.M} font-size="14" letter-spacing="2" fill="${c.on(c.brand)}">${c.esc(c.domain.toUpperCase())}</text>`
    );
  },

  pattern: (c) => {
    let cells = '';
    const step = 100;
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 6; i++) {
        const big = (i + j) % 2 === 0;
        const s = big ? 64 : 32;
        const cx = i * step + 50;
        const cy = j * step + 50;
        const color = (i * 3 + j) % 5 === 0 ? c.accent : c.brand;
        cells += `<g transform="rotate(${((i + j) % 4) * 90} ${cx} ${cy})">${c.device(cx - s / 2, cy - s / 2, s, color)}</g>`;
      }
    }
    return `<rect width="600" height="400" fill="${c.tint}"/>${cells}`;
  },

  icons: (c, m) => {
    const st = iconStroke(m.id.style, m.personalities);
    return (
      `<rect width="600" height="320" fill="${c.paper}"/>` +
      ICONS.map(([label, d], i) => {
        const x = 30 + (i % 4) * 140;
        const y = 22 + Math.floor(i / 4) * 150;
        return (
          `<rect x="${x}" y="${y}" width="120" height="104" rx="18" fill="${c.tint}"/>` +
          `<g transform="translate(${x + 30} ${y + 12}) scale(2.5)"><path d="${d}" fill="none" stroke="${c.ink}" stroke-width="${st.width}" stroke-linecap="${st.cap}" stroke-linejoin="${st.join}"/><circle cx="20" cy="4" r="1.7" fill="${c.accent === c.tint ? c.brand : c.accent}"/></g>` +
          `<text x="${x + 60}" y="${y + 128}" text-anchor="middle" ${c.M} font-size="11" letter-spacing="1" fill="${c.ink}">${label.toUpperCase()}</text>`
        );
      }).join('')
    );
  },

  seal: (c, m) => {
    const ring = `sr-${c.uid}`;
    const text = `${c.name.toUpperCase()} · EST. ${m.year ?? new Date().getFullYear()} · ${c.domain.toUpperCase()} · `;
    return (
      `<rect width="400" height="400" fill="${c.tint}"/>` +
      `<circle cx="200" cy="200" r="178" fill="#FFFFFF"/>` +
      `<circle cx="200" cy="200" r="166" fill="${c.brand}"/>` +
      `<circle cx="200" cy="200" r="104" fill="none" stroke="${c.on(c.brand)}" stroke-opacity="0.5" stroke-width="2"/>` +
      `<path id="${ring}" d="M200 200 m-132 0 a132 132 0 1 1 264 0 a132 132 0 1 1 -264 0" fill="none"/>` +
      `<text ${c.M} font-size="19" letter-spacing="4" fill="${c.on(c.brand)}"><textPath href="#${ring}" textLength="820">${c.esc(text.slice(0, 64))}</textPath></text>` +
      c.device(136, 136, 128, c.on(c.brand))
    );
  },

  typewall: (c) => {
    const word = `${c.name} `.repeat(6);
    let rows = '';
    for (let i = 0; i < 6; i++) {
      const y = 70 + i * 66;
      const solid = i % 2 === 0;
      rows += `<text x="${-40 - (i % 3) * 60}" y="${y}" ${c.D} font-weight="${c.dw}" font-size="72" letter-spacing="-2" ${solid ? `fill="${c.on(c.brand)}"` : `fill="none" stroke="${c.on(c.brand)}" stroke-width="1.6"`}>${c.esc(word)}</text>`;
    }
    const clip = `tw-${c.uid}`;
    return `<rect width="600" height="400" fill="${c.brand}"/><clipPath id="${clip}"><rect width="600" height="400"/></clipPath><g clip-path="url(#${clip})">${rows}</g>`;
  },

  colourmodes: (c) => {
    const bar = (y: number, parts: Array<[string, number]>, label: string) => {
      let x = 30;
      let out = `<text x="30" y="${y - 14}" ${c.M} font-size="12" letter-spacing="1.5" fill="${c.ink}">${label}</text>`;
      for (const [hex, pct] of parts) {
        const w = (540 * pct) / 100;
        out += `<rect x="${f1(x)}" y="${y}" width="${f1(w)}" height="96" fill="${hex}" stroke="#000" stroke-opacity="0.06"/>`;
        if (pct >= 10) out += `<text x="${f1(x + 10)}" y="${y + 84}" ${c.M} font-size="11" fill="${c.on(hex)}">${pct}%</text>`;
        x += w;
      }
      return out;
    };
    return (
      `<rect width="600" height="320" fill="#FFFFFF"/>` +
      bar(44, [[c.paper, 70], [c.ink, 15], [c.brand, 10], [c.tint, 3], [c.accent, 2]], 'QUIET · PRODUCT, DOCUMENTS, UI') +
      bar(196, [[c.brand, 65], [c.ink, 20], [c.accent, 10], [c.paper, 5]], 'LOUD · CAMPAIGNS, PACKAGING, SOCIAL')
    );
  },

  frames: (c) => {
    const fill = (id: string) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.brand}"/><stop offset="1" stop-color="${c.accent}"/></linearGradient></defs>`;
    const g = `fg-${c.uid}`;
    const label = (x: number, t: string) => `<text x="${x}" y="284" text-anchor="middle" ${c.M} font-size="11" letter-spacing="1.5" fill="${c.ink}">${t}</text>`;
    return (
      `<rect width="600" height="300" fill="${c.paper}"/>` +
      fill(g) +
      `<path d="M40 250 V110 A70 70 0 0 1 180 110 V250 Z" fill="url(#${g})"/>` +
      label(110, 'ARCH') +
      `<rect x="230" y="40" width="140" height="210" rx="70" fill="url(#${g})"/>` +
      label(300, 'PILL') +
      `<path d="M420 40 H520 Q560 40 560 80 V250 H460 Q420 250 420 210 Z" fill="url(#${g})"/>` +
      label(490, 'LEAF') +
      c.device(470, 120, 40, c.on(c.brand)) +
      c.device(280, 125, 40, c.on(c.brand)) +
      c.device(90, 160, 40, c.on(c.brand))
    );
  },

  dividers: (c) => {
    let dots = '';
    for (let i = 0; i < 25; i++) dots += `<circle cx="${60 + i * 20}" cy="128" r="${i % 6 === 0 ? 4 : 2}" fill="${i % 6 === 0 ? c.brand : c.ink}" fill-opacity="${i % 6 === 0 ? 1 : 0.35}"/>`;
    return (
      `<rect width="600" height="240" fill="#FFFFFF"/>` +
      `<line x1="40" y1="60" x2="270" y2="60" stroke="${c.ink}" stroke-width="1.5"/><line x1="330" y1="60" x2="560" y2="60" stroke="${c.ink}" stroke-width="1.5"/>` +
      c.device(284, 44, 32, c.brand) +
      dots +
      `<path d="M40 186 V214 H68" fill="none" stroke="${c.brand}" stroke-width="3"/><path d="M560 186 V214 H532" fill="none" stroke="${c.brand}" stroke-width="3"/>` +
      `<text x="300" y="206" text-anchor="middle" ${c.M} font-size="12" letter-spacing="3" fill="${c.ink}">${c.esc(c.name.toUpperCase())} · NO. 001</text>`
    );
  },

  progress: (c) => {
    let segs = '';
    const n = 24;
    const done = 18;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2 + 0.04;
      const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2 - 0.04;
      const r = 140;
      const p = (a: number) => `${f1(200 + Math.cos(a) * r)} ${f1(200 + Math.sin(a) * r)}`;
      segs += `<path d="M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}" fill="none" stroke="${i < done ? c.brand : c.ink}" stroke-opacity="${i < done ? 1 : 0.12}" stroke-width="26"/>`;
    }
    return (
      `<rect width="400" height="400" fill="${c.paper}"/>` +
      segs +
      `<text x="200" y="214" text-anchor="middle" ${c.D} font-weight="${c.dw}" font-size="64" letter-spacing="-2" fill="${c.ink}">75%</text>` +
      `<text x="200" y="246" text-anchor="middle" ${c.M} font-size="13" letter-spacing="2" fill="${c.ink}" fill-opacity="0.7">OF THE WAY THERE</text>`
    );
  },
};

/** One toolkit element as a complete SVG. */
export function elementSVG(kind: ElementKind, m: MockupInput & { personalities?: string[]; year?: number }): string {
  const meta = ELEMENT_META[kind];
  const c = sceneContext(m, `el-${kind}`, { W: meta.w, H: meta.h });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${meta.w} ${meta.h}" width="${meta.w}" height="${meta.h}" role="img"><title>${c.esc(m.id.name)} — ${meta.title}</title>${BUILD[kind](c, m)}</svg>`;
}

/* ------------------------------ social kit -------------------------------- */

export const SOCIAL_ASSETS = {
  avatar: { title: 'Profile picture', size: '1080 × 1080', w: 1080, h: 1080 },
  post: { title: 'Launch post', size: '1080 × 1080', w: 1080, h: 1080 },
  x: { title: 'X header', size: '1500 × 500', w: 1500, h: 500 },
  linkedin: { title: 'LinkedIn banner', size: '1584 × 396', w: 1584, h: 396 },
  youtube: { title: 'YouTube banner', size: '2560 × 1440', w: 2560, h: 1440 },
} as const;
export type SocialAsset = keyof typeof SOCIAL_ASSETS;

/** Profile pictures and banners at each platform's exact size, content kept inside the safe areas. */
export function socialSVG(kind: SocialAsset, m: MockupInput): string {
  const { w, h, title } = SOCIAL_ASSETS[kind];
  const c = sceneContext(m, `so-${kind}`, { W: w, H: h });
  const clip = `soc-${c.uid}`;
  const crop = (x: number, y: number, s: number) => `<clipPath id="${clip}"><rect width="${w}" height="${h}"/></clipPath><g clip-path="url(#${clip})">${c.device(x, y, s, c.accent)}</g>`;
  let body: string;
  if (kind === 'avatar') {
    body = `<rect width="${w}" height="${h}" fill="${c.paper}"/>` + c.place(c.icon, 150, 150, 780, 780);
  } else if (kind === 'post') {
    const { size, lines } = c.fit(c.tagline, 860, 4, 120, 64);
    body =
      `<rect width="${w}" height="${h}" fill="${c.brand}"/>` +
      crop(560, 560, 760) +
      c.place(c.logoOn(c.brand), 90, 80, 420, 130, 'xMinYMid') +
      lines.map((l, i) => `<text x="90" y="${f1(330 + size * 0.9 + i * size)}" ${c.D} font-weight="${c.dw}" font-size="${size}" letter-spacing="${f1(-size * 0.03)}" fill="${c.on(c.brand)}">${c.esc(l)}</text>`).join('') +
      `<text x="90" y="1000" ${c.M} font-size="26" letter-spacing="4" fill="${c.on(c.brand)}">${c.esc(c.domain.toUpperCase())}</text>`;
  } else {
    // Banners: content inside the centre safe area (YouTube shows only the middle 1546 × 423 on every device).
    const safe = kind === 'youtube' ? { x: 507, y: 508, w: 1546, h: 423 } : { x: Math.round(w * 0.06), y: Math.round(h * 0.18), w: Math.round(w * 0.88), h: Math.round(h * 0.64) };
    const logoW = safe.w * 0.32;
    const { size, lines } = c.fit(c.tagline, safe.w * 0.56, 3, Math.round(safe.h * 0.24), Math.round(safe.h * 0.11));
    const ty = safe.y + safe.h / 2 - (lines.length * size) / 2 + size * 0.8;
    body =
      `<rect width="${w}" height="${h}" fill="${c.brand}"/>` +
      crop(safe.x + safe.w * 0.78, -h * 0.25, h * 1.5) +
      c.place(c.logoOn(c.brand), safe.x, safe.y + safe.h * 0.2, logoW, safe.h * 0.6, 'xMinYMid') +
      lines.map((l, i) => `<text x="${f1(safe.x + logoW + safe.w * 0.06)}" y="${f1(ty + i * size)}" ${c.D} font-weight="${c.dw}" font-size="${size}" letter-spacing="${f1(-size * 0.02)}" fill="${c.on(c.brand)}">${c.esc(l)}</text>`).join('');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"><title>${c.esc(m.id.name)} — ${title}</title>${body}</svg>`;
}

/** The website hero visual: brand colour, the device cropped big, the icon as a small tile. */
export function heroArtSVG(m: MockupInput): string {
  const c = sceneContext(m, 'hero', { W: 560, H: 560 });
  const clip = `ha-${c.uid}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 560" width="560" height="560" role="img"><title>${c.esc(m.id.name)}</title>` +
    `<rect width="560" height="560" fill="${c.brand}"/>` +
    `<clipPath id="${clip}"><rect width="560" height="560"/></clipPath><g clip-path="url(#${clip})">${c.device(180, 150, 520, c.accent)}</g>` +
    `<rect x="40" y="420" width="100" height="100" rx="26" fill="${c.paper}"/>` +
    c.place(c.icon, 48, 428, 84, 84) +
    `</svg>`
  );
}
