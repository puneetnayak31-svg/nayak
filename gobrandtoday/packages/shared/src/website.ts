/**
 * Websites: a free first-draft site generated from the Brand Bible (one
 * responsive HTML file in the brand's colours, fonts and words), and the
 * paid "we build it for you" packages with the brief a founder fills in.
 * Requests go through the experts intake (service "website").
 */
import { googleFontsHref, onColor, swatch } from './brand-system';
import type { BrandKit } from './types';

const h = (s: string) => s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface SiteInput {
  kit: BrandKit;
  domain: string;
  handle: string;
  /** Pre-rendered SVGs (the browser renders them with real font metrics). */
  logo: string;
  logoDark: string;
  icon: string;
  heroArt: string;
  year?: number;
}

/** A one-page website draft as a single, self-contained HTML file. */
export function websiteHTML(s: SiteInput): string {
  const k = s.kit;
  const W = k.website;
  const p = k.identity.palette;
  const ty = k.identity.typography;
  const ink = swatch(p, 'ink');
  const paper = swatch(p, 'paper');
  const brand = swatch(p, 'brand');
  const accent = swatch(p, 'accent');
  const tint = swatch(p, 'tint');
  const radius = Number(k.identity.designSystem.radius.match(/(\d{1,2})\s?px/)?.[1] ?? 16);
  const year = s.year ?? new Date().getFullYear();
  const inline = (svg: string, cls: string, label: string) => svg.replace('<svg ', `<svg class="${cls}" aria-label="${h(label)}" `);
  const favicon = `data:image/svg+xml,${encodeURIComponent(s.icon)}`;
  const features = W.features.slice(0, 6);
  const same = (a: string, b: string) => a.toLowerCase().replace(/[^a-z0-9]/g, '') === b.toLowerCase().replace(/[^a-z0-9]/g, '');
  // The eyebrow must add something: skip lines that repeat the headline.
  const eyebrow = [...k.taglines, k.messaging.oneLiner, k.archetype.name].find((x) => x && !same(x, W.headline)) ?? k.name;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(W.seoTitle || `${k.name}: ${k.taglines[0] ?? ''}`)}</title>
