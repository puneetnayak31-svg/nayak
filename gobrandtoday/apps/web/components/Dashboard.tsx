'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { planById, swatch, toSlug, type BrandKit, type DomainResult, type HandleSuggestion, type LogoStyle, type MarkShape, type PaletteSwatch, type SocialResult } from '@gbt/shared';
import { Logo } from './Logo';
import { ApiError, api } from '@/lib/api';
import { useApp } from '@/lib/providers';
import { CurrencyToggle } from './CurrencyToggle';
import { Mark, Spark } from './Spark';
import { DomainList, HandleIdeas, HandleList } from './Availability';
import { ExpertsBox } from './Experts';
import { Empty } from './ui';
import { UsageMeters } from './AccountMenu';

const NAV = [
  ['/dashboard', 'Home'],
  ['/create', 'Discover Names'],
  ['/dashboard/saved', 'Saved Names'],
  ['/dashboard/brands', 'Brand Kits'],
  ['/dashboard/domains', 'Domains'],
  ['/dashboard/handles', 'Social Handles'],
  ['/dashboard/assistant', 'AI Assistant'],
  ['/dashboard/settings', 'Settings'],
] as const;

export function DashNav() {
  const path = usePathname();
  return (
    <nav className="side-nav" aria-label="Dashboard">
      {NAV.map(([href, label]) => (
        <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>
          {href === '/create' ? <Spark size={12} /> : null}
          {label}
        </Link>
      ))}
    </nav>
  );
}

export interface BrandSummary {
  id: string;
  name: string;
  domain: string | null;
  status: string;
  overall: number | null;
  palette: PaletteSwatch[] | null;
  mark: MarkShape | null;
  style: LogoStyle | null;
  seed: number;
  symbol?: BrandKit['identity']['symbol'] | null;
  case?: BrandKit['identity']['case'] | null;
  fonts: BrandKit['identity']['typography'] | null;
  tagline: string | null;
  updatedAt: string;
}
interface Project {
  id: string;
  title: string;
  rounds: number;
  updatedAt: string;
}
interface Saved {
  id: string;
  name: string;
  slug: string;
  favourite: boolean;
  data: { score?: { overall: number }; rationale?: string } | null;
}

function useBrands() {
  const [brands, setBrands] = useState<BrandSummary[] | null>(null);
  useEffect(() => {
    api<{ brands: BrandSummary[] }>('/api/brands')
      .then((r) => setBrands(r.brands))
      .catch(() => setBrands([]));
  }, []);
  return [brands, setBrands] as const;
}

