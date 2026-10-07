/**
 * Brand applications ("mockups"): the real logo placed on everyday objects —
 * a business card, a phone, a social post, a website, merch, a cup, a shop
 * sign and packaging. Each scene is a self-contained SVG built from the same
 * logo renderer, so what you see is exactly what you'd export.
 */
import { onColor, swatch } from './brand-system';
import { approxMeasure, iconSVG, logoSVG, type LogoIdentity, type Measurer } from './logo';
import { drawSymbol } from './symbols';

export const MOCKUP_KINDS = ['card', 'phone', 'social', 'web', 'tshirt', 'tote', 'cup', 'storefront', 'packaging'] as const;
export type MockupKind = (typeof MOCKUP_KINDS)[number];

export const MOCKUP_META: Record<MockupKind, { title: string; note: string }> = {
  card: { title: 'Business cards', note: 'Reversed logo on the front, contact details in the data font on the back.' },
  phone: { title: 'App icon', note: 'The icon has to work at 60px among other apps. Keep it bold and simple.' },
  social: { title: 'Social post', note: 'One idea, one line of display type, the logo as a quiet sign-off.' },
  web: { title: 'Website', note: 'Big headline, one primary action in brand colour, plenty of air.' },
  tshirt: { title: 'T-shirt', note: 'The mark alone on the chest; the full lockup on the back if you like.' },
  tote: { title: 'Tote bag', note: 'Large, single-colour print on natural canvas.' },
  cup: { title: 'Coffee cup', note: 'Brand-colour sleeve; the icon carries the brand at a glance.' },
  storefront: { title: 'Shop sign', note: 'Reversed logo on the fascia; brand colours on the awning.' },
  packaging: { title: 'Packaging', note: 'Lead with the logo, then the product; tint for the side panels.' },
};

export interface MockupInput {
  id: LogoIdentity;
  measure?: Measurer;
  /** Fonts for text in the scene. */
  fonts: { display: string; body: string; data: string };
  tagline: string;
  headline: string;
  subheadline: string;
  cta: string;
  domain: string;
  handle: string;
}

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);
const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

/** Place a rendered SVG (logo/icon) into a box, keeping its aspect ratio. */
function place(svg: string, x: number, y: number, w: number, h: number, align: 'xMidYMid' | 'xMinYMid' | 'xMaxYMid' = 'xMidYMid'): string {
  return svg.replace(/^<svg ([^>]*?)width="[^"]*" height="[^"]*"/, `<svg $1x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" preserveAspectRatio="${align} meet"`);
}

/** Wrap text to a pixel width using real font metrics (max 3 lines, ellipsis on overflow). */
function wrapTo(text: string, measure: Measurer, font: { family: string; weight: number; size: number }, maxWidth: number, maxLines = 3): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (measure.width(next, font) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1]!.replace(/[.,;:!?]?$/, '')}…`;
    return kept;
  }
  return lines;
}

const shadow = (kind: string) =>
  `<defs><filter id="sh-${kind}" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#16161A" flood-opacity="0.18"/></filter></defs>`;

