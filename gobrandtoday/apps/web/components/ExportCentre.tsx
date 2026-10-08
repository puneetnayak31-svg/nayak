'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { SOCIAL_ASSETS, toSlug, type BrandKit, type SocialAsset } from '@gbt/shared';
import { api, track } from '@/lib/api';
import {
  download,
  downloadBrandBookHTML,
  downloadIconPNG,
  downloadIconSVG,
  downloadKitZip,
  downloadLogoPNG,
  downloadLogoSVG,
  downloadSocial,
  downloadTokens,
  downloadWebsiteHTML,
  emailSignatureHTML,
  signatureLogoDataUrl,
  signatureLogoPng,
  kitDomain,
  kitHandle,
  tokensFile,
} from '@/lib/export';
import { useApp } from '@/lib/providers';
import { PlatformStack, SOCIAL_PLATFORM } from './Mockups';
import { useSignupGate } from './SignupGate';
import { Spark } from './Spark';

/** True in the single-file preview build (no server, so no print-to-PDF route). */
const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW === '1';

interface Props {
  brandId: string;
  kit: BrandKit;
  domain: string | null;
  handle: string | null;
  version: number;
  onOpenWebsite: () => void;
}

/**
 * Every way to take the brand away, grouped by who it's for: the whole kit
 * as one ZIP, the brand book (PDF/HTML/Markdown/JSON), logo files, the
 * website draft, design tokens for developers, the social media kit at each
 * platform's size and an email signature.
 */
