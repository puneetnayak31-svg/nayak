'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { INDUSTRIES, toSlug } from '@gbt/shared';
import { Spark } from './Spark';

const EXAMPLES = [
  'A cosy candle brand for Gen Z…',
  'AI customer support for Indian small businesses…',
  'Premium sustainable clothing for Gen Z in India…',
  'A chai subscription for remote teams…',
  'Fintech for freelancers…',
];
const QUICK = ['Playful', 'Minimal', 'Premium', 'Futuristic', 'Human'];
const STYLES = ['Short', 'Invented', 'Real word', 'Indian-inspired', 'Two words'];
const EXTS = ['com', 'in', 'ai', 'io', 'co'];

/** The hero's two doors: "I have an idea" and "I have a name". */
export function HeroComposer({ defaultMode = 'smart' }: { defaultMode?: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<'idea' | 'name'>('idea');
  const [idea, setIdea] = useState('');
  const [name, setName] = useState('');
  const [vibes, setVibes] = useState<string[]>([]);
  const [ph, setPh] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [industry, setIndustry] = useState('');
  const [styles, setStyles] = useState<string[]>([]);
  const [exts, setExts] = useState<string[]>(['com', 'in']);
  const [maxLen, setMaxLen] = useState('');
  const [startsWith, setStartsWith] = useState('');
  const activeFilters = [industry, styles.length, maxLen, startsWith].filter(Boolean).length + (exts.join() !== 'com,in' ? 1 : 0);
  const toggle = (list: string[], v: string, set: (x: string[]) => void, max = 5) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v].slice(-max));

  useEffect(() => {
    const t = setInterval(() => setPh((x) => (x + 1) % EXAMPLES.length), 2600);
    return () => clearInterval(t);
  }, []);

  const go = () => {
    if (tab === 'idea') {
      const q = new URLSearchParams({ brief: idea.trim() || EXAMPLES[ph]!.replace('…', ''), mode: defaultMode, go: '1' });
      if (vibes.length) q.set('p', vibes.join(','));
      if (industry) q.set('ind', industry);
      if (styles.length) q.set('st', styles.join(','));
      if (exts.length) q.set('tld', exts.join(','));
      if (maxLen) q.set('max', maxLen);
      if (startsWith) q.set('start', startsWith);
      router.push(`/create?${q}`);
    } else if (toSlug(name)) {
      router.push(`/name/${encodeURIComponent(name.trim())}`);
    }
  };

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
    >
      <div className="row between wrap gap-12">
        <div className="tabs" role="tablist" aria-label="Start with">
          <button type="button" role="tab" aria-selected={tab === 'idea'} onClick={() => setTab('idea')}>
            <Spark size={12} color={tab === 'idea' ? '#6D4AFF' : '#8d88a8'} /> I have an idea
          </button>
          <button type="button" role="tab" aria-selected={tab === 'name'} onClick={() => setTab('name')}>
            I have a name
          </button>
        </div>
        <span className="eyebrow" style={{ fontSize: 11.5 }}>
          Free · no sign-up
        </span>
      </div>

      {tab === 'idea' ? (
        <>
          <label className="label" htmlFor="hero-idea">
            What are you building?
          </label>
          <textarea
            id="hero-idea"
            className="textarea"
            rows={2}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={EXAMPLES[ph]}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                go();
              }
            }}
            style={{ minHeight: 84, fontSize: 18 }}
          />
          <div className="chips" aria-label="Vibe (optional)">
            {QUICK.map((v) => (
              <button
                key={v}
                type="button"
                className="chip sm"
                aria-pressed={vibes.includes(v)}
                onClick={() => setVibes((x) => (x.includes(v) ? x.filter((y) => y !== v) : [...x, v].slice(-3)))}
              >
                {v}
              </button>
            ))}
          </div>
          <button type="button" className="filters-toggle" aria-expanded={showFilters} aria-controls="hero-filters" onClick={() => setShowFilters((x) => !x)}>
            <span aria-hidden="true">{showFilters ? '−' : '+'}</span> Filters{activeFilters ? ` · ${activeFilters}` : ''}
            <span className="muted" style={{ fontWeight: 400 }}>
              industry, name style, domains, length
            </span>
          </button>
          {showFilters && (
            <div id="hero-filters" className="filters-panel">
              <label className="stack gap-6">
                <span className="tiny" style={{ fontWeight: 700 }}>
                  Industry
                </span>
                <select className="input sm" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option value="">Any</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </label>
              <div className="stack gap-6">
                <span className="tiny" style={{ fontWeight: 700 }}>
                  Name style
                </span>
                <div className="chips">
                  {STYLES.map((v) => (
                    <button key={v} type="button" className="chip sm" aria-pressed={styles.includes(v)} onClick={() => toggle(styles, v, setStyles)}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="stack gap-6">
                <span className="tiny" style={{ fontWeight: 700 }}>
                  Must-have domains
                </span>
                <div className="chips">
                  {EXTS.map((v) => (
                    <button key={v} type="button" className="chip sm mono" aria-pressed={exts.includes(v)} onClick={() => toggle(exts, v, setExts)}>
                      .{v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="row gap-10">
                <label className="stack gap-6 grow">
                  <span className="tiny" style={{ fontWeight: 700 }}>
                    Max letters
                  </span>
                  <input className="input sm" inputMode="numeric" value={maxLen} onChange={(e) => setMaxLen(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="8" />
                </label>
                <label className="stack gap-6 grow">
                  <span className="tiny" style={{ fontWeight: 700 }}>
                    Starts with
                  </span>
                  <input className="input sm" value={startsWith} maxLength={3} onChange={(e) => setStartsWith(e.target.value.replace(/[^a-z]/gi, ''))} placeholder="K" />
                </label>
              </div>
            </div>
          )}
          <div className="row wrap gap-12">
            <button type="submit" className="btn btn-primary">
              <Spark size={16} color="#fff" /> Create My Brand
            </button>
            <a href="#how" className="btn btn-outline">
              See how it works
            </a>
          </div>
        </>
      ) : (
        <>
          <label className="label" htmlFor="hero-name">
            Already have a name in mind?
          </label>
          <div className="input-group">
            <input
              id="hero-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="lumora"
              autoComplete="off"
              spellCheck={false}
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em' }}
            />
            <span className="suffix">{toSlug(name) ? `${toSlug(name)}.com` : '.com · .in · .ai'}</span>
          </div>
          <p className="field-hint">We’ll check domains, handles on 10 platforms, and score it out of 10.</p>
          <div className="row wrap gap-12">
            <button type="submit" className="btn btn-primary" disabled={!toSlug(name)}>
              Check this name
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setTab('idea')}>
              Find me a name instead
            </button>
          </div>
        </>
      )}
    </form>
  );
}
