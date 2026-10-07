import { googleFontsHref, iconSVG, logoSVG, toSlug, type BrandKit, type LogoIdentity, type LogoVariant } from '@gbt/shared';
import { canvasMeasure, kitIdentity } from '@/components/Logo';

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

const toBase64 = (buf: ArrayBuffer) => {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

/**
 * Self-contained @font-face rules: the exact glyphs the logo uses, subset by
 * Google Fonts (`text=`) and inlined, so the SVG/PNG renders anywhere.
 */
async function embeddedFontCss(fonts: Array<{ family: string; weights: number[] }>, text: string): Promise<string> {
  const rules: string[] = [];
  for (const f of fonts) {
    try {
      const href = `${googleFontsHref([{ family: f.family, weights: [Math.max(...f.weights)] }]).replace('&display=swap', '')}&text=${encodeURIComponent(text)}`;
      const css = await (await fetch(href)).text();
      for (const m of css.matchAll(/@font-face\s*{([^}]*)}/g)) {
        const block = m[1]!;
        const url = block.match(/url\(([^)]+)\)/)?.[1];
        if (!url) continue;
        const data = toBase64(await (await fetch(url)).arrayBuffer());
        rules.push(`@font-face{${block.replace(/src:[^;]+;/, `src:url(data:font/woff2;base64,${data}) format('woff2');`)}}`);
      }
    } catch {
      /* fall back to the system font for this family */
    }
  }
  return rules.join('');
}

async function ensureFonts(id: LogoIdentity) {
  for (const f of [id.typography.display, id.typography.data]) {
    try {
      await document.fonts.load(`${Math.max(...f.weights)} 100px "${f.family}"`);
    } catch {
      /* ignore */
    }
  }
}

async function buildSvg(kit: BrandKit, kind: 'logo' | 'icon', variant: LogoVariant): Promise<{ svg: string; width: number; height: number }> {
  const id = kitIdentity(kit);
  await ensureFonts(id);
  const css = await embeddedFontCss([id.typography.display, id.typography.data], `${kit.name}${kit.name.toUpperCase()}${kit.name.toLowerCase()}>_EST.0123456789`);
  return kind === 'icon' ? iconSVG(id, { measure: canvasMeasure, css }) : logoSVG(id, { variant, measure: canvasMeasure, css, background: variant === 'dark' });
}

export async function downloadLogoSVG(kit: BrandKit, variant: LogoVariant = 'light') {
  const out = await buildSvg(kit, 'logo', variant);
  download(`${toSlug(kit.name)}-logo-${variant}.svg`, out.svg, 'image/svg+xml');
}

export async function downloadIconSVG(kit: BrandKit) {
  const out = await buildSvg(kit, 'icon', 'light');
  download(`${toSlug(kit.name)}-icon.svg`, out.svg, 'image/svg+xml');
}

async function svgToPng(svg: string, width: number, height: number, scale: number): Promise<Blob | null> {
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not render the logo'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((r) => canvas.toBlob(r, 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function downloadLogoPNG(kit: BrandKit, variant: LogoVariant = 'light') {
  const out = await buildSvg(kit, 'logo', variant);
  const blob = await svgToPng(out.svg, out.width, out.height, 4);
  if (blob) download(`${toSlug(kit.name)}-logo-${variant}.png`, blob);
}

export async function downloadIconPNG(kit: BrandKit) {
  const out = await buildSvg(kit, 'icon', 'light');
  const blob = await svgToPng(out.svg, out.width, out.height, 8);
  if (blob) download(`${toSlug(kit.name)}-icon.png`, blob);
}