export function BrandTile({ b }: { b: BrandSummary }) {
  const ink = b.palette ? swatch(b.palette, 'ink') : '#16161A';
  const brand = b.palette ? swatch(b.palette, 'brand') : '#6D4AFF';
  const tint = b.palette ? swatch(b.palette, 'tint') : '#ECE7FF';
  return (
    <Link href={`/brand/${b.id}`} className="card hover stack gap-12" style={{ color: 'inherit', padding: 0, overflow: 'hidden' }}>
      <div style={{ background: tint, height: 132, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        {b.palette && b.fonts && b.mark ? (
          <Logo id={{ name: b.name, style: b.style ?? 'twinkle', palette: b.palette, typography: { display: b.fonts.display, data: b.fonts.data }, mark: b.mark, seed: b.seed, symbol: b.symbol ?? undefined, case: b.case ?? undefined }} width="78%" maxHeight={90} />
        ) : (
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, letterSpacing: '-0.05em', color: ink }}>{b.name.toLowerCase()}</span>
        )}
      </div>
      <div className="stack gap-6" style={{ padding: '4px 20px 20px' }}>
        <div className="row between">
          <strong>{b.name}</strong>
          {b.status === 'ready' && b.overall != null ? <span className="score-pill">{b.overall.toFixed(1)}</span> : <span className="badge">{b.status}</span>}
        </div>
        <span className="small soft">{b.tagline ?? (b.status === 'generating' ? 'Building…' : '')}</span>
        {b.domain && <span className="mono tiny muted">{b.domain}</span>}
        {b.palette && (
          <div className="row gap-4" style={{ marginTop: 4 }}>
            {b.palette.map((s) => (
              <span key={s.role} style={{ flex: 1, height: 8, borderRadius: 4, background: s.hex, border: '1px solid rgba(0,0,0,.05)' }} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function DashHome() {
  const { me, usage } = useApp();
  const [brands] = useBrands();
  const [projects, setProjects] = useState<Project[] | null>(null);
  useEffect(() => {
    api<{ projects: Project[] }>('/api/projects')
      .then((r) => setProjects(r.projects))
      .catch(() => setProjects([]));
  }, []);
  return (
    <div className="stack gap-32">
      <div className="row between wrap gap-16">
        <div className="stack gap-6">
          <span className="eyebrow">Home</span>
          <h1 className="display" style={{ fontSize: 'clamp(30px,4vw,44px)' }}>
            {me?.name ? `Hi ${me.name.split(' ')[0]}.` : 'Your brands.'}
          </h1>
        </div>
        <Link href="/create" className="btn btn-primary">
          <Spark size={14} color="#fff" /> New brand
        </Link>
      </div>
      {me?.isGuest && (
        <div className="notice row between wrap gap-12">
          <span>You’re working as a guest. Create a free account so you never lose your brands.</span>
          <Link href="/signup" className="btn btn-dark btn-sm">
            Save my work
          </Link>
        </div>
      )}
      {usage && (
        <section className="card stack gap-14">
          <div className="row between wrap gap-8">
            <h2 className="h3" style={{ fontSize: 19 }}>
              What’s left on {planById(me?.plan ?? 'free').name}
            </h2>
            {me?.plan === 'free' && (
              <Link href="/pricing" className="btn-link small">
                Go Pro for more →
              </Link>
            )}
          </div>
          <UsageMeters usage={usage} />
        </section>
      )}
      <section className="stack gap-16">
        <h2 className="h3">Brand kits</h2>
        {brands === null ? (
          <div className="skeleton" style={{ height: 220 }} />
        ) : brands.length === 0 ? (
          <Empty title="No brands yet" body="Find a name, then hit “Build brand”. Your Brand in a Box lands here." action={<Link href="/create" className="btn btn-primary btn-sm">Find a name</Link>} />
        ) : (
          <div className="grid-3">
            {brands.slice(0, 6).map((b) => (
              <BrandTile key={b.id} b={b} />
            ))}
          </div>
        )}
      </section>
      <section className="stack gap-16">
        <h2 className="h3">Naming projects</h2>
        {projects?.length ? (
          <div className="stack gap-8">
            {projects.map((p) => (
              <Link key={p.id} href={`/create?project=${p.id}`} className="card sm row between gap-12" style={{ color: 'inherit', padding: '14px 18px' }}>
                <span style={{ fontWeight: 700 }}>{p.title}</span>
                <span className="mono tiny muted">
                  {p.rounds} round{p.rounds === 1 ? '' : 's'} · {new Date(p.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted small">Your idea briefs and every round of names are saved here.</p>
        )}
      </section>
      <ExpertsBox brandId={brands?.[0]?.id} brandName={brands?.[0]?.name} />
    </div>
  );
}

export function DashBrands() {
  const [brands] = useBrands();
  return (
    <div className="stack gap-24">
      <div className="row between wrap gap-12">
        <h1 className="display" style={{ fontSize: 36 }}>
          Brand kits
        </h1>
        <Link href="/create" className="btn btn-primary btn-sm">
          <Spark size={12} color="#fff" /> New brand
        </Link>
      </div>
      {brands === null ? (
        <div className="skeleton" style={{ height: 220 }} />
      ) : brands.length ? (
        <div className="grid-3">
          {brands.map((b) => (
            <BrandTile key={b.id} b={b} />
          ))}
        </div>
      ) : (
        <Empty title="No brand kits yet" action={<Link href="/create" className="btn btn-primary btn-sm">Start</Link>} />
      )}
    </div>
  );
}

export function DashSaved() {
  const { toast } = useApp();
  const router = useRouter();
  const [saved, setSaved] = useState<Saved[] | null>(null);
  useEffect(() => {
    api<{ saved: Saved[] }>('/api/saved')
      .then((r) => setSaved(r.saved))
      .catch(() => setSaved([]));
  }, []);
  const fav = async (s: Saved) => {
    const r = await api<{ saved: Saved }>(`/api/saved/${s.id}`, { method: 'PATCH', body: { favourite: !s.favourite } });
    setSaved((x) => x?.map((y) => (y.id === s.id ? r.saved : y)) ?? null);
  };
  const remove = async (s: Saved) => {
    await api(`/api/saved/${s.id}`, { method: 'DELETE' });
    setSaved((x) => x?.filter((y) => y.id !== s.id) ?? null);
    toast(`Removed ${s.name}`);
  };
  const share = async () => {
    const text = `My GoBrandToday shortlist:\n${(saved ?? []).map((s) => `• ${s.name} — ${location.origin}/name/${encodeURIComponent(s.name)}`).join('\n')}`;
    if (navigator.share) await navigator.share({ text }).catch(() => undefined);
    else {
      await navigator.clipboard.writeText(text);
      toast('Shortlist copied');
    }
  };
  const exportCsv = () => {
    const rows = [['name', 'score', 'favourite', 'link'], ...(saved ?? []).map((s) => [s.name, String(s.data?.score?.overall ?? ''), String(s.favourite), `${location.origin}/name/${encodeURIComponent(s.name)}`])];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gobrandtoday-shortlist.csv';
    a.click();
  };
  return (
    <div className="stack gap-24">
      <div className="row between wrap gap-12">
        <h1 className="display" style={{ fontSize: 36 }}>
          Saved names
        </h1>
        {saved && saved.length > 0 && (
          <div className="row gap-8">
            <button className="btn btn-ghost btn-sm" onClick={share}>
              Share
            </button>
            <button className="btn btn-ghost btn-sm" onClick={exportCsv}>
              Export CSV
            </button>
          </div>
        )}
      </div>
      {saved === null ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : saved.length === 0 ? (
        <Empty title="Nothing saved yet" body="Tap ♡ Save on any name to keep it here." action={<Link href="/create" className="btn btn-primary btn-sm">Find names</Link>} />
      ) : (
        <div className="names-grid">
          {saved.map((s) => (
            <div key={s.id} className="name-card">
              <div className="row between">
                <span className="nm">{s.name}</span>
                {s.data?.score && <span className="score-pill">{s.data.score.overall.toFixed(1)}</span>}
              </div>
              {s.data?.rationale && <p className="why">{s.data.rationale}</p>}
              <div className="row gap-8 wrap" style={{ marginTop: 'auto' }}>
                <button className="btn btn-ghost btn-xs" onClick={() => fav(s)} aria-pressed={s.favourite}>
                  {s.favourite ? '★ Favourite' : '☆ Favourite'}
                </button>
                <Link href={`/name/${encodeURIComponent(s.name)}`} className="btn btn-ghost btn-xs">
                  Recheck availability
                </Link>
                <button className="btn btn-ghost btn-xs" onClick={() => remove(s)}>
                  Remove
                </button>
                <button className="btn btn-primary btn-xs" style={{ marginLeft: 'auto' }} onClick={() => router.push(`/name/${encodeURIComponent(s.name)}`)}>
                  <Spark size={11} color="#fff" /> Build
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DashDomains() {
  const { toast } = useApp();
  const [name, setName] = useState('');
  const [results, setResults] = useState<DomainResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [watch, setWatch] = useState<Array<{ id: string; domain: string; lastStatus: string | null; lastCheckedAt: string | null }>>([]);
  useEffect(() => {
    api<{ items: typeof watch }>('/api/watch')
      .then((r) => setWatch(r.items))
      .catch(() => undefined);
  }, []);
  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toSlug(name)) return;
    setBusy(true);
    try {
      const r = await api<{ results: DomainResult[] }>('/api/domain/check', { body: { name, tlds: ['com', 'in', 'co.in', 'ai', 'io', 'co', 'app', 'xyz'] } });
      setResults(r.results);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Check failed', 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="stack gap-24">
      <h1 className="display" style={{ fontSize: 36 }}>
        Domains
      </h1>
      <form className="card stack gap-12" onSubmit={check}>
        <label className="label" htmlFor="dn">
          See if the domain is yours
        </label>
        <div className="row gap-10 wrap">
          <input id="dn" className="input sm grow" value={name} onChange={(e) => setName(e.target.value)} placeholder="lumora" style={{ minWidth: 200 }} />
          <button className="btn btn-primary btn-sm" disabled={busy}>
            {busy ? 'Checking…' : 'Check 8 extensions'}
          </button>
        </div>
        {results && (
          <DomainList
            results={results}
            onWatch={(d) =>
              api<{ item: (typeof watch)[number] | null }>('/api/watch', { body: { domain: d.domain, status: d.status } }).then((r) => {
                if (r.item) setWatch((w) => [r.item!, ...w]);
                toast(`Watching ${d.domain}`);
              })
            }
          />
        )}
      </form>
      <section className="card stack gap-12">
        <div className="row between wrap gap-8">
          <h2 className="h3">Watchlist</h2>
          <span className="tiny muted">Recheck any time. Automatic alerts are coming with Studio.</span>
        </div>
        {watch.length === 0 ? (
          <p className="muted small">Taken domains you watch appear here.</p>
        ) : (
          <table className="table">
            <tbody>
              {watch.map((w) => (
                <tr key={w.id}>
                  <td className="mono">{w.domain}</td>
                  <td>
                    <span className={`status ${w.lastStatus ?? 'unknown'}`}>{w.lastStatus ?? 'unknown'}</span>
                  </td>
                  <td className="tiny muted hide-sm">{w.lastCheckedAt ? new Date(w.lastCheckedAt).toLocaleString('en-IN') : ''}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="row gap-6" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={async () => {
                          const r = await api<{ item: (typeof watch)[number] }>(`/api/watch/${w.id}/recheck`, { method: 'POST' });
                          setWatch((x) => x.map((y) => (y.id === w.id ? r.item : y)));
                        }}
                      >
                        Recheck
                      </button>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={async () => {
                          await api(`/api/watch/${w.id}`, { method: 'DELETE' });
                          setWatch((x) => x.filter((y) => y.id !== w.id));
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export function DashHandles() {
  const { toast } = useApp();
  const [handle, setHandle] = useState('');
  const [res, setRes] = useState<{ results: SocialResult[]; alternatives: HandleSuggestion[] } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="stack gap-24">
      <h1 className="display" style={{ fontSize: 36 }}>
        Social handles
      </h1>
      <form
        className="card stack gap-16"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!handle.trim()) return;
          setBusy(true);
          try {
            setRes(await api('/api/social/check', { body: { handle, alternatives: true } }));
          } catch (err) {
            toast(err instanceof ApiError ? err.message : 'Check failed', 'error');
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="label" htmlFor="hn">
          Check a handle on 10 platforms
        </label>
        <div className="row gap-10 wrap">
          <div className="input-group grow" style={{ minWidth: 200 }}>
            <span className="suffix" style={{ paddingRight: 0 }}>
              @
            </span>
            <input id="hn" className="input sm" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="lumora" />
          </div>
          <button className="btn btn-primary btn-sm" disabled={busy}>
            {busy ? 'Checking…' : 'Check'}
          </button>
        </div>
        <p className="tiny muted">Verified automatically on GitHub, Reddit and YouTube. Platforms without a public check get a one-tap link — we never guess.</p>
        {res && (
          <>
            <HandleList results={res.results} />
            <HandleIdeas items={res.alternatives} />
          </>
        )}
      </form>
    </div>
  );
}

export function DashAssistant() {
  const [brands] = useBrands();
  return (
    <div className="stack gap-24">
      <div className="stack gap-6">
        <h1 className="display" style={{ fontSize: 36 }}>
          AI Brand Assistant
        </h1>
        <p className="soft">Pick a brand. The assistant knows its story, palette, fonts and voice — and can change them.</p>
      </div>
      {brands === null ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : brands.length === 0 ? (
        <Empty title="Build a brand first" action={<Link href="/create" className="btn btn-primary btn-sm">Find a name</Link>} />
      ) : (
        <div className="grid-3">
          {brands
            .filter((b) => b.status === 'ready')
            .map((b) => (
              <BrandTile key={b.id} b={b} />
            ))}
        </div>
      )}
    </div>
  );
}

export function DashSettings() {
  const { me, refreshMe, toast } = useApp();
  const router = useRouter();
  const [name, setName] = useState(me?.name ?? '');
  useEffect(() => setName(me?.name ?? ''), [me?.name]);
  return (
    <div className="stack gap-24">
      <h1 className="display" style={{ fontSize: 36 }}>
        Settings
      </h1>
      <div className="card stack gap-16">
        <div className="row between wrap gap-12">
          <div className="stack gap-4">
            <strong>Account</strong>
            <span className="small soft">{me?.isGuest ? 'Guest — your work is saved on this browser.' : me?.email}</span>
          </div>
          {me?.isGuest ? (
            <Link href="/signup" className="btn btn-dark btn-sm">
              Create account
            </Link>
          ) : (
            <button
              className="btn btn-ghost btn-sm"
              onClick={async () => {
                await api('/api/auth/logout', { method: 'POST' });
                await refreshMe();
                router.push('/');
              }}
            >
              Sign out
            </button>
          )}
        </div>
        {!me?.isGuest && (
          <form
            className="row gap-10 wrap"
            onSubmit={async (e) => {
              e.preventDefault();
              await api('/api/me', { method: 'PATCH', body: { name } });
              await refreshMe();
              toast('Saved');
            }}
          >
            <input className="input sm grow" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Your name" style={{ minWidth: 200 }} />
            <button className="btn btn-ghost btn-sm">Save</button>
          </form>
        )}
        <hr className="divider" />
        <div className="row between wrap gap-12">
          <div className="stack gap-4">
            <strong>Currency</strong>
            <span className="small soft">Prices and registrar storefronts follow this.</span>
          </div>
          <CurrencyToggle />
        </div>
        <hr className="divider" />
        <div className="row between wrap gap-12">
          <div className="stack gap-4">
            <strong>Plan</strong>
            <span className="small soft">{me?.plan === 'free' ? 'Spark (free)' : planById(me?.plan ?? 'free').name}</span>
          </div>
          <Link href="/pricing" className="btn btn-ghost btn-sm">
            See plans
          </Link>
        </div>
      </div>
    </div>
  );
}
