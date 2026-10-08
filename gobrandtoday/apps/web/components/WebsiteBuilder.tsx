'use client';

import { useMemo, useState } from 'react';
import { EXPERT_TIMELINES, WEBSITE_FEATURES, WEBSITE_PACKAGES, WEBSITE_SECTIONS, formatPrice, websiteBriefText, type BrandKit, type WebsitePackage } from '@gbt/shared';
import { ApiError, api, track } from '@/lib/api';
import { download, kitDomain, kitHandle, websiteFile } from '@/lib/export';
import { useApp } from '@/lib/providers';
import { useLogoFonts } from './Logo';
import { useSignupGate } from './SignupGate';
import { Spark } from './Spark';

/**
 * The Website tab's top half: a live first-draft website built from the
 * Brand Bible (download it as one HTML file), and "we build it for you":
 * packages plus a short brief that goes to the experts inbox.
 */
export function WebsiteBuilder({ brandId, kit, domain, handle }: { brandId: string; kit: BrandKit; domain: string | null; handle: string | null }) {
  const t = kit.identity.typography;
  const v = useLogoFonts([t.display, t.body, t.data]);
  const ctx = { kit, domain: kitDomain(kit, domain), handle: kitHandle(kit, handle) };
  const html = useMemo(
    () => websiteFile(ctx),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kit, ctx.domain, ctx.handle, v],
  );
  const [mobile, setMobile] = useState(false);
  const { guard, gate } = useSignupGate();

  const open = () => {
    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <div className="stack gap-24">
      {gate}
      <section className="stack gap-12">
        <div className="row between wrap gap-12" style={{ alignItems: 'flex-end' }}>
          <div className="stack gap-6">
            <span className="eyebrow">Your first-draft website</span>
            <h2 className="h3" style={{ fontSize: 24 }}>
              {kit.name}, live in your brand
            </h2>
            <span className="small soft">Built from your Brand Bible: your colours, fonts, logo and words. Download it as one HTML file, or have us build it for real.</span>
          </div>
          <div className="row gap-8 wrap">
            <div className="seg" role="group" aria-label="Preview size">
              <button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>
                Desktop
              </button>
              <button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>
                Mobile
              </button>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={open}>
              Open full screen
            </button>
            <button
              type="button"
              className="btn btn-dark btn-sm"
              onClick={guard(() => {
                track('export', { format: 'website-html' });
                download(`${kit.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-website-draft.html`, html, 'text/html');
              })}
            >
              Download HTML
            </button>
          </div>
        </div>
        <div className="wb-preview">
          <div className="wb-bar">
            <span className="wb-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="wb-url">https://{ctx.domain}</span>
          </div>
          <div className="wb-frame-wrap">
            <iframe title={`${kit.name} website draft`} className={`wb-frame${mobile ? ' mobile' : ''}`} srcDoc={html} sandbox="" loading="lazy" />
          </div>
        </div>
      </section>
      <BuildForYou brandId={brandId} brandName={kit.name} domain={domain} />
    </div>
  );
}

