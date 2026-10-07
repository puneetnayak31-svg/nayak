'use client';

import { IDLE_PATH, LOGO_STYLE_META, MARK_PATHS, THINKING_PATH, onColor, swatch, toSlug, type BrandKit } from '@gbt/shared';
import { useApp } from '@/lib/providers';
import { KitIcon, KitLogo, Logo, lookIdentity } from './Logo';
import { Mark } from './Spark';
import { useGoogleFonts } from './ui';

/**
 * A user's brand guidelines, laid out exactly like GoBrandToday's own
 * (Direction 06 "Twinkle"): logo lockups, idea, motion, colour, type,
 * UI sample + voice, usage rules. Printable to PDF.
 */
export function BrandGuidelines({ kit, domain, handle, version, score, onSwitchLook }: { kit: BrandKit; domain?: string | null; handle?: string | null; version?: number; score?: number | null; onSwitchLook?: (lookId: string) => void }) {
  const markLabel = (k: BrandKit) => MARK_PATHS[k.identity.mark.shape]?.label ?? 'Mark';
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
  const mark = MARK_PATHS[kit.identity.mark.shape];
  const line = 'rgba(22,22,26,0.1)';
  const h2 = { fontFamily: display, fontSize: 'clamp(26px,3vw,36px)', letterSpacing: '-0.03em', fontWeight: Math.max(...t.display.weights) } as const;
  const num = { fontFamily: mono, fontSize: 14, color: '#4D4870' } as const;
  const handleText = handle ?? toSlug(kit.name);
  const domainText = domain ?? `${toSlug(kit.name)}.com`;
  const sectionHead = (n: string, title: string) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
      <span style={num}>{n}</span>
      <h2 style={h2}>{title}</h2>
    </div>
  );

  return (
    <div style={{ background: paper, color: ink, fontFamily: body, borderRadius: 28, border: `1px solid ${line}`, padding: 'clamp(20px, 5vw, 64px)', display: 'flex', flexDirection: 'column', gap: 'clamp(40px,5vw,60px)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', borderBottom: `1px solid ${line}`, paddingBottom: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
          <div style={{ fontFamily: mono, fontSize: 13, letterSpacing: '0.12em', color: '#4D4870' }}>BRAND GUIDELINES · {styleMeta.title.toUpperCase()}</div>
          <h1 style={{ fontFamily: display, fontWeight: Math.max(...t.display.weights), fontSize: 'clamp(44px,6vw,72px)', lineHeight: 1, letterSpacing: '-0.04em' }}>{kit.name}</h1>
          <p style={{ fontSize: 'clamp(17px,1.8vw,21px)', lineHeight: 1.45, color: '#36315A' }}>{kit.identity.mark.concept}</p>
        </div>
        <div style={{ fontFamily: mono, fontSize: 13, color: '#4D4870', textAlign: 'right', lineHeight: 1.7 }}>
          {kit.name}
          <br />
          Brand guidelines v{version ?? 1}.0
        </div>
      </header>

      {/* Logo lockups */}
      <section className="gl-hero">
        <div style={{ minHeight: 300, borderRadius: 28, background: '#fff', border: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px,4vw,48px)', overflow: 'hidden' }}>
          <KitLogo kit={kit} width="min(100%, 560px)" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ flex: 1, minHeight: 140, borderRadius: 28, background: ink, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }}>
            <KitLogo kit={kit} variant="dark" width="min(100%, 260px)" />
          </div>
          <div style={{ flex: 1, minHeight: 140, borderRadius: 28, background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 20 }}>
            <KitIcon kit={kit} size={88} />
            <div style={{ width: 52, height: 52, borderRadius: 14, background: brand, display: 'grid', placeItems: 'center' }}>
              <Mark shape={kit.identity.mark.shape} size={28} color={onColor(brand)} />
            </div>
            <Mark shape={kit.identity.mark.shape} size={26} color={brand} />
          </div>
        </div>
      </section>

      {/* Idea */}
      <section style={{ display: 'grid', gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))' }}>
        {[
          ['The idea', kit.meaning],
          [styleMeta.title, `${styleMeta.construction} Signature mark: the ${mark.label.toLowerCase()} — ${mark.meaning}.`],
          ['Positioning', kit.positioning],
        ].map(([h, b]) => (
          <div key={h} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontFamily: display, fontSize: 22, letterSpacing: '-0.02em' }}>{h}</h3>
            <p style={{ fontSize: 17, lineHeight: 1.55, color: '#36315A' }}>{b}</p>
          </div>
        ))}
      </section>

      {/* Motion */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sectionHead('02', `Motion — dot to ${markLabel(kit).toLowerCase()}`)}
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
          {[
            { t: '1 · Idle', d: kit.identity.motion.idle, svg: <path d={IDLE_PATH} fill={brand} transform="translate(16 16) scale(0.5)" />, dark: false },
            { t: '2 · Thinking', d: kit.identity.motion.thinking, svg: <path d={THINKING_PATH} fill={brand} />, dark: false },
            { t: `3 · ${markLabel(kit)}`, d: kit.identity.motion.mark, svg: <path d={mark.d} fill={brand} fillRule={mark.evenOdd ? 'evenodd' : undefined} />, dark: false },
            {
              t: '4 · Done',
              d: kit.identity.motion.done,
              svg: (
                <>
                  <path d={mark.d} fill={brand} fillRule={mark.evenOdd ? 'evenodd' : undefined} transform="translate(2 10) scale(0.75)" />
                  <path d={MARK_PATHS.spark.d} fill={accent} transform="translate(44 4) scale(0.26)" />
                </>
              ),
              dark: true,
            },
          ].map((m) => (
            <div key={m.t} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ height: 160, borderRadius: 20, background: m.dark ? ink : '#fff', border: m.dark ? 'none' : `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="76" height="76" viewBox="0 0 64 64" aria-hidden="true">
                  {m.svg}
                </svg>
              </div>
              <b style={{ fontSize: 16 }}>{m.t}</b>
              <span style={{ fontSize: 15, color: '#4D4870' }}>{m.d}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Colour */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sectionHead('03', 'Colour')}
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))' }}>
          {p.map((s) => (
            <button
              key={s.role}
              type="button"
              onClick={() => navigator.clipboard?.writeText(s.hex).then(() => toast(`${s.hex} copied`))}
              style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}
              aria-label={`Copy ${s.name} ${s.hex}`}
            >
              <div className="swatch" style={{ background: s.hex, height: 150, border: s.role === 'paper' || s.role === 'tint' ? `1px solid ${line}` : undefined }} />
              <b style={{ fontSize: 17 }}>{s.name}</b>
              <span style={{ fontFamily: mono, fontSize: 15 }}>{s.hex}</span>
              <span style={{ fontSize: 14.5, color: '#4D4870' }}>{s.usage}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sectionHead('04', 'Typography')}
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))' }}>
          <div style={{ border: `1px solid ${line}`, background: '#fff', borderRadius: 24, padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontFamily: mono, fontSize: 12.5, color: '#4D4870' }}>DISPLAY · {t.display.family.toUpperCase()} {Math.max(...t.display.weights)}</span>
            <span style={{ fontFamily: display, fontWeight: Math.max(...t.display.weights), fontSize: 36, lineHeight: 1.1, letterSpacing: '-0.04em' }}>{kit.taglines[0] ?? kit.name}</span>
            <span style={{ fontSize: 15.5, lineHeight: 1.5, color: '#36315A' }}>{t.display.why}</span>
          </div>
          <div style={{ border: `1px solid ${line}`, background: '#fff', borderRadius: 24, padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontFamily: mono, fontSize: 12.5, color: '#4D4870' }}>BODY · {t.body.family.toUpperCase()} {t.body.weights.slice(0, 2).join('/')}</span>
            <span style={{ fontSize: 19, lineHeight: 1.5 }}>{kit.messaging.short}</span>
            <span style={{ fontSize: 15.5, lineHeight: 1.5, color: '#36315A' }}>{t.body.why}</span>
          </div>
          <div style={{ border: `1px solid ${line}`, background: '#fff', borderRadius: 24, padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontFamily: mono, fontSize: 12.5, color: '#4D4870' }}>DATA · {t.data.family.toUpperCase()} 400</span>
            <span style={{ fontFamily: mono, fontSize: 17, lineHeight: 1.7, wordBreak: 'break-all' }}>
              {domainText}
              <br />@{handleText}
              {score != null && (
                <>
                  <br />
                  Score {score.toFixed(1)} / 10
                </>
              )}
            </span>
            <span style={{ fontSize: 15.5, lineHeight: 1.5, color: '#36315A' }}>{t.data.why}</span>
          </div>
        </div>
      </section>

      {/* UI sample + voice */}
      <section style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' }}>
        <div style={{ background: '#fff', border: `1px solid ${line}`, borderRadius: 28, padding: 'clamp(24px,3vw,40px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span style={{ fontFamily: mono, fontSize: 12.5, color: '#4D4870' }}>05 · UI SAMPLE</span>
          <label style={{ fontWeight: 700, fontSize: 17 }} htmlFor={`ui-${kit.name}`}>
            {kit.website.headline}
          </label>
          <input id={`ui-${kit.name}`} readOnly placeholder={kit.website.subheadline.slice(0, 60)} style={{ height: 54, borderRadius: 16, border: '1.5px solid #C9C4DC', padding: '0 18px', fontFamily: body, fontSize: 16, background: paper }} />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ height: 50, padding: '0 22px', borderRadius: 16, background: brand, color: onColor(brand), fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <Mark shape={kit.identity.mark.shape} size={15} color={onColor(brand)} />
              {kit.website.cta}
            </span>
            <span style={{ height: 50, padding: '0 22px', borderRadius: 16, border: `1.5px solid ${ink}`, background: '#fff', fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>Learn more</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {kit.personality.slice(0, 3).map((x, i) => (
              <span key={x} style={{ padding: '8px 15px', borderRadius: 999, background: i === 0 ? tint : '#fff', border: i === 0 ? 'none' : '1px solid #C9C4DC', fontSize: 15, fontWeight: 500 }}>
                {x}
                {i === 0 ? ' ✓' : ''}
              </span>
            ))}
          </div>
          <div style={{ background: ink, color: '#fff', borderRadius: 20, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: mono, fontSize: 12.5, color: tint }}>{kit.name.toUpperCase()}</span>
              <span style={{ fontFamily: display, fontWeight: 700, fontSize: 26, letterSpacing: '-0.03em' }}>{kit.taglines[1] ?? kit.taglines[0]}</span>
            </div>
            <Mark shape={kit.identity.mark.shape} size={22} color={accent} />
          </div>
        </div>
        <div style={{ background: ink, color: paper, borderRadius: 28, padding: 'clamp(24px,3vw,40px)', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <span style={{ fontFamily: mono, fontSize: 12.5, color: '#B5B5BD' }}>06 · VOICE</span>
          <div style={{ fontFamily: display, fontWeight: 700, fontSize: 26, letterSpacing: '-0.03em' }}>{kit.voice.summary}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: tint }}>SAY</span>
            {kit.voice.say.slice(0, 2).map((s) => (
              <span key={s} style={{ fontSize: 18 }}>
                {s}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#B5B5BD' }}>NOT</span>
            {kit.voice.not.slice(0, 2).map((s) => (
              <span key={s} style={{ fontSize: 18, color: '#B5B5BD', textDecoration: 'line-through' }}>
                {s}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #34343C', paddingTop: 22 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>TAGLINE OPTIONS</span>
            {kit.taglines.slice(0, 3).map((s) => (
              <span key={s} style={{ fontSize: 18 }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Usage rules */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sectionHead('07', 'Usage rules')}
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}>
          {[
            ['Clear space', kit.identity.usageRules.clearSpace, undefined],
            ['Minimum size', kit.identity.usageRules.minSize, undefined],
            ['Do', kit.identity.usageRules.do, '#1F7A3E'],
            ["Don't", kit.identity.usageRules.dont, '#B42318'],
          ].map(([h, b, c]) => (
            <div key={h} style={{ borderRadius: 20, background: '#fff', border: `1px solid ${line}`, padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <b style={{ fontSize: 17, color: c }}>{h}</b>
              <span style={{ fontSize: 15.5, lineHeight: 1.5, color: '#36315A' }}>{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Lockups */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sectionHead('08', 'Lockups')}
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}>
          {[
            { label: 'Primary', bg: '#fff', el: <KitLogo kit={kit} width="88%" /> },
            { label: 'Reversed', bg: ink, el: <KitLogo kit={kit} variant="dark" width="88%" /> },
            { label: 'Single colour', bg: tint, el: <KitLogo kit={kit} variant="mono" width="88%" /> },
            { label: 'App icon', bg: paper, el: <KitIcon kit={kit} size={84} /> },
          ].map((x) => (
            <div key={x.label} style={{ borderRadius: 20, background: '#fff', border: `1px solid ${line}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ height: 130, borderRadius: 14, background: x.bg, border: x.bg === '#fff' || x.bg === paper ? `1px solid ${line}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{x.el}</div>
              <b style={{ fontSize: 15 }}>{x.label}</b>
            </div>
          ))}
        </div>
      </section>

      {kit.identity.looks.length > 1 && (
        <section className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {sectionHead('09', 'Other looks we explored')}
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))' }}>
            {kit.identity.looks
              .filter((l) => !(l.style === kit.identity.style && l.seed === kit.identity.seed))
              .map((l) => (
                <div key={l.id} style={{ borderRadius: 20, background: '#fff', border: `1px solid ${line}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ height: 120, borderRadius: 14, background: '#FAFAF7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 12 }}>
                    <Logo id={lookIdentity(kit.name, l)} width="90%" />
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
        </section>
      )}

      <footer style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontFamily: mono, fontSize: 12.5, color: '#4D4870', borderTop: `1px solid ${line}`, paddingTop: 22 }}>
        <span>
          {kit.name} · made with gobrandtoday
          <span style={{ color: '#6D4AFF' }}>✦</span>
        </span>
        <span>Fonts: Google Fonts (free, open licence)</span>
      </footer>
    </div>
  );
}
