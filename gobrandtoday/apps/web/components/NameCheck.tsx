'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PERSONALITIES, TLDS, scoreName, toSlug, type DomainResult, type HandleSuggestion, type SocialResult } from '@gbt/shared';
import { ApiError, api } from '@/lib/api';
import { useApp } from '@/lib/providers';
import { Spark } from './Spark';
import { Alternatives, DemoBanner, DomainTable, Risks, ScoreBreakdown, ScoreCard, SocialGrid } from './ui';

/** "Just try my name": domains, handles, score — and one click to build the brand. */
export function NameCheck({ name }: { name: string }) {
  const router = useRouter();
  const { toast } = useApp();
  const [tlds, setTlds] = useState<string[]>(['com', 'in', 'ai', 'io', 'co', 'app']);
  const [domains, setDomains] = useState<DomainResult[] | null>(null);
  const [socials, setSocials] = useState<SocialResult[] | null>(null);
  const [alts, setAlts] = useState<HandleSuggestion[]>([]);
  const [err, setErr] = useState<{ d?: string; s?: string }>({});
  const [loadingD, setLoadingD] = useState(false);
  const [about, setAbout] = useState('');
  const [vibe, setVibe] = useState<string[]>([]);
  const [building, setBuilding] = useState(false);
  const [next, setNext] = useState(name);

  const slug = toSlug(name);

  const runDomains = useCallback(
    async (fresh = false) => {
      setLoadingD(true);
      setErr((e) => ({ ...e, d: undefined }));
      try {
        const r = await api<{ results: DomainResult[] }>('/api/domain/check', { body: { name, tlds, fresh } });
        setDomains(r.results);
      } catch (e) {
        setErr((x) => ({ ...x, d: e instanceof ApiError ? e.message : 'We couldn’t check domains right now.' }));
      } finally {
        setLoadingD(false);
      }
    },
    [name, tlds],
  );

  const runSocials = useCallback(async () => {
    setErr((e) => ({ ...e, s: undefined }));
    try {
      const r = await api<{ results: SocialResult[]; alternatives: HandleSuggestion[] }>('/api/social/check', { body: { handle: slug, alternatives: true } });
      setSocials(r.results);
      setAlts(r.alternatives);
    } catch (e) {
      setErr((x) => ({ ...x, s: e instanceof ApiError ? e.message : 'We couldn’t check handles right now.' }));
    }
  }, [slug]);

  useEffect(() => {
    void runDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tlds.join(',')]);
  useEffect(() => {
    void runSocials();
  }, [runSocials]);

  const score = useMemo(() => scoreName({ name, brief: about, domains: domains ?? undefined, socials: socials ?? undefined, preferredTlds: tlds }), [name, about, domains, socials, tlds]);

  const build = async () => {
    setBuilding(true);
    try {
      const free = domains?.find((d) => d.status === 'available')?.domain;
      const r = await api<{ brand: { id: string } }>('/api/brands', {
        body: { name, domain: free, brief: { description: about, personalities: vibe, styles: [], tlds, mode: 'smart' } },
      });
      router.push(`/brand/${r.brand.id}`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not start building', 'error');
      setBuilding(false);
    }
  };

  const save = async () => {
    try {
      await api('/api/saved', { body: { name, data: { name, score } } });
      toast(`Saved ${name}`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not save', 'error');
    }
  };

  return (
    <div className="container stack gap-32" style={{ padding: '32px var(--gutter) 64px' }}>
      <form
        className="row wrap gap-10"
        onSubmit={(e) => {
          e.preventDefault();
          if (toSlug(next) && next !== name) router.push(`/name/${encodeURIComponent(next.trim())}`);
        }}
      >
        <span className="eyebrow">Try a name</span>
        <input className="input sm" style={{ maxWidth: 280 }} value={next} onChange={(e) => setNext(e.target.value)} aria-label="Try another name" />
        <button className="btn btn-dark btn-sm">Check</button>
      </form>

      <div className="grid-2" style={{ alignItems: 'end', gap: 32 }}>
        <div className="stack gap-12">
          <h1 className="display" style={{ fontSize: 'clamp(52px, 10vw, 112px)', lineHeight: 0.95, letterSpacing: '-0.05em', wordBreak: 'break-word' }}>
            {name.toLowerCase()}
            <Spark size={38} className="twinkle" style={{ display: 'inline-block', marginLeft: 6 }} />
          </h1>
          <span className="mono muted">{score.components.length ? `${slug.length} letters · ${name.split(/\s+/).length} word${name.split(/\s+/).length > 1 ? 's' : ''}` : ''}</span>
        </div>
        <ScoreCard score={score} />
      </div>

      <DemoBanner />
      <Risks score={score} />

      <div className="grid-2" style={{ alignItems: 'start', gap: 24 }}>
        <div className="stack gap-24">
          <section className="card stack gap-16" aria-labelledby="dom-h">
            <div className="row between wrap gap-12">
              <h2 id="dom-h" className="h3">
                See if the domain is yours
              </h2>
              <button className="btn btn-ghost btn-xs" onClick={() => runDomains(true)} disabled={loadingD}>
                {loadingD ? 'Checking…' : 'Recheck'}
              </button>
            </div>
            <div className="chips">
              {TLDS.map((t) => (
                <button key={t} type="button" className="chip sm mono" aria-pressed={tlds.includes(t)} onClick={() => setTlds((x) => (x.includes(t) ? (x.length > 1 ? x.filter((y) => y !== t) : x) : [...x, t].slice(-8)))}>
                  .{t}
                </button>
              ))}
            </div>
            {err.d ? (
              <div className="notice error row between gap-12">
                {err.d}
                <button className="btn btn-ghost btn-xs" onClick={() => runDomains(true)}>
                  Try again
                </button>
              </div>
            ) : domains ? (
              <DomainTable
                results={domains}
                onWatch={(d) =>
                  api('/api/watch', { body: { domain: d.domain, status: d.status } })
                    .then(() => toast(`Watching ${d.domain}`))
                    .catch(() => toast('Could not add to watchlist', 'error'))
                }
              />
            ) : (
              <div className="skeleton" style={{ height: 240 }} />
            )}
          </section>

          <section className="card stack gap-16" aria-labelledby="soc-h">
            <h2 id="soc-h" className="h3">
              Social handles
            </h2>
            {err.s ? (
              <div className="notice error row between gap-12">
                {err.s}
                <button className="btn btn-ghost btn-xs" onClick={runSocials}>
                  Try again
                </button>
              </div>
            ) : socials ? (
              <>
                <SocialGrid results={socials} />
                <Alternatives items={alts} />
              </>
            ) : (
              <div className="skeleton" style={{ height: 260 }} />
            )}
          </section>
        </div>

        <div className="stack gap-24">
          <section className="card stack gap-16">
            <h2 className="h3">Score breakdown</h2>
            <ScoreBreakdown score={score} />
          </section>
          <section className="card stack gap-8">
            <strong>SEO potential · {score.seo.value.toFixed(1)}</strong>
            <p className="small soft">{score.seo.explanation}</p>
          </section>

          <section className="card lilac stack gap-16">
            <div className="stack gap-6">
              <span className="eyebrow">Found your name?</span>
              <h2 className="h3">Turn it into a brand.</h2>
            </div>
            <label className="small" style={{ fontWeight: 700 }} htmlFor="about">
              What’s it for? <span className="muted" style={{ fontWeight: 400 }}>(optional — makes the brand sharper)</span>
            </label>
            <textarea id="about" className="textarea" rows={2} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="A cosy candle brand for Gen Z in India" style={{ background: '#fff' }} />
            <div className="chips">
              {PERSONALITIES.slice(0, 8).map((p) => (
                <button key={p} type="button" className="chip sm" aria-pressed={vibe.includes(p)} onClick={() => setVibe((x) => (x.includes(p) ? x.filter((y) => y !== p) : [...x, p].slice(-3)))}>
                  {p}
                </button>
              ))}
            </div>
            <div className="row gap-10 wrap">
              <button className="btn btn-primary" onClick={build} disabled={building}>
                <Spark size={16} color="#fff" /> {building ? 'Starting…' : 'Build my brand'}
              </button>
              <button className="btn btn-outline" onClick={save}>
                ♡ Save name
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
