'use client';

import { useMemo, type CSSProperties, type ReactNode } from 'react';
import {
  LOGO_STYLE_META,
  MARK_PATHS,
  SECTOR_META,
  SYMBOL_META,
  contrast,
  drawSymbol,
  hexToCmyk,
  hexToRgb,
  onColor,
  swatch,
  sectorForKit,
  toSlug,
  type BrandKit,
} from '@gbt/shared';
import { useApp } from '@/lib/providers';
import { KitIcon, KitLogo, Logo, lookIdentity } from './Logo';
import { MockupGrid, ToolkitGrid } from './Mockups';
import { Mark } from './Spark';
import { useGoogleFonts } from './ui';

/**
 * A user's brand guidelines, structured like a studio brand book:
 * essence → logo system → clear space & sizes → backgrounds → misuse →
 * colour (HEX/RGB/CMYK, proportions, contrast) → type scale → pattern →
 * toolkit → imagery → voice & UI → applications (industry mockups first) → other looks.
 * Printable to PDF.
 */
export function BrandGuidelines({
  kit,
  domain,
  handle,
  version,
  score,
  onSwitchLook,
  onGenerateImagery,
  imageryBusy,
}: {
  kit: BrandKit;
  domain?: string | null;
  handle?: string | null;
  version?: number;
  score?: number | null;
  onSwitchLook?: (lookId: string) => void;
  /** When set, the imagery section offers "Generate with AI". */
  onGenerateImagery?: (kind: 'moodboard' | 'concepts') => void;
  imageryBusy?: 'moodboard' | 'concepts' | null;
}) {
  const styleMeta = LOGO_STYLE_META[kit.identity.style ?? 'twinkle'];
  const { toast } = useApp();
  const t = kit.identity.typography;
  useGoogleFonts([t.display, t.body, t.data]);
  const p = kit.identity.palette;
  const ink = swatch(p, 'ink');
  const brand = swatch(p, 'brand');
  const accent = swatch(p, 'accent');
  const tint = swatch(p, 'tint');
  const paper = swatch(p, 'paper');
  const display = `'${t.display.family}', var(--font-display)`;
  const body = `'${t.body.family}', var(--font-body)`;
  const mono = `'${t.data.family}', var(--font-mono)`;
  // The page around the specimens speaks in GoBrandToday's own type; the brand's fonts appear only where they are
  // being shown off (the name, the promise, type specimens and voice samples).
  const uiDisplay = 'var(--font-display)';
  const uiBody = 'var(--font-body)';
  const uiMono = 'var(--font-mono)';
  const dw = Math.max(...t.display.weights);
  const line = 'rgba(22,22,26,0.1)';
  const muted = '#4D4870';
  const handleText = handle ?? toSlug(kit.name).replace(/-/g, '');
  const domainText = domain ?? `${toSlug(kit.name)}.com`;
  const fam = kit.identity.symbol?.family as keyof typeof SYMBOL_META | undefined;
  const symbolName = kit.identity.symbol?.svg ? 'Custom symbol' : fam && SYMBOL_META[fam] ? SYMBOL_META[fam].label : MARK_PATHS[kit.identity.mark.shape]?.label ?? 'Mark';
  const essence = kit.identity.essence;

  let n = 0;
  const head = (title: string, lead?: string) => {
    n += 1;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span style={{ fontFamily: uiMono, fontSize: 14, color: muted }}>{String(n).padStart(2, '0')}</span>
          <h2 style={{ fontFamily: uiDisplay, fontSize: 'clamp(26px,3vw,36px)', letterSpacing: '-0.03em', fontWeight: 700, margin: 0 }}>{title}</h2>
        </div>
        {lead && <p style={{ margin: 0, maxWidth: 720, fontSize: 16, lineHeight: 1.55, color: '#36315A' }}>{lead}</p>}
      </div>
    );
  };
  const card: CSSProperties = { borderRadius: 20, background: '#fff', border: `1px solid ${line}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 };
  const grid = (min: number): CSSProperties => ({ display: 'grid', gap: 18, gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))` });
  const label: CSSProperties = { fontFamily: uiMono, fontSize: 12, letterSpacing: '0.08em', color: muted, textTransform: 'uppercase' };

  /* -------------------------- derived visuals -------------------------- */
  const pattern = useMemo(() => {
    const cells: string[] = [];
    const s = 46;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 9; c++) {
        const x = c * 64 + (r % 2 ? 32 : 0) - 16;
        const y = r * 60 - 10;
        const col = (r + c) % 3 === 0 ? accent : onColor(brand) === '#FFFFFF' ? paper : ink;
        if (kit.identity.symbol) {
          cells.push(`<g opacity="${(r + c) % 3 === 0 ? 0.95 : 0.22}">${drawSymbol(kit.identity.symbol, `${kit.name}:${kit.identity.seed}`, { brand: col, accent: col, ink: col, tint: col, paper: 'none' }, x, y, s)}</g>`);
        } else {
          const m = MARK_PATHS[kit.identity.mark.shape];
          cells.push(`<path d="${m.d}" fill="${col}" opacity="${(r + c) % 3 === 0 ? 0.95 : 0.22}" transform="translate(${x} ${y}) scale(${s / 64}) rotate(${(r * c * 15) % 45} 32 32)"/>`);
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 270" preserveAspectRatio="xMidYMid slice" style="display:block;width:100%;height:100%"><rect width="560" height="270" fill="${brand}"/>${cells.join('')}</svg>`;
  }, [kit, brand, accent, ink, paper]);

  const pairs: Array<[string, string, string]> = [
    ['Ink on Paper', ink, paper],
    ['Paper on Ink', paper, ink],
    [`Text on ${p.find((x) => x.role === 'brand')?.name ?? 'Brand'}`, onColor(brand), brand],
    [`${p.find((x) => x.role === 'brand')?.name ?? 'Brand'} on Paper`, brand, paper],
    ['Ink on Tint', ink, tint],
    [`${p.find((x) => x.role === 'accent')?.name ?? 'Accent'} on Ink`, accent, ink],
  ];
  const rating = (r: number) => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA large' : 'Decorative only');
  const proportions: Array<[string, number]> = [
    [paper, 46],
    [ink, 26],
    [brand, 16],
    [tint, 8],
    [accent, 4],
  ];
  const scale = [
    { name: 'Display', size: 56, lh: 1.05, family: display, weight: dw, sample: kit.taglines[0] ?? kit.name, ls: '-0.04em' },
    { name: 'Heading', size: 36, lh: 1.15, family: display, weight: dw, sample: kit.website.features[0]?.title ?? kit.name, ls: '-0.03em' },
    { name: 'Subhead', size: 24, lh: 1.3, family: display, weight: Math.min(...t.display.weights), sample: kit.messaging.oneLiner, ls: '-0.02em' },
    { name: 'Body', size: 17, lh: 1.6, family: body, weight: t.body.weights[0] ?? 400, sample: kit.messaging.short, ls: '0' },
    { name: 'Small', size: 14, lh: 1.5, family: body, weight: t.body.weights[0] ?? 400, sample: kit.website.contact, ls: '0' },
    { name: 'Label', size: 12, lh: 1.4, family: mono, weight: 400, sample: `${domainText.toUpperCase()} · @${handleText.toUpperCase()}`, ls: '0.12em' },
  ];

  return (
    <div className="guidelines" style={{ background: paper, color: ink, fontFamily: uiBody, borderRadius: 28, border: `1px solid ${line}`, padding: 'clamp(20px, 5vw, 64px)', display: 'flex', flexDirection: 'column', gap: 'clamp(48px,6vw,72px)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', borderBottom: `1px solid ${line}`, paddingBottom: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
          <div style={{ ...label, fontSize: 13, letterSpacing: '0.12em' }}>Brand guidelines · {styleMeta.title}</div>
          <h1 style={{ fontFamily: uiDisplay, fontWeight: 700, fontSize: 'clamp(44px,6vw,72px)', lineHeight: 1, letterSpacing: '-0.04em', margin: 0 }}>{kit.name}</h1>
          <p style={{ fontSize: 'clamp(17px,1.8vw,21px)', lineHeight: 1.45, color: '#36315A', margin: 0 }}>{kit.identity.mark.concept}</p>
        </div>
        <div style={{ fontFamily: uiMono, fontSize: 13, color: muted, textAlign: 'right', lineHeight: 1.7 }}>
          {domainText}
          <br />v{version ?? 1}.0 · {new Date().getFullYear()}
        </div>
      </header>

      {/* Essence */}
      <Section>
        {head('Brand essence', 'Everything else in this book follows from these few lines.')}
        <div style={{ ...grid(280), alignItems: 'stretch' }}>
          <div style={{ ...card, background: ink, color: paper, border: 'none', padding: 28, justifyContent: 'space-between', gridColumn: 'span 1' }}>
            <span style={{ ...label, color: '#B5B5BD' }}>Our promise</span>
            <span style={{ fontFamily: display, fontWeight: dw, fontSize: 'clamp(26px,3vw,34px)', lineHeight: 1.15, letterSpacing: '-0.03em' }}>{essence?.promise ?? kit.messaging.oneLiner}</span>
            <span style={{ fontSize: 14, color: '#B5B5BD' }}>
              {kit.archetype.name} · {kit.voice.summary}
            </span>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {(essence?.values ?? kit.personality.slice(0, 3).map((x) => ({ name: x, meaning: '' }))).slice(0, 3).map((v, i) => (
              <div key={v.name} style={{ ...card, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ width: 30, height: 30, borderRadius: 10, background: i === 0 ? brand : i === 1 ? accent : tint, flex: 'none' }} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <b style={{ fontSize: 16.5 }}>{v.name}</b>
                  {v.meaning && <span style={{ fontSize: 14.5, lineHeight: 1.5, color: '#36315A' }}>{v.meaning}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={grid(240)}>
          {[
            ['What the name means', kit.meaning],
            ['Positioning', kit.positioning],
            ['Who it’s for', kit.audience.primary],
          ].map(([h, b]) => (
            <div key={h} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={label}>{h}</span>
              <p style={{ fontSize: 16.5, lineHeight: 1.55, color: '#36315A', margin: 0 }}>{b}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Logo */}
      <Section>
        {head('Logo', `${styleMeta.construction} ${kit.identity.symbol ? `The symbol (${symbolName.toLowerCase()}) also works on its own.` : ''}`)}
        <div style={grid(260)}>
          <div style={{ ...card, padding: 18 }}>
            <span style={label}>Logo type</span>
            <b style={{ fontSize: 17 }}>{styleMeta.type}</b>
            <span style={{ fontSize: 14.5, lineHeight: 1.5, color: '#36315A' }}>{styleMeta.typeNote}</span>
          </div>
          {fam && SYMBOL_META[fam] && !kit.identity.symbol?.svg && (
            <div style={{ ...card, padding: 18 }}>
              <span style={label}>How the symbol reads</span>
              <b style={{ fontSize: 17 }}>{SYMBOL_META[fam].feel}</b>
              <span style={{ fontSize: 14.5, lineHeight: 1.5, color: '#36315A' }}>Watch for: {SYMBOL_META[fam].caution}</span>
            </div>
          )}
        </div>
        <div className="gl-hero">
          <div style={{ minHeight: 300, borderRadius: 28, background: '#fff', border: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px,4vw,48px)', overflow: 'hidden' }}>
            <KitLogo kit={kit} width="min(100%, 560px)" maxHeight={240} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ flex: 1, minHeight: 140, borderRadius: 28, background: ink, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }}>
              <KitLogo kit={kit} variant="dark" width="min(100%, 260px)" maxHeight={100} />
            </div>
            <div style={{ flex: 1, minHeight: 140, borderRadius: 28, background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 20 }}>
              <KitIcon kit={kit} size={88} />
              {!kit.identity.symbol && <Mark shape={kit.identity.mark.shape} size={28} color={brand} />}
            </div>
          </div>
        </div>
        <div style={grid(200)}>
          {[
            { label: 'Primary', bg: '#fff', el: <KitLogo kit={kit} width="86%" maxHeight={100} />, note: 'Default on light backgrounds.' },
            { label: 'Reversed', bg: ink, el: <KitLogo kit={kit} variant="dark" width="86%" maxHeight={100} />, note: 'On ink, photos and dark UI.' },
            { label: 'Single colour', bg: '#fff', el: <KitLogo kit={kit} variant="mono" width="86%" maxHeight={100} />, note: 'Stamps, embossing, one-colour print.' },
            { label: 'White (reverse)', bg: brand, el: <KitLogo kit={kit} variant="reverse" width="86%" maxHeight={100} />, note: 'On brand colour, photos and busy surfaces.' },
            { label: kit.identity.symbol ? 'Symbol / app icon' : 'App icon', bg: paper, el: <KitIcon kit={kit} size={84} />, note: 'Avatars, favicons and app stores.' },
          ].map((x) => (
            <div key={x.label} style={{ ...card, padding: 14 }}>
              <div style={{ height: 130, borderRadius: 14, background: x.bg, border: x.bg === '#fff' || x.bg === paper ? `1px solid ${line}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{x.el}</div>
              <b style={{ fontSize: 15 }}>{x.label}</b>
              <span style={{ fontSize: 13.5, color: muted }}>{x.note}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Clear space & size */}
      <Section>
        {head('Clear space & minimum size', kit.identity.usageRules.clearSpace)}
        <div style={grid(300)}>
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div className="gl-clearspace" style={{ ['--cs-color' as string]: brand }}>
              <div className="gl-clearspace-inner">
                <KitLogo kit={kit} width="100%" maxHeight={200} />
                {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
                  <span key={c} className={`gl-x ${c}`}>x</span>
                ))}
              </div>
            </div>
            <span style={{ padding: '0 20px 18px', fontSize: 14, color: muted }}>The shaded zone stays empty: no text, edges or other logos inside it.</span>
          </div>
          <div style={{ ...card, justifyContent: 'space-between' }}>
            <span style={label}>Minimum sizes</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <KitLogo kit={kit} width={120} maxHeight={90} />
                <span style={{ fontFamily: uiMono, fontSize: 12, color: muted }}>Smallest full lockup</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <KitIcon kit={kit} size={32} />
                <span style={{ fontFamily: uiMono, fontSize: 12, color: muted }}>Icon 16–32 px</span>
              </div>
            </div>
            <span style={{ fontSize: 14, color: '#36315A' }}>{kit.identity.usageRules.minSize}</span>
          </div>
        </div>
      </Section>

      {/* Backgrounds */}
      <Section>
        {head('On colour and photography', 'Use the version that keeps the most contrast. When in doubt: primary on light, reversed on dark.')}
        <div style={grid(170)}>
          {[
            { name: 'Paper', bg: paper, v: 'light' as const },
            { name: 'Tint', bg: tint, v: 'light' as const },
            { name: 'Ink', bg: ink, v: 'dark' as const },
            { name: 'Brand', bg: brand, v: (onColor(brand) === '#FFFFFF' ? 'reverse' : 'mono') as 'reverse' | 'mono' },
            { name: 'Photo', bg: `linear-gradient(135deg, ${ink}, ${brand} 70%, ${accent})`, v: 'reverse' as const },
          ].map((x) => (
            <div key={x.name} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 120, borderRadius: 16, background: x.bg, border: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflow: 'hidden' }}>
                <KitLogo kit={kit} variant={x.v} width="84%" maxHeight={84} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{x.name}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Misuse */}
      <Section>
        {head('Please don’t', kit.identity.usageRules.dont)}
        <div style={grid(150)}>
          {[
            { t: 'Stretch or squash it', s: { transform: 'scaleX(1.45)' } },
            { t: 'Rotate it', s: { transform: 'rotate(-14deg)' } },
            { t: 'Change its colours', s: { filter: 'hue-rotate(150deg) saturate(1.6)' } },
            { t: 'Add shadows or glows', s: { filter: `drop-shadow(3px 3px 0 #ff2bd6) drop-shadow(-3px -2px 0 #00e0ff)` } },
            { t: 'Fade it out', s: { opacity: 0.3 } },
            { t: 'Put it on busy backgrounds', s: {}, busy: true },
          ].map((x) => (
            <div key={x.t} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  position: 'relative',
                  height: 120,
                  borderRadius: 16,
                  background: x.busy ? `repeating-linear-gradient(45deg, ${accent} 0 14px, ${tint} 14px 28px, ${brand} 28px 42px)` : '#fff',
                  border: `1px solid ${line}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  overflow: 'hidden',
                }}
              >
                <div style={{ width: '70%', ...(x.s as CSSProperties) }}>
                  <KitLogo kit={kit} width="100%" maxHeight={80} />
                </div>
                <span className="gl-no" aria-hidden="true">
                  ✕
                </span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#B42318' }}>{x.t}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Colour */}
      <Section>
        {head('Colour', 'Five colours with clear jobs. Tap a swatch to copy its HEX.')}
        <div style={grid(160)}>
          {p.map((s) => {
            const [r, g, b] = hexToRgb(s.hex);
            const [c, m, y, k] = hexToCmyk(s.hex);
            return (
              <button
                key={s.role}
                type="button"
                onClick={() => navigator.clipboard?.writeText(s.hex).then(() => toast(`${s.hex} copied`))}
                style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
                aria-label={`Copy ${s.name} ${s.hex}`}
              >
                <div className="swatch" style={{ background: s.hex, height: 140, border: s.role === 'paper' || s.role === 'tint' ? `1px solid ${line}` : undefined, display: 'flex', alignItems: 'flex-end', padding: 12 }}>
                  <span style={{ fontFamily: uiMono, fontSize: 12, color: onColor(s.hex), opacity: 0.85 }}>{s.role.toUpperCase()}</span>
                </div>
                <b style={{ fontSize: 16.5 }}>{s.name}</b>
                <span style={{ fontFamily: uiMono, fontSize: 12.5, lineHeight: 1.6, color: '#36315A' }}>
                  HEX {s.hex}
                  <br />
                  RGB {r} {g} {b}
                  <br />
                  CMYK {c} {m} {y} {k}
                </span>
                <span style={{ fontSize: 13.5, color: muted }}>{s.usage}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={label}>Proportion: how much of each, roughly</span>
          <div style={{ display: 'flex', height: 44, borderRadius: 12, overflow: 'hidden', border: `1px solid ${line}` }}>
            {proportions.map(([hex, w]) => (
              <div key={hex + w} style={{ width: `${w}%`, background: hex, display: 'flex', alignItems: 'center', paddingLeft: 10, fontFamily: uiMono, fontSize: 11.5, color: onColor(hex) }}>
                {w >= 8 ? `${w}%` : ''}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={label}>Accessible pairings (WCAG contrast)</span>
          <div style={grid(280)}>
            {pairs.map(([name, fg, bg]) => {
              const r = contrast(fg, bg);
              return (
                <div key={name} style={{ borderRadius: 14, background: bg, border: `1px solid ${line}`, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: fg, fontFamily: display, fontWeight: dw, fontSize: 22 }}>Aa</span>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', color: fg, fontSize: 12 }}>
                    <b>{rating(r)}</b>
                    <span style={{ fontFamily: uiMono, opacity: 0.8 }}>
                      {r.toFixed(1)}:1 · {name}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Typography */}
      <Section>
        {head('Typography', `${t.display.family} for headlines, ${t.body.family} for reading, ${t.data.family} for details. All free on Google Fonts.`)}
        <div style={grid(240)}>
          {[
            { k: 'Display', f: t.display, ff: display, sample: 'Aa Bb 123' },
            { k: 'Body', f: t.body, ff: body, sample: 'Aa Bb 123' },
            { k: 'Data', f: t.data, ff: mono, sample: 'Aa Bb 123' },
          ].map((x) => (
            <div key={x.k} style={{ ...card, padding: 24 }}>
              <span style={label}>
                {x.k} · {x.f.family} {x.f.weights.join('/')}
              </span>
              <span style={{ fontFamily: x.ff, fontWeight: Math.max(...x.f.weights), fontSize: 46, lineHeight: 1.1, letterSpacing: x.k === 'Display' ? '-0.04em' : 0 }}>{x.sample}</span>
              <span style={{ fontSize: 14.5, lineHeight: 1.5, color: '#36315A' }}>{x.f.why}</span>
            </div>
          ))}
        </div>
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {scale.map((s, i) => (
            <div key={s.name} className="gl-type-row" style={{ borderTop: i ? `1px solid ${line}` : 'none' }}>
              <span style={{ fontFamily: uiMono, fontSize: 12, color: muted, lineHeight: 1.5 }}>
                {s.name}
                <br />
                {s.size}/{Math.round(s.size * s.lh)} · {s.weight}
              </span>
              <span style={{ fontFamily: s.family, fontSize: `clamp(${Math.min(s.size, 16)}px, ${(s.size / 12).toFixed(2)}vw, ${s.size}px)`, lineHeight: s.lh, fontWeight: s.weight, letterSpacing: s.ls, textTransform: s.name === 'Label' ? 'uppercase' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{s.sample}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Pattern & graphic language */}
      <Section>
        {head('Graphic language', `${kit.identity.designSystem.illustration} ${kit.identity.designSystem.iconography}`)}
        <div style={grid(280)}>
          <div style={{ borderRadius: 20, overflow: 'hidden', minHeight: 200, border: `1px solid ${line}` }} dangerouslySetInnerHTML={{ __html: pattern }} />
          <div style={{ ...card, justifyContent: 'center' }}>
            <span style={label}>Pattern</span>
            <span style={{ fontSize: 15.5, lineHeight: 1.55, color: '#36315A' }}>
              Built from the {symbolName.toLowerCase()}. Use it on packaging, backgrounds, stickers and slide covers, never behind the logo itself.
            </span>
            <span style={label}>Corners & spacing</span>
            <span style={{ fontSize: 15.5, lineHeight: 1.55, color: '#36315A' }}>
              {kit.identity.designSystem.radius} {kit.identity.designSystem.spacing}
            </span>
          </div>
        </div>
      </Section>

      {/* Toolkit */}
      <Section>
        {head('Brand toolkit', 'The graphic elements that sit around the logo, all drawn from one graphic device. Use one device, one pattern and one accent per surface.')}
        <ToolkitGrid kit={kit} domain={domainText} handle={handleText} />
      </Section>

      {/* Imagery */}
      <Section>
        {head('Imagery', kit.identity.designSystem.photography)}
        <Moodboard kit={kit} onGenerate={onGenerateImagery} busy={imageryBusy} />
      </Section>

      {/* Voice & UI */}
      <Section>
        {head('Voice & interface')}
        <div style={grid(360)}>
          <div style={{ background: '#fff', border: `1px solid ${line}`, borderRadius: 28, padding: 'clamp(24px,3vw,40px)', display: 'flex', flexDirection: 'column', gap: 18, fontFamily: body }}>
            <span style={label}>UI sample</span>
            <label style={{ fontWeight: 700, fontSize: 17 }} htmlFor={`ui-${kit.name}`}>
              {kit.website.headline}
            </label>
            <input id={`ui-${kit.name}`} readOnly placeholder={kit.website.subheadline.slice(0, 60)} style={{ height: 54, borderRadius: 16, border: '1.5px solid #C9C4DC', padding: '0 18px', fontFamily: body, fontSize: 16, background: paper }} />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ height: 50, padding: '0 22px', borderRadius: 16, background: brand, color: onColor(brand), fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 10 }}>{kit.website.cta}</span>
              <span style={{ height: 50, padding: '0 22px', borderRadius: 16, border: `1.5px solid ${ink}`, background: '#fff', fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>Learn more</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {kit.personality.slice(0, 3).map((x, i) => (
                <span key={x} style={{ padding: '8px 15px', borderRadius: 999, background: i === 0 ? tint : '#fff', border: i === 0 ? 'none' : '1px solid #C9C4DC', fontSize: 15, fontWeight: 500 }}>
                  {x}
                </span>
              ))}
            </div>
            <div style={{ background: ink, color: '#fff', borderRadius: 20, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ fontFamily: mono, fontSize: 12.5, color: tint }}>{kit.name.toUpperCase()}</span>
                <span style={{ fontFamily: display, fontWeight: dw, fontSize: 24, letterSpacing: '-0.03em' }}>{kit.taglines[1] ?? kit.taglines[0]}</span>
              </div>
              <KitIcon kit={kit} size={40} />
            </div>
          </div>
          <div style={{ background: ink, color: paper, borderRadius: 28, padding: 'clamp(24px,3vw,40px)', display: 'flex', flexDirection: 'column', gap: 22 }}>
            <span style={{ ...label, color: '#B5B5BD' }}>Voice</span>
            <div style={{ fontFamily: uiDisplay, fontWeight: 700, fontSize: 26, letterSpacing: '-0.03em' }}>{kit.voice.summary}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: tint }}>WE SAY</span>
              {kit.voice.say.slice(0, 3).map((s) => (
                <span key={s} style={{ fontSize: 17.5 }}>
                  {s}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#B5B5BD' }}>WE DON’T SAY</span>
              {kit.voice.not.slice(0, 2).map((s) => (
                <span key={s} style={{ fontSize: 17.5, color: '#B5B5BD', textDecoration: 'line-through' }}>
                  {s}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #34343C', paddingTop: 20 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>PRINCIPLES</span>
              {kit.voice.principles.slice(0, 3).map((s) => (
                <span key={s} style={{ fontSize: 15.5, color: '#DCDCE2' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Applications */}
      <Section>
        {head('Applications', `How the identity lives in the world, starting with the objects a ${SECTOR_META[sectorForKit(kit)].label.toLowerCase()} brand actually uses. Every mockup uses your real logo, colours and type.`)}
        <MockupGrid kit={kit} domain={domainText} handle={handleText} download />
      </Section>

      {kit.identity.looks.length > 1 && (
        <Section print={false}>
          {head('Other looks we explored', 'Changed your mind? Switch any time; everything in this book rebuilds around the new look.')}
          <div style={grid(240)}>
            {kit.identity.looks
              .filter((l) => !(l.style === kit.identity.style && l.seed === kit.identity.seed))
              .map((l) => (
                <div key={l.id} style={{ ...card, padding: 16 }}>
                  <div style={{ height: 120, borderRadius: 14, background: '#FAFAF7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 12 }}>
                    <Logo id={lookIdentity(kit.name, l)} width="90%" maxHeight={96} />
                  </div>
                  <b style={{ fontSize: 15 }}>{l.title}</b>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: '#36315A' }}>{l.concept}</span>
                  {onSwitchLook && (
                    <button type="button" className="btn btn-ghost btn-xs" style={{ alignSelf: 'flex-start' }} onClick={() => onSwitchLook(l.id)}>
                      Switch to this look
                    </button>
                  )}
                </div>
              ))}
          </div>
        </Section>
      )}

      <footer style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontFamily: uiMono, fontSize: 12.5, color: muted, borderTop: `1px solid ${line}`, paddingTop: 22 }}>
        <span>
          {kit.name} · made with gobrandtoday
          <span style={{ color: '#6D4AFF' }}>✦</span>
        </span>
        <span>Fonts: Google Fonts (free, open licence)</span>
      </footer>
    </div>
  );
}

function Section({ children, print = true }: { children: ReactNode; print?: boolean }) {
  return (
    <section className={`gl-section ${print ? '' : 'no-print'}`} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {children}
    </section>
  );
}

/** Imagery direction: AI-generated photos when available, otherwise art-directed placeholders. */
function Moodboard({ kit, onGenerate, busy }: { kit: BrandKit; onGenerate?: (kind: 'moodboard' | 'concepts') => void; busy?: 'moodboard' | 'concepts' | null }) {
  const { system } = useApp();
  const p = kit.identity.palette;
  const items = kit.identity.moodboard?.length
    ? kit.identity.moodboard
    : [
        { caption: 'People and moments', prompt: kit.identity.designSystem.photography },
        { caption: 'Texture and detail', prompt: kit.identity.designSystem.imagery },
        { caption: 'Product in use', prompt: kit.identity.designSystem.social },
        { caption: 'Place', prompt: kit.identity.designSystem.website },
      ];
  const canGenerate = !!onGenerate && system?.images?.live !== false;
  const grads = [
    [swatch(p, 'brand'), swatch(p, 'accent')],
    [swatch(p, 'tint'), swatch(p, 'paper')],
    [swatch(p, 'ink'), swatch(p, 'brand')],
    [swatch(p, 'accent'), swatch(p, 'tint')],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="moodboard">
        {items.slice(0, 4).map((m, i) => (
          <figure key={m.caption + i} className={`mood mood-${i}`}>
            {'imageUrl' in m && m.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.imageUrl} alt={m.caption} loading="lazy" />
            ) : (
              <div className="mood-ph" style={{ background: `linear-gradient(140deg, ${grads[i]![0]}, ${grads[i]![1]})` }}>
                <span style={{ color: onColor(grads[i]![0]!) }}>{m.prompt}</span>
              </div>
            )}
            <figcaption>{m.caption}</figcaption>
          </figure>
        ))}
      </div>
      {kit.identity.concepts?.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <b style={{ fontSize: 15 }}>AI concept sketches</b>
          <span style={{ fontSize: 13.5, color: '#4D4870' }}>Raster explorations from an image model: inspiration for a designer to refine, not a replacement for the vector logo.</span>
          <div className="moodboard concepts">
            {kit.identity.concepts.map((c) => (
              <figure key={c.imageUrl} className="mood">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.imageUrl} alt={c.caption} loading="lazy" />
                <figcaption>{c.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ) : null}
      {canGenerate && (
        <div className="row gap-10 wrap no-print">
          <button type="button" className="btn btn-outline btn-sm" disabled={!!busy} onClick={() => onGenerate!('moodboard')}>
            {busy === 'moodboard' ? 'Generating photos…' : kit.identity.moodboard?.some((m) => m.imageUrl) ? 'Regenerate moodboard' : 'Generate moodboard photos'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => onGenerate!('concepts')}>
            {busy === 'concepts' ? 'Sketching…' : 'AI logo concept sketches'}
          </button>
          <span className="tiny muted">Free image model ({system?.images?.provider ?? 'pollinations'}). Takes about 20 seconds.</span>
        </div>
      )}
    </div>
  );
}
