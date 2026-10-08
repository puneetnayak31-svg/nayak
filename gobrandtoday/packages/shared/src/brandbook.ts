/**
 * The brand book as one self-contained HTML file: opens offline in any
 * browser, prints to PDF page by page, and can be emailed to a printer or a
 * developer. The browser passes in the SVGs (rendered with real font
 * metrics); fonts load from Google Fonts.
 */
import { contrast, googleFontsHref, hexToRgb, onColor, swatch } from './brand-system';
import { hexToCmyk } from './mockups';
import type { BrandKit } from './types';

const h = (s: string) => s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface BookArt {
  title: string;
  note: string;
  svg: string;
}

export interface BookInput {
  kit: BrandKit;
  domain: string;
  handle: string;
  version?: number;
  sectorLabel?: string;
  logos: { light: string; dark: string; mono: string; icon: string };
  mockups: BookArt[];
  elements: BookArt[];
  year?: number;
}

export function brandBookHTML(b: BookInput): string {
  const k = b.kit;
  const p = k.identity.palette;
  const ty = k.identity.typography;
  const ink = swatch(p, 'ink');
  const paper = swatch(p, 'paper');
  const brand = swatch(p, 'brand');
  const accent = swatch(p, 'accent');
  const tint = swatch(p, 'tint');
  const year = b.year ?? new Date().getFullYear();
  const svg = (s: string, cls = '') => s.replace('<svg ', `<svg class="${cls}" `);
  let n = 0;
  const head = (title: string, lead?: string) => {
    n += 1;
    return `<header class="sh"><span class="no">${String(n).padStart(2, '0')}</span><h2>${h(title)}</h2></header>${lead ? `<p class="lead">${h(lead)}</p>` : ''}`;
  };
  const pairs: Array<[string, string, string]> = [
    ['Ink on paper', ink, paper],
    ['Paper on ink', paper, ink],
    ['Text on brand', onColor(brand), brand],
    ['Brand on paper', brand, paper],
    ['Ink on tint', ink, tint],
    ['Accent on ink', accent, ink],
  ];
  const rating = (r: number) => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA large' : 'Decorative');
  const dw = Math.max(...ty.display.weights);
  const values = k.identity.essence?.values ?? k.personality.slice(0, 3).map((x) => ({ name: x, meaning: '' }));
  const art = (a: BookArt) => `<figure class="art"><div class="frame">${svg(a.svg)}</div><figcaption><b>${h(a.title)}</b><span>${h(a.note)}</span></figcaption></figure>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(k.name)} brand guidelines</title>
<link rel="stylesheet" href="${googleFontsHref([ty.display, ty.body, ty.data])}">
<style>
:root{--ink:${ink};--paper:${paper};--brand:${brand};--accent:${accent};--tint:${tint};--display:'${ty.display.family}',system-ui,sans-serif;--body:'${ty.body.family}',system-ui,sans-serif;--data:'${ty.data.family}',ui-monospace,monospace}
*{box-sizing:border-box}body{margin:0;background:#EDEBF1;color:var(--ink);font-family:var(--body);line-height:1.55;-webkit-font-smoothing:antialiased}
.book{width:min(1080px,100% - 32px);margin:32px auto;display:flex;flex-direction:column;gap:28px}
.page{background:var(--paper);border-radius:28px;padding:clamp(24px,5vw,64px);display:flex;flex-direction:column;gap:26px;break-after:page;page-break-after:always}
.cover{background:var(--brand);color:${onColor(brand)};min-height:560px;justify-content:space-between}
.cover h1{font-family:var(--display);font-weight:${dw};font-size:clamp(56px,9vw,112px);letter-spacing:-.045em;line-height:.95;margin:0}
.cover .meta{font-family:var(--data);font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.85}
.cover .lockup{max-width:420px;height:auto}
.sh{display:flex;align-items:baseline;gap:16px}.no{font-family:var(--data);font-size:14px;opacity:.6}
h2{font-family:var(--display);font-weight:${dw};font-size:clamp(28px,3.4vw,40px);letter-spacing:-.03em;margin:0}
h3{font-family:var(--display);font-size:20px;margin:0}
.lead{margin:0;max-width:44em;font-size:17px;opacity:.85}
.label{font-family:var(--data);font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;opacity:.65}
.grid{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(min(100%,var(--min,240px)),1fr))}
.card{background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:8px}
.promise{background:var(--ink);color:var(--paper);border-radius:22px;padding:30px;font-family:var(--display);font-size:clamp(24px,3vw,34px);line-height:1.15;letter-spacing:-.02em}
.logo-tile{height:180px;border-radius:18px;display:flex;align-items:center;justify-content:center;padding:24px;border:1px solid rgba(0,0,0,.08)}
.logo-tile>svg{max-width:88%;max-height:120px;width:auto;height:auto}
.sw{border-radius:16px;height:130px;display:flex;align-items:flex-end;padding:12px;font-family:var(--data);font-size:12px;border:1px solid rgba(0,0,0,.08)}
.mono{font-family:var(--data);font-size:12.5px;line-height:1.7}
.pair{border-radius:14px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;border:1px solid rgba(0,0,0,.08)}
.pair .aa{font-family:var(--display);font-weight:${dw};font-size:22px}
.type-row{display:grid;grid-template-columns:140px 1fr;gap:18px;align-items:baseline;border-top:1px solid rgba(0,0,0,.08);padding:14px 0}
.masonry{columns:3 260px;column-gap:18px}.masonry .art{break-inside:avoid;margin-bottom:22px}
.art{margin:0;display:flex;flex-direction:column;gap:10px}.art .frame{border-radius:16px;overflow:hidden;background:#fff;border:1px solid rgba(0,0,0,.08)}.art .frame>svg{display:block;width:100%;height:auto}
.art figcaption{display:flex;flex-direction:column;gap:2px;font-size:14px}.art figcaption span{opacity:.75}
.voice{background:var(--ink);color:var(--paper);border-radius:22px;padding:28px;display:flex;flex-direction:column;gap:14px}
.voice .not{text-decoration:line-through;opacity:.65}
ul.clean{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px}
footer{font-family:var(--data);font-size:12px;opacity:.7;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
@media print{body{background:#fff}.book{width:auto;margin:0;gap:0}.page{border-radius:0;min-height:auto}@page{size:A4;margin:12mm}}
</style>
</head>
<body>
<main class="book">

<section class="page cover">
<div class="meta">Brand guidelines · v${b.version ?? 1}.0 · ${year}</div>
<div style="display:flex;flex-direction:column;gap:24px">
${svg(b.logos.mono.replace(/#FFFFFF/gi, '\u0000').replace(new RegExp(ink, 'gi'), onColor(brand)).replace(/\u0000/g, brand), 'lockup')}
<h1>${h(k.taglines[0] ?? k.name)}</h1>
</div>
<div class="meta">${h(b.domain)} · @${h(b.handle)}${b.sectorLabel ? ` · ${h(b.sectorLabel)}` : ''}</div>
</section>

<section class="page">
${head('Brand essence', 'Everything else in this book follows from these few lines.')}
<div class="promise">${h(k.identity.essence?.promise ?? k.messaging.oneLiner)}</div>
<div class="grid" style="--min:220px">${values.slice(0, 3).map((v) => `<div class="card"><h3>${h(v.name)}</h3><span>${h(v.meaning)}</span></div>`).join('')}</div>
<div class="grid" style="--min:240px">
<div><div class="label">What the name means</div><p>${h(k.meaning)}</p></div>
<div><div class="label">Positioning</div><p>${h(k.positioning)}</p></div>
<div><div class="label">Who it’s for</div><p>${h(k.audience.primary)}</p></div>
</div>
</section>

<section class="page">
${head('Logo', k.identity.mark.concept)}
<div class="grid" style="--min:220px">
<div class="logo-tile" style="background:#fff">${svg(b.logos.light)}</div>
<div class="logo-tile" style="background:${ink}">${svg(b.logos.dark)}</div>
<div class="logo-tile" style="background:#fff">${svg(b.logos.mono)}</div>
<div class="logo-tile" style="background:${tint}">${svg(b.logos.icon)}</div>
</div>
<div class="grid" style="--min:240px">
<div class="card"><div class="label">Clear space</div><span>${h(k.identity.usageRules.clearSpace)}</span></div>
<div class="card"><div class="label">Minimum size</div><span>${h(k.identity.usageRules.minSize)}</span></div>
<div class="card"><div class="label">Do</div><span>${h(k.identity.usageRules.do)}</span></div>
<div class="card"><div class="label">Don’t</div><span>${h(k.identity.usageRules.dont)}</span></div>
</div>
</section>

<section class="page">
${head('Colour', 'Five colours with clear jobs.')}
<div class="grid" style="--min:170px">
${p
  .map((s) => {
    const [r, g, bl] = hexToRgb(s.hex);
    const [c, m, y, kk] = hexToCmyk(s.hex);
    return `<div style="display:flex;flex-direction:column;gap:8px"><div class="sw" style="background:${s.hex};color:${onColor(s.hex)}">${s.role.toUpperCase()}</div><b>${h(s.name)}</b><span class="mono">HEX ${s.hex}<br>RGB ${r} ${g} ${bl}<br>CMYK ${c} ${m} ${y} ${kk}</span><span style="font-size:13.5px;opacity:.75">${h(s.usage)}</span></div>`;
  })
  .join('')}
</div>
<div class="label">Accessible pairings (WCAG contrast)</div>
<div class="grid" style="--min:260px">
${pairs.map(([name, fg, bg]) => { const r = contrast(fg, bg); return `<div class="pair" style="background:${bg};color:${fg}"><span class="aa">Aa</span><span class="mono">${rating(r)} · ${r.toFixed(1)}:1 · ${h(name)}</span></div>`; }).join('')}
</div>
</section>

<section class="page">
${head('Typography', `${ty.display.family} for headlines, ${ty.body.family} for reading, ${ty.data.family} for details. All free on Google Fonts.`)}
<div class="grid" style="--min:240px">
${[['Display', ty.display, 'var(--display)'], ['Body', ty.body, 'var(--body)'], ['Data', ty.data, 'var(--data)']].map(([label, f, ff]) => { const font = f as typeof ty.display; return `<div class="card"><div class="label">${label} · ${h(font.family)}</div><span style="font-family:${ff};font-weight:${Math.max(...font.weights)};font-size:44px;line-height:1.1">Aa Bb 123</span><span style="font-size:14px;opacity:.8">${h(font.why ?? '')}</span></div>`; }).join('')}
</div>
<div>
<div class="type-row"><span class="label">Display 56</span><span style="font-family:var(--display);font-weight:${dw};font-size:clamp(32px,5vw,56px);line-height:1.05;letter-spacing:-.04em">${h(k.taglines[0] ?? k.name)}</span></div>
<div class="type-row"><span class="label">Heading 32</span><span style="font-family:var(--display);font-weight:${dw};font-size:32px;line-height:1.15;letter-spacing:-.02em">${h(k.website.features[0]?.title ?? k.name)}</span></div>
<div class="type-row"><span class="label">Body 17</span><span style="font-size:17px">${h(k.messaging.short)}</span></div>
<div class="type-row"><span class="label">Label 12</span><span style="font-family:var(--data);font-size:12px;letter-spacing:.12em">${h(b.domain.toUpperCase())} · @${h(b.handle.toUpperCase())}</span></div>
</div>
</section>

${b.elements.length ? `<section class="page">${head('Brand toolkit', 'The graphic elements around the logo, all drawn from one graphic device. One device, one pattern and one accent per surface.')}<div class="masonry">${b.elements.map(art).join('')}</div></section>` : ''}

<section class="page">
${head('Voice', k.voice.summary)}
<div class="voice">
<div class="label" style="opacity:.8">We say</div>${k.voice.say.slice(0, 4).map((s) => `<span>${h(s)}</span>`).join('')}
<div class="label" style="opacity:.8">We don’t say</div>${k.voice.not.slice(0, 3).map((s) => `<span class="not">${h(s)}</span>`).join('')}
</div>
<div class="grid" style="--min:260px">
<div class="card"><div class="label">Principles</div><ul class="clean">${k.voice.principles.map((s) => `<li>${h(s)}</li>`).join('')}</ul></div>
<div class="card"><div class="label">Taglines</div><ul class="clean">${k.taglines.map((s) => `<li>${h(s)}</li>`).join('')}</ul></div>
<div class="card"><div class="label">Elevator pitch</div><span>${h(k.messaging.elevatorPitch)}</span></div>
</div>
</section>

${b.mockups.length ? `<section class="page">${head('Applications', b.sectorLabel ? `Chosen for a ${b.sectorLabel.toLowerCase()} brand. Every mockup uses the real logo, colours and type.` : 'Every mockup uses the real logo, colours and type.')}<div class="grid" style="--min:300px">${b.mockups.map(art).join('')}</div></section>` : ''}

<section class="page">
${head('Launch kit')}
<div class="grid" style="--min:260px">
<div class="card"><div class="label">Instagram bio</div><span>${h(k.launch.bios.instagram)}</span></div>
<div class="card"><div class="label">X bio</div><span>${h(k.launch.bios.x)}</span></div>
<div class="card"><div class="label">LinkedIn</div><span>${h(k.launch.bios.linkedin)}</span></div>
<div class="card"><div class="label">Launch announcement</div><span style="white-space:pre-wrap">${h(k.launch.posts.announcement)}</span></div>
</div>
<footer><span>${h(k.name)} · made with gobrandtoday✦</span><span>Fonts: Google Fonts (free, open licence)</span></footer>
</section>

</main>
</body>
</html>
`;
}
