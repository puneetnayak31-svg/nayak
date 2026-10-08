'use client';

import { useEffect, useState } from 'react';
import { PlatformIcon } from './PlatformIcons';

/**
 * The landing hero's "magic": one sentence types itself, then the whole
 * Brand in a Box assembles tile by tile (name, logo, domains, handles, brand
 * book, social kit, website, launch copy). Three worked examples cycle.
 * Illustrative only and labelled "Example": nothing here claims a real name
 * or domain is free.
 */
interface Example {
  idea: string;
  name: string;
  say: string;
  score: string;
  tagline: string;
  font: string;
  weight: number;
  italic?: boolean;
  /** brand, ink, tint, paper, accent */
  c: [string, string, string, string, string];
  /** Inner SVG for a 24 × 24 mark, drawn in `currentColor` with an accent `var(--a)`. */
  mark: string;
}

const EXAMPLES: Example[] = [
  {
    idea: 'A cosy candle brand for Gen Z',
    name: 'wickly',
    say: 'WIK-lee',
    score: '8.6',
    tagline: 'Slow evenings, poured by hand.',
    font: "Georgia, 'Times New Roman', serif",
    weight: 700,
    italic: true,
    c: ['#E8572A', '#2A1A2E', '#FFE4CC', '#FFF8F0', '#7C5CFF'],
    mark: '<path d="M12 2.5c3.4 3.7 5.2 6.6 5.2 9.6a5.2 5.2 0 1 1-10.4 0c0-2 .9-3.8 2.5-5.4.2 1.8 1 2.9 2.3 3.4-.4-2.7-.2-5 .4-7.6z" fill="currentColor"/><circle cx="12" cy="13.6" r="1.9" fill="var(--a)"/>',
  },
  {
    idea: 'AI customer support for small businesses',
    name: 'Replyo',
    say: 'reh-PLY-oh',
    score: '8.9',
    tagline: 'Every customer, answered.',
    font: 'var(--font-display)',
    weight: 700,
    c: ['#5B4BFF', '#14132B', '#E5E1FF', '#FAFAFF', '#19C3B4'],
    mark: '<path d="M5 4.5h14a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-6.5L7.5 20v-3.5H5A2.5 2.5 0 0 1 2.5 14V7A2.5 2.5 0 0 1 5 4.5z" fill="currentColor"/><path d="M12 7.2l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" fill="var(--a)"/>',
  },
  {
    idea: 'A mithai shop in Jaipur with festive gift boxes',
    name: 'mithaas',
    say: 'mee-THAAS',
    score: '8.4',
    tagline: 'Sweets worth the wait.',
    font: 'var(--font-body)',
    weight: 800,
    c: ['#1E8A43', '#1B1B12', '#FFE9B8', '#FFFBF0', '#F59E0B'],
    mark: '<circle cx="12" cy="12" r="9" fill="currentColor"/><path d="M12 6.5l5.5 5.5-5.5 5.5L6.5 12z" fill="var(--a)"/><circle cx="12" cy="12" r="1.8" fill="#fff"/>',
  },
];

const PLATFORMS = ['instagram', 'x', 'youtube', 'linkedin', 'tiktok', 'facebook', 'threads', 'pinterest', 'reddit', 'github'];
const PRICES: Array<[string, string]> = [
  ['.com', '₹899'],
  ['.in', '₹649'],
  ['.ai', '₹6,999'],
];
const TILES = 8;
const TYPE_MS = 34;

