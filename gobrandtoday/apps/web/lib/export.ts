import {
  ELEMENT_KINDS,
  ELEMENT_META,
  MOCKUP_KINDS,
  MOCKUP_META,
  PRIMARY_MOCKUPS,
  REPURPOSE_KINDS,
  REPURPOSE_META,
  SECTOR_META,
  SOCIAL_ASSETS,
  brandBookHTML,
  cssTokens,
  elementSVG,
  googleFontsHref,
  heroArtSVG,
  iconSVG,
  jsonTokens,
  kitTokens,
  logoSVG,
  makeZip,
  mockupSVG,
  mockupsForSector,
  repurposeSVG,
  sectorForKit,
  socialSVG,
  tailwindTokens,
  toSlug,
  websiteHTML,
  type BrandKit,
  type ElementKind,
  type LogoIdentity,
  type LogoVariant,
  type MockupInput,
  type MockupKind,
  type RepurposeInput,
  type RepurposeKind,
  type SocialAsset,
} from '@gbt/shared';
import { canvasMeasure, kitIdentity } from '@/components/Logo';

/** Hosts that can't follow <a download> (e.g. a sandboxed preview) can register their own saver. */
type Saver = (filename: string, blob: Blob) => Promise<void> | void;

export function download(filename: string, data: Blob | string, type = 'text/plain') {
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data;
  const saver = (globalThis as { __gbtSave?: Saver }).__gbtSave;
  if (saver) {
    void saver(filename, blob);
    return;
  }
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

export async function svgToPng(svg: string, width: number, height: number, scale: number): Promise<Blob | null> {
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

/* ------------------------------ whole-kit exports ------------------------------ */

export interface KitContext {
  kit: BrandKit;
  domain: string;
  handle: string;
  version?: number;
}

export const kitDomain = (kit: BrandKit, domain?: string | null) => domain ?? `${toSlug(kit.name)}.com`;
export const kitHandle = (kit: BrandKit, handle?: string | null) => handle ?? toSlug(kit.name).replace(/-/g, '');

/** Inputs every scene, element and social asset is drawn from. */
export function kitMockupInput(kit: BrandKit, domain: string, handle: string): MockupInput {
  const t = kit.identity.typography;
  return {
    id: kitIdentity(kit),
    measure: typeof document === 'undefined' ? undefined : canvasMeasure,
    fonts: { display: t.display.family, body: t.body.family, data: t.data.family },
    tagline: kit.taglines[0] ?? kit.messaging.oneLiner,
    headline: kit.website.headline,
    subheadline: kit.website.subheadline,
    cta: kit.website.cta,
    domain,
    handle,
  };
}

/** The applications for this brand, its own industry's objects first. */
export function kitMockupKinds(kit: BrandKit): MockupKind[] {
  return mockupsForSector(sectorForKit(kit), MOCKUP_KINDS);
}

async function loadKitFonts(kit: BrandKit) {
  const t = kit.identity.typography;
  const href = googleFontsHref([t.display, t.body, t.data]);
  if (!document.querySelector(`link[data-gf="${CSS.escape(href)}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.gf = href;
    document.head.appendChild(link);
  }
  for (const f of [t.display, t.body, t.data]) {
    try {
      await document.fonts.load(`${Math.max(...f.weights)} 40px "${f.family}"`);
    } catch {
      /* system fallback */
    }
  }
}

const withCss = (svg: string, css: string) => (css ? svg.replace(/^<svg ([^>]*)>/, `<svg $1><style>${css}</style>`) : svg);

/** Render an SVG to PNG with the brand's fonts embedded (so text survives rasterising). */
async function brandPng(kit: BrandKit, svg: string, w: number, h: number, scale = 1): Promise<Blob | null> {
  const t = kit.identity.typography;
  const text = (svg.match(/>([^<>]+)</g) ?? []).join('').replace(/[<>]/g, '') + kit.name + kit.name.toUpperCase();
  const css = await embeddedFontCss([t.display, t.body, t.data], [...new Set(text)].join('').slice(0, 900));
  return svgToPng(withCss(svg, css), w, h, scale);
}

export function brandBookFile(ctx: KitContext): string {
  const { kit, domain, handle } = ctx;
  const m = kitMockupInput(kit, domain, handle);
  const id = m.id;
  const sector = sectorForKit(kit);
  return brandBookHTML({
    kit,
    domain,
    handle,
    version: ctx.version,
    sectorLabel: SECTOR_META[sector].label,
    logos: {
      light: logoSVG(id, { variant: 'light', measure: canvasMeasure }).svg,
      dark: logoSVG(id, { variant: 'dark', measure: canvasMeasure }).svg.replace(/<rect width="100%" height="100%"[^>]*\/>/, ''),
      mono: logoSVG(id, { variant: 'mono', measure: canvasMeasure }).svg,
      icon: iconSVG(id, { measure: canvasMeasure }).svg,
    },
    mockups: kitMockupKinds(kit)
      .slice(0, PRIMARY_MOCKUPS)
      .map((k) => ({ title: MOCKUP_META[k].title, note: MOCKUP_META[k].note, svg: mockupSVG(k, m) })),
    elements: ELEMENT_KINDS.map((k) => ({ title: ELEMENT_META[k].title, note: ELEMENT_META[k].note, svg: elementSVG(k, { ...m, personalities: kit.personality }) })),
  });
}

export function websiteFile(ctx: KitContext): string {
  const { kit, domain, handle } = ctx;
  const m = kitMockupInput(kit, domain, handle);
  return websiteHTML({
    kit,
    domain,
    handle,
    logo: logoSVG(m.id, { variant: 'light', measure: canvasMeasure }).svg,
    logoDark: logoSVG(m.id, { variant: 'dark', measure: canvasMeasure }).svg.replace(/<rect width="100%" height="100%"[^>]*\/>/, ''),
    icon: iconSVG(m.id, { measure: canvasMeasure }).svg,
    heroArt: heroArtSVG(m),
  });
}

export async function downloadBrandBookHTML(ctx: KitContext) {
  await loadKitFonts(ctx.kit);
  download(`${toSlug(ctx.kit.name)}-brand-guidelines.html`, brandBookFile(ctx), 'text/html');
}

export async function downloadWebsiteHTML(ctx: KitContext) {
  await loadKitFonts(ctx.kit);
  download(`${toSlug(ctx.kit.name)}-website-draft.html`, websiteFile(ctx), 'text/html');
}

export type TokenFormat = 'css' | 'tailwind' | 'json';
export function tokensFile(kit: BrandKit, f: TokenFormat): { name: string; text: string; type: string } {
  const slug = toSlug(kit.name);
  const t = kitTokens(kit);
  if (f === 'css') return { name: `${slug}-tokens.css`, text: cssTokens(t), type: 'text/css' };
  if (f === 'tailwind') return { name: `${slug}-tailwind.config.js`, text: tailwindTokens(t), type: 'text/javascript' };
  return { name: `${slug}-tokens.json`, text: jsonTokens(t), type: 'application/json' };
}

export function downloadTokens(kit: BrandKit, f: TokenFormat) {
  const file = tokensFile(kit, f);
  download(file.name, file.text, file.type);
}

export async function downloadSocial(ctx: KitContext, kind: SocialAsset) {
  await loadKitFonts(ctx.kit);
  const a = SOCIAL_ASSETS[kind];
  const blob = await brandPng(ctx.kit, socialSVG(kind, kitMockupInput(ctx.kit, ctx.domain, ctx.handle)), a.w, a.h);
  if (blob) download(`${toSlug(ctx.kit.name)}-${kind}-${a.w}x${a.h}.png`, blob);
}

export async function downloadSVGFile(kit: BrandKit, name: string, svg: string) {
  await loadKitFonts(kit);
  const t = kit.identity.typography;
  const css = await embeddedFontCss([t.display, t.body, t.data], [...new Set((svg.match(/>([^<>]+)</g) ?? []).join('') + kit.name)].join('').slice(0, 900));
  download(`${toSlug(kit.name)}-${name}.svg`, withCss(svg, css), 'image/svg+xml');
}

export async function downloadElement(ctx: KitContext, kind: ElementKind) {
  await loadKitFonts(ctx.kit);
  await downloadSVGFile(ctx.kit, kind, elementSVG(kind, { ...kitMockupInput(ctx.kit, ctx.domain, ctx.handle), personalities: ctx.kit.personality }));
}

export async function downloadMockup(ctx: KitContext, kind: MockupKind) {
  await loadKitFonts(ctx.kit);
  await downloadSVGFile(ctx.kit, `mockup-${kind}`, mockupSVG(kind, kitMockupInput(ctx.kit, ctx.domain, ctx.handle)));
}

/** An email signature as HTML (paste into Gmail or Outlook settings). */
export function emailSignatureHTML(ctx: KitContext, person: { name: string; role: string }): string {
  const p = ctx.kit.identity.palette;
  const brand = p.find((s) => s.role === 'brand')?.hex ?? '#6D4AFF';
  const ink = p.find((s) => s.role === 'ink')?.hex ?? '#16161A';
  const e = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);
  return `<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;color:${ink};font-size:13px;line-height:1.5"><tr><td style="padding-right:14px;border-right:3px solid ${brand}"><b style="font-size:15px">${e(person.name)}</b><br>${e(person.role)}, ${e(ctx.kit.name)}</td><td style="padding-left:14px"><a href="https://${e(ctx.domain)}" style="color:${brand};text-decoration:none;font-weight:bold">${e(ctx.domain)}</a><br>@${e(ctx.handle)}<br><span style="color:#777">${e(ctx.kit.taglines[0] ?? '')}</span></td></tr></table>`;
}

/**
 * Everything in one ZIP: logos (SVG + PNG), favicons, brand book (HTML),
 * website draft, tokens, mockups, toolkit, social kit and the Brand Bible
 * text. `extra` lets the caller add files it already has (Markdown, JSON).
 */
export async function downloadKitZip(ctx: KitContext, extra: Array<{ name: string; data: string }> = [], onProgress?: (label: string) => void) {
  const { kit } = ctx;
  const slug = toSlug(kit.name);
  await loadKitFonts(kit);
  const id = kitIdentity(kit);
  const t = kit.identity.typography;
  const css = await embeddedFontCss([t.display, t.data], `${kit.name}${kit.name.toUpperCase()}${kit.name.toLowerCase()}>_EST.0123456789`);
  const files: Array<{ name: string; data: Uint8Array | string }> = [];
  const bytes = async (b: Blob | null) => (b ? new Uint8Array(await b.arrayBuffer()) : null);

  onProgress?.('Logos');
  for (const v of ['light', 'dark', 'mono'] as const) {
    const out = logoSVG(id, { variant: v, measure: canvasMeasure, css, background: v === 'dark' });
    files.push({ name: `logo/${slug}-logo-${v}.svg`, data: out.svg });
    const png = await bytes(await svgToPng(out.svg, out.width, out.height, 4));
    if (png) files.push({ name: `logo/${slug}-logo-${v}.png`, data: png });
  }
  const icon = iconSVG(id, { measure: canvasMeasure, css });
  files.push({ name: `logo/${slug}-icon.svg`, data: icon.svg });
  for (const size of [32, 180, 192, 512, 1024]) {
    const png = await bytes(await svgToPng(icon.svg, icon.width, icon.height, size / icon.width));
    if (png) files.push({ name: size === 32 ? `favicon/favicon-32.png` : size === 180 ? 'favicon/apple-touch-icon.png' : `favicon/icon-${size}.png`, data: png });
  }
  files.push({ name: 'favicon/favicon.svg', data: icon.svg });

  onProgress?.('Brand book and website');
  files.push({ name: `${slug}-brand-guidelines.html`, data: brandBookFile(ctx) });
  files.push({ name: `website/${slug}-website-draft.html`, data: websiteFile(ctx) });

  for (const f of ['css', 'tailwind', 'json'] as const) {
    const tok = tokensFile(kit, f);
    files.push({ name: `tokens/${tok.name}`, data: tok.text });
  }

  onProgress?.('Mockups and toolkit');
  const m = kitMockupInput(kit, ctx.domain, ctx.handle);
  for (const k of kitMockupKinds(kit).slice(0, PRIMARY_MOCKUPS)) files.push({ name: `mockups/${slug}-${k}.svg`, data: mockupSVG(k, m) });
  for (const k of ELEMENT_KINDS) files.push({ name: `toolkit/${slug}-${k}.svg`, data: elementSVG(k, { ...m, personalities: kit.personality }) });

  onProgress?.('Social kit');
  for (const k of Object.keys(SOCIAL_ASSETS) as SocialAsset[]) {
    const a = SOCIAL_ASSETS[k];
    const png = await bytes(await brandPng(kit, socialSVG(k, m), a.w, a.h));
    if (png) files.push({ name: `social/${slug}-${k}-${a.w}x${a.h}.png`, data: png });
  }
  files.push({ name: 'email-signature.html', data: emailSignatureHTML(ctx, { name: 'Your Name', role: 'Founder' }) });

  for (const e of extra) files.push(e);
  files.push({
    name: 'README.txt',
    data: [
      `${kit.name}: brand kit from GoBrandToday`,
      '',
      `Open ${slug}-brand-guidelines.html in any browser. Print it to save a PDF.`,
      'logo/      SVG for print and web, PNG for everything else',
      'favicon/   website icons (add favicon.svg and apple-touch-icon.png to your site)',
      'website/   a first-draft website you can open, edit or hand to a developer',
      'tokens/    colours and fonts as CSS variables, a Tailwind theme and design-token JSON',
      'mockups/   the logo on real objects for your industry',
      'toolkit/   supergraphic, pattern, icons, seal and other brand elements',
      'social/    profile picture and banners at each platform’s exact size',
      '',
      `Fonts (free on Google Fonts): ${t.display.family}, ${t.body.family}, ${t.data.family}.`,
      'Before you print or file anything, run a trademark search on the name.',
    ].join('\n'),
  });
  onProgress?.('Packing');
  const zip = makeZip(files);
  download(`${slug}-brand-kit.zip`, new Blob([zip as BlobPart], { type: 'application/zip' }));
}

/* ------------------------------------------------------------------ */
/* Logo repurpose tool (upload a logo → social kit)                    */
/* ------------------------------------------------------------------ */

/** Load one Google Font for on-screen previews. */
export async function ensureFont(family: string, weights = [400, 700]) {
  const href = googleFontsHref([{ family, weights }]);
  if (!document.querySelector(`link[data-gf="${CSS.escape(href)}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.gf = href;
    document.head.appendChild(link);
  }
  try {
    await document.fonts.load(`700 40px "${family}"`);
  } catch {
    /* system fallback */
  }
}

async function repurposeFile(kind: RepurposeKind, input: RepurposeInput): Promise<Blob | null> {
  const svg = repurposeSVG(kind, input);
  const { w, h } = REPURPOSE_META[kind];
  const text = [...new Set((svg.match(/>([^<>]+)</g) ?? []).join('').replace(/[<>]/g, '') + input.name + 'Aa')].join('').slice(0, 900);
  const css = await embeddedFontCss([{ family: input.font || 'Space Grotesk', weights: [400] }, { family: input.font || 'Space Grotesk', weights: [700] }, { family: 'Space Mono', weights: [400] }], text);
  return svgToPng(withCss(svg, css), w, h, 1);
}

/** One repurposed asset as a PNG at the platform's exact size. */
export async function downloadRepurposed(kind: RepurposeKind, input: RepurposeInput) {
  const blob = await repurposeFile(kind, input);
  const { w, h } = REPURPOSE_META[kind];
  if (blob) download(`${toSlug(input.name) || 'brand'}-${kind}-${w}x${h}.png`, blob);
}

/** Every repurposed asset in one ZIP, with a short README. */
export async function downloadRepurposedZip(input: RepurposeInput, onProgress?: (step: string) => void) {
  const slug = toSlug(input.name) || 'brand';
  const files: Array<{ name: string; data: Uint8Array | string }> = [];
  for (const k of REPURPOSE_KINDS) {
    const m = REPURPOSE_META[k];
    onProgress?.(m.title);
    const blob = await repurposeFile(k, input);
    if (blob) files.push({ name: `${slug}-${k}-${m.w}x${m.h}.png`, data: new Uint8Array(await blob.arrayBuffer()) });
  }
  files.push({
    name: 'README.txt',
    data: [
      `${input.name}: social kit made from your logo with GoBrandToday`,
      '',
      ...REPURPOSE_KINDS.map((k) => `${slug}-${k}  ${REPURPOSE_META[k].title}, ${REPURPOSE_META[k].size}`),
      '',
      'Profile pictures are cropped to a circle on most platforms: the logo sits inside the safe middle.',
      'Banners keep words and logo inside each platform’s safe area.',
      `Colours: brand ${input.colors.brand}, accent ${input.colors.accent}, ink ${input.colors.ink}, paper ${input.colors.paper}. Font: ${input.font || 'Space Grotesk'} (Google Fonts).`,
    ].join('\n'),
  });
  download(`${slug}-social-kit.zip`, new Blob([makeZip(files) as BlobPart], { type: 'application/zip' }));
}
