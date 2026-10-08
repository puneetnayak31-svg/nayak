'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GEOGRAPHIES,
  INDUSTRIES,
  NAME_MODES,
  NAME_STYLES,
  PERSONALITIES,
  REFINEMENTS,
  TLDS,
  scoreName,
  toSlug,
  type Brief,
  type DomainResult,
  type HandleSuggestion,
  type NameCandidate,
  type SocialResult,
} from '@gbt/shared';
import { ApiError, api } from '@/lib/api';
import { useApp } from '@/lib/providers';
import { Spark } from './Spark';
import { AvailabilityPanel, CoreTag, DomainChips } from './Availability';
import { DemoBanner, Empty, Loading, Risks, ScoreBreakdown, ScorePill, SourceBadge } from './ui';

interface NamesResponse {
  projectId: string;
  round: number;
  names: NameCandidate[];
  source: 'ai' | 'offline';
  notice?: string;
  checked?: number;
}
interface CheckState {
  loading: boolean;
  domains?: DomainResult[];
  socials?: SocialResult[];
  alternatives?: HandleSuggestion[];
  error?: string;
}

const EXAMPLES = [
  'An AI platform that helps Indian small businesses automate customer support',
  'Premium sustainable clothing brand for Gen Z in India',
  'A cosy candle brand for Gen Z',
  'Fintech company for freelancers',
  'I want a short tech startup name',
];

const emptyBrief = (): Brief => ({ description: '', personalities: [], styles: [], tlds: ['com', 'in', 'ai'], mode: 'smart', constraints: {} });

