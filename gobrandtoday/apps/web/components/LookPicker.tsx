'use client';

import { useMemo, useState } from 'react';
import { LOGO_STYLE_META, MARK_PATHS, lookFonts, swatch, type BrandKit, type Look } from '@gbt/shared';
import { Logo, LogoIcon, lookIdentity } from './Logo';
import { Spark } from './Spark';

/**
 * Step 2 of building a brand: four genuinely different looks, side by side.
 * Picking one builds the full guidelines around it.
 */
export function LookPicker({
  kit,
  onChoose,
  onMore,
  busy,
  canCancel,
  onCancel,
}: {
  kit: BrandKit;
  onChoose: (lookId: string) => void;
  onMore: () => void;
  busy: string | null;
  canCancel?: boolean;
  onCancel?: () => void;
}) {
  return (
    <section className="stack gap-24" aria-labelledby="looks-h">
      <div className="row between wrap gap-16" style={{ alignItems: 'flex-end' }}>
        <div className="stack gap-8">
          <span className="eyebrow">Step 2 of 2 · Pick a look</span>
          <h1 id="looks-h" className="display" style={{ fontSize: 'clamp(30px,4.4vw,48px)', lineHeight: 1.04 }}>
            Four ways {kit.name} could look.
          </h1>
          <p className="soft" style={{ maxWidth: 620 }}>
            Each one is a different logo style with its own colours and fonts. Pick the one that feels right and we’ll build the full guidelines around it. You can switch later.
          </p>
        </div>
        <div className="row gap-8 wrap">
          {canCancel && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={!!busy}>
              Keep current look
            </button>
          )}
          <button type="button" className="btn btn-outline btn-sm" onClick={onMore} disabled={!!busy}>
            <Spark size={12} /> {busy === 'more' ? 'Designing…' : 'Show 4 new looks'}
          </button>
        </div>
      </div>
      <div className="looks-grid">
        {kit.identity.looks.map((look, i) => (
          <LookCard key={look.id} name={kit.name} look={look} index={i} busy={busy} onChoose={() => onChoose(look.id)} />
        ))}
      </div>
    </section>
  );
}

function LookCard({ name, look, index, busy, onChoose }: { name: string; look: Look; index: number; busy: string | null; onChoose: () => void }) {
  const id = useMemo(() => lookIdentity(name, look), [name, look]);
  const [hover, setHover] = useState(false);
  const meta = LOGO_STYLE_META[look.style];
  const fonts = lookFonts(look);
  const ink = swatch(look.palette, 'ink');
  const tint = swatch(look.palette, 'tint');
  return (
    <article className="look-card" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ animationDelay: `${index * 70}ms` }}>
      <div className="look-hero" style={{ background: '#fff' }}>
        <Logo id={id} width="82%" />
      </div>
      <div className="look-strip">
        <div style={{ background: ink }} className="look-dark">
          <Logo id={id} variant="dark" width="86%" />
        </div>
        <div style={{ background: tint }} className="look-icon">
          <LogoIcon id={id} size={64} />
        </div>
      </div>
      <div className="stack gap-10" style={{ padding: '4px 18px 18px' }}>
        <div className="row gap-4" aria-label="Palette">
          {look.palette.map((s) => (
            <span key={s.role} title={`${s.name} ${s.hex}`} style={{ flex: 1, height: 10, borderRadius: 5, background: s.hex, border: '1px solid rgba(0,0,0,.06)' }} />
          ))}
        </div>
        <div className="stack gap-4">
          {look.title !== meta.title && <span className="eyebrow" style={{ fontSize: 11 }}>{meta.title}</span>}
          <strong className="display" style={{ fontSize: 22 }}>
            {look.title}
          </strong>
        </div>
        <p className="small soft">{look.concept}</p>
        <p className="tiny muted mono">
          {fonts.display.family} · {fonts.body.family} · {MARK_PATHS[look.markShape].label.toLowerCase()} mark
        </p>
        <button type="button" className={`btn ${hover ? 'btn-primary' : 'btn-dark'} btn-sm`} onClick={onChoose} disabled={!!busy} style={{ marginTop: 4 }}>
          {busy === look.id ? 'Building guidelines…' : 'Use this look'}
        </button>
      </div>
    </article>
  );
}
