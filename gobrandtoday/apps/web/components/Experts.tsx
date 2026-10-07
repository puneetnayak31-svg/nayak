'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EXPERT_BUDGETS, EXPERT_SERVICES, EXPERT_TIMELINES, formatPrice, rankExperts, type ExpertService } from '@gbt/shared';
import { ApiError, api, track } from '@/lib/api';
import { useApp } from '@/lib/providers';
import { Spark } from './Spark';

/* ------------------------------------------------------------------ */
/* Glyphs                                                              */
/* ------------------------------------------------------------------ */

const GLYPHS: Record<ExpertService['glyph'], string> = {
  pen: 'M6 26 L20 12 L24 16 L10 30 L5 31 Z M20 12 L23 9 A2.8 2.8 0 0 1 27 13 L24 16',
  compass: 'M18 4 A14 14 0 1 0 18.01 4 Z M23 13 L20 20 L13 23 L16 16 Z',
  browser: 'M5 8 H31 V28 H5 Z M5 13 H31 M9 10.5 H9.5 M12 10.5 H12.5 M10 18 H22 M10 22 H18',
  wave: 'M4 18 H7 M10 12 V24 M14 8 V28 M18 14 V22 M22 10 V26 M26 15 V21 M30 18 H32',
  box: 'M18 4 L31 10 V26 L18 32 L5 26 V10 Z M5 10 L18 16 L31 10 M18 16 V32',
  play: 'M5 7 H31 V29 H5 Z M15 13 L24 18 L15 23 Z',
  shield: 'M18 4 L30 8 V17 C30 24 25 29 18 32 C11 29 6 24 6 17 V8 Z M13 18 L17 22 L24 14',
  grid: 'M6 6 H16 V16 H6 Z M20 6 H30 V16 H20 Z M6 20 H16 V30 H6 Z M20 20 H30 V30 H20 Z',
};