export function mockupSVG(kind: MockupKind, m: MockupInput): string {
  const p = m.id.palette;
  const ink = swatch(p, 'ink');
  const brand = swatch(p, 'brand');
  const accent = swatch(p, 'accent');
  const tint = swatch(p, 'tint');
  const paper = swatch(p, 'paper');
  const light = logoSVG(m.id, { variant: 'light', measure: m.measure }).svg;
  const dark = logoSVG(m.id, { variant: 'dark', measure: m.measure }).svg;
  const mono = logoSVG(m.id, { variant: 'mono', measure: m.measure }).svg;
  const icon = iconSVG(m.id, { measure: m.measure }).svg;
  const D = `font-family="'${m.fonts.display}', sans-serif"`;
  const B = `font-family="'${m.fonts.body}', sans-serif"`;
  const M = `font-family="'${m.fonts.data}', monospace"`;
  const symbolOr = (x: number, y: number, s: number, color: string) =>
    m.id.symbol ? drawSymbol(m.id.symbol, `${m.id.name}:${m.id.seed}`, { brand: color, accent: color, ink: color, tint: color, paper: 'none' }, x, y, s) : place(icon, x, y, s, s);
  const W = 800;
  const H = 600;
  const meas = m.measure ?? approxMeasure;
  const dw = Math.max(...m.id.typography.display.weights);
  const fitSize = (text: string, maxWidth: number, maxLines: number, start: number, min: number) => {
    for (let size = start; size >= min; size -= 2) {
      const lines = wrapTo(text, meas, { family: m.fonts.display, weight: dw, size }, maxWidth, 99);
      if (lines.length <= maxLines) return { size, lines };
    }
    return { size: min, lines: wrapTo(text, meas, { family: m.fonts.display, weight: dw, size: min }, maxWidth, maxLines) };
  };
  let body = '';

  switch (kind) {
    case 'card': {
      body =
        `<rect width="${W}" height="${H}" fill="#E9E6EF"/>` +
        // back card (paper)
        `<g filter="url(#sh-${kind})" transform="rotate(5 550 370)"><rect x="340" y="250" width="420" height="240" rx="14" fill="${paper}"/>` +
        place(light, 370, 276, 200, 52, 'xMinYMid') +
        `<text x="370" y="390" ${D} font-weight="700" font-size="22" fill="${ink}">Your Name</text>` +
        `<text x="370" y="414" ${B} font-size="14" fill="${ink}" fill-opacity="0.7">Founder</text>` +
        `<text x="370" y="448" ${M} font-size="13" fill="${ink}">hello@${esc(m.domain)}</text>` +
        `<text x="370" y="468" ${M} font-size="13" fill="${ink}">@${esc(m.handle)}</text>` +
        `<path d="M720 250 H746 A14 14 0 0 1 760 264 V476 A14 14 0 0 1 746 490 H720 Z" fill="${brand}"/></g>` +
        // front card (ink)
        `<g filter="url(#sh-${kind})" transform="rotate(-5 250 210)"><rect x="40" y="90" width="420" height="240" rx="14" fill="${ink}"/>` +
        place(dark, 90, 150, 320, 120) +
        `</g>`;
      break;
    }
    case 'phone': {
      const icons = [accent, '#F2C14E', '#4FA3F7', '#F25F5C', '#7BC67E', '#A78BFA', '#FFB86B', '#5EC2B7', '#E879F9', '#94A3B8', '#FDE68A'];
      let grid = '';
      let k = 0;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const x = 300 + c * 54;
          const y = 120 + r * 70;
          if (r === 1 && c === 1) {
            grid += place(icon, x, y, 42, 42) + `<text x="${x + 21}" y="${y + 56}" text-anchor="middle" ${B} font-size="8.5" fill="#fff">${esc(m.id.name.slice(0, 10))}</text>`;
          } else {
            grid += `<rect x="${x}" y="${y}" width="42" height="42" rx="11" fill="${icons[k++ % icons.length]}" fill-opacity="0.85"/>`;
          }
        }
      }
      body =
        `<rect width="${W}" height="${H}" fill="${tint}"/>` +
        `<g filter="url(#sh-${kind})"><rect x="275" y="40" width="250" height="520" rx="40" fill="#111"/><rect x="285" y="50" width="230" height="500" rx="32" fill="${ink}"/></g>` +
        `<rect x="285" y="50" width="230" height="500" rx="32" fill="url(#wall-${kind})"/>` +
        `<defs><linearGradient id="wall-${kind}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${brand}" stop-opacity="0.9"/><stop offset="1" stop-color="${ink}"/></linearGradient></defs>` +
        `<text x="400" y="88" text-anchor="middle" ${D} font-weight="600" font-size="15" fill="#fff">9:41</text>` +
        grid +
        `<rect x="300" y="470" width="200" height="56" rx="18" fill="#fff" fill-opacity="0.18"/>` +
        // big icon callout
        `<g filter="url(#sh-${kind})">${place(icon, 560, 210, 150, 150)}</g>` +
        `<text x="635" y="392" text-anchor="middle" ${M} font-size="13" fill="${ink}">1024 × 1024</text>`;
      break;
    }
    case 'social': {
      const { size: ts, lines } = fitSize(m.tagline, 340, 3, 46, 28);
      body =
        `<rect width="${W}" height="${H}" fill="#EDEBF2"/>` +
        `<g filter="url(#sh-${kind})"><rect x="200" y="30" width="400" height="540" rx="18" fill="#fff"/></g>` +
        place(icon, 218, 46, 34, 34) +
        `<text x="262" y="62" ${B} font-weight="700" font-size="13" fill="#111">${esc(m.handle)}</text>` +
        `<text x="262" y="78" ${B} font-size="11" fill="#666">Sponsored</text>` +
        `<rect x="200" y="94" width="400" height="400" fill="${brand}"/>` +
        lines.map((l, i) => `<text x="230" y="${f1(150 + ts + i * ts * 1.12)}" ${D} font-weight="${dw}" font-size="${ts}" fill="${onColor(brand)}">${esc(l)}</text>`).join('') +
        place(m.id.style === 'stacked' ? light : dark.replace(/<rect width="100%" height="100%"[^>]*\/>/, ''), 230, 420, 160, 50, 'xMinYMid') +
        `<text x="218" y="522" ${B} font-size="20" fill="#111">♡  ◯  ➤</text>` +
        `<text x="218" y="552" ${B} font-size="12" fill="#111"><tspan font-weight="700">${esc(m.handle)}</tspan> ${esc(m.subheadline.slice(0, 48))}…</text>`;
      break;
    }
    case 'web': {
      const { size: hs, lines } = fitSize(m.headline, 390, 3, 44, 26);
      const sub = wrapTo(m.subheadline, meas, { family: m.fonts.body, weight: 400, size: 15 }, 390, 2);
      const afterHead = 180 + lines.length * hs * 1.12;
      body =
        `<rect width="${W}" height="${H}" fill="#E6E4EC"/>` +
        `<g filter="url(#sh-${kind})"><rect x="50" y="40" width="700" height="520" rx="14" fill="${paper}"/></g>` +
        `<rect x="50" y="40" width="700" height="40" rx="14" fill="#F1EFF5"/><rect x="50" y="66" width="700" height="14" fill="#F1EFF5"/>` +
        `<circle cx="74" cy="60" r="6" fill="#F25F5C"/><circle cx="94" cy="60" r="6" fill="#F2C14E"/><circle cx="114" cy="60" r="6" fill="#7BC67E"/>` +
        `<rect x="250" y="49" width="300" height="22" rx="11" fill="#fff"/><text x="400" y="65" text-anchor="middle" ${M} font-size="11" fill="#555">${esc(m.domain)}</text>` +
        place(light, 80, 96, 150, 40, 'xMinYMid') +
        `<text x="560" y="121" ${B} font-size="13" fill="${ink}">Product</text><text x="625" y="121" ${B} font-size="13" fill="${ink}">Pricing</text>` +
        `<rect x="680" y="104" width="50" height="26" rx="8" fill="${ink}"/><text x="705" y="121" text-anchor="middle" ${B} font-size="11" font-weight="700" fill="${paper}">Login</text>` +
        lines.map((l, i) => `<text x="80" y="${f1(180 + hs + i * hs * 1.12)}" ${D} font-weight="${dw}" font-size="${hs}" fill="${ink}">${esc(l)}</text>`).join('') +
        sub.map((l, i) => `<text x="80" y="${f1(afterHead + 30 + i * 22)}" ${B} font-size="15" fill="${ink}" fill-opacity="0.72">${esc(l)}</text>`).join('') +
        `<rect x="80" y="${f1(afterHead + 30 + sub.length * 22 + 8)}" width="170" height="46" rx="14" fill="${brand}"/>` +
        `<text x="165" y="${f1(afterHead + 30 + sub.length * 22 + 37)}" text-anchor="middle" ${B} font-weight="700" font-size="15" fill="${onColor(brand)}">${esc(m.cta.slice(0, 18))}</text>` +
        `<rect x="500" y="170" width="220" height="300" rx="22" fill="${tint}"/>` +
        symbolOr(545, 245, 130, brand);
      break;
    }
    case 'tshirt': {
      const shirt = ink;
      body =
        `<rect width="${W}" height="${H}" fill="${tint}"/>` +
        `<g filter="url(#sh-${kind})"><path d="M290 70 L350 50 Q400 90 450 50 L510 70 L610 140 L570 220 L520 195 L520 540 L280 540 L280 195 L230 220 L190 140 Z" fill="${shirt}"/></g>` +
        `<path d="M350 50 Q400 90 450 50" fill="none" stroke="#000" stroke-opacity="0.25" stroke-width="6"/>` +
        (m.id.symbol ? symbolOr(430, 170, 60, onColor(shirt) === '#FFFFFF' ? paper : ink) : place(dark.replace(/<rect width="100%" height="100%"[^>]*\/>/, ''), 330, 170, 140, 60));
      break;
    }
    case 'tote': {
      const canvas = '#EFE6D2';
      body =
        `<rect width="${W}" height="${H}" fill="#DCD6E6"/>` +
        `<path d="M330 170 Q330 70 400 70 Q470 70 470 170" fill="none" stroke="#D9CDB0" stroke-width="16"/>` +
        `<g filter="url(#sh-${kind})"><path d="M260 170 L540 170 L560 540 L240 540 Z" fill="${canvas}"/></g>` +
        place(mono.replace(new RegExp(ink, 'g'), brand), 280, 280, 240, 140);
      break;
    }
    case 'cup': {
      body =
        `<rect width="${W}" height="${H}" fill="${paper}"/>` +
        `<ellipse cx="400" cy="545" rx="130" ry="18" fill="#000" fill-opacity="0.08"/>` +
        `<path d="M300 150 L500 150 L470 540 L330 540 Z" fill="#fff" stroke="#E2E0EA" stroke-width="2"/>` +
        `<path d="M290 120 L510 120 L505 152 L295 152 Z" fill="${ink}"/><rect x="300" y="104" width="200" height="18" rx="6" fill="${ink}"/>` +
        `<path d="M311 270 L489 270 L479 410 L321 410 Z" fill="${brand}"/>` +
        place(icon, 362, 284, 76, 76) +
        `<text x="400" y="394" text-anchor="middle" ${M} font-size="11" letter-spacing="2" fill="${onColor(brand)}">${esc(m.domain.toUpperCase())}</text>`;
      break;
    }
    case 'storefront': {
      let stripes = '';
      for (let i = 0; i < 10; i++) stripes += `<path d="M${120 + i * 56} 200 L${176 + i * 56} 200 L${176 + i * 56} 250 Q${148 + i * 56} 272 ${120 + i * 56} 250 Z" fill="${i % 2 ? paper : brand}"/>`;
      body =
        `<rect width="${W}" height="${H}" fill="#CFE3F2"/>` +
        `<rect x="0" y="500" width="${W}" height="100" fill="#B9B4C4"/>` +
        `<rect x="100" y="80" width="600" height="420" fill="#F4F1EA"/>` +
        `<rect x="120" y="96" width="560" height="96" rx="6" fill="${ink}"/>` +
        place(dark.replace(/<rect width="100%" height="100%"[^>]*\/>/, ''), 150, 104, 500, 80) +
        stripes +
        `<rect x="140" y="290" width="240" height="200" fill="#9CC3DE" fill-opacity="0.7" stroke="${ink}" stroke-width="6"/>` +
        `<rect x="430" y="290" width="120" height="210" fill="${accent}" stroke="${ink}" stroke-width="6"/>` +
        `<circle cx="532" cy="400" r="5" fill="${ink}"/>` +
        `<rect x="580" y="300" width="90" height="70" rx="6" fill="#fff"/>` +
        place(icon, 600, 310, 50, 50);
      break;
    }
    case 'packaging':
    default: {
      body =
        `<rect width="${W}" height="${H}" fill="#EEEAF4"/>` +
        `<ellipse cx="400" cy="540" rx="230" ry="22" fill="#000" fill-opacity="0.08"/>` +
        // box: front + side + top
        `<path d="M220 200 L500 200 L500 530 L220 530 Z" fill="${brand}"/>` +
        `<path d="M500 200 L590 160 L590 490 L500 530 Z" fill="${tint}"/>` +
        `<path d="M220 200 L310 160 L590 160 L500 200 Z" fill="${paper}"/>` +
        place(dark.replace(/<rect width="100%" height="100%"[^>]*\/>/, ''), 240, 250, 240, 100) +
        `<text x="360" y="420" text-anchor="middle" ${B} font-size="16" fill="${onColor(brand)}">${esc(m.tagline.slice(0, 28))}</text>` +
        `<text x="360" y="500" text-anchor="middle" ${M} font-size="12" letter-spacing="2" fill="${onColor(brand)}" fill-opacity="0.8">${esc(m.domain.toUpperCase())}</text>` +
        `<g transform="translate(545 300) skewY(-24)">${place(icon, -34, 0, 68, 68)}</g>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"><title>${esc(m.id.name)} — ${MOCKUP_META[kind].title}</title>${shadow(kind)}${body}</svg>`;
}

/* ------------------------------ colour specs ------------------------------ */

export function hexToCmyk(hex: string): [number, number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return [0, 0, 0, 100];
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);
  return [c, m, y, k].map((v) => Math.round(v * 100)) as [number, number, number, number];
}
