'use client';

import { useState } from 'react';
import { PLATFORM_ICON, PlatformIcon } from './PlatformIcons';
import {
  SOCIAL_PLATFORMS,
  buyLinks,
  coreAvailability,
  displayPrice,
  domainState,
  profileUrl,
  regionForCurrency,
  socialState,
  toSlug,
  type CoreState,
  type DomainResult,
  type HandleSuggestion,
  type SocialResult,
} from '@gbt/shared';
import { track } from '@/lib/api';
import { useApp } from '@/lib/providers';

/* ------------------------------------------------------------------ */
/* Shared vocabulary                                                   */
/* ------------------------------------------------------------------ */

const STATE_LABEL: Record<CoreState, string> = {
  free: 'Available',
  likely: 'Likely free',
  taken: 'Taken',
  check: 'Not checked',
  pending: 'Checking',
};

const STATE_HINT: Record<CoreState, string> = {
  free: 'Confirmed by a registrar or the platform’s own API.',
  likely: 'Nobody owns it at the registry. The registrar confirms the final price at checkout.',
  taken: 'Already registered.',
  check: 'We can’t check this automatically here. Tap to see it on the official site.',
  pending: 'Checking now…',
};

export function StateDot({ state }: { state: CoreState }) {
  return <span className={`av-dot ${state}`} aria-hidden="true" />;
}

const PLATFORM_GLYPH: Record<string, { g: string; bg: string; fg: string }> = {
  instagram: { g: 'IG', bg: 'linear-gradient(135deg,#F58529,#DD2A7B 55%,#8134AF)', fg: '#fff' },
  x: { g: '𝕏', bg: '#16161A', fg: '#fff' },
  youtube: { g: '▶', bg: '#FF0033', fg: '#fff' },
  linkedin: { g: 'in', bg: '#0A66C2', fg: '#fff' },
  tiktok: { g: '♪', bg: '#111', fg: '#25F4EE' },
  facebook: { g: 'f', bg: '#1877F2', fg: '#fff' },
  threads: { g: '@', bg: '#000', fg: '#fff' },
  pinterest: { g: 'P', bg: '#E60023', fg: '#fff' },
  reddit: { g: 'r/', bg: '#FF4500', fg: '#fff' },
  github: { g: 'GH', bg: '#24292F', fg: '#fff' },
  com: { g: '.com', bg: '#ECE7FF', fg: '#4527D9' },
};