export function ExpertGlyph({ glyph, size = 36 }: { glyph: ExpertService['glyph']; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" className="ex-glyph">
      <path d={GLYPHS[glyph]} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Box (used across the product)                                       */
/* ------------------------------------------------------------------ */

/**
 * The premium upsell: human experts for bespoke work. Compact by default
 * (four services most relevant to this brand), with a link to all of them.
 */
export function ExpertsBox({ tags = [], brandId, brandName, compact = true, title }: { tags?: string[]; brandId?: string; brandName?: string; compact?: boolean; title?: string }) {
  const { currency } = useApp();
  const [open, setOpen] = useState<ExpertService | null>(null);
  const services = compact ? rankExperts(tags).slice(0, 4) : EXPERT_SERVICES;
  useEffect(() => {
    track('expert_viewed', { where: brandId ? 'brand' : 'page' });
  }, [brandId]);
  return (
    <section className="ex-box" aria-labelledby="ex-h">
      <div className="ex-head">
        <div className="stack gap-8" style={{ maxWidth: 560 }}>
          <span className="ex-kicker">
            <Spark size={12} color="#B9AEFF" /> GOBRAND STUDIO · BESPOKE
          </span>
          <h2 id="ex-h" className="ex-title">
            {title ?? (brandName ? `Take ${brandName} further with an expert` : 'Want something bespoke? Work with an expert.')}
          </h2>
          <p className="ex-lead">Hand-picked designers, composers, developers and trademark attorneys who start from your Brand Bible. You get a written scope and fixed quote within one working day, before you pay anything.</p>
        </div>
        {compact && (
          <Link href="/experts" className="btn btn-sm ex-all">
            All {EXPERT_SERVICES.length} services →
          </Link>
        )}
      </div>
      <div className="ex-grid">
        {services.map((s) => (
          <button key={s.id} type="button" className="ex-card" onClick={() => setOpen(s)}>
            <ExpertGlyph glyph={s.glyph} />
            <b>{s.title}</b>
            <span className="ex-pitch">{s.pitch}</span>
            <span className="ex-meta">
              <span>
                from <strong>{formatPrice(s.from[currency], currency)}</strong>
                {s.priceNote ? ` ${s.priceNote}` : ''}
              </span>
              <span>{s.turnaround}</span>
            </span>
            <span className="ex-cta">Get a quote →</span>
          </button>
        ))}
      </div>
      {open && <ExpertRequestModal service={open} brandId={brandId} brandName={brandName} onClose={() => setOpen(null)} />}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Request form                                                        */
/* ------------------------------------------------------------------ */

export function ExpertRequestForm({ service, brandId, brandName, onDone }: { service?: ExpertService; brandId?: string; brandName?: string; onDone?: () => void }) {
  const { currency, me, toast } = useApp();
  const [main, setMain] = useState(service?.id ?? EXPERT_SERVICES[0]!.id);
  const [also, setAlso] = useState<string[]>([]);
  const [name, setName] = useState(me?.name ?? '');
  const [email, setEmail] = useState(me?.email ?? '');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState<string>('');
  const [timeline, setTimeline] = useState<string>('Within a month');
  const [details, setDetails] = useState(brandName ? `For ${brandName}: ` : '');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const current = EXPERT_SERVICES.find((s) => s.id === main)!;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ message: string }>('/api/experts/requests', {
        body: { service: main, also, name, email, phone: phone || undefined, budget: budget || undefined, timeline, details: details || undefined, brandId, currency },
      });
      setDone(r.message);
      toast('Request sent');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not send your request. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="stack gap-12" style={{ alignItems: 'flex-start' }}>
        <span className="ex-done-mark">
          <Spark size={22} color="#fff" />
        </span>
        <h3 className="h3">Request received</h3>
        <p className="soft">{done}</p>
        <ol className="ex-steps">
          <li>An expert reads your Brand Bible and brief.</li>
          <li>You get a written scope, timeline and fixed quote by email.</li>
          <li>Approve it and pay 50% to start; the rest on delivery.</li>
        </ol>
        {onDone && (
          <button className="btn btn-ghost btn-sm" onClick={onDone}>
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form className="stack gap-14" onSubmit={submit}>
      <div className="stack gap-6">
        <label className="label" htmlFor="ex-service">
          What do you need?
        </label>
        <select id="ex-service" className="input sm" value={main} onChange={(e) => setMain(e.target.value)}>
          {EXPERT_SERVICES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} · from {formatPrice(s.from[currency], currency)}
            </option>
          ))}
        </select>
        <ul className="ex-includes">
          {current.includes.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
      <div className="stack gap-6">
        <span className="label">Add to the same brief (optional)</span>
        <div className="chips">
          {EXPERT_SERVICES.filter((s) => s.id !== main).map((s) => (
            <button key={s.id} type="button" className="chip sm" aria-pressed={also.includes(s.id)} onClick={() => setAlso((a) => (a.includes(s.id) ? a.filter((x) => x !== s.id) : [...a, s.id]))}>
              {s.title}
            </button>
          ))}
        </div>
      </div>
      <div className="grid-2" style={{ gap: 12 }}>
        <div className="stack gap-6">
          <label className="label" htmlFor="ex-name">
            Your name
          </label>
          <input id="ex-name" className="input sm" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" />
        </div>
        <div className="stack gap-6">
          <label className="label" htmlFor="ex-email">
            Email
          </label>
          <input id="ex-email" type="email" className="input sm" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="stack gap-6">
          <label className="label" htmlFor="ex-phone">
            WhatsApp / phone <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>
          </label>
          <input id="ex-phone" className="input sm" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="+91" />
        </div>
        <div className="stack gap-6">
          <label className="label" htmlFor="ex-budget">
            Budget
          </label>
          <select id="ex-budget" className="input sm" value={budget} onChange={(e) => setBudget(e.target.value)}>
            <option value="">Choose a range</option>
            {EXPERT_BUDGETS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="stack gap-6">
        <span className="label">When do you need it?</span>
        <div className="chips">
          {EXPERT_TIMELINES.map((t) => (
            <button key={t} type="button" className="chip sm" aria-pressed={timeline === t} onClick={() => setTimeline(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="stack gap-6">
        <label className="label" htmlFor="ex-details">
          Anything we should know?
        </label>
        <textarea id="ex-details" className="textarea" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="References you love, deadlines, where it will be used…" />
      </div>
      {err && <div className="notice error">{err}</div>}
      <div className="row gap-12 wrap" style={{ alignItems: 'center' }}>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Sending…' : 'Get my scope & quote'}
        </button>
        <span className="tiny muted">Free, no obligation. We reply within one working day.</span>
      </div>
    </form>
  );
}

function ExpertRequestModal({ service, brandId, brandName, onClose }: { service: ExpertService; brandId?: string; brandName?: string; onClose: () => void }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Request: ${service.title}`}>
      <div className="modal stack gap-16" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
        <div className="row between gap-12">
          <div className="row gap-12" style={{ alignItems: 'center' }}>
            <span className="ex-modal-glyph">
              <ExpertGlyph glyph={service.glyph} size={30} />
            </span>
            <div className="stack gap-2">
              <span className="eyebrow">Work with an expert</span>
              <h2 className="h3" style={{ margin: 0 }}>
                {service.title}
              </h2>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <ExpertRequestForm service={service} brandId={brandId} brandName={brandName} onDone={onClose} />
      </div>
    </div>
  );
}
