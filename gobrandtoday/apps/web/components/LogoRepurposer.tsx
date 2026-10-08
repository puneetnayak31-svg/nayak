'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { REPURPOSE_FONTS, REPURPOSE_KINDS, REPURPOSE_META, paletteFromPixels, repurposeColors, repurposeSVG, type RepurposeColors, type RepurposeInput, type RepurposeKind } from '@gbt/shared';
import { track } from '@/lib/api';
import { downloadRepurposed, downloadRepurposedZip, ensureFont } from '@/lib/export';
import { useApp } from '@/lib/providers';
import { PlatformIcon } from './PlatformIcons';
import { useSignupGate } from './SignupGate';
import { Spark } from './Spark';

const MAX_BYTES = 5 * 1024 * 1024;
const KEY = 'gbt:repurpose';

interface Logo {
  href: string;
  w: number;
  h: number;
  bg: string | null;
  main: string | null;
  palette: string[];
}

/** A sample logo so the tool can be tried without a file. */
const SAMPLE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 160"><circle cx="80" cy="80" r="62" fill="#0F766E"/><path d="M52 98c10-30 46-52 60-34-22 0-36 18-38 40z" fill="#FBBF24"/><text x="160" y="104" font-family="Georgia, serif" font-size="68" font-weight="700" fill="#0F172A">Tealeaf</text></svg>',
)}`;

const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

/** Read an image, downscale big rasters, and sample its colours and background. */
async function readLogo(src: string, isSvg: boolean): Promise<Logo> {
  const img = new Image();
  img.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('unreadable'));
    img.src = src;
  });
  const w = img.naturalWidth || 480;
  const h = img.naturalHeight || 160;
  const scale = Math.min(1, 1600 / Math.max(w, h));
  let href = src;
  if (!isSvg && scale < 1) {
    const big = document.createElement('canvas');
    big.width = Math.round(w * scale);
    big.height = Math.round(h * scale);
    big.getContext('2d')!.drawImage(img, 0, 0, big.width, big.height);
    href = big.toDataURL('image/png');
  }
  const sw = Math.max(1, Math.round((w / Math.max(w, h)) * 160));
  const sh = Math.max(1, Math.round((h / Math.max(w, h)) * 160));
  const c = document.createElement('canvas');
  c.width = sw;
  c.height = sh;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, sw, sh);
  const { data } = ctx.getImageData(0, 0, sw, sh);
  let transparent = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i]! < 240) {
      transparent = true;
      break;
    }
  }
  const bg = transparent ? null : toHex(data[0]!, data[1]!, data[2]!);
  const palette = paletteFromPixels(data, 6);
  const main = palette.find((p) => p !== bg) ?? palette[0] ?? null;
  return { href, w, h, bg, main, palette };
}

function load(): Partial<{ logo: Logo; name: string; tagline: string; website: string; font: string; style: 'brand' | 'light'; colors: RepurposeColors }> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

/**
 * "Already have a logo?" Upload it and get a profile picture, a launch post,
 * LinkedIn, X and YouTube banners and a one-page brand guidelines sheet.
 * Everything happens in the browser: the file is never uploaded.
 */
export function LogoRepurposer({ focus }: { focus?: RepurposeKind }) {
  const { toast } = useApp();
  const { guard, gate } = useSignupGate();
  const [logo, setLogo] = useState<Logo | null>(null);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [website, setWebsite] = useState('');
  const [font, setFont] = useState<string>(REPURPOSE_FONTS[0]);
  const [style, setStyle] = useState<'brand' | 'light'>('brand');
  const [colors, setColors] = useState<RepurposeColors | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  // Keep the work across the sign-up round trip (session only, this browser only).
  useEffect(() => {
    const s = load();
    if (s.logo) setLogo(s.logo);
    if (s.name) setName(s.name);
    if (s.tagline) setTagline(s.tagline);
    if (s.website) setWebsite(s.website);
    if (s.font) setFont(s.font);
    if (s.style) setStyle(s.style);
    if (s.colors) setColors(s.colors);
  }, []);
  useEffect(() => {
    if (!logo) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ logo, name, tagline, website, font, style, colors }));
    } catch {
      /* too big or blocked: fine, it only saves a re-upload */
    }
  }, [logo, name, tagline, website, font, style, colors]);
  useEffect(() => {
    void ensureFont(font);
  }, [font]);

  const take = async (f: File | undefined) => {
    setErr(null);
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(f.type)) return setErr('Use a PNG, JPG, WebP or SVG file.');
    if (f.size > MAX_BYTES) return setErr('That file is over 5 MB. Export a smaller PNG (1000–2000 px wide is plenty).');
    const src = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(f);
    });
    try {
      const l = await readLogo(src, f.type === 'image/svg+xml');
      setLogo(l);
      setColors(repurposeColors(l.palette));
      if (!name) setName(f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').replace(/\blogo\b/i, '').trim().replace(/\b\w/g, (m) => m.toUpperCase()));
      track('tool_used', { tool: 'repurpose' });
    } catch {
      setErr('We couldn’t read that image. Try a PNG with a transparent background.');
    }
  };

  const sample = async () => {
    const l = await readLogo(SAMPLE, true);
    setLogo(l);
    setColors(repurposeColors(l.palette));
    setName('Tealeaf');
    setTagline('Small-batch teas, picked for the way you brew');
    setWebsite('tealeaf.in');
  };

  const input = useMemo<RepurposeInput | null>(() => (logo && colors ? { name: name || 'Your brand', tagline, website, logo, colors, font, style } : null), [logo, colors, name, tagline, website, font, style]);
  // Rows whose items share a height (each grows by its aspect ratio); the page's own asset leads.
  const rows = useMemo(() => {
    const social: RepurposeKind[][] = [['avatar', 'post', 'youtube'], ['x', 'linkedin']].map((r) => r.filter((k) => k !== focus) as RepurposeKind[]);
    // A banner left on its own row would stretch to full width: fold it into the other row.
    const lone = social.findIndex((r) => r.length === 1);
    const merged = lone >= 0 ? [social.flat()] : social;
    return [...(focus ? [[focus]] : []), ...merged, ...(focus === 'guidelines' ? [] : [['guidelines'] as RepurposeKind[]])].filter((r) => r.length);
  }, [focus]);

  const run = (key: string, fn: () => Promise<void>) =>
    guard(async () => {
      setBusy(key);
      track('export', { format: `repurpose-${key}` });
      try {
        await fn();
      } catch {
        toast('That download didn’t work. Try again.', 'error');
      } finally {
        setBusy(null);
      }
    })();

  return (
    <div className="rp stack gap-20">
      {gate}
      <div className="rp-top">
        <div
          className={`rp-drop${over ? ' over' : ''}${logo ? ' has' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            void take(e.dataTransfer.files[0]);
          }}
        >
          {logo ? (
            <div className="rp-logo" style={{ background: logo.bg ?? 'repeating-conic-gradient(#f1eff7 0 25%, #fff 0 50%) 0 0/16px 16px' }}>
              <img src={logo.href} alt="Your logo" />
            </div>
          ) : (
            <span className="rp-drop-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26">
                <path d="M12 16V5m0 0-4.5 4.5M12 5l4.5 4.5M5 19h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
          <div className="stack gap-4" style={{ alignItems: 'center', textAlign: 'center' }}>
            <b>{logo ? 'Your logo' : 'Drop your logo here'}</b>
            <span className="tiny muted">PNG with a transparent background works best · JPG, WebP, SVG · up to 5 MB</span>
          </div>
          <div className="row gap-8 wrap" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn btn-dark btn-sm" onClick={() => file.current?.click()}>
              {logo ? 'Change logo' : 'Choose a file'}
            </button>
            {!logo && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void sample()}>
                Try a sample logo
              </button>
            )}
          </div>
          <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => void take(e.target.files?.[0])} />
          <span className="tiny muted rp-private">🔒 Your logo stays in your browser. Nothing is uploaded.</span>
        </div>

        <div className="card stack gap-12 rp-form">
          <div className="grid-2 rp-fields">
            <label className="stack gap-6">
              <span className="label">Brand name</span>
              <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Tealeaf" />
            </label>
            <label className="stack gap-6">
              <span className="label">Website (optional)</span>
              <input className="input" value={website} maxLength={60} onChange={(e) => setWebsite(e.target.value)} placeholder="tealeaf.in" inputMode="url" autoCapitalize="none" />
            </label>
          </div>
          <label className="stack gap-6">
            <span className="label">Tagline or launch line (optional)</span>
            <input className="input" value={tagline} maxLength={90} onChange={(e) => setTagline(e.target.value)} placeholder="Small-batch teas, picked for the way you brew" />
          </label>
          <div className="grid-2 rp-fields">
            <label className="stack gap-6">
              <span className="label">Font for the words</span>
              <select className="input select" value={font} onChange={(e) => setFont(e.target.value)}>
                {REPURPOSE_FONTS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
            <div className="stack gap-6">
              <span className="label">Backgrounds</span>
              <div className="seg" role="group" aria-label="Background style">
                <button type="button" aria-pressed={style === 'brand'} onClick={() => setStyle('brand')}>
                  Brand colour
                </button>
                <button type="button" aria-pressed={style === 'light'} onClick={() => setStyle('light')}>
                  Light
                </button>
              </div>
            </div>
          </div>
          {colors && (
            <div className="stack gap-6">
              <span className="label">Colours, picked from your logo (tap to change)</span>
              <div className="rp-swatches">
                {(['brand', 'accent', 'ink', 'paper'] as const).map((k) => (
                  <label key={k} className="rp-swatch">
                    <input type="color" value={colors[k].toLowerCase()} onChange={(e) => setColors({ ...colors, [k]: e.target.value.toUpperCase() })} aria-label={`${k} colour`} />
                    <span className="stack">
                      <b className="small" style={{ textTransform: 'capitalize' }}>
                        {k}
                      </b>
                      <span className="tiny mono muted">{colors[k]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {err && <div className="notice error">{err}</div>}
        </div>
      </div>

      {input ? (
        <>
          <div className="row between wrap gap-12" style={{ alignItems: 'center' }}>
            <div className="stack gap-4">
              <span className="eyebrow">
                <Spark size={11} /> Your social kit
              </span>
              <span className="small soft">Six files at each platform’s exact size, with words and logo inside the safe areas.</span>
            </div>
            <button type="button" className="btn btn-primary" disabled={!!busy} onClick={() => run('zip', () => downloadRepurposedZip(input))}>
              {busy === 'zip' ? 'Packing…' : 'Download all (.zip)'}
            </button>
          </div>
          <div className="rp-rows">
            {rows.map((row) => (
              <div key={row.join()} className="rp-row">
                {row.map((k) => (
                  <RepurposeCard key={k} kind={k} input={input} single={row.length === 1} featured={k === focus} busy={busy === k} onDownload={() => run(k, () => downloadRepurposed(k, input))} />
                ))}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rp-empty">
          {REPURPOSE_KINDS.map((k) => (
            <span key={k} className="rp-ghost">
              {REPURPOSE_META[k].platform ? <PlatformIcon id={REPURPOSE_META[k].platform!} size={18} /> : <Spark size={12} />}
              {REPURPOSE_META[k].title}
              <span className="tiny muted">{REPURPOSE_META[k].size}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function RepurposeCard({ kind, input, single, featured, busy, onDownload }: { kind: RepurposeKind; input: RepurposeInput; single: boolean; featured: boolean; busy: boolean; onDownload: () => void }) {
  const m = REPURPOSE_META[kind];
  // Inline (not <img>) so the chosen Google Font shows in the preview. User text is escaped by repurposeSVG.
  const svg = useMemo(() => repurposeSVG(kind, input).replace('<svg ', '<svg style="display:block;width:100%;height:auto" '), [kind, input]);
  const cap = single ? (kind === 'avatar' || kind === 'post' ? 420 : kind === 'guidelines' ? 920 : undefined) : undefined;
  return (
    <figure className={`rp-card${featured ? ' featured' : ''}`} style={{ flexGrow: m.w / m.h, maxWidth: cap }}>
      <div className={`rp-art${kind === 'avatar' ? ' round' : ''}`} dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption className="row between gap-8">
        <span className="row gap-8" style={{ alignItems: 'center', minWidth: 0 }}>
          {m.platform ? <PlatformIcon id={m.platform} size={22} /> : <span className="rp-dot" aria-hidden="true" />}
          <span className="stack" style={{ minWidth: 0 }}>
            <b className="small">{m.title}</b>
            <span className="tiny muted">{m.size}</span>
          </span>
        </span>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={onDownload}>
          {busy ? '…' : 'PNG ↓'}
        </button>
      </figcaption>
    </figure>
  );
}
