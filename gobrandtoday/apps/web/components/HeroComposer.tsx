'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toSlug } from '@gbt/shared';
import { Spark } from './Spark';

const EXAMPLES = [
  'A cosy candle brand for Gen Z…',
  'AI customer support for Indian small businesses…',
  'Premium sustainable clothing for Gen Z in India…',
  'A chai subscription for remote teams…',
  'Fintech for freelancers…',
];
const QUICK = ['Playful', 'Minimal', 'Premium', 'Futuristic', 'Human'];

/** The hero's two doors: "I have an idea" and "I have a name". */
export function HeroComposer({ defaultMode = 'smart' }: { defaultMode?: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<'idea' | 'name'>('idea');
  const [idea, setIdea] = useState('');
  const [name, setName] = useState('');
  const [vibes, setVibes] = useState<string[]>([]);
  const [ph, setPh] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPh((x) => (x + 1) % EXAMPLES.length), 2600);
    return () => clearInterval(t);
  }, []);

  const go = () => {
    if (tab === 'idea') {
      const q = new URLSearchParams({ brief: idea.trim() || EXAMPLES[ph]!.replace('…', ''), mode: defaultMode, go: '1' });
      if (vibes.length) q.set('p', vibes.join(','));
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