<meta name="description" content="${h(W.metaDescription || W.subheadline)}">
<meta property="og:title" content="${h(k.name)}">
<meta property="og:description" content="${h(W.metaDescription || W.subheadline)}">
<link rel="icon" href="${favicon}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${googleFontsHref([ty.display, ty.body, ty.data])}">
<style>
:root{--ink:${ink};--paper:${paper};--brand:${brand};--on-brand:${onColor(brand)};--accent:${accent};--tint:${tint};--r:${radius}px;--display:'${ty.display.family}',system-ui,sans-serif;--body:'${ty.body.family}',system-ui,sans-serif;--data:'${ty.data.family}',ui-monospace,monospace}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit}img{max-width:100%}
.wrap{width:min(1120px,100% - 40px);margin:0 auto}
h1,h2,h3{font-family:var(--display);line-height:1.05;letter-spacing:-.03em;margin:0}
h1{font-size:clamp(40px,6.4vw,76px)}h2{font-size:clamp(30px,4vw,48px)}h3{font-size:21px;letter-spacing:-.01em}
.eyebrow{font-family:var(--data);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--brand);margin:0 0 18px}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 24px;border-radius:var(--r);background:var(--brand);color:var(--on-brand);font-weight:700;text-decoration:none;border:2px solid var(--brand)}
.btn.ghost{background:transparent;color:var(--ink);border-color:currentColor}
.btn.light{background:var(--paper);color:var(--ink);border-color:var(--paper)}
header{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--paper) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid color-mix(in srgb,var(--ink) 8%,transparent)}
header .wrap{display:flex;align-items:center;gap:24px;min-height:72px}
.logo{height:36px;width:auto;display:block}
header nav{display:flex;gap:22px;margin-left:auto;font-weight:600;font-size:15px}header nav a{text-decoration:none;opacity:.8}header nav a:hover{opacity:1}
header .btn{min-height:42px;padding:0 18px;font-size:15px}
.hero{padding:72px 0 64px}.hero .wrap{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center}
.lead{font-size:clamp(18px,2vw,21px);margin:22px 0 30px;max-width:34em;opacity:.82}
.actions{display:flex;gap:12px;flex-wrap:wrap}
.art{border-radius:calc(var(--r) * 2);overflow:hidden;aspect-ratio:1;display:block;width:100%;height:auto}
section{padding:80px 0}
.features .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:20px;margin-top:40px}
.card{background:#fff;border:1px solid color-mix(in srgb,var(--ink) 9%,transparent);border-radius:calc(var(--r) * 1.4);padding:28px;display:flex;flex-direction:column;gap:10px}
.num{font-family:var(--data);font-size:13px;color:var(--brand)}
.card p{margin:0;opacity:.8}
.benefits{background:var(--tint)}.benefits ul{list-style:none;padding:0;margin:36px 0 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:16px}
.benefits li{background:var(--paper);border-radius:var(--r);padding:20px 22px;font-weight:600;display:flex;gap:12px;align-items:flex-start}
.benefits li::before{content:"";flex:none;width:12px;height:12px;margin-top:7px;border-radius:50%;background:var(--accent)}
.about .wrap{display:grid;grid-template-columns:.8fr 1.2fr;gap:48px}
.about p{margin:0 0 16px;font-size:18px}
blockquote{margin:24px 0 0;padding:24px 28px;border-left:4px solid var(--brand);background:#fff;border-radius:0 var(--r) var(--r) 0;font-family:var(--display);font-size:22px;line-height:1.35;letter-spacing:-.01em}
.faq details{border-bottom:1px solid color-mix(in srgb,var(--ink) 12%,transparent);padding:20px 0}
.faq summary{cursor:pointer;font-weight:700;font-size:18px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.faq summary::after{content:"+";font-family:var(--data);color:var(--brand)}.faq details[open] summary::after{content:"–"}
.faq details p{margin:12px 0 0;opacity:.82}
.cta{background:var(--brand);color:var(--on-brand);text-align:center}
.cta h2{max-width:16em;margin:0 auto}.cta p{max-width:36em;margin:18px auto 30px;opacity:.9}
footer{background:var(--ink);color:var(--paper);padding:40px 0;font-size:14px}
footer .wrap{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
footer .meta{font-family:var(--data);font-size:12.5px;opacity:.75;letter-spacing:.04em}
@media (max-width:820px){header nav{display:none}.hero{padding:40px 0}.hero .wrap,.about .wrap{grid-template-columns:1fr}.art{max-width:440px}section{padding:56px 0}}
</style>
</head>
<body>
<header><div class="wrap">
<a href="#" aria-label="${h(k.name)} home">${inline(s.logo, 'logo', k.name)}</a>
<nav aria-label="Main"><a href="#features">What we do</a><a href="#about">About</a><a href="#faq">FAQ</a></nav>
<a class="btn" href="#contact">${h(W.cta)}</a>
</div></header>
<main>
<section class="hero"><div class="wrap">
<div>
<p class="eyebrow">${h(eyebrow)}</p>
<h1>${h(W.headline)}</h1>
<p class="lead">${h(W.subheadline)}</p>
<div class="actions"><a class="btn" href="#contact">${h(W.cta)}</a><a class="btn ghost" href="#features">See how it works</a></div>
</div>
${inline(s.heroArt, 'art', `${k.name} brand graphic`)}
</div></section>
<section class="features" id="features"><div class="wrap">
<p class="eyebrow">Why ${h(k.name)}</p>
<h2>${h(k.messaging.oneLiner)}</h2>
<div class="grid">
${features.map((f, i) => `<article class="card"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3>${h(f.title)}</h3><p>${h(f.body)}</p></article>`).join('\n')}
</div>
</div></section>
${W.benefits.length ? `<section class="benefits"><div class="wrap"><p class="eyebrow">What you get</p><h2>${h(k.taglines[1] ?? k.taglines[0] ?? k.name)}</h2><ul>${W.benefits.slice(0, 6).map((b) => `<li>${h(b)}</li>`).join('')}</ul></div></section>` : ''}
<section class="about" id="about"><div class="wrap">
<div><p class="eyebrow">About</p><h2>${h(k.name)}</h2></div>
<div><p>${h(W.about || k.story)}</p><blockquote>${h(k.mission)}</blockquote></div>
</div></section>
${W.faq.length ? `<section class="faq" id="faq"><div class="wrap"><p class="eyebrow">FAQ</p><h2>Questions, answered</h2><div style="margin-top:28px">${W.faq.slice(0, 8).map((q) => `<details><summary>${h(q.q)}</summary><p>${h(q.a)}</p></details>`).join('')}</div></div></section>` : ''}
<section class="cta" id="contact"><div class="wrap">
<h2>${h(k.taglines[0] ?? W.headline)}</h2>
<p>${h(W.contact)}</p>
<a class="btn light" href="mailto:hello@${h(s.domain)}">${h(W.cta)}</a>
</div></section>
</main>
<footer><div class="wrap">
${inline(s.logoDark, 'logo', k.name)}
<span class="meta">© ${year} ${h(k.name)} · ${h(s.domain)} · @${h(s.handle)}</span>
</div></footer>
</body>
</html>
`;
}

/* ------------------------- "We build it for you" ------------------------- */

export interface WebsitePackage {
  id: 'launch' | 'business' | 'store' | 'custom';
  title: string;
  pitch: string;
  includes: string[];
  turnaround: string;
  /** null = quoted after the brief. */
  from: { INR: number; USD: number } | null;
}

export const WEBSITE_PACKAGES: WebsitePackage[] = [
  {
    id: 'launch',
    title: 'Launch page',
    pitch: 'Your first draft, polished by a designer and live on your own domain.',
    includes: ['One long page from your draft', 'Contact form and WhatsApp button', 'Connected to your domain, with SSL', 'Basic SEO and Google Analytics', '1 round of changes'],
    turnaround: '5–7 days',
    from: { INR: 9999, USD: 199 },
  },
  {
    id: 'business',
    title: 'Business website',
    pitch: 'A complete site you can edit yourself, built on your new identity.',
    includes: ['Up to 6 pages: home, about, services or menu, gallery, blog, contact', 'Editable CMS (Framer, Webflow or WordPress)', 'Booking or enquiry forms', 'English plus Hindi or one more language on request', 'SEO setup, Search Console and analytics', '2 rounds of changes, 30 days of fixes'],
    turnaround: '2–3 weeks',
    from: { INR: 34999, USD: 699 },
  },
  {
    id: 'store',
    title: 'Online store',
    pitch: 'Sell from day one: a branded shop with payments, shipping and invoices.',
    includes: ['Shopify or WooCommerce, set up for you', 'Up to 25 products loaded', 'UPI, cards and wallets (Razorpay or Stripe)', 'Shipping, GST invoices and order emails', 'Product photo retouching for 25 images', 'Training call so you can run it'],
    turnaround: '3–5 weeks',
    from: { INR: 64999, USD: 1299 },
  },
  {
    id: 'custom',
    title: 'Something custom',
    pitch: 'Memberships, bookings, a web app or a big content site. Tell us what you need.',
    includes: ['Scoping call with a developer', 'Written plan and fixed quote', 'Design and build in milestones'],
    turnaround: 'Quoted',
    from: null,
  },
];

/** What the site should show. */
export const WEBSITE_SECTIONS = ['Products or menu', 'Services', 'Pricing', 'Gallery', 'Team', 'Testimonials', 'Blog', 'Locations', 'Careers', 'Press'] as const;
/** What the site should do. */
export const WEBSITE_FEATURES = ['Contact form', 'WhatsApp chat', 'Online booking', 'Online payments', 'Newsletter sign-up', 'Hindi + English', 'Store with cart', 'Member login'] as const;

export interface WebsiteBrief {
  packageId: WebsitePackage['id'];
  sections: string[];
  features: string[];
  pages?: string;
  references?: string;
  notes?: string;
  hasDomain?: boolean;
}

/** The brief as plain text for the experts inbox (kept under the 2,000-character details limit). */
export function websiteBriefText(b: WebsiteBrief, brand?: { name: string; domain?: string | null }): string {
  const pkg = WEBSITE_PACKAGES.find((x) => x.id === b.packageId);
  const lines = [
    `Package: ${pkg?.title ?? b.packageId}`,
    brand ? `Brand: ${brand.name}${brand.domain ? ` (${brand.domain})` : ''}` : '',
    b.hasDomain === undefined ? '' : `Domain bought: ${b.hasDomain ? 'yes' : 'not yet'}`,
    b.sections.length ? `Show: ${b.sections.join(', ')}` : '',
    b.features.length ? `Needs: ${b.features.join(', ')}` : '',
    b.pages ? `Pages: ${b.pages}` : '',
    b.references ? `Sites they like: ${b.references}` : '',
    b.notes ? `Notes: ${b.notes}` : '',
    'Starting point: the GoBrandToday first-draft website and Brand Bible.',
  ];
  return lines.filter(Boolean).join('\n').slice(0, 2000);
}
