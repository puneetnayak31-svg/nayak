/**
 * Industry scenes: the objects a studio would actually show for this kind of
 * business (a woven neck label for a clothing brand, a mithai box for a sweet
 * shop, a serum bottle for skincare). Each scene draws into an 800×600 canvas
 * from a SceneCtx that mockups.ts builds from the real logo, palette and fonts.
 *
 * Scenes follow the same rules as the brand book (docs/DESIGN_RESEARCH.md):
 * the logo goes where the object's maker would put it, the brand's graphic
 * device is cropped big ("supergraphic") rather than scattered small, and
 * colour is used in blocks, not gradients.
 */
import { hash32, rng } from './text';

export interface SceneCtx {
  W: number;
  H: number;
  uid: string;
  ink: string;
  brand: string;
  accent: string;
  tint: string;
  paper: string;
  /** Logo on light, logo for dark surfaces (no background), app icon. */
  light: string;
  darkNoBg: string;
  icon: string;
  /** The logo in one colour. */
  monoIn: (color: string, surface?: string) => string;
  /** The right logo version for a surface of this colour. */
  logoOn: (fill: string) => string;
  /** Readable text colour on a fill. */
  on: (fill: string) => string;
  /** The brand's graphic device (symbol or mark) in one colour, size × size at (x, y). */
  device: (x: number, y: number, size: number, color: string) => string;
  place: (svg: string, x: number, y: number, w: number, h: number, align?: 'xMidYMid' | 'xMinYMid' | 'xMaxYMid') => string;
  fit: (text: string, maxWidth: number, maxLines: number, start: number, min: number) => { size: number; lines: string[] };
  esc: (s: string) => string;
  /** font-family attributes for display, body and data text. */
  D: string;
  B: string;
  M: string;
  dw: number;
  name: string;
  tagline: string;
  domain: string;
  handle: string;
  headline: string;
  cta: string;
}

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

/** Crop the graphic device big inside a clip shape: the supergraphic. */
function superGraphic(c: SceneCtx, key: string, clip: string, x: number, y: number, size: number, color: string, opacity = 1): string {
  const id = `sg-${c.uid}-${key}`;
  return `<clipPath id="${id}">${clip}</clipPath><g clip-path="url(#${id})" opacity="${opacity}">${c.device(x, y, size, color)}</g>`;
}

const floor = (cx: number, cy: number, rx: number, ry = 18, o = 0.1) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" fill-opacity="${o}"/>`;
const shade = (o: number) => `fill="#000" fill-opacity="${o}"`;
const shine = (o: number) => `fill="#FFFFFF" fill-opacity="${o}"`;

function barcode(seed: string, x: number, y: number, w: number, h: number, color: string): string {
  const r = rng(hash32(seed));
  let out = '';
  let cx = x;
  while (cx < x + w - 2) {
    const bw = 1 + Math.floor(r() * 3);
    if (r() > 0.35) out += `<rect x="${f1(cx)}" y="${y}" width="${bw}" height="${h}" fill="${color}"/>`;
    cx += bw + 1;
  }
  return out;
}

function qr(seed: string, x: number, y: number, size: number, color: string): string {
  const r = rng(hash32(seed));
  const n = 13;
  const s = size / n;
  let out = '';
  const finder = (fx: number, fy: number) =>
    `<rect x="${f1(x + fx * s)}" y="${f1(y + fy * s)}" width="${f1(s * 4)}" height="${f1(s * 4)}" fill="none" stroke="${color}" stroke-width="${f1(s * 0.9)}"/><rect x="${f1(x + (fx + 1.3) * s)}" y="${f1(y + (fy + 1.3) * s)}" width="${f1(s * 1.4)}" height="${f1(s * 1.4)}" fill="${color}"/>`;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const inFinder = (i < 5 && j < 5) || (i > n - 6 && j < 5) || (i < 5 && j > n - 6);
      if (!inFinder && r() > 0.52) out += `<rect x="${f1(x + i * s)}" y="${f1(y + j * s)}" width="${f1(s)}" height="${f1(s)}" fill="${color}"/>`;
    }
  }
  return out + finder(0.4, 0.4) + finder(n - 4.4, 0.4) + finder(0.4, n - 4.4);
}

/** A stand-up pouch (coffee, treats, snacks). */
function pouch(c: SceneCtx, key: string, x: number, y: number, w: number, h: number, fill: string, label: { text: string } | null): string {
  const d = `M${x} ${y + 18} Q${x} ${y} ${x + 18} ${y} H${x + w - 18} Q${x + w} ${y} ${x + w} ${y + 18} V${y + h - 14} Q${x + w} ${y + h} ${x + w - 16} ${y + h} H${x + 16} Q${x} ${y + h} ${x} ${y + h - 14} Z`;
  const panelY = y + h * 0.3;
  const panelH = h * 0.34;
  return (
    `<path d="${d}" fill="${fill}"/>` +
    superGraphic(c, key, `<path d="${d}"/>`, x + w * 0.35, y + h * 0.62, w * 0.95, c.on(fill), 0.14) +
    `<rect x="${x}" y="${y + 10}" width="${w}" height="14" ${shade(0.12)}/>` +
    `<path d="M${x + 6} ${y + 6} H${x + w - 6}" stroke="#000" stroke-opacity="0.18" stroke-width="2" stroke-dasharray="3 3"/>` +
    `<circle cx="${x + w / 2}" cy="${y + 52}" r="9" ${shade(0.18)}/><circle cx="${x + w / 2}" cy="${y + 52}" r="4" ${shine(0.35)}/>` +
    (label
      ? `<rect x="${x + 20}" y="${f1(panelY)}" width="${w - 40}" height="${f1(panelH)}" rx="10" fill="${c.paper}"/>` +
        c.place(c.light, x + 34, panelY + 14, w - 68, panelH * 0.55) +
        `<text x="${x + w / 2}" y="${f1(panelY + panelH - 16)}" text-anchor="middle" ${c.M} font-size="10" letter-spacing="2" fill="${c.ink}">${c.esc(label.text)}</text>`
      : c.place(c.logoOn(fill), x + 24, panelY, w - 48, panelH * 0.6)) +
    `<rect x="${x + 8}" y="${y + 30}" width="10" height="${h - 60}" rx="5" ${shine(0.12)}/>`
  );
}