export function HeroMagic() {
  const [i, setI] = useState(0);
  // The first paint shows a finished example (good for no-JS and first paint); the show starts after a beat.
  const [typed, setTyped] = useState(EXAMPLES[0]!.idea.length);
  const [step, setStep] = useState(TILES + 2);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const ex = EXAMPLES[i]!;
    const ts: ReturnType<typeof setTimeout>[] = [];
    if (!started) return;
    if (reduce) {
      setTyped(ex.idea.length);
      setStep(TILES + 2);
      ts.push(setTimeout(() => setI((x) => (x + 1) % EXAMPLES.length), 7000));
      return () => ts.forEach(clearTimeout);
    }
    setTyped(0);
    setStep(0);
    for (let c = 1; c <= ex.idea.length; c++) ts.push(setTimeout(() => setTyped(c), 350 + c * TYPE_MS));
    const t0 = 350 + ex.idea.length * TYPE_MS + 250;
    ts.push(setTimeout(() => setStep(1), t0));
    for (let k = 0; k < TILES; k++) ts.push(setTimeout(() => setStep(2 + k), t0 + 650 + k * 230));
    ts.push(setTimeout(() => setStep(TILES + 2), t0 + 650 + TILES * 230 + 150));
    ts.push(setTimeout(() => setI((x) => (x + 1) % EXAMPLES.length), t0 + 650 + TILES * 230 + 4200));
    return () => ts.forEach(clearTimeout);
  }, [i, started]);

  useEffect(() => {
    if (started) return;
    // Start on the second example so the first loop shows something new.
    const t = setTimeout(() => {
      setStarted(true);
      setI(1);
    }, 3200);
    return () => clearTimeout(t);
  }, [started]);

  const ex = EXAMPLES[i]!;
  const [brand, ink, tint, paper, accent] = ex.c;
  const on = (k: number) => (step >= 2 + k ? ' on' : '');
  const word = { fontFamily: ex.font, fontWeight: ex.weight, fontStyle: ex.italic ? 'italic' : 'normal' } as const;
  const Mark = ({ size, color }: { size: number; color: string }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ color, ['--a' as string]: accent, flex: 'none' }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: ex.mark }} />
  );

  return (
    <div className="hm" aria-label={`Example: “${ex.idea}” becomes ${ex.name}, with its logo, domains, handles, brand book, social kit, website and launch copy`}>
      <div className="hm-idea">
        <span className="hm-k">Your idea</span>
        <span className="hm-typed">
          {ex.idea.slice(0, typed)}
          <i className="hm-caret" aria-hidden="true" />
        </span>
      </div>

      <div className={`hm-flow${step === 1 ? ' busy' : ''}`} aria-hidden="true">
        <span className="hm-spark">✦</span>
        <span>{step >= TILES + 2 ? 'Your Brand in a Box' : 'Naming · checking · designing'}</span>
      </div>

      <div className="hm-grid" aria-hidden="true">
        <div className={`hm-tile hm-name${on(0)}`}>
          <span className="hm-k">Name</span>
          <b className="hm-brand" style={{ ...word, color: ink }}>
            {ex.name}
          </b>
          <span className="hm-sub">
            <span className="hm-score" style={{ ['--p' as string]: `${Number(ex.score) * 10}%` }}>
              {ex.score}
            </span>
            GoBrand Score · {ex.say}
          </span>
        </div>

        <div className={`hm-tile hm-logo${on(1)}`} style={{ background: tint }}>
          <span className="hm-k">Logo · 4 looks</span>
          <span className="hm-lockup">
            <Mark size={34} color={brand} />
            <b style={{ ...word, color: ink, fontSize: 26, letterSpacing: '-0.02em' }}>{ex.name}</b>
          </span>
        </div>

        <div className={`hm-tile${on(2)}`}>
          <span className="hm-k">Domains</span>
          <span className="hm-doms">
            {PRICES.map(([t, p]) => (
              <span key={t}>
                <b>
                  {ex.name.toLowerCase()}
                  <em>{t}</em>
                </b>
                <span>{p}</span>
              </span>
            ))}
          </span>
        </div>

        <div className={`hm-tile${on(3)}`}>
          <span className="hm-k">@{ex.name.toLowerCase()}</span>
          <span className="hm-icons">
            {PLATFORMS.map((p) => (
              <PlatformIcon key={p} id={p} size={19} />
            ))}
          </span>
        </div>

        <div className={`hm-tile${on(4)}`}>
          <span className="hm-k">Brand book</span>
          <span className="hm-swatches">
            {[brand, accent, tint, ink, paper].map((c) => (
              <i key={c} style={{ background: c }} />
            ))}
          </span>
          <span className="hm-type">
            <b style={{ ...word, color: ink }}>Aa</b>
            <span>
              <i />
              <i style={{ width: '62%' }} />
            </span>
          </span>
        </div>

        <div className={`hm-tile${on(5)}`}>
          <span className="hm-k">Social kit</span>
          <span className="hm-social">
            <span className="hm-avatar" style={{ background: tint }}>
              <Mark size={20} color={brand} />
            </span>
            <span className="hm-banner" style={{ background: brand }}>
              <b style={{ ...word, color: '#fff' }}>{ex.name}</b>
              <i style={{ background: accent }} />
            </span>
          </span>
        </div>

        <div className={`hm-tile${on(6)}`}>
          <span className="hm-k">Website draft</span>
          <span className="hm-site" style={{ background: paper }}>
            <span className="hm-bar">
              <i />
              <i />
              <i />
            </span>
            <b style={{ ...word, color: ink }}>{ex.tagline}</b>
            <span className="hm-cta" style={{ background: brand }} />
          </span>
        </div>

        <div className={`hm-tile${on(7)}`}>
          <span className="hm-k">Launch copy</span>
          <span className="hm-icons">
            <PlatformIcon id="instagram" size={19} />
            <PlatformIcon id="linkedin" size={19} />
            <PlatformIcon id="x" size={19} />
            <PlatformIcon id="youtube" size={19} />
          </span>
          <span className="hm-sub">Bios, launch posts, an X thread and 10 post ideas</span>
        </div>
      </div>

      <div className={`hm-foot${step >= TILES + 2 ? ' on' : ''}`}>
        <span>
          <b>✓ Ready in about a minute.</b> Free to start.
        </span>
        <span className="hm-example">Example</span>
      </div>
    </div>
  );
}
