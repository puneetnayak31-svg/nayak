'use client';

import { useEffect, useRef, useState } from 'react';
import { Mark, Spark, SparkLoader } from './Spark';

/**
 * Section 4 — a scripted, clearly-labelled example of the whole journey.
 * Nothing here is a live check; it shows what the product does.
 */
const STEPS = ['Idea', 'Names', 'Domains', 'Handles', 'Identity'] as const;
const NAMES = [
  { n: 'Kettlo', s: 8.9, why: '“Kettle” + a friendly “-o”. Warm, short, office-friendly.' },
  { n: 'Chaiwise', s: 8.4, why: 'Chai + wise — the smart way to keep teams fuelled.' },
  { n: 'Sippet', s: 8.1, why: 'A little sip, a little snippet. Playful and light.' },
];
const DOMAINS = [
  ['kettlo.com', 'taken'],
  ['kettlo.in', 'available'],
  ['kettlo.co', 'available'],
  ['getkettlo.com', 'available'],
] as const;
const HANDLES = [
  ['Instagram', 'check'],
  ['X', 'check'],
  ['YouTube', 'available'],
  ['GitHub', 'available'],
  ['Reddit', 'available'],
  ['LinkedIn', 'check'],
] as const;

export function DemoPlayer() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), step === 0 ? 2200 : 3000);
    return () => clearTimeout(t);
  }, [step, playing, visible]);

  return (
    <div ref={ref} className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
      <div className="row between wrap gap-12" style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
        <div className="row gap-6 wrap" role="tablist" aria-label="Example steps">
          {STEPS.map((s, i) => (
            <button
              key={s}
              role="tab"
              aria-selected={step === i}
              className={`chip sm ${step === i ? 'on' : ''}`}
              onClick={() => {
                setStep(i);
                setPlaying(false);
              }}
            >
              <span className="mono tiny">{String(i + 1).padStart(2, '0')}</span> {s}
            </button>
          ))}
        </div>
        <div className="row gap-8">
          <span className="badge line">Example</span>
          <button className="btn btn-ghost btn-xs" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause example' : 'Play example'}>
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>

      <div style={{ padding: 'clamp(20px,3vw,32px)', minHeight: 360 }} key={step} className="fade-up">
        {step === 0 && (
          <div className="stack gap-16">
            <span className="label">What are you building?</span>
            <div className="input" style={{ display: 'flex', alignItems: 'center', background: '#fff' }}>
              A chai subscription for remote teams in Bengaluru<span style={{ width: 2, height: 22, background: 'var(--violet)', marginLeft: 2, animation: 'twinkle 1s steps(2) infinite' }} />
            </div>
            <div className="chips">
              <span className="chip sm on">Playful ✓</span>
              <span className="chip sm on">Human ✓</span>
              <span className="chip sm">Premium</span>
            </div>
            <div className="row gap-16" style={{ marginTop: 12 }}>
              <SparkLoader size={44} />
              <span className="muted">Reading your idea…</span>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="stack gap-12">
            {NAMES.map((x, i) => (
              <div key={x.n} className="row between gap-16" style={{ border: `1.5px solid ${i === 0 ? 'var(--violet)' : 'var(--line)'}`, borderRadius: 16, padding: '14px 16px', background: '#fff' }}>
                <div className="stack gap-4">
                  <span className="display" style={{ fontSize: 26 }}>
                    {x.n}
                  </span>
                  <span className="small soft">{x.why}</span>
                </div>
                <span className="score-pill provisional">
                  ~{x.s}
                  <small>/10</small>
                </span>
              </div>
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="stack gap-12">
            <span className="display" style={{ fontSize: 26 }}>
              Kettlo
            </span>
            {DOMAINS.map(([d, s]) => (
              <div key={d} className="row between" style={{ borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
                <span className="mono">{d}</span>
                <span className={`status ${s}`}>{s === 'available' ? 'Available' : 'Taken'}</span>
              </div>
            ))}
            <span className="tiny muted">Checked with the registries — in the real product, not in this example.</span>
          </div>
        )}
        {step === 3 && (
          <div className="grid-2" style={{ gap: 10 }}>
            {HANDLES.map(([p, s]) => (
              <div key={p} className="row between" style={{ border: '1px solid var(--line)', borderRadius: 14, padding: '10px 12px', background: '#fff' }}>
                <div className="stack">
                  <strong className="small">{p}</strong>
                  <span className="mono tiny muted">@kettlo</span>
                </div>
                <span className={`status ${s === 'check' ? 'manual' : s}`}>{s === 'check' ? 'Check ↗' : 'Available'}</span>
              </div>
            ))}
          </div>
        )}
        {step === 4 && (
          <div className="grid-2" style={{ alignItems: 'stretch' }}>
            <div className="stack gap-12" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 20, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 48, letterSpacing: '-0.05em', display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                kettlo
                <Mark shape="flame" size={22} color="#D9480F" />
              </span>
              <span className="small soft">Brewed for teams that ship.</span>
            </div>
            <div className="stack gap-12">
              <div className="row gap-8">
                {['#1B1411', '#D9480F', '#0E8F86', '#FFEDE5', '#FBF9F7'].map((c) => (
                  <span key={c} title={c} style={{ flex: 1, height: 56, borderRadius: 12, background: c, border: '1px solid rgba(0,0,0,.06)' }} />
                ))}
              </div>
              <div className="card sm stack gap-6" style={{ padding: 16 }}>
                <span className="mono tiny muted">DISPLAY · BRICOLAGE GROTESQUE</span>
                <span className="small">Voice: Warm · Witty · Kind</span>
              </div>
              <div className="scorecard" style={{ padding: '14px 18px' }}>
                <div className="stack">
                  <span className="label">GOBRAND SCORE</span>
                  <span className="value" style={{ fontSize: 32 }}>
                    8.9<small> / 10</small>
                  </span>
                </div>
                <Spark size={18} color="#19C3B4" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