export function Studio() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast, refreshMe, system } = useApp();
  const [brief, setBrief] = useState<Brief>(emptyBrief);
  const [rounds, setRounds] = useState<Array<{ round: number; names: NameCandidate[]; source: string; notice?: string }>>([]);
  const [projectId, setProjectId] = useState<string | undefined>();
  const [loading, setLoading] = useState<false | 'generate' | 'refine' | 'domain_first'>(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [checks, setChecks] = useState<Record<string, CheckState>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [refinements, setRefinements] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [compare, setCompare] = useState(false);
  const [building, setBuilding] = useState<string | null>(null);
  const started = useRef(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const current = rounds[0];
  const allNames = useMemo(() => rounds.flatMap((r) => r.names), [rounds]);

  // Hydrate from the URL (?brief=…&mode=…&p=…&go=1) or a saved project (?project=…).
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const b = emptyBrief();
    const desc = params.get('brief');
    const mode = params.get('mode');
    const p = params.get('p');
    if (desc) b.description = desc;
    if (mode && NAME_MODES.some((m) => m.id === mode)) b.mode = mode as Brief['mode'];
    if (p) b.personalities = p.split(',').filter((x) => (PERSONALITIES as readonly string[]).includes(x));
    const ind = params.get('ind');
    if (ind && (INDUSTRIES as readonly string[]).includes(ind)) b.industry = ind;
    const st = params.get('st');
    if (st) b.styles = st.split(',').filter((x) => (NAME_STYLES as readonly string[]).includes(x));
    const tld = params.get('tld');
    if (tld) b.tlds = tld.split(',').filter((x) => (TLDS as readonly string[]).includes(x)).slice(0, 5);
    const max = Number(params.get('max'));
    const start = params.get('start');
    if (max >= 3 || start) b.constraints = { ...(max >= 3 ? { maxLength: Math.min(20, max) } : {}), ...(start ? { startsWith: start.replace(/[^a-z]/gi, '').slice(0, 3) } : {}) };
    setBrief(b);
    const project = params.get('project');
    if (project) {
      api<{ project: { id: string; brief: Brief }; names: Array<NameCandidate & { round: number }> }>(`/api/projects/${project}`)
        .then((r) => {
          setBrief({ ...emptyBrief(), ...r.project.brief });
          setProjectId(r.project.id);
          const byRound = new Map<number, NameCandidate[]>();
          r.names.forEach((n) => byRound.set(n.round, [...(byRound.get(n.round) ?? []), n]));
          setRounds([...byRound.entries()].sort((a, b2) => b2[0] - a[0]).map(([round, names]) => ({ round, names, source: names[0]?.source ?? 'ai' })));
        })
        .catch(() => toast('Could not open that project', 'error'));
    } else if (desc && params.get('go')) {
      void run('generate', b);
    }
    api<{ saved: Array<{ id: string; slug: string }> }>('/api/saved')
      .then((r) => setSaved(Object.fromEntries(r.saved.map((s) => [s.slug, s.id]))))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = useCallback(
    async (kind: 'generate' | 'refine', b: Brief = brief) => {
      if (b.description.trim().length < 2) {
        setError('Tell us a little about your idea first — one sentence is plenty.');
        return;
      }
      setError(null);
      const domainFirst = b.mode === 'domain_first';
      setLoading(domainFirst ? 'domain_first' : kind);
      try {
        const body = {
          brief: b,
          count: domainFirst ? 10 : 18,
          projectId: kind === 'refine' ? projectId : projectId,
          ...(kind === 'refine'
            ? { feedback: feedback || undefined, refinements, exclude: allNames.map((n) => n.name), liked: Object.keys(saved).slice(0, 10) }
            : { exclude: allNames.map((n) => n.name).slice(0, 80) }),
        };
        const path = domainFirst ? '/api/brand/domain-first' : kind === 'refine' ? '/api/brand/refine-names' : '/api/brand/generate-names';
        const r = await api<NamesResponse>(path, { body });
        setProjectId(r.projectId);
        setRounds((prev) => [{ round: r.round, names: r.names, source: r.source, notice: r.notice }, ...prev]);
        if (domainFirst) {
          setChecks((c) => ({ ...c, ...Object.fromEntries(r.names.map((n) => [n.id, { loading: false, domains: n.domains }])) }));
        }
        if (!r.names.length) setError(domainFirst ? 'No registrable names in three rounds — try a different mode or TLD.' : 'No names passed your constraints. Try loosening them.');
        setFeedback('');
        setRefinements([]);
        if (!params.get('project')) router.replace(`/create?project=${r.projectId}`, { scroll: false });
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
        void refreshMe();
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [brief, projectId, feedback, refinements, allNames, saved, params, router, refreshMe],
  );

  const check = useCallback(
    async (n: NameCandidate) => {
      setChecks((c) => ({ ...c, [n.id]: { ...c[n.id], loading: true, error: undefined } }));
      try {
        const [d, s] = await Promise.all([
          api<{ results: DomainResult[] }>('/api/domain/check', { body: { name: n.name, tlds: brief.tlds.length ? brief.tlds : ['com', 'in', 'ai'] } }),
          api<{ results: SocialResult[]; alternatives: HandleSuggestion[] }>('/api/social/check', { body: { handle: toSlug(n.name), alternatives: true } }),
        ]);
        setChecks((c) => ({ ...c, [n.id]: { loading: false, domains: d.results, socials: s.results, alternatives: s.alternatives } }));
      } catch (e) {
        setChecks((c) => ({ ...c, [n.id]: { ...c[n.id], loading: false, error: e instanceof ApiError ? e.message : 'Check failed' } }));
      }
    },
    [brief.tlds],
  );

  const scored = useCallback(
    (n: NameCandidate) => {
      const c = checks[n.id];
      if (!c?.domains && !c?.socials) return n.score;
      return scoreName({ name: n.name, brief: brief.description, relevance: n.relevance, domains: c.domains, socials: c.socials, preferredTlds: brief.tlds });
    },
    [checks, brief.description, brief.tlds],
  );

  const toggleSave = async (n: NameCandidate) => {
    const slug = toSlug(n.name);
    try {
      if (saved[slug]) {
        await api(`/api/saved/${saved[slug]}`, { method: 'DELETE' });
        setSaved(({ [slug]: _, ...rest }) => rest);
      } else {
        const r = await api<{ saved: { id: string } }>('/api/saved', { body: { name: n.name, projectId, data: { ...n, score: scored(n) } } });
        setSaved((s) => ({ ...s, [slug]: r.saved.id }));
        toast(`Saved ${n.name}`);
      }
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not save', 'error');
    }
  };

  const build = async (n: NameCandidate) => {
    setBuilding(n.id);
    try {
      const c = checks[n.id];
      const freeDomain = c?.domains?.find((d) => d.status === 'available')?.domain;
      const r = await api<{ brand: { id: string } }>('/api/brands', { body: { name: n.name, brief, projectId, domain: freeDomain } });
      router.push(`/brand/${r.brand.id}`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not start building', 'error');
      setBuilding(null);
    }
  };

  const toggleSelect = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-4)));
  const checkShortlist = async () => {
    for (const id of selected) {
      const n = allNames.find((x) => x.id === id);
      if (n && !checks[id]?.domains) await check(n);
    }
    toast('Shortlist checked');
  };

  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => setBrief((b) => ({ ...b, [k]: v }));
  const toggleIn = (k: 'personalities' | 'styles' | 'tlds', v: string, max = 6) =>
    setBrief((b) => ({ ...b, [k]: b[k].includes(v) ? b[k].filter((x) => x !== v) : [...b[k], v].slice(-max) }));
  const setC = (k: keyof NonNullable<Brief['constraints']>, v: string | number | undefined) =>
    setBrief((b) => ({ ...b, constraints: { ...b.constraints, [k]: v === '' ? undefined : v } }));

  const selectedNames = allNames.filter((n) => selected.includes(n.id));

  return (
    <div className="container studio">
      {/* ------------------------------ brief ------------------------------ */}
      <aside className="studio-side stack gap-20">
        <form
          className="card stack gap-16"
          onSubmit={(e) => {
            e.preventDefault();
            void run('generate');
          }}
        >
          <div className="row between">
            <span className="eyebrow">Your brief</span>
            {projectId && (
              <button
                type="button"
                className="btn-link small"
                onClick={() => {
                  setBrief(emptyBrief());
                  setRounds([]);
                  setProjectId(undefined);
                  setSelected([]);
                  setChecks({});
                  router.replace('/create');
                }}
              >
                New idea
              </button>
            )}
          </div>
          <label className="label" htmlFor="brief">
            What are you building?
          </label>
          <textarea
            id="brief"
            className="textarea"
            value={brief.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="A cosy candle brand for Gen Z…"
            rows={3}
            maxLength={800}
          />

          <div className="stack gap-8">
            <span className="label" style={{ fontSize: 14.5 }}>
              Naming style
            </span>
            <div className="chips">
              {NAME_MODES.filter((m) => m.id !== 'domain_first' || system?.features?.domainFirst !== false).map((m) => (
                <button key={m.id} type="button" className="chip sm" aria-pressed={brief.mode === m.id} onClick={() => set('mode', m.id)} title={m.hint}>
                  {m.id === 'domain_first' && <Spark size={10} />}
                  {m.label}
                </button>
              ))}
            </div>
            <span className="field-hint">{NAME_MODES.find((m) => m.id === brief.mode)?.hint}</span>
          </div>

          <details className="stack gap-12">
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14.5 }}>Add details (optional)</summary>
            <div className="stack gap-16" style={{ marginTop: 12 }}>
              <Field label="Industry">
                <div className="chips">
                  {INDUSTRIES.map((i) => (
                    <button key={i} type="button" className="chip sm" aria-pressed={brief.industry === i} onClick={() => set('industry', brief.industry === i ? undefined : i)}>
                      {i}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Who is it for?">
                <input className="input sm" value={brief.audience ?? ''} onChange={(e) => set('audience', e.target.value || undefined)} placeholder="College students in Tier-2 cities" />
              </Field>
              <Field label="Where?">
                <div className="chips">
                  {GEOGRAPHIES.map((g) => (
                    <button key={g} type="button" className="chip sm" aria-pressed={brief.geography === g} onClick={() => set('geography', brief.geography === g ? undefined : g)}>
                      {g}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Personality">
                <div className="chips">
                  {PERSONALITIES.map((p) => (
                    <button key={p} type="button" className="chip sm" aria-pressed={brief.personalities.includes(p)} onClick={() => toggleIn('personalities', p, 4)}>
                      {p}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Name style">
                <div className="chips">
                  {NAME_STYLES.map((s) => (
                    <button key={s} type="button" className="chip sm" aria-pressed={brief.styles.includes(s)} onClick={() => toggleIn('styles', s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Domain extensions">
                <div className="chips">
                  {TLDS.map((t) => (
                    <button key={t} type="button" className="chip sm mono" aria-pressed={brief.tlds.includes(t)} onClick={() => toggleIn('tlds', t, 5)}>
                      .{t}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid-3" style={{ gap: 10, gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
                <Field label="Max letters">
                  <input className="input sm" inputMode="numeric" value={brief.constraints?.maxLength ?? ''} onChange={(e) => setC('maxLength', e.target.value ? Math.max(3, Math.min(20, Number(e.target.value) || 0)) : undefined)} placeholder="7" />
                </Field>
                <Field label="Starts with">
                  <input className="input sm" maxLength={3} value={brief.constraints?.startsWith ?? ''} onChange={(e) => setC('startsWith', e.target.value.replace(/[^a-z]/gi, ''))} placeholder="K" />
                </Field>
                <Field label="Avoid letters">
                  <input className="input sm" maxLength={10} value={brief.constraints?.avoidLetters ?? ''} onChange={(e) => setC('avoidLetters', e.target.value.replace(/[^a-z]/gi, ''))} placeholder="xq" />
                </Field>
              </div>
            </div>
          </details>

          {error && <div className="notice error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={!!loading}>
            <Spark size={16} color="#fff" />
            {rounds.length ? 'Generate a fresh batch' : brief.mode === 'domain_first' ? 'Find registrable names' : 'Find names'}
          </button>
        </form>
        <DemoBanner />
      </aside>

      {/* ------------------------------ results ------------------------------ */}
      <section ref={resultsRef} className="stack gap-20" aria-live="polite" style={{ scrollMarginTop: 90 }}>
        {loading ? (
          <div className="card">
            <Loading
              title={loading === 'domain_first' ? 'Finding names you can register…' : loading === 'refine' ? 'Refining…' : 'Finding names…'}
              steps={
                loading === 'domain_first'
                  ? ['Generating 24 candidates', 'Checking each one with the registry', 'Keeping only the registrable ones', 'Scoring the survivors']
                  : ['Reading your idea', 'Exploring directions', 'Checking meanings across languages', 'Scoring every name']
              }
            />
          </div>
        ) : !current ? (
          <div className="stack gap-16">
            <Empty title="Your names will appear here" body="Describe your idea on the left — one sentence is enough. Or try one of these:" />
            <div className="chips" style={{ justifyContent: 'center' }}>
              {EXAMPLES.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="chip wrap"
                  onClick={() => {
                    const b = { ...brief, description: e };
                    setBrief(b);
                    void run('generate', b);
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="row between wrap gap-12">
              <div className="stack gap-4">
                <span className="eyebrow">
                  Round {current.round} · {current.names.length} names
                </span>
                <h1 className="display" style={{ fontSize: 'clamp(26px,3vw,34px)' }}>
                  Find a name you’ll actually want to use.
                </h1>
              </div>
              <SourceBadge source={current.source} />
            </div>
            {current.notice && <div className="notice warn">{current.notice}</div>}

            {/* Refine bar */}
            <form
              className="card sm stack gap-12"
              onSubmit={(e) => {
                e.preventDefault();
                void run('refine');
              }}
            >
              <div className="chips">
                {REFINEMENTS.map((r) => (
                  <button key={r} type="button" className="chip sm" aria-pressed={refinements.includes(r)} onClick={() => setRefinements((x) => (x.includes(r) ? x.filter((y) => y !== r) : [...x, r]))}>
                    {r}
                  </button>
                ))}
              </div>
              <div className="row gap-10 wrap">
                <input className="input sm grow" style={{ minWidth: 220 }} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Tell us what to change — “too corporate”, “feel like chai”, “start with K”" aria-label="Refine instruction" />
                <button className="btn btn-dark btn-sm" disabled={!feedback && !refinements.length}>
                  Refine
                </button>
              </div>
              <span className="tiny muted">Saved ♥ names steer the next round.</span>
            </form>

            <div className="names-grid">
              {current.names.map((n, i) => (
                <NameCard
                  key={n.id}
                  n={n}
                  index={i}
                  score={scored(n)}
                  check={checks[n.id]}
                  selected={selected.includes(n.id)}
                  saved={!!saved[toSlug(n.name)]}
                  building={building === n.id}
                  onSelect={() => toggleSelect(n.id)}
                  onSave={() => toggleSave(n)}
                  onCheck={() => check(n)}
                  onOpen={() => {
                    setOpen(n.id);
                    if (!checks[n.id]?.domains) void check(n);
                  }}
                  onBuild={() => build(n)}
                />
              ))}
            </div>

            {rounds.length > 1 && (
              <details className="card sm">
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Earlier rounds ({rounds.length - 1})</summary>
                <div className="stack gap-16" style={{ marginTop: 16 }}>
                  {rounds.slice(1).map((r) => (
                    <div key={r.round} className="stack gap-8">
                      <span className="eyebrow">Round {r.round}</span>
                      <div className="chips">
                        {r.names.map((n) => (
                          <button key={n.id} type="button" className="chip sm" aria-pressed={selected.includes(n.id)} onClick={() => toggleSelect(n.id)}>
                            {n.name} <span className="mono tiny muted">{n.score.overall.toFixed(1)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </section>

      {/* ------------------------------ shortlist tray ------------------------------ */}
      {selected.length > 0 && (
        <div className="tray" role="region" aria-label="Shortlist">
          <strong>
            {selected.length} shortlisted
            <span className="hide-sm" style={{ fontWeight: 400, color: 'var(--on-dark-muted)' }}>
              {' '}
              · {selectedNames.map((n) => n.name).join(', ')}
            </span>
          </strong>
          <div className="row gap-8 wrap" style={{ marginLeft: 'auto' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected([])}>
              Clear
            </button>
            <button className="btn btn-ghost btn-sm" onClick={checkShortlist}>
              Check domains & handles
            </button>
            <button className="btn btn-primary btn-sm" disabled={selected.length < 2} onClick={() => setCompare(true)}>
              Compare {selected.length >= 2 ? selected.length : ''}
            </button>
          </div>
        </div>
      )}

      {open && (() => {
        const n = allNames.find((x) => x.id === open);
        if (!n) return null;
        return <NameDetail n={n} score={scored(n)} check={checks[n.id]} onClose={() => setOpen(null)} onBuild={() => build(n)} onRecheck={() => check(n)} building={building === n.id} />;
      })()}
      {compare && <CompareModal names={selectedNames} scored={scored} checks={checks} onClose={() => setCompare(false)} onCheck={check} onBuild={build} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="stack gap-6">
      <span className="small" style={{ fontWeight: 700 }}>
        {label}
      </span>
      {children}
    </div>
  );
}

/* --------------------------------- name card -------------------------------- */

const TYPE_LABEL: Record<string, string> = {
  invented: 'Coined',
  compound: 'Compound',
  blend: 'Blend',
  real_word: 'Real word',
  descriptive: 'Descriptive',
  indian: 'Indian roots',
  abstract: 'Invented',
  founder: 'Founder-led',
};

function NameCard(props: {
  n: NameCandidate;
  index: number;
  score: NameCandidate['score'];
  check?: CheckState;
  selected: boolean;
  saved: boolean;
  building: boolean;
  onSelect: () => void;
  onSave: () => void;
  onCheck: () => void;
  onOpen: () => void;
  onBuild: () => void;
}) {
  const { n, score, check } = props;
  const len = toSlug(n.name).length + (n.name.includes(' ') ? 1 : 0);
  const size = len <= 7 ? 34 : len <= 9 ? 30 : len <= 11 ? 26 : len <= 13 ? 23 : 20;
  return (
    <article className={`name-card ${props.selected ? 'selected' : ''}`} style={{ animationDelay: `${Math.min(props.index, 12) * 40}ms` }}>
      <div className="row between gap-8">
        <label className="row gap-8 tiny muted" style={{ cursor: 'pointer' }}>
          <input type="checkbox" className="check-box" checked={props.selected} onChange={props.onSelect} aria-label={`Shortlist ${n.name}`} />
          {props.selected ? 'Shortlisted' : 'Shortlist'}
        </label>
        <ScorePill score={score} />
      </div>

      <div className="stack gap-2" style={{ minWidth: 0 }}>
        <button type="button" onClick={props.onOpen} className="nm-btn" style={{ fontSize: size }} title={n.name}>
          {n.name}
        </button>
        <span className="pron">{n.pronunciation}</span>
      </div>

      {n.tagline && <p className="nm-tagline">“{n.tagline}”</p>}
      <div className="row gap-6 wrap">
        <span className="badge line">{TYPE_LABEL[n.nameType] ?? n.nameType}</span>
        {n.personality.slice(0, 2).map((p) => (
          <span key={p} className="badge">
            {p}
          </span>
        ))}
      </div>
      <p className="why clamp-3">{n.meaning ?? n.rationale}</p>

      {check?.domains || check?.socials ? (
        <div className="stack gap-8 nm-avail">
          {check.domains && <DomainChips results={check.domains} />}
          <CoreTag name={n.name} domains={check.domains} socials={check.socials} size="sm" />
        </div>
      ) : check?.error ? (
        <span className="tiny" style={{ color: 'var(--danger)' }}>
          {check.error}{' '}
          <button className="btn-link tiny" onClick={props.onCheck}>
            Try again
          </button>
        </span>
      ) : null}

      <div className="stack gap-8" style={{ marginTop: 'auto' }}>
        <div className="row gap-6">
          <button type="button" className="btn btn-ghost btn-xs grow" onClick={props.onCheck} disabled={check?.loading}>
            {check?.loading ? 'Checking…' : check?.domains ? 'Recheck' : 'Check availability'}
          </button>
          <button type="button" className="btn btn-ghost btn-xs" onClick={props.onSave} aria-pressed={props.saved} aria-label={props.saved ? `Unsave ${n.name}` : `Save ${n.name}`} title={props.saved ? 'Saved' : 'Save'} style={{ width: 34, padding: 0, color: props.saved ? 'var(--violet)' : undefined }}>
            {props.saved ? '♥' : '♡'}
          </button>
          <button type="button" className="btn btn-ghost btn-xs" onClick={props.onOpen} aria-label={`Details for ${n.name}`} title="Details">
            Details
          </button>
        </div>
        <button type="button" className="btn btn-primary btn-sm btn-block" onClick={props.onBuild} disabled={props.building}>
          <Spark size={12} color="#fff" />
          {props.building ? 'Starting…' : `Build ${n.name}`}
        </button>
      </div>
    </article>
  );
}

/* --------------------------------- detail modal -------------------------------- */

function NameDetail({ n, score, check, onClose, onBuild, onRecheck, building }: { n: NameCandidate; score: NameCandidate['score']; check?: CheckState; onClose: () => void; onBuild: () => void; onRecheck: () => void; building: boolean }) {
  useEscape(onClose);
  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={`${n.name} details`}>
      <div className="modal stack gap-24" onClick={(e) => e.stopPropagation()}>
        <div className="row between gap-16 wrap">
          <div className="stack gap-6">
            <span className="display" style={{ fontSize: 'clamp(40px,6vw,64px)', lineHeight: 1 }}>
              {n.name.toLowerCase()}
              <Spark size={22} style={{ display: 'inline-block', marginLeft: 4 }} />
            </span>
            <span className="mono small muted">{n.pronunciation}</span>
          </div>
          <div className="row gap-8">
            <a className="btn btn-ghost btn-sm" href={`/name/${encodeURIComponent(n.name)}`} target="_blank" rel="noopener noreferrer">
              Share page
            </a>
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>
        {n.tagline && <p className="nm-detail-tagline">“{n.tagline}”</p>}
        <div className="grid-2" style={{ alignItems: 'start', gap: 20 }}>
          <div className="stack gap-12">
            {n.meaning && (
              <div className="stack gap-4">
                <span className="eyebrow">What it means</span>
                <p style={{ margin: 0, fontSize: 16.5 }}>{n.meaning}</p>
              </div>
            )}
            <div className="stack gap-4">
              <span className="eyebrow">Why it fits</span>
              <p className="soft" style={{ margin: 0 }}>{n.rationale}</p>
            </div>
            {n.origin && <span className="tiny muted mono">{n.origin}</span>}
          </div>
          <div className="stack gap-12">
            {n.whyItWorks?.length ? (
              <ul className="ticks">
                {n.whyItWorks.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            ) : null}
            {n.watchOut && (
              <div className="notice warn small">
                <strong>Watch out:</strong> {n.watchOut}
              </div>
            )}
          </div>
        </div>
        <Risks score={score} />
        <AvailabilityPanel name={n.name} domains={check?.domains} socials={check?.socials} alternatives={check?.alternatives} busy={check?.loading} onRecheck={onRecheck} />
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card sm">
            <ScoreBreakdown score={score} />
          </div>
          <div className="stack gap-16">
            <div className="scorecard">
              <div className="stack gap-4">
                <span className="label">GOBRAND SCORE{score.provisional ? ' · PROVISIONAL' : ''}</span>
                <span className="value">
                  {score.overall.toFixed(1)}
                  <small> / 10</small>
                </span>
              </div>
            </div>
            <div className="card sm stack gap-8">
              <strong>SEO potential · {score.seo.value.toFixed(1)}</strong>
              <p className="small soft">{score.seo.explanation}</p>
            </div>
          </div>
        </div>
        <div className="row gap-12 wrap" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onBuild} disabled={building}>
            <Spark size={16} color="#fff" /> {building ? 'Starting…' : `Build ${n.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- compare -------------------------------- */

function CompareModal({
  names,
  scored,
  checks,
  onClose,
  onCheck,
  onBuild,
}: {
  names: NameCandidate[];
  scored: (n: NameCandidate) => NameCandidate['score'];
  checks: Record<string, CheckState>;
  onClose: () => void;
  onCheck: (n: NameCandidate) => Promise<void>;
  onBuild: (n: NameCandidate) => void;
}) {
  useEscape(onClose);
  useEffect(() => {
    names.forEach((n) => {
      if (!checks[n.id]?.domains && !checks[n.id]?.loading) void onCheck(n);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const keys = names[0] ? scored(names[0]).components.map((c) => c.key) : [];
  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Compare names">
      <div className="modal stack gap-20" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <div className="stack gap-4">
            <span className="eyebrow">Compare {names.length} names</span>
            <h2 className="h3">No winner declared. You decide.</h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Factor</th>
                {names.map((n) => (
                  <th key={n.id} style={{ fontFamily: 'var(--font-display)', fontSize: 20, textTransform: 'none', letterSpacing: '-0.03em', color: 'var(--ink)', fontWeight: 700 }}>
                    {n.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>GoBrand Score</strong>
                </td>
                {names.map((n) => (
                  <td key={n.id}>
                    <ScorePill score={scored(n)} />
                  </td>
                ))}
              </tr>
              {keys.map((k) => (
                <tr key={k}>
                  <td>{scored(names[0]!).components.find((c) => c.key === k)?.label}</td>
                  {names.map((n) => {
                    const c = scored(n).components.find((x) => x.key === k);
                    return (
                      <td key={n.id} className="mono">
                        {c?.value == null ? '—' : c.value.toFixed(1)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td>Domains</td>
                {names.map((n) => (
                  <td key={n.id}>
                    {checks[n.id]?.domains ? (
                      <DomainChips results={checks[n.id]!.domains!} />
                    ) : (
                      <span className="tiny muted">Checking…</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td>Core 5</td>
                {names.map((n) => (
                  <td key={n.id}>
                    {checks[n.id]?.socials ? <CoreTag name={n.name} domains={checks[n.id]!.domains} socials={checks[n.id]!.socials} size="sm" /> : <span className="tiny muted">…</span>}
                  </td>
                ))}
              </tr>
              <tr>
                <td>Length</td>
                {names.map((n) => (
                  <td key={n.id} className="mono">
                    {toSlug(n.name).length} letters
                  </td>
                ))}
              </tr>
              <tr>
                <td />
                {names.map((n) => (
                  <td key={n.id}>
                    <button className="btn btn-primary btn-xs" onClick={() => onBuild(n)}>
                      <Spark size={11} color="#fff" /> Build
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function useEscape(fn: () => void) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && fn();
    window.addEventListener('keydown', on);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', on);
      document.body.style.overflow = '';
    };
  }, [fn]);
}