export const SCENE_KINDS = [
  'letterhead',
  'coffeebag',
  'necklabel',
  'hangtag',
  'shoppingbag',
  'sweetbox',
  'candle',
  'dropper',
  'can',
  'bottle',
  'menu',
  'deliverybag',
  'dashboard',
  'paycard',
  'badge',
  'notebook',
  'waterbottle',
  'jewelbox',
  'mailer',
  'stickers',
  'banner',
  'signboard',
  'pettag',
] as const;
export type SceneKind = (typeof SCENE_KINDS)[number];

export const SCENE_META: Record<SceneKind, { title: string; note: string }> = {
  letterhead: { title: 'Letterhead & envelope', note: 'Logo top left, details in the data font, one band of brand colour at the foot.' },
  coffeebag: { title: 'Coffee bag', note: 'A paper label on a brand-colour pouch; the symbol cropped big behind it.' },
  necklabel: { title: 'Woven neck label', note: 'The single-colour logo, woven small. Size tab in brand colour.' },
  hangtag: { title: 'Hang tag', note: 'Brand colour on the front, barcode and size on the back.' },
  shoppingbag: { title: 'Shopping bag', note: 'The graphic device cropped across the bag; logo small and confident.' },
  sweetbox: { title: 'Mithai box', note: 'A lid people keep: logo centred, a ribbon band in the accent colour.' },
  candle: { title: 'Candle jar', note: 'A wrap label in brand colour; the name reads from across the room.' },
  dropper: { title: 'Serum bottle & carton', note: 'Clean paper label on dark glass; the carton carries the colour.' },
  can: { title: 'Cans', note: 'One can per flavour: the same layout, a different palette colour.' },
  bottle: { title: 'Bottles', note: 'A wrap label in brand colour over tinted glass.' },
  menu: { title: 'Menu', note: 'Logo up top, sections in the display font, prices in the data font.' },
  deliverybag: { title: 'Takeaway bag', note: 'Kraft paper, one-colour print and a sticker seal with the symbol.' },
  dashboard: { title: 'Product screen', note: 'The interface in brand colours: dark sidebar, one accent for actions.' },
  paycard: { title: 'Payment card', note: 'The symbol cropped big across the card; logo top left.' },
  badge: { title: 'ID badge & lanyard', note: 'Brand-colour lanyard, logo band at the top of the card.' },
  notebook: { title: 'Notebooks', note: 'A debossed logo on brand colour; the pattern on the second cover.' },
  waterbottle: { title: 'Water bottle', note: 'The logo runs up the bottle; one colour, no clutter.' },
  jewelbox: { title: 'Jewellery box', note: 'Dark box, light lining, the logo printed in the brand colour inside the lid.' },
  mailer: { title: 'Shipping box', note: 'The unboxing moment: branded tape, logo on the front, label on the side.' },
  stickers: { title: 'Sticker sheet', note: 'Badge, logo, icon and a burst: the cheapest brand-builders there are.' },
  banner: { title: 'Channel banner', note: 'Big tagline on brand colour; the icon as the profile picture.' },
  signboard: { title: 'Signboard', note: 'Brand-colour board, reversed logo, address in the data font.' },
  pettag: { title: 'Collar & tag', note: 'Brand-colour collar with the symbol engraved on the tag.' },
};

type Scene = (c: SceneCtx) => string;