function BuildForYou({ brandId, brandName, domain }: { brandId: string; brandName: string; domain: string | null }) {
  const { currency, toast, me } = useApp();
  const [pkg, setPkg] = useState<WebsitePackage['id']>('business');
  const [sections, setSections] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>(['Contact form', 'WhatsApp chat']);
  const [hasDomain, setHasDomain] = useState<boolean | undefined>(undefined);
  const [references, setReferences] = useState('');
  const [notes, setNotes] = useState('');
  const [timeline, setTimeline] = useState<string>(EXPERT_TIMELINES[1]);
  const [name, setName] = useState(me?.isGuest ? '' : (me?.name ?? ''));
  const [email, setEmail] = useState(me?.email ?? '');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const chosen = WEBSITE_PACKAGES.find((p) => p.id === pkg)!;
  const toggle = (list: string[], set: (v: string[]) => void, x: string) => set(list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ message: string }>('/api/experts/requests', {
        body: {
          service: 'website',
          name,
          email,
          phone: phone || undefined,
          budget: `${chosen.title}${chosen.from ? ` · from ${formatPrice(chosen.from[currency], currency)}` : ' · quote'}`.slice(0, 40),
          timeline,
          details: websiteBriefText({ packageId: pkg, sections, features, references, notes, hasDomain }, { name: brandName, domain }),
          brandId,
          currency,
        },
      });
      track('expert_requested', { service: 'website', package: pkg });
      setDone(r.message);
      toast('Brief sent');
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : 'Could not send your brief. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="wb-build" aria-labelledby="wb-h">
      <div className="stack gap-8" style={{ maxWidth: 640 }}>
        <span className="eyebrow">
          <Spark size={11} /> GoBrand Studio · built for you
        </span>
        <h2 id="wb-h" className="h2" style={{ fontSize: 'clamp(26px,3.4vw,36px)' }}>
          Want it live? We’ll build {brandName}’s website for you.
        </h2>
        <p className="soft">Tell us what you want to show. A designer-developer turns this draft into a real, fast site on your domain. You get a written scope and a fixed quote within one working day, before you pay anything.</p>
      </div>

      <div className="wb-packs" role="group" aria-label="Choose a package">
        {WEBSITE_PACKAGES.map((p) => (
          <button key={p.id} type="button" className="wb-pack" aria-pressed={pkg === p.id} onClick={() => setPkg(p.id)}>
            <span className="row between gap-8" style={{ alignItems: 'baseline' }}>
              <b style={{ fontSize: 16.5 }}>{p.title}</b>
              <span className="tiny muted">{p.turnaround}</span>
            </span>
            <span className="wb-price">{p.from ? <>from {formatPrice(p.from[currency], currency)}</> : 'Custom quote'}</span>
            <span className="small soft">{p.pitch}</span>
            <ul>
              {p.includes.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {done ? (
        <div className="card stack gap-8" role="status">
          <b style={{ fontSize: 18 }}>Brief received ✓</b>
          <span className="soft">{done}</span>
          <span className="small muted">Next: a written scope and fixed quote by email. 50% to start, 50% when the site is live. Your draft and Brand Bible are attached to the brief.</span>
        </div>
      ) : (
        <form className="card stack gap-16" onSubmit={submit}>
          <div className="stack gap-8">
            <span className="label">What should the site show?</span>
            <div className="chips">
              {WEBSITE_SECTIONS.map((s) => (
                <button key={s} type="button" className="chip" aria-pressed={sections.includes(s)} onClick={() => toggle(sections, setSections, s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="stack gap-8">
            <span className="label">What should it do?</span>
            <div className="chips">
              {WEBSITE_FEATURES.map((s) => (
                <button key={s} type="button" className="chip" aria-pressed={features.includes(s)} onClick={() => toggle(features, setFeatures, s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="grid-2">
            <label className="stack gap-6">
              <span className="label">Sites you like (optional)</span>
              <input className="input" value={references} maxLength={300} onChange={(e) => setReferences(e.target.value)} placeholder="e.g. a competitor or any site whose feel you like" />
            </label>
            <div className="stack gap-6">
              <span className="label">Do you own the domain yet?</span>
              <div className="seg" role="group" aria-label="Domain bought">
                <button type="button" aria-pressed={hasDomain === true} onClick={() => setHasDomain(true)}>
                  Yes
                </button>
                <button type="button" aria-pressed={hasDomain === false} onClick={() => setHasDomain(false)}>
                  Not yet
                </button>
              </div>
            </div>
          </div>
          <label className="stack gap-6">
            <span className="label">Anything else we should know?</span>
            <textarea className="input textarea" rows={3} value={notes} maxLength={800} onChange={(e) => setNotes(e.target.value)} placeholder="Pages you need, products, launch date, languages…" />
          </label>
          <div className="grid-2">
            <label className="stack gap-6">
              <span className="label">Your name</span>
              <input className="input" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
            <label className="stack gap-6">
              <span className="label">Email</span>
              <input className="input" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label className="stack gap-6">
              <span className="label">Phone / WhatsApp (optional)</span>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" />
            </label>
            <label className="stack gap-6">
              <span className="label">When do you need it?</span>
              <select className="input select" value={timeline} onChange={(e) => setTimeline(e.target.value)}>
                {EXPERT_TIMELINES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          {err && <div className="notice error">{err}</div>}
          <div className="row between wrap gap-12">
            <span className="small muted">
              {chosen.title} · {chosen.from ? `from ${formatPrice(chosen.from[currency], currency)}` : 'custom quote'} · no payment now
            </span>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Sending…' : 'Get my fixed quote'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
