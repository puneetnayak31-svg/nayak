import { MARK_PATHS, googleFontsHref, swatch, toSlug, wordmarkText, type BrandKit } from '@gbt/shared';

type Variant = 'light' | 'dark';

function colors(kit: BrandKit, v: Variant) {
  const p = kit.identity.palette;
  return v === 'dark'
    ? { bg: swatch(p, 'ink'), text: swatch(p, 'paper'), mark: swatch(p, 'accent') }
    : { bg: null as string | null, text: swatch(p, 'ink'), mark: swatch(p, 'brand') };
}

export function download(filename: string, data: Blob | string, type = 'text/plain') {
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Measure the wordmark with the real web font so exports match the screen. */
async function layout(kit: BrandKit, fontSize: number) {
  const display = kit.identity.typography.display;
  const weight = Math.max(...display.weights);
  const font = `${weight} ${fontSize}px "${display.family}"`;
  try {
    await document.fonts.load(font, wordmarkText(kit.name));
  } catch {
    /* fall back to whatever is available */
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  const spacing = -0.05 * fontSize;
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacing}px`;
  const text = wordmarkText(kit.name, kit.identity.wordmarkCase);
  const m = ctx.measureText(text);
  const markSize = fontSize * 0.46;
  const gap = fontSize / 12;
  const pad = fontSize * 0.55; // clear space ≈ the "o" height
  const ascent = m.actualBoundingBoxAscent || fontSize * 0.75;
  const descent = m.actualBoundingBoxDescent || fontSize * 0.22;
  const width = Math.ceil(pad * 2 + m.width + gap + markSize);
  const height = Math.ceil(pad * 2 + ascent + descent);
  return { font, text, spacing, markSize, gap, pad, ascent, descent, width, height, textWidth: m.width, weight, family: display.family };
}

export async function downloadLogoPNG(kit: BrandKit, variant: Variant = 'light', scale = 2) {
  const L = await layout(kit, 160);
  const c = colors(kit, variant);
  const canvas = document.createElement('canvas');
  canvas.width = L.width * scale;
  canvas.height = L.height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  if (c.bg) {
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, L.width, L.height);
  }
  ctx.font = L.font;
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${L.spacing}px`;
  ctx.fillStyle = c.text;
  ctx.textBaseline = 'alphabetic';
  const baseline = L.pad + L.ascent;
  ctx.fillText(L.text, L.pad, baseline);
  const mark = MARK_PATHS[kit.identity.mark.shape];
  ctx.save();
  ctx.translate(L.pad + L.textWidth + L.gap, baseline - L.markSize);
  ctx.scale(L.markSize / 64, L.markSize / 64);
  ctx.fillStyle = c.mark;
  ctx.fill(new Path2D(mark.d), mark.evenOdd ? 'evenodd' : 'nonzero');
  ctx.restore();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
  if (blob) download(`${toSlug(kit.name)}-logo-${variant}.png`, blob);
}

export async function downloadLogoSVG(kit: BrandKit, variant: Variant = 'light') {
  const L = await layout(kit, 160);
  const c = colors(kit, variant);
  const mark = MARK_PATHS[kit.identity.mark.shape];
  const baseline = L.pad + L.ascent;
  const href = googleFontsHref([{ family: L.family, weights: [L.weight] }]).replace(/&/g, '&amp;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${L.width}" height="${L.height}" viewBox="0 0 ${L.width} ${L.height}">
  <defs><style>@import url('${href}');</style></defs>
  ${c.bg ? `<rect width="100%" height="100%" fill="${c.bg}"/>` : ''}
  <text x="${L.pad}" y="${baseline}" font-family="'${L.family}', sans-serif" font-weight="${L.weight}" font-size="160" letter-spacing="${L.spacing}" fill="${c.text}">${escapeXml(L.text)}</text>
  <g transform="translate(${(L.pad + L.textWidth + L.gap).toFixed(1)} ${(baseline - L.markSize).toFixed(1)}) scale(${(L.markSize / 64).toFixed(4)})">
    <path d="${mark.d}" fill="${c.mark}"${mark.evenOdd ? ' fill-rule="evenodd"' : ''}/>
  </g>
</svg>`;
  download(`${toSlug(kit.name)}-logo-${variant}.svg`, svg, 'image/svg+xml');
}

/** The mark alone — the smallest version of the brand. */
export function downloadMarkSVG(kit: BrandKit) {
  const mark = MARK_PATHS[kit.identity.mark.shape];
  const brand = swatch(kit.identity.palette, 'brand');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${brand}"/><g transform="translate(13.5 13.5) scale(0.578)"><path d="${mark.d}" fill="#FFFFFF"${mark.evenOdd ? ' fill-rule="evenodd"' : ''}/></g></svg>`;
  download(`${toSlug(kit.name)}-icon.svg`, svg, 'image/svg+xml');
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[ch]!);
}