export const SCENES: Record<SceneKind, Scene> = {
  letterhead: (c) => {
    let lines = '';
    for (let i = 0; i < 10; i++) lines += `<rect x="182" y="${178 + i * 17}" width="${i % 4 === 3 ? 170 : 270}" height="6" rx="3" fill="${c.ink}" fill-opacity="0.12"/>`;
    return (
      `<rect width="${c.W}" height="${c.H}" fill="#E9E6EF"/>` +
      `<g filter="url(#sh-${c.uid})" transform="rotate(-4 320 290)"><rect x="150" y="40" width="340" height="480" rx="4" fill="#FFFFFF"/>` +
      c.place(c.light, 180, 68, 150, 46, 'xMinYMid') +
      `<text x="462" y="86" text-anchor="end" ${c.M} font-size="9.5" fill="${c.ink}" fill-opacity="0.7">${c.esc(c.domain)}</text>` +
      `<text x="462" y="100" text-anchor="end" ${c.M} font-size="9.5" fill="${c.ink}" fill-opacity="0.7">@${c.esc(c.handle)}</text>` +
      `<text x="182" y="160" ${c.B} font-size="12" fill="${c.ink}">Hello,</text>` +
      lines +
      `<path d="M184 392 c18 -22 30 6 44 -8 s20 -14 30 4" fill="none" stroke="${c.ink}" stroke-width="2"/>` +
      `<text x="182" y="418" ${c.B} font-size="11" fill="${c.ink}" fill-opacity="0.75">Founder, ${c.esc(c.name)}</text>` +
      `<rect x="150" y="494" width="340" height="26" fill="${c.brand}"/>` +
      `<text x="320" y="511" text-anchor="middle" ${c.M} font-size="9" letter-spacing="2" fill="${c.on(c.brand)}">${c.esc(c.domain.toUpperCase())}</text></g>` +
      `<g filter="url(#sh-${c.uid})" transform="rotate(7 600 420)"><rect x="440" y="330" width="320" height="180" rx="6" fill="${c.paper}"/>` +
      `<path d="M440 334 L600 430 L760 334" fill="none" stroke="${c.ink}" stroke-opacity="0.14" stroke-width="2"/>` +
      c.place(c.icon, 460, 350, 40, 40) +
      `<rect x="736" y="330" width="24" height="180" fill="${c.brand}"/></g>`
    );
  },

  coffeebag: (c) =>
    `<rect width="${c.W}" height="${c.H}" fill="${c.tint}"/>` +
    floor(400, 520, 230) +
    `<g transform="rotate(-7 300 330)">${pouch(c, 'b2', 170, 150, 200, 350, c.ink, null)}</g>` +
    `<g filter="url(#sh-${c.uid})">${pouch(c, 'b1', 330, 100, 240, 410, c.brand, { text: 'WHOLE BEAN · 250 G' })}</g>`,

  necklabel: (c) => {
    let weave = '';
    for (let y = 176; y < 260; y += 3) weave += `<line x1="314" y1="${y}" x2="486" y2="${y}" stroke="${c.ink}" stroke-opacity="0.05"/>`;
    return (
      `<rect width="${c.W}" height="${c.H}" fill="${c.ink}"/>` +
      `<rect width="${c.W}" height="${c.H}" fill="url(#fab-${c.uid})"/>` +
      `<defs><pattern id="fab-${c.uid}" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6 L6 0" stroke="#FFFFFF" stroke-opacity="0.04"/></pattern></defs>` +
      `<ellipse cx="400" cy="40" rx="320" ry="250" fill="#000" fill-opacity="0.38"/>` +
      `<ellipse cx="400" cy="40" rx="320" ry="250" fill="none" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="40"/>` +
      `<ellipse cx="400" cy="40" rx="300" ry="232" fill="none" stroke="#000" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="5 4"/>` +
      `<g transform="translate(400 230) scale(1.5) translate(-400 -230)">` +
      `<g filter="url(#sh-${c.uid})"><rect x="310" y="168" width="180" height="96" rx="2" fill="${c.paper}"/></g>` +
      weave +
      `<path d="M318 172 V260 M482 172 V260" stroke="${c.ink}" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="3 3"/>` +
      c.place(c.monoIn(c.ink, c.paper), 328, 180, 144, 50) +
      `<text x="400" y="250" text-anchor="middle" ${c.M} font-size="7.5" letter-spacing="1.5" fill="${c.ink}" fill-opacity="0.75">100% COTTON · MADE IN INDIA</text>` +
      `<rect x="374" y="270" width="52" height="40" rx="2" fill="${c.brand}"/>` +
      `<text x="400" y="298" text-anchor="middle" ${c.D} font-weight="${c.dw}" font-size="20" fill="${c.on(c.brand)}">M</text></g>`
    );
  },

  hangtag: (c) => {
    const tag = (x: number, y: number) => `M${x + 30} ${y} H${x + 170} L${x + 200} ${y + 30} V${y + 320} H${x} V${y + 30} Z`;
    return (
      `<rect width="${c.W}" height="${c.H}" fill="#EFEAE2"/>` +
      `<path d="M520 0 C500 80 560 110 540 176" fill="none" stroke="#8A7F6A" stroke-width="2.5"/>` +
      `<g filter="url(#sh-${c.uid})" transform="rotate(9 540 320)"><path d="${tag(440, 160)}" fill="${c.paper}"/>` +
      `<circle cx="540" cy="190" r="9" fill="#EFEAE2" stroke="${c.ink}" stroke-opacity="0.2"/>` +
      `<text x="460" y="250" ${c.D} font-weight="${c.dw}" font-size="18" fill="${c.ink}">${c.esc(c.name)}</text>` +
      `<text x="460" y="276" ${c.M} font-size="10" fill="${c.ink}" fill-opacity="0.7">STYLE 001 · SIZE M</text>` +
      barcode(`${c.name}:tag`, 460, 400, 160, 46, c.ink) +
      `<text x="460" y="462" ${c.M} font-size="9" fill="${c.ink}">8 901234 567890</text></g>` +
      `<path d="M400 0 C380 90 430 120 400 182" fill="none" stroke="#8A7F6A" stroke-width="2.5"/>` +
      `<g filter="url(#sh-${c.uid})" transform="rotate(-6 400 330)"><path d="${tag(300, 150)}" fill="${c.brand}"/>` +
      superGraphic(c, 'tag', `<path d="${tag(300, 150)}"/>`, 330, 330, 260, c.on(c.brand), 0.14) +
      `<circle cx="400" cy="180" r="9" fill="#EFEAE2" stroke="${c.on(c.brand)}" stroke-opacity="0.4"/>` +
      c.place(c.logoOn(c.brand), 325, 236, 150, 84) +
      `<text x="400" y="440" text-anchor="middle" ${c.M} font-size="10" letter-spacing="2" fill="${c.on(c.brand)}">${c.esc(c.domain.toUpperCase())}</text></g>`
    );
  },

  shoppingbag: (c) => {
    const front = (x: number, y: number, w: number, h: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
    return (
      `<rect width="${c.W}" height="${c.H}" fill="#E6E2EC"/>` +
      floor(420, 530, 260) +
      // back bag
      `<path d="M500 200 Q500 130 560 130 Q620 130 620 200" fill="none" stroke="${c.ink}" stroke-width="5"/>` +
      `<g filter="url(#sh-${c.uid})"><rect x="460" y="200" width="200" height="310" fill="${c.paper}"/><path d="M660 200 L690 214 L690 518 L660 510 Z" fill="${c.paper}"/><path d="M660 200 L690 214 L690 518 L660 510 Z" ${shade(0.12)}/></g>` +
      c.place(c.icon, 530, 400, 60, 60) +
      // front bag
      `<path d="M260 160 Q260 70 345 70 Q430 70 430 160" fill="none" stroke="${c.ink}" stroke-width="6"/>` +
      `<g filter="url(#sh-${c.uid})"><rect x="200" y="160" width="290" height="360" fill="${c.brand}"/></g>` +
      superGraphic(c, 'bag', front(200, 160, 290, 360), 260, 300, 330, c.accent) +
      `<path d="M490 160 L530 176 L530 528 L490 520 Z" fill="${c.brand}"/><path d="M490 160 L530 176 L530 528 L490 520 Z" ${shade(0.18)}/>` +
      `<rect x="200" y="160" width="290" height="12" ${shade(0.1)}/>` +
      c.place(c.logoOn(c.brand), 226, 196, 238, 70)
    );
  },

  sweetbox: (c) => {
    const ladoo = '#F0A93B';
    const katli = '#EFE4CE';
    let sweets = '';
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 5; i++) {
        const k = r === 0 ? 0.86 : 1;
        const x = 400 + (i - 2) * 66 * k;
        const y = 272 + r * 40;
        const s = 26 * k;
        sweets += `<ellipse cx="${f1(x)}" cy="${f1(y + s * 0.55)}" rx="${f1(s * 0.95)}" ry="${f1(s * 0.42)}" fill="${c.paper}" stroke="#000" stroke-opacity="0.08"/>`;
        sweets +=
          (r + i) % 2 === 0
            ? `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s * 0.7)}" fill="${ladoo}"/><circle cx="${f1(x - s * 0.22)}" cy="${f1(y - s * 0.22)}" r="${f1(s * 0.18)}" ${shine(0.4)}/>`
            : `<path d="M${f1(x)} ${f1(y - s * 0.62)} L${f1(x + s * 0.8)} ${f1(y)} L${f1(x)} ${f1(y + s * 0.62)} L${f1(x - s * 0.8)} ${f1(y)} Z" fill="${katli}" stroke="#D9D9DE" stroke-width="2"/>`;
      }
    }
    return (
      `<rect width="${c.W}" height="${c.H}" fill="#F4EDE4"/>` +
      floor(400, 500, 260) +
      // lid leaning behind
      `<g filter="url(#sh-${c.uid})"><path d="M236 70 H564 L580 246 H220 Z" fill="${c.brand}"/></g>` +
      superGraphic(c, 'lid', `<path d="M236 70 H564 L580 246 H220 Z"/>`, 470, 110, 200, c.on(c.brand), 0.12) +
      `<rect x="472" y="70" width="30" height="176" fill="${c.accent}"/>` +
      c.place(c.logoOn(c.brand), 254, 112, 200, 92) +
      // tray
      `<path d="M226 248 H574 L612 334 H188 Z" fill="${c.paper}"/><path d="M226 248 H574 L612 334 H188 Z" ${shade(0.05)}/>` +
      sweets +
      // front face
      `<rect x="188" y="334" width="424" height="150" fill="${c.brand}"/><rect x="188" y="334" width="424" height="150" ${shade(0.12)}/>` +
      `<rect x="472" y="334" width="30" height="150" fill="${c.accent}"/>` +
      `<circle cx="487" cy="410" r="34" fill="${c.paper}"/>` +
      c.device(465, 388, 44, c.brand) +
      `<text x="214" y="404" ${c.M} font-size="11" letter-spacing="2" fill="${c.on(c.brand)}">500 G · FRESH TODAY</text>` +
      `<text x="214" y="424" ${c.B} font-size="12" fill="${c.on(c.brand)}" fill-opacity="0.85">${c.esc(c.tagline.slice(0, 30))}</text>`
    );
  },

  candle: (c) => {
    const flame = `<path d="M400 168 C412 186 414 200 400 210 C386 200 388 186 400 168 Z" fill="#F7B733"/><path d="M400 184 C406 194 406 202 400 206 C394 202 394 194 400 184 Z" fill="#FFF1B5"/>`;
    return (
      `<rect width="${c.W}" height="${c.H}" fill="${c.tint}"/>` +
      `<circle cx="400" cy="190" r="70" fill="#F7B733" fill-opacity="0.12"/>` +
      floor(420, 488, 210) +
      // lid on the side
      `<ellipse cx="610" cy="470" rx="92" ry="22" fill="${c.ink}"/><rect x="518" y="448" width="184" height="22" fill="${c.ink}"/><ellipse cx="610" cy="448" rx="92" ry="22" fill="${c.ink}"/><ellipse cx="610" cy="448" rx="92" ry="22" ${shine(0.1)}/>` +
      // jar
      `<g filter="url(#sh-${c.uid})"><rect x="300" y="210" width="200" height="270" rx="28" fill="#FFFFFF" fill-opacity="0.5"/></g>` +
      `<rect x="310" y="236" width="180" height="234" rx="22" fill="${c.paper}"/>` +
      `<ellipse cx="400" cy="238" rx="90" ry="12" ${shade(0.06)}/>` +
      `<line x1="400" y1="236" x2="400" y2="208" stroke="${c.ink}" stroke-width="3"/>` +
      flame +
      `<rect x="314" y="306" width="172" height="118" rx="6" fill="${c.brand}"/>` +
      c.place(c.logoOn(c.brand), 328, 318, 144, 66) +
      `<text x="400" y="408" text-anchor="middle" ${c.M} font-size="9" letter-spacing="2" fill="${c.on(c.brand)}">NO. 01 · 200 G</text>` +
      `<rect x="306" y="226" width="10" height="230" rx="5" ${shine(0.35)}/>`
    );
  },

  dropper: (c) => {
    const carton = `<rect x="440" y="140" width="170" height="350"/>`;
    return (
      `<rect width="${c.W}" height="${c.H}" fill="#EEE9F3"/>` +
      floor(440, 500, 240) +
      // carton
      `<g filter="url(#sh-${c.uid})"><rect x="440" y="140" width="170" height="350" fill="${c.brand}"/></g>` +
      superGraphic(c, 'carton', carton, 470, 330, 240, c.accent) +
      `<path d="M610 140 L640 126 L640 476 L610 490 Z" fill="${c.brand}"/><path d="M610 140 L640 126 L640 476 L610 490 Z" ${shade(0.2)}/>` +
      `<path d="M440 140 L470 126 H640 L610 140 Z" fill="${c.brand}"/><path d="M440 140 L470 126 H640 L610 140 Z" ${shine(0.15)}/>` +
      c.place(c.logoOn(c.brand), 456, 170, 138, 70) +
      // bottle
      `<path d="M300 150 Q300 126 320 126 Q340 126 340 150 V228 H300 Z" fill="${c.ink}"/>` +
      `<rect x="288" y="222" width="64" height="38" rx="6" fill="${c.ink}"/><rect x="288" y="222" width="64" height="38" rx="6" ${shine(0.12)}/>` +
      `<g filter="url(#sh-${c.uid})"><path d="M270 286 Q270 260 296 260 H344 Q370 260 370 286 V478 Q370 496 352 496 H288 Q270 496 270 478 Z" fill="${c.ink}" fill-opacity="0.9"/></g>` +
      `<rect x="278" y="336" width="84" height="120" rx="4" fill="${c.paper}"/>` +
      c.place(c.light, 284, 350, 72, 44) +
      `<text x="320" y="428" text-anchor="middle" ${c.M} font-size="7.5" letter-spacing="1.5" fill="${c.ink}">SERUM · 30 ML</text>` +
      `<rect x="278" y="276" width="7" height="200" rx="3" ${shine(0.18)}/>`
    );
  },

  can: (c) => {
    const can = (x: number, fill: string, key: string) => {
      const body = `<rect x="${x}" y="134" width="170" height="350" rx="16"/>`;
      return (
        `<g filter="url(#sh-${c.uid})"><rect x="${x}" y="134" width="170" height="350" rx="16" fill="${fill}"/></g>` +
        superGraphic(c, key, body, x + 30, 300, 220, c.on(fill), 0.16) +
        c.place(c.logoOn(fill), x + 16, 196, 138, 84) +
        `<text x="${x + 85}" y="456" text-anchor="middle" ${c.M} font-size="10" letter-spacing="2" fill="${c.on(fill)}">330 ML</text>` +
        `<rect x="${x}" y="134" width="170" height="350" rx="16" fill="url(#cyl-${c.uid})"/>` +
        `<ellipse cx="${x + 85}" cy="134" rx="85" ry="14" fill="#D6D6DC"/><ellipse cx="${x + 85}" cy="134" rx="66" ry="9" fill="#BDBDC5"/>`
      );
    };
    return (
      `<rect width="${c.W}" height="${c.H}" fill="${c.tint}"/>` +
      `<defs><linearGradient id="cyl-${c.uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.18"/><stop offset="0.3" stop-color="#FFF" stop-opacity="0.22"/><stop offset="0.6" stop-color="#FFF" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.2"/></linearGradient></defs>` +
      floor(400, 500, 250) +
      can(220, c.brand, 'c1') +
      can(410, c.accent, 'c2')
    );
  },

  bottle: (c) => {
    const shape = (cx: number) => `M${cx - 20} 96 H${cx + 20} V156 Q${cx + 70} 182 ${cx + 70} 236 V492 Q${cx + 70} 510 ${cx + 52} 510 H${cx - 52} Q${cx - 70} 510 ${cx - 70} 492 V236 Q${cx - 70} 182 ${cx - 20} 156 Z`;
    const bottle = (cx: number, liquid: string, label: string, key: string) => {
      const id = `bt-${c.uid}-${key}`;
      return (
        `<clipPath id="${id}"><path d="${shape(cx)}"/></clipPath>` +
        `<g filter="url(#sh-${c.uid})"><path d="${shape(cx)}" fill="#E4EEEA" fill-opacity="0.65"/></g>` +
        `<g clip-path="url(#${id})"><rect x="${cx - 80}" y="210" width="160" height="320" fill="${liquid}" fill-opacity="0.85"/>` +
        `<rect x="${cx - 80}" y="296" width="160" height="136" fill="${label}"/></g>` +
        c.place(c.logoOn(label), cx - 56, 316, 112, 66) +
        `<text x="${cx}" y="414" text-anchor="middle" ${c.M} font-size="9" letter-spacing="2" fill="${c.on(label)}">250 ML</text>` +
        `<rect x="${cx - 24}" y="72" width="48" height="28" rx="5" fill="${c.ink}"/>` +
        `<rect x="${cx - 60}" y="236" width="8" height="250" rx="4" ${shine(0.4)}/>`
      );
    };
    return `<rect width="${c.W}" height="${c.H}" fill="#EDEAF1"/>` + floor(400, 512, 230) + bottle(300, c.accent, c.brand, 'b1') + bottle(500, c.brand, c.ink, 'b2');
  },

  menu: (c) => {
    const section = (title: string, y: number) =>
      `<text x="240" y="${y}" ${c.D} font-weight="${c.dw}" font-size="17" fill="${c.ink}">${title}</text>` +
      [0, 1, 2]
        .map(
          (i) =>
            `<rect x="240" y="${y + 16 + i * 22}" width="${150 - i * 22}" height="6" rx="3" fill="${c.ink}" fill-opacity="0.18"/><text x="470" y="${y + 23 + i * 22}" text-anchor="end" ${c.M} font-size="10" fill="${c.ink}">₹${240 + i * 60 + y}</text>`,
        )
        .join('');
    return (
      `<rect width="${c.W}" height="${c.H}" fill="#E7DDCF"/>` +
      `<circle cx="660" cy="470" r="150" fill="#FFFFFF"/><circle cx="660" cy="470" r="108" fill="#F5F2EC"/><circle cx="640" cy="455" r="46" fill="${c.accent}" fill-opacity="0.75"/><circle cx="690" cy="490" r="26" fill="${c.brand}" fill-opacity="0.6"/>` +
      `<g filter="url(#sh-${c.uid})" transform="rotate(-4 360 300)"><rect x="210" y="36" width="290" height="512" rx="6" fill="${c.paper}"/>` +
      c.place(c.light, 240, 64, 230, 64) +
      `<rect x="240" y="146" width="230" height="3" fill="${c.brand}"/>` +
      section('Small plates', 186) +
      section('Mains', 296) +
      section('Desserts', 406) +
      `<text x="355" y="526" text-anchor="middle" ${c.M} font-size="9" letter-spacing="2" fill="${c.ink}" fill-opacity="0.7">${c.esc(c.domain.toUpperCase())}</text></g>`
    );
  },

  deliverybag: (c) => {
    const kraft = '#C9A57D';
    return (
      `<rect width="${c.W}" height="${c.H}" fill="${c.tint}"/>` +
      floor(410, 512, 220) +
      `<g filter="url(#sh-${c.uid})"><rect x="280" y="172" width="240" height="334" fill="${kraft}"/></g>` +
      `<path d="M520 172 L556 188 L556 512 L520 506 Z" fill="${kraft}"/><path d="M520 172 L556 188 L556 512 L520 506 Z" ${shade(0.16)}/>` +
      `<rect x="280" y="128" width="240" height="56" fill="${kraft}"/><rect x="280" y="128" width="240" height="56" ${shade(0.1)}/>` +
      `<line x1="280" y1="184" x2="520" y2="184" stroke="#000" stroke-opacity="0.15" stroke-width="2"/>` +
      `<circle cx="400" cy="184" r="36" fill="${c.brand}"/>` +
      c.device(378, 162, 44, c.on(c.brand)) +
      c.place(c.monoIn(c.ink, kraft), 306, 268, 188, 92) +
      `<text x="400" y="400" text-anchor="middle" ${c.B} font-size="13" fill="${c.ink}">${c.esc(c.tagline.slice(0, 34))}</text>` +
      `<text x="400" y="470" text-anchor="middle" ${c.M} font-size="10" letter-spacing="2" fill="${c.ink}" fill-opacity="0.8">${c.esc(c.domain.toUpperCase())}</text>`
    );
  },

  dashboard: (c) => {
    const pts = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [292 + i * 46, 340 - [10, 34, 22, 52, 46, 78, 70, 102][i]!] as const);
    const line = pts.map(([x, y]) => `${x},${y}`).join(' ');
    const area = `M292 360 L${pts.map(([x, y]) => `${x} ${y}`).join(' L')} L614 360 Z`;
    const kpis: Array<[string, string]> = [
      ['2,481', 'ACTIVE'],
      ['94%', 'ON TIME'],
      ['4.8', 'RATING'],
    ];
    return (
      `<rect width="${c.W}" height="${c.H}" fill="#E7E5EE"/>` +
      `<g filter="url(#sh-${c.uid})"><rect x="128" y="56" width="544" height="354" rx="18" fill="#1B1B1F"/></g>` +
      `<rect x="144" y="72" width="512" height="322" rx="6" fill="${c.paper}"/>` +
      `<path d="M84 410 H716 L690 442 H110 Z" fill="#C9C8D0"/><rect x="350" y="410" width="100" height="8" rx="4" fill="#B1B0BA"/>` +
      `<rect x="144" y="72" width="112" height="322" fill="${c.ink}"/>` +
      c.place(c.darkNoBg, 154, 84, 92, 30, 'xMinYMid') +
      [0, 1, 2, 3, 4].map((i) => `<rect x="156" y="${140 + i * 26}" width="${i === 0 ? 88 : 64}" height="${i === 0 ? 18 : 7}" rx="${i === 0 ? 6 : 3}" fill="${i === 0 ? c.brand : c.paper}" fill-opacity="${i === 0 ? 1 : 0.28}" transform="translate(0 ${i === 0 ? -6 : 0})"/>`).join('') +
      `<text x="274" y="104" ${c.D} font-weight="${c.dw}" font-size="15" fill="${c.ink}">Good morning</text>` +
      `<rect x="560" y="88" width="80" height="24" rx="8" fill="${c.brand}"/><text x="600" y="104" text-anchor="middle" ${c.B} font-weight="700" font-size="9.5" fill="${c.on(c.brand)}">${c.esc(c.cta.slice(0, 14))}</text>` +
      kpis
        .map(
          ([v, l], i) =>
            `<rect x="${274 + i * 124}" y="124" width="112" height="62" rx="8" fill="#FFFFFF" stroke="${c.ink}" stroke-opacity="0.08"/><text x="${286 + i * 124}" y="158" ${c.D} font-weight="${c.dw}" font-size="19" fill="${c.ink}">${v}</text><text x="${286 + i * 124}" y="176" ${c.M} font-size="7.5" letter-spacing="1" fill="${c.ink}" fill-opacity="0.6">${l}</text>`,
        )
        .join('') +
      `<rect x="274" y="198" width="360" height="178" rx="8" fill="#FFFFFF" stroke="${c.ink}" stroke-opacity="0.08"/>` +
      `<path d="${area}" fill="${c.brand}" fill-opacity="0.12"/><polyline points="${line}" fill="none" stroke="${c.brand}" stroke-width="3" stroke-linejoin="round"/>` +
      `<circle cx="${pts[7]![0]}" cy="${pts[7]![1]}" r="5" fill="${c.accent}" stroke="#FFFFFF" stroke-width="2"/>`
    );
  },

  paycard: (c) => {
    const card = (x: number, y: number) => `<rect x="${x}" y="${y}" width="340" height="214" rx="18"/>`;
    return (
      `<rect width="${c.W}" height="${c.H}" fill="#ECE9F1"/>` +
      `<g filter="url(#sh-${c.uid})" transform="rotate(8 520 330)"><rect x="350" y="220" width="340" height="214" rx="18" fill="${c.ink}"/>` +
      c.place(c.icon, 620, 240, 48, 48) +
      `<text x="374" y="404" ${c.M} font-size="13" letter-spacing="2" fill="${c.paper}" fill-opacity="0.8">•••• 7310</text></g>` +
      `<g filter="url(#sh-${c.uid})" transform="rotate(-7 360 280)"><rect x="200" y="170" width="340" height="214" rx="18" fill="${c.brand}"/>` +
      superGraphic(c, 'card', card(200, 170), 360, 150, 300, c.accent) +
      c.place(c.logoOn(c.brand), 222, 190, 150, 44, 'xMinYMid') +
      `<rect x="226" y="262" width="46" height="34" rx="6" fill="#D8B45A"/><path d="M226 279 H272 M242 262 V296 M256 262 V296" stroke="#000" stroke-opacity="0.2"/>` +
      `<path d="M292 266 q8 13 0 26 M302 260 q12 19 0 38" fill="none" stroke="${c.on(c.brand)}" stroke-width="2.5" stroke-linecap="round"/>` +
      `<text x="226" y="350" ${c.M} font-size="15" letter-spacing="2" fill="${c.on(c.brand)}">•••• •••• •••• 4821</text></g>`
    );
  },

  badge: (c) => (
    `<rect width="${c.W}" height="${c.H}" fill="${c.tint}"/>` +
    `<path d="M350 0 L384 186 M450 0 L416 186" stroke="${c.brand}" stroke-width="20"/>` +
    `<path d="M350 0 L384 186 M450 0 L416 186" stroke="${c.on(c.brand)}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="8 10"/>` +
    `<rect x="378" y="178" width="44" height="22" rx="4" fill="#9A99A6"/>` +
    `<g filter="url(#sh-${c.uid})"><rect x="290" y="196" width="220" height="330" rx="16" fill="#FFFFFF"/></g>` +
    `<path d="M290 212 Q290 196 306 196 H494 Q510 196 510 212 V270 H290 Z" fill="${c.brand}"/>` +
    c.place(c.logoOn(c.brand), 310, 206, 180, 54) +
    `<circle cx="400" cy="330" r="48" fill="${c.tint}"/><circle cx="400" cy="316" r="17" fill="${c.ink}" fill-opacity="0.35"/><path d="M366 368 Q400 336 434 368 Z" fill="${c.ink}" fill-opacity="0.35"/>` +
    `<text x="400" y="408" text-anchor="middle" ${c.D} font-weight="${c.dw}" font-size="20" fill="${c.ink}">Your Name</text>` +
    `<text x="400" y="430" text-anchor="middle" ${c.B} font-size="12" fill="${c.ink}" fill-opacity="0.7">Team ${c.esc(c.name)}</text>` +
    qr(`${c.name}:badge`, 372, 448, 56, c.ink)
  ),

  notebook: (c) => (
    `<rect width="${c.W}" height="${c.H}" fill="#E8E5EE"/>` +
    floor(420, 520, 250) +
    `<g filter="url(#sh-${c.uid})" transform="rotate(7 560 320)"><rect x="430" y="140" width="250" height="350" rx="10" fill="${c.paper}"/>` +
    superGraphic(c, 'nb2', `<rect x="430" y="140" width="250" height="350" rx="10"/>`, 470, 260, 300, c.brand) +
    `</g>` +
    `<g filter="url(#sh-${c.uid})"><rect x="200" y="110" width="260" height="370" rx="10" fill="${c.brand}"/></g>` +
    `<rect x="200" y="110" width="22" height="370" ${shade(0.15)}/>` +
    `<rect x="420" y="110" width="12" height="370" fill="${c.ink}" fill-opacity="0.7"/>` +
    c.place(c.monoIn(c.on(c.brand), c.brand), 240, 248, 170, 86) +
    `<text x="325" y="444" text-anchor="middle" ${c.M} font-size="9" letter-spacing="2" fill="${c.on(c.brand)}" fill-opacity="0.75">NOTES · 2026</text>` +
    `<g transform="rotate(-28 300 520)"><rect x="140" y="510" width="300" height="16" rx="3" fill="${c.accent}"/><path d="M440 510 L470 518 L440 526 Z" fill="#E9D7B8"/><path d="M462 516 L470 518 L462 520 Z" fill="${c.ink}"/></g>`
  ),

  waterbottle: (c) => (
    `<rect width="${c.W}" height="${c.H}" fill="${c.tint}"/>` +
    floor(400, 530, 120, 14) +
    `<path d="M370 66 Q370 30 400 30 Q430 30 430 66" fill="none" stroke="${c.ink}" stroke-width="10"/>` +
    `<rect x="356" y="62" width="88" height="58" rx="14" fill="${c.ink}"/>` +
    `<g filter="url(#sh-${c.uid})"><rect x="336" y="112" width="128" height="414" rx="44" fill="${c.brand}"/></g>` +
    superGraphic(c, 'wb', `<rect x="336" y="112" width="128" height="414" rx="44"/>`, 340, 400, 180, c.accent) +
    `<g transform="rotate(-90 400 300)">${c.place(c.logoOn(c.brand), 240, 270, 300, 60)}</g>` +
    `<rect x="350" y="140" width="12" height="360" rx="6" ${shine(0.22)}/>`
  ),

  jewelbox: (c) => (
    `<rect width="${c.W}" height="${c.H}" fill="#EFE9E4"/>` +
    floor(420, 488, 230) +
    // pouch
    `<g filter="url(#sh-${c.uid})"><path d="M560 280 Q600 270 640 280 L664 470 Q600 486 536 470 Z" fill="${c.brand}"/></g>` +
    `<path d="M560 296 Q600 286 640 296" fill="none" stroke="${c.accent}" stroke-width="3"/>` +
    c.device(578, 360, 44, c.on(c.brand)) +
    // box
    `<g filter="url(#sh-${c.uid})"><rect x="250" y="150" width="260" height="170" rx="14" fill="${c.ink}"/></g>` +
    `<rect x="266" y="166" width="228" height="140" rx="8" fill="${c.tint}"/>` +
    c.place(c.monoIn(c.brand, c.tint), 290, 196, 180, 70) +
    `<rect x="250" y="320" width="260" height="150" rx="14" fill="${c.ink}"/><rect x="250" y="320" width="260" height="20" ${shine(0.08)}/>` +
    `<rect x="290" y="346" width="180" height="70" rx="34" fill="${c.tint}"/><rect x="290" y="372" width="180" height="16" ${shade(0.18)}/>` +
    `<circle cx="380" cy="350" r="30" fill="none" stroke="#D4AF61" stroke-width="9"/>` +
    `<path d="M380 300 L394 316 L380 332 L366 316 Z" fill="#FFFFFF" stroke="${c.accent}" stroke-width="2"/>`
  ),

  mailer: (c) => {
    const tapeText = `${c.handle.toUpperCase()} · `.repeat(6);
    return (
      `<rect width="${c.W}" height="${c.H}" fill="#E8E5EE"/>` +
      floor(410, 510, 260) +
      `<g filter="url(#sh-${c.uid})"><path d="M200 270 H520 V488 H200 Z" fill="${c.brand}"/></g>` +
      `<path d="M520 270 L610 226 V444 L520 488 Z" fill="${c.brand}"/><path d="M520 270 L610 226 V444 L520 488 Z" ${shade(0.2)}/>` +
      `<path d="M200 270 L290 226 H610 L520 270 Z" fill="${c.brand}"/><path d="M200 270 L290 226 H610 L520 270 Z" ${shine(0.18)}/>` +
      superGraphic(c, 'side', `<path d="M520 270 L610 226 V444 L520 488 Z"/>`, 500, 300, 160, c.accent, 0.9) +
      // tape across the top and down the front
      `<path d="M335 270 L425 226 H465 L375 270 Z" fill="${c.ink}"/><rect x="335" y="270" width="40" height="70" fill="${c.ink}"/>` +
      `<clipPath id="tp-${c.uid}"><path d="M335 270 L425 226 H465 L375 270 Z"/></clipPath>` +
      `<g clip-path="url(#tp-${c.uid})"><text x="320" y="262" ${c.M} font-size="8" letter-spacing="1.5" fill="${c.paper}" transform="rotate(-26 400 248)">${c.esc(tapeText)}</text></g>` +
      c.place(c.logoOn(c.brand), 220, 350, 172, 80, 'xMinYMid') +
      `<rect x="408" y="408" width="100" height="66" rx="4" fill="#FFFFFF"/>` +
      barcode(`${c.name}:ship`, 416, 440, 84, 24, c.ink) +
      `<text x="416" y="428" ${c.M} font-size="7" fill="${c.ink}">@${c.esc(c.handle.slice(0, 16))}</text>`
    );
  },

  stickers: (c) => {
    const ring = `circ-${c.uid}`;
    const ringText = `${c.name.toUpperCase()} · ${c.tagline.toUpperCase()} · `;
    let star = '';
    for (let i = 0; i < 24; i++) {
      const r = i % 2 ? 50 : 72;
      const a = (i / 24) * Math.PI * 2;
      star += `${i ? 'L' : 'M'}${f1(330 + Math.cos(a) * r)} ${f1(460 + Math.sin(a) * r)} `;
    }
    return (
      `<rect width="${c.W}" height="${c.H}" fill="${c.tint}"/>` +
      // circle badge with text on a path
      `<g filter="url(#sh-${c.uid})"><circle cx="220" cy="220" r="122" fill="#FFFFFF"/></g><circle cx="220" cy="220" r="112" fill="${c.brand}"/>` +
      `<path id="${ring}" d="M220 220 m-84 0 a84 84 0 1 1 168 0 a84 84 0 1 1 -168 0" fill="none"/>` +
      `<text ${c.M} font-size="13" letter-spacing="2.5" fill="${c.on(c.brand)}"><textPath href="#${ring}">${c.esc(ringText.slice(0, 54))}</textPath></text>` +
      c.device(184, 184, 72, c.on(c.brand)) +
      // logo sticker
      `<g filter="url(#sh-${c.uid})" transform="rotate(-5 580 150)"><rect x="410" y="84" width="340" height="132" rx="66" fill="#FFFFFF"/></g>` +
      `<g transform="rotate(-5 580 150)">${c.place(c.light, 450, 106, 260, 88)}</g>` +
      // icon sticker
      `<g filter="url(#sh-${c.uid})" transform="rotate(8 580 360)"><rect x="500" y="280" width="164" height="164" rx="44" fill="#FFFFFF"/>${c.place(c.icon, 510, 290, 144, 144)}</g>` +
      // burst
      `<g filter="url(#sh-${c.uid})"><path d="${star}Z" fill="${c.accent}"/></g>` +
      `<text x="330" y="468" text-anchor="middle" ${c.D} font-weight="${c.dw}" font-size="24" fill="${c.on(c.accent)}">NEW</text>` +
      // pill
      `<g transform="rotate(-3 560 520)"><rect x="440" y="490" width="300" height="56" rx="28" fill="${c.ink}"/><text x="590" y="524" text-anchor="middle" ${c.B} font-weight="700" font-size="15" fill="${c.paper}">${c.esc(c.tagline.slice(0, 30))}</text></g>`
    );
  },

  banner: (c) => {
    const { size, lines } = c.fit(c.tagline, 420, 2, 34, 22);
    return (
      `<rect width="${c.W}" height="${c.H}" fill="#E6E4EC"/>` +
      `<g filter="url(#sh-${c.uid})"><rect x="40" y="40" width="720" height="520" rx="14" fill="#FFFFFF"/></g>` +
      `<rect x="40" y="40" width="720" height="40" rx="14" fill="#F1EFF5"/><rect x="40" y="66" width="720" height="14" fill="#F1EFF5"/>` +
      `<circle cx="64" cy="60" r="6" fill="#F25F5C"/><circle cx="84" cy="60" r="6" fill="#F2C14E"/><circle cx="104" cy="60" r="6" fill="#7BC67E"/>` +
      `<rect x="40" y="80" width="720" height="176" fill="${c.brand}"/>` +
      superGraphic(c, 'art', `<rect x="40" y="80" width="720" height="176"/>`, 520, 40, 300, c.accent) +
      lines.map((l, i) => `<text x="80" y="${f1(140 + i * size * 1.1)}" ${c.D} font-weight="${c.dw}" font-size="${size}" fill="${c.on(c.brand)}">${c.esc(l)}</text>`).join('') +
      `<circle cx="116" cy="290" r="48" fill="#FFFFFF"/>` +
      `<clipPath id="av-${c.uid}"><circle cx="116" cy="290" r="42"/></clipPath><g clip-path="url(#av-${c.uid})">${c.place(c.icon, 74, 248, 84, 84)}</g>` +
      `<text x="182" y="294" ${c.D} font-weight="${c.dw}" font-size="22" fill="#111">${c.esc(c.name)}</text>` +
      `<text x="182" y="316" ${c.M} font-size="11" fill="#666">@${c.esc(c.handle)}</text>` +
      `<rect x="630" y="276" width="100" height="34" rx="17" fill="#111"/><text x="680" y="298" text-anchor="middle" ${c.B} font-weight="700" font-size="12" fill="#FFF">Subscribe</text>` +
      [0, 1, 2, 3]
        .map((i) => {
          const fill = [c.ink, c.brand, c.accent, c.tint][i]!;
          return `<rect x="${70 + i * 168}" y="360" width="152" height="86" rx="8" fill="${fill}"/>${c.device(124 + i * 168, 383, 40, c.on(fill))}<rect x="${70 + i * 168}" y="458" width="${130 - i * 10}" height="7" rx="3" fill="#111" fill-opacity="0.5"/><rect x="${70 + i * 168}" y="474" width="80" height="6" rx="3" fill="#111" fill-opacity="0.25"/>`;
        })
        .join('')
    );
  },

  signboard: (c) => (
    `<rect width="${c.W}" height="${c.H}" fill="#D7E7F2"/>` +
    `<rect y="470" width="${c.W}" height="130" fill="#A9C99A"/>` +
    `<rect x="236" y="120" width="16" height="380" fill="${c.ink}"/><rect x="236" y="120" width="360" height="14" fill="${c.ink}"/>` +
    `<path d="M300 134 V176 M540 134 V176" stroke="#7C7B86" stroke-width="3"/>` +
    `<g filter="url(#sh-${c.uid})"><rect x="276" y="172" width="290" height="190" rx="8" fill="${c.brand}"/></g>` +
    c.place(c.logoOn(c.brand), 300, 196, 242, 96) +
    `<rect x="276" y="312" width="290" height="50" fill="${c.ink}" fill-opacity="0.18"/>` +
    `<text x="421" y="343" text-anchor="middle" ${c.M} font-size="13" letter-spacing="2" fill="${c.on(c.brand)}">${c.esc(c.domain.toUpperCase())}</text>` +
    `<rect x="296" y="378" width="250" height="44" rx="6" fill="${c.paper}"/><text x="421" y="406" text-anchor="middle" ${c.D} font-weight="${c.dw}" font-size="16" fill="${c.ink}">Open Mon–Sat</text>`
  ),

  pettag: (c) => (
    `<rect width="${c.W}" height="${c.H}" fill="#F1EAE0"/>` +
    floor(380, 520, 260) +
    `<g filter="url(#sh-${c.uid})"><path d="M120 250 Q380 430 640 250" fill="none" stroke="${c.brand}" stroke-width="46" stroke-linecap="round"/></g>` +
    `<path d="M120 250 Q380 430 640 250" fill="none" stroke="${c.on(c.brand)}" stroke-opacity="0.45" stroke-width="2" stroke-dasharray="6 6" transform="translate(0 -14)"/>` +
    `<path d="M120 250 Q380 430 640 250" fill="none" stroke="${c.on(c.brand)}" stroke-opacity="0.45" stroke-width="2" stroke-dasharray="6 6" transform="translate(0 14)"/>` +
    `<rect x="560" y="236" width="56" height="62" rx="8" fill="none" stroke="#B9B8C2" stroke-width="8" transform="rotate(-24 588 267)"/>` +
    `<circle cx="380" cy="344" r="14" fill="none" stroke="#B9B8C2" stroke-width="6"/>` +
    `<g filter="url(#sh-${c.uid})"><circle cx="380" cy="426" r="70" fill="${c.accent}"/></g>` +
    `<circle cx="380" cy="426" r="70" fill="url(#metal-${c.uid})"/>` +
    `<defs><linearGradient id="metal-${c.uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF" stop-opacity="0.45"/><stop offset="0.5" stop-color="#FFF" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.15"/></linearGradient></defs>` +
    c.device(352, 382, 56, c.on(c.accent)) +
    `<text x="380" y="466" text-anchor="middle" ${c.D} font-weight="${c.dw}" font-size="14" fill="${c.on(c.accent)}">${c.esc(c.name.slice(0, 14))}</text>`
  ),
};