export function PlatformGlyph({ id, size = 28 }: { id: string; size?: number }) {
  if (PLATFORM_ICON[id]) return <PlatformIcon id={id} size={size} />;
  const p = PLATFORM_GLYPH[id] ?? { g: id.slice(0, 2).toUpperCase(), bg: '#F4F2FA', fg: '#16161A' };
  return (
    <span className="av-glyph" aria-hidden="true" style={{ width: size, height: size, background: p.bg, color: p.fg, fontSize: p.g.length > 2 ? size * 0.3 : size * 0.42 }}>
      {p.g}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Core-5 tag                                                          */
/* ------------------------------------------------------------------ */

/**
 * The one-glance answer: is the name free where it matters most —
 * .com, Instagram, X, YouTube and LinkedIn?
 */
export function CoreTag({ name, domains, socials, size = 'md' }: { name: string; domains?: DomainResult[]; socials?: SocialResult[]; size?: 'sm' | 'md' }) {
  const { currency } = useApp();
  const handle = toSlug(name).replace(/-/g, '');
  const fallback: Record<string, string> = {
    com: buyLinks(`${toSlug(name)}.com`, regionForCurrency(currency))[0]!.url,
    instagram: profileUrl('instagram', handle),
    x: profileUrl('x', handle),
    youtube: profileUrl('youtube', handle),
    linkedin: profileUrl('linkedin', handle),
  };
  const core = coreAvailability(domains, socials, fallback);
  const tone = core.verdict === 'clear' ? 'good' : core.verdict === 'mostly' ? 'ok' : core.verdict === 'blocked' ? 'bad' : 'neutral';
  const noneChecked = core.items.every((i) => i.state === 'check');
  return (
    <div className={`core-tag ${tone} ${size}`} title="The core five: .com, Instagram, X, YouTube and LinkedIn">
      <span className="core-head">
        <span className="core-kicker">CORE 5</span>
        <span className="core-title">{noneChecked ? 'Check the core five' : core.headline}</span>
      </span>
      <span className="core-items">
        {core.items.map((i) => (
          <a
            key={i.key}
            className={`core-item ${i.state}`}
            href={i.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${i.label}: ${STATE_LABEL[i.state]}. ${STATE_HINT[i.state]}`}
            onClick={(e) => {
              e.stopPropagation();
              track('social_checked', { platform: i.key, core: true });
            }}
          >
            <StateDot state={i.state} />
            {i.label}
          </a>
        ))}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Domains                                                             */
/* ------------------------------------------------------------------ */

export function DomainPrice({ r, compact }: { r: DomainResult; compact?: boolean }) {
  const { currency } = useApp();
  const p = displayPrice(r, currency);
  if (!p) return null;
  return (
    <span className="av-price" title={p.estimated ? 'Typical first-year price at Indian/US registrars. The exact price is shown at checkout.' : 'Live price from the registrar'}>
      <strong>{p.label}</strong>
      <span className="muted">/yr</span>
      {p.estimated && <span className="av-est">est.</span>}
      {!compact && p.renewal && <span className="muted av-renew">renews {p.renewal}</span>}
    </span>
  );
}

function BuyButton({ r, label }: { r: DomainResult; label?: string }) {
  const [primary, ...rest] = r.buyLinks;
  const [open, setOpen] = useState(false);
  if (!primary) return null;
  const st = domainState(r);
  return (
    <div className="av-buy">
      <a
        className={`btn btn-xs ${st === 'free' || st === 'likely' ? 'btn-primary' : 'btn-ghost'}`}
        href={primary.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => track('purchase_link_clicked', { domain: r.domain, registrar: primary.registrar })}
      >
        {label ?? (st === 'free' || st === 'likely' || r.status === 'premium' ? 'Get it' : 'Check')} · {primary.label}
      </a>
      {rest.length > 0 && (
        <button type="button" className="btn btn-ghost btn-xs av-more" aria-expanded={open} aria-label="Other registrars" onClick={() => setOpen((o) => !o)}>
          ▾
        </button>
      )}
      {open && (
        <div className="av-menu" role="menu">
          {rest.map((l) => (
            <a
              key={l.registrar}
              role="menuitem"
              href={l.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => {
                setOpen(false);
                track('purchase_link_clicked', { domain: r.domain, registrar: l.registrar });
              }}
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function domainHint(r: DomainResult): string {
  if (r.source === 'demo') return 'Preview build: no live registry check here. Tap to see it at the registrar.';
  return [r.note, r.confirmed ? `Confirmed by ${sourceName(r.source)}` : r.verified ? `Checked with ${sourceName(r.source)}` : ''].filter(Boolean).join(' · ');
}

export function sourceName(s: string): string {
  return (
    { rdap: 'the registry (RDAP)', dns: 'DNS', godaddy: 'GoDaddy', hostinger: 'Hostinger', namecheap: 'Namecheap', porkbun: 'Porkbun', namecom: 'Name.com', demo: 'sample data' } as Record<string, string>
  )[s] ?? s;
}

/** Clean domain list: open names first with price and one buy button; taken ones folded into one line. */
export function DomainList({ results, onWatch }: { results: DomainResult[]; onWatch?: (d: DomainResult) => void }) {
  const open = results.filter((r) => domainState(r) !== 'taken');
  const taken = results.filter((r) => domainState(r) === 'taken');
  return (
    <div className="av-list">
      {open.map((r) => {
        const st = r.status === 'premium' ? 'premium' : domainState(r);
        return (
          <div key={r.domain} className="av-row">
            <div className="av-name av-dname">
              <span className="mono av-domain">{r.domain}</span>
              <span className={`av-state ${st}`} title={domainHint(r)}>
                <StateDot state={st === 'premium' ? 'free' : (st as CoreState)} />
                {st === 'premium' ? 'Premium' : STATE_LABEL[st as CoreState]}
              </span>
            </div>
            <DomainPrice r={r} />
            <BuyButton r={r} />
          </div>
        );
      })}
      {taken.length > 0 && (
        <div className="av-taken">
          <span className="av-state taken">
            <StateDot state="taken" />
            Taken
          </span>
          <span className="av-taken-list">
            {taken.map((r, i) => (
              <span key={r.domain} title={domainHint(r)}>
                <span className="mono">{r.domain}</span>
                {onWatch && (
                  <button type="button" className="link-btn" onClick={() => onWatch(r)}>
                    watch
                  </button>
                )}
                {i < taken.length - 1 ? ', ' : ''}
              </span>
            ))}
          </span>
        </div>
      )}
      {!results.length && <p className="tiny muted">No domains checked yet.</p>}
    </div>
  );
}

/** Compact one-line domain summary for cards: state dot, ending and price. */
export function DomainChips({ results }: { results: DomainResult[] }) {
  const { currency } = useApp();
  return (
    <div className="dchips">
      {results.map((r) => {
        const st = domainState(r);
        const p = displayPrice(r, currency);
        return (
          <span key={r.domain} className={`dchip ${st}`} title={`${r.domain}: ${STATE_LABEL[st]}${p ? ` · ${p.label}/yr${p.estimated ? ' (est.)' : ''}` : ''}`}>
            <StateDot state={st} />
            <span className="mono">.{r.tld}</span>
            {p && st !== 'taken' && (
              <span className="dchip-price">
                {p.label}
                {p.estimated ? '*' : ''}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Handles                                                             */
/* ------------------------------------------------------------------ */

const PLATFORM_PRIORITY = ['instagram', 'x', 'youtube', 'linkedin', 'tiktok', 'facebook', 'threads', 'github', 'reddit', 'pinterest'];

export function HandleList({ results, initial = 5 }: { results: SocialResult[]; initial?: number }) {
  const [all, setAll] = useState(false);
  const order: CoreState[] = ['free', 'likely', 'check', 'taken', 'pending'];
  const sorted = [...results].sort((a, b) => order.indexOf(socialState(a)) - order.indexOf(socialState(b)) || PLATFORM_PRIORITY.indexOf(a.platform) - PLATFORM_PRIORITY.indexOf(b.platform));
  // Verified answers first, then the platforms that matter most for a launch.
  const shown = all ? sorted : sorted.slice(0, initial);
  return (
    <div className="av-list">
      {shown.map((r) => {
        const st = socialState(r);
        const p = SOCIAL_PLATFORMS.find((x) => x.id === r.platform);
        return (
          <a
            key={r.platform}
            className="av-row av-handle"
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            title={r.method === 'demo' ? 'Preview build: no live check here. Tap to see the profile.' : r.note ?? STATE_HINT[st]}
            onClick={() => track('social_checked', { platform: r.platform, manual: st === 'check' })}
          >
            <span className="av-name">
              <PlatformGlyph id={r.platform} />
              <span className="stack" style={{ minWidth: 0 }}>
                <span className="av-platform">{p?.label ?? r.platform}</span>
                <span className="mono tiny muted av-at">@{r.handle}</span>
              </span>
            </span>
            <span className={`av-state ${st}`}>
              <StateDot state={st} />
              {st === 'check' ? 'Check ↗' : STATE_LABEL[st]}
            </span>
          </a>
        );
      })}
      {sorted.length > initial && (
        <button type="button" className="av-more-row" onClick={() => setAll((x) => !x)} aria-expanded={all}>
          {all ? 'Show fewer' : `Show ${sorted.length - initial} more platforms`}
        </button>
      )}
    </div>
  );
}

export function HandleIdeas({ items }: { items: HandleSuggestion[] }) {
  if (!items.length) return null;
  return (
    <div className="stack gap-8">
      <span className="tiny muted">If the exact handle is gone, these keep the name intact:</span>
      <div className="chips">
        {items.slice(0, 8).map((a) => (
          <span key={a.handle} className="chip static sm" title={a.verifiedOn.length ? `Verified free on ${a.verifiedOn.join(', ')}` : 'Idea: not checked yet'}>
            <span className="mono">@{a.handle}</span>
            {a.verifiedOn.length > 0 && <span className="badge aqua" style={{ fontSize: 10 }}>✓ {a.verifiedOn.length}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The panel used everywhere                                           */
/* ------------------------------------------------------------------ */

export function AvailabilityPanel({
  name,
  domains,
  socials,
  alternatives,
  onRecheck,
  onWatch,
  busy,
}: {
  name: string;
  domains?: DomainResult[];
  socials?: SocialResult[];
  alternatives?: HandleSuggestion[];
  onRecheck?: () => void;
  onWatch?: (d: DomainResult) => void;
  busy?: boolean;
}) {
  const demo = domains?.some((d) => d.source === 'demo') || socials?.some((s) => s.method === 'demo');
  return (
    <section className="av-panel" aria-label={`Availability for ${name}`}>
      <div className="av-panel-head">
        <CoreTag name={name} domains={domains} socials={socials} />
        {onRecheck && (
          <button type="button" className="btn btn-ghost btn-xs" onClick={onRecheck} disabled={busy}>
            {busy ? 'Checking…' : 'Re-check'}
          </button>
        )}
      </div>
      <div className="av-cols">
        <div className="stack gap-8">
          <h4 className="av-h">Domains</h4>
          {domains ? <DomainList results={domains} onWatch={onWatch} /> : <div className="skeleton" style={{ height: 150 }} />}
        </div>
        <div className="stack gap-8">
          <h4 className="av-h">Handles</h4>
          {socials ? <HandleList results={socials} /> : <div className="skeleton" style={{ height: 200 }} />}
          {alternatives && <HandleIdeas items={alternatives} />}
        </div>
      </div>
      <p className="av-legend">
        <span>
          <StateDot state="free" /> Available: confirmed
        </span>
        <span>
          <StateDot state="likely" /> Likely free: no owner at the registry
        </span>
        <span>
          <StateDot state="check" /> Not checked: tap to see it
        </span>
        <span>
          <span className="av-est">est.</span> typical price, exact at checkout
        </span>
        {demo && <span className="av-demo">Preview build: live checks run on the server version.</span>}
      </p>
    </section>
  );
}