export function ExportCentre({ brandId, kit, domain, handle, version, onOpenWebsite }: Props) {
  const { toast } = useApp();
  const ctx = { kit, domain: kitDomain(kit, domain), handle: kitHandle(kit, handle), version };
  const slug = toSlug(kit.name);
  const [busy, setBusy] = useState<string | null>(null);
  const [zipStep, setZipStep] = useState<string | null>(null);
  const { guard, gate, isGuest } = useSignupGate();

  const run = (key: string, fn: () => Promise<void> | void) => guard(() => runNow(key, fn))();
  const runNow = async (key: string, fn: () => Promise<void> | void) => {
    setBusy(key);
    track('export', { format: key });
    try {
      await fn();
    } catch {
      toast('That download didn’t work. Try again.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const bibleText = async (f: 'md' | 'json') => {
    if (PREVIEW) {
      const t = await api<string>(`/api/brands/${brandId}/export?format=${f}`);
      return typeof t === 'string' ? t : JSON.stringify(t, null, 2);
    }
    const res = await fetch(`/api/brands/${brandId}/export?format=${f}`, { credentials: 'include' });
    return res.text();
  };

  const zip = () =>
    run('zip', async () => {
      const extra = [];
      try {
        extra.push({ name: `${slug}-brand-bible.md`, data: await bibleText('md') });
        extra.push({ name: `${slug}-brand-bible.json`, data: await bibleText('json') });
      } catch {
        /* the kit still downloads without the text files */
      }
      await downloadKitZip(ctx, extra, setZipStep);
      setZipStep(null);
      toast('Brand kit downloaded');
    });

  const B = ({ k, children, onClick, hint, icon }: { k: string; children: ReactNode; onClick: () => void; hint?: string; icon?: ReactNode }) => (
    <button type="button" className="ec-btn" disabled={!!busy} onClick={onClick} title={hint}>
      <span className="ec-btn-label">
        {icon}
        {busy === k ? 'Preparing…' : children}
      </span>
      {hint && <span className="ec-hint">{hint}</span>}
    </button>
  );

  const [person, setPerson] = useState({ name: 'Your Name', role: 'Founder' });
  const [logoData, setLogoData] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  useEffect(() => {
    let live = true;
    void signatureLogoDataUrl(kit).then((d) => live && setLogoData(d));
    return () => {
      live = false;
    };
  }, [kit]);
  const hosted = /^https:\/\/\S+$/i.test(logoUrl.trim()) ? logoUrl.trim() : null;
  const signature = emailSignatureHTML(ctx, person, hosted ?? logoData);

  return (
    <div className="stack gap-20">
      {gate}
      {isGuest && (
        <div className="notice row between wrap gap-12">
          <span>Downloads need a free account, so your Brand Box is saved before it leaves the app.</span>
          <button type="button" className="btn btn-dark btn-sm" onClick={guard(() => undefined)}>
            Create free account
          </button>
        </div>
      )}
      <section className="ec-hero">
        <div className="stack gap-10" style={{ maxWidth: 560 }}>
          <span className="eyebrow" style={{ color: '#B9AEFF' }}>
            <Spark size={11} color="#B9AEFF" /> Everything, one download
          </span>
          <h2 className="h2" style={{ color: '#fff' }}>
            Your whole brand kit as a ZIP
          </h2>
          <p style={{ color: '#D6D3E4' }}>Logos in every format, favicons, the brand book as a web page, your website draft, design tokens, industry mockups, the brand toolkit and your social media kit. Open the README first.</p>
          <span className="ec-social">
            <PlatformStack ids={['instagram', 'linkedin', 'x', 'youtube']} size={20} />
            Includes profile picture, launch post and LinkedIn, X and YouTube banners
          </span>
        </div>
        <div className="stack gap-8" style={{ alignItems: 'flex-start' }}>
          <button type="button" className="btn btn-primary" disabled={!!busy} onClick={zip}>
            {busy === 'zip' ? `Packing ${zipStep ? `· ${zipStep}` : '…'}` : 'Download everything (.zip)'}
          </button>
          <span className="tiny" style={{ color: '#B5B2C6' }}>About 40 files · ready in a few seconds</span>
        </div>
      </section>

      <div className="ec-grid">
        <Group
          title="Social media kit"
          icons={<PlatformStack ids={['instagram', 'linkedin', 'x', 'youtube']} size={20} />}
          lead="Profile picture, launch post and banners for LinkedIn, X and YouTube, each as a PNG at the platform’s exact size."
          highlight
        >
          {(Object.keys(SOCIAL_ASSETS) as SocialAsset[]).map((k) => (
            <B key={k} k={`social-${k}`} hint={SOCIAL_ASSETS[k].size} icon={<PlatformStack ids={SOCIAL_PLATFORM[k].slice(0, 2)} size={16} />} onClick={() => run(`social-${k}`, () => downloadSocial(ctx, k))}>
              {SOCIAL_ASSETS[k].title}
            </B>
          ))}
        </Group>

        <Group title="Brand book" lead="The full guidelines, to read, print or send.">
          {!PREVIEW && <B k="pdf" hint="Opens print view → Save as PDF" onClick={() => run('pdf', () => void window.open(`/brand/${brandId}/guidelines?print=1`, '_blank'))}>PDF</B>}
          <B k="html" hint="One file, works offline, prints to PDF" onClick={() => run('html', () => downloadBrandBookHTML(ctx))}>
            Web page (.html)
          </B>
          <B k="md" hint="For Notion, Docs or AI tools" onClick={() => run('md', async () => download(`${slug}-brand-bible.md`, await bibleText('md'), 'text/markdown'))}>
            Markdown
          </B>
          <B k="json" hint="Structured data for developers" onClick={() => run('json', async () => download(`${slug}-brand-bible.json`, await bibleText('json'), 'application/json'))}>
            JSON
          </B>
        </Group>

        <Group title="Logo files" lead="SVG for print and the web, PNG for everything else.">
          <B k="svg" onClick={() => run('svg', () => downloadLogoSVG(kit, 'light'))}>Logo SVG</B>
          <B k="svg-dark" onClick={() => run('svg-dark', () => downloadLogoSVG(kit, 'dark'))}>Reversed SVG</B>
          <B k="svg-mono" onClick={() => run('svg-mono', () => downloadLogoSVG(kit, 'mono'))}>One-colour SVG</B>
          <B k="png" onClick={() => run('png', () => downloadLogoPNG(kit, 'light'))}>Logo PNG</B>
          <B k="png-dark" onClick={() => run('png-dark', () => downloadLogoPNG(kit, 'dark'))}>Reversed PNG</B>
          <B k="icon" onClick={() => run('icon', () => downloadIconSVG(kit))}>App icon SVG</B>
          <B k="icon-png" onClick={() => run('icon-png', () => downloadIconPNG(kit))}>App icon PNG</B>
        </Group>

        <Group title="Website" lead="A first-draft site in your brand, as one HTML file.">
          <B k="site" hint="Open it, edit it or hand it to a developer" onClick={() => run('site', () => downloadWebsiteHTML(ctx))}>
            Website draft (.html)
          </B>
          <button type="button" className="ec-btn" onClick={onOpenWebsite}>
            <span>Preview it & get it built →</span>
          </button>
        </Group>

        <Group title="For developers" lead="Your colours, fonts and corners, ready to paste.">
          <B k="css" hint="CSS variables" onClick={() => run('css', () => downloadTokens(kit, 'css'))}>CSS</B>
          <B k="tailwind" hint="Tailwind theme" onClick={() => run('tailwind', () => downloadTokens(kit, 'tailwind'))}>Tailwind</B>
          <B k="tokens" hint="Design tokens (Figma, Tokens Studio)" onClick={() => run('tokens', () => downloadTokens(kit, 'json'))}>Tokens JSON</B>
          <button
            type="button"
            className="ec-btn"
            onClick={guard(() => navigator.clipboard?.writeText(tokensFile(kit, 'css').text).then(() => toast('CSS variables copied')))}
          >
            <span>Copy CSS</span>
          </button>
        </Group>

        <Group title="Email signature" lead="Paste into Gmail or Outlook signature settings.">
          <div className="row gap-8 wrap" style={{ width: '100%' }}>
            <input className="input" style={{ flex: '1 1 140px', minHeight: 40 }} aria-label="Your name" value={person.name} onChange={(e) => setPerson({ ...person, name: e.target.value })} />
            <input className="input" style={{ flex: '1 1 120px', minHeight: 40 }} aria-label="Your role" value={person.role} onChange={(e) => setPerson({ ...person, role: e.target.value })} />
          </div>
          <input
            className="input"
            style={{ minHeight: 40 }}
            aria-label="Logo image link for Gmail"
            placeholder="Logo link for Gmail (optional): https://…/logo.png"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            inputMode="url"
            autoCapitalize="none"
          />
          <div className="ec-sig" dangerouslySetInnerHTML={{ __html: signature }} />
          <span className="tiny muted">Apple Mail and Outlook keep the logo as pasted. Gmail only shows a logo from a web link: download the PNG, put it on your site, paste its link above.</span>
          <button
            type="button"
            className="ec-btn"
            onClick={guard(async () => {
              try {
                await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([signature], { type: 'text/html' }), 'text/plain': new Blob([`${person.name}\n${person.role}, ${kit.name}\n${ctx.domain}`], { type: 'text/plain' }) })]);
              } catch {
                await navigator.clipboard?.writeText(signature);
              }
              toast('Signature copied');
            })}
          >
            <span>Copy signature</span>
          </button>
          <B k="sig-logo" hint="112 × 112, shown at 56" onClick={() => run('sig-logo', async () => { const b = await signatureLogoPng(kit); if (b) download(`${slug}-email-logo.png`, b); })}>
            Signature logo PNG
          </B>
        </Group>
      </div>
      <p className="tiny muted">All fonts are free Google Fonts. Before you print packaging or file anything, run a trademark search on the name.</p>
    </div>
  );
}

function Group({ title, lead, children, icons, highlight }: { title: string; lead: string; children: ReactNode; icons?: ReactNode; highlight?: boolean }) {
  return (
    <section className={`card stack gap-12${highlight ? ' ec-highlight' : ''}`}>
      <div className="stack gap-4">
        <h3 className="h3 row gap-8 wrap" style={{ fontSize: 19, alignItems: 'center' }}>
          {title}
          {icons}
        </h3>
        <span className="small soft">{lead}</span>
      </div>
      <div className="ec-btns">{children}</div>
    </section>
  );
}
