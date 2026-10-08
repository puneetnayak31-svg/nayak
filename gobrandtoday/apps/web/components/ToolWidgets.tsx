'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PERSONALITIES, TLDS, normaliseHandle, toSlug, type DomainResult, type HandleSuggestion, type SocialResult } from '@gbt/shared';
import { ApiError, api, track } from '@/lib/api';
import { CoreTag, DomainList, HandleIdeas, HandleList } from './Availability';
import { LogoRepurposer } from './LogoRepurposer';
import { Spark } from './Spark';

/** Free utility tools that live on SEO landing pages. */
export function ToolWidget({ kind, example }: { kind: 'social' | 'domain' | 'bible' | 'repurpose'; example: string }) {
  if (kind === 'social') return <SocialTool example={example} />;
  if (kind === 'domain') return <DomainTool example={example} />;
  if (kind === 'repurpose') return <LogoRepurposer />;
  return <BibleTool example={example} />;
}

function ToolCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="card stack gap-16 tool-card">
      <span className="eyebrow">{title}</span>
      {children}
    </div>
  );
}

function SocialTool({ example }: { example: string }) {
  const [handle, setHandle] = useState('');
  const [res, setRes] = useState<{ results: SocialResult[]; alternatives: HandleSuggestion[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const h = normaliseHandle(handle || example);
    if (!h) return;
    setBusy(true);
    setErr(null);
    try {
      setRes(await api('/api/social/check', { body: { handle: h, alternatives: true } }));
      track('tool_used', { tool: 'social' });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not check right now.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <ToolCard title="Check a username">
      <form className="row gap-8 wrap" onSubmit={run}>
        <span className="tool-at">@</span>
        <input className="input grow" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder={example} aria-label="Username" autoCapitalize="none" spellCheck={false} />
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Checking…' : 'Check 10 platforms'}
        </button>
      </form>
      {err && <div className="notice error">{err}</div>}
      {res && (
        <div className="stack gap-12 fade-up">
          <CoreTag name={handle || example} socials={res.results} />
          <HandleList results={res.results} />
          <HandleIdeas items={res.alternatives} />
        </div>
      )}
    </ToolCard>
  );
}

function DomainTool({ example }: { example: string }) {
  const [name, setName] = useState('');
  const [tlds, setTlds] = useState<string[]>(['com', 'in', 'co.in', 'ai', 'io', 'co', 'app', 'xyz']);
  const [res, setRes] = useState<DomainResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const n = toSlug(name || example);
    if (!n) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ results: DomainResult[] }>('/api/domain/check', { body: { name: n, tlds } });
      setRes(r.results);
      track('tool_used', { tool: 'domain' });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not check right now.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <ToolCard title="Check a domain">
      <form className="row gap-8 wrap" onSubmit={run}>
        <input className="input grow" value={name} onChange={(e) => setName(e.target.value.replace(/\s+/g, ''))} placeholder={example} aria-label="Domain name (without the ending)" autoCapitalize="none" spellCheck={false} />
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Checking…' : `Check ${tlds.length} endings`}
        </button>
      </form>
      <div className="chips" aria-label="Endings">
        {TLDS.map((t) => (
          <button key={t} type="button" className="chip sm mono" aria-pressed={tlds.includes(t)} onClick={() => setTlds((x) => (x.includes(t) ? (x.length > 1 ? x.filter((y) => y !== t) : x) : [...x, t].slice(-10)))}>
            .{t}
          </button>
        ))}
      </div>
      {err && <div className="notice error">{err}</div>}
      {res && (
        <div className="stack gap-10 fade-up">
          <DomainList results={res} />
          <span className="tiny muted">Prices marked “est.” are typical first-year prices; the registrar shows the exact price and taxes at checkout.</span>
        </div>
      )}
    </ToolCard>
  );
}

function BibleTool({ example }: { example: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [vibe, setVibe] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = (name || example).trim();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ brand: { id: string } }>('/api/brands', { body: { name: n, brief: { description: about, personalities: vibe, styles: [], tlds: ['com', 'in', 'ai'], mode: 'smart' } } });
      track('tool_used', { tool: 'bible' });
      router.push(`/brand/${r.brand.id}`);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not start right now.');
      setBusy(false);
    }
  };
  return (
    <ToolCard title="Generate a brand bible">
      <form className="stack gap-12" onSubmit={run}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={`Brand name, e.g. ${example}`} aria-label="Brand name" maxLength={40} />
        <textarea className="textarea" rows={2} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="What is it? e.g. Fresh chai delivered to offices in Bangalore" aria-label="What it is" />
        <div className="chips">
          {PERSONALITIES.slice(0, 8).map((p) => (
            <button key={p} type="button" className="chip sm" aria-pressed={vibe.includes(p)} onClick={() => setVibe((x) => (x.includes(p) ? x.filter((y) => y !== p) : [...x, p].slice(-3)))}>
              {p}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" disabled={busy}>
          <Spark size={14} color="#fff" /> {busy ? 'Starting…' : 'Generate my brand bible'}
        </button>
        {err && <div className="notice error">{err}</div>}
      </form>
    </ToolCard>
  );
}
