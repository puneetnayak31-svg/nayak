'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { planById } from '@gbt/shared';
import { api } from '@/lib/api';
import { useApp, type Usage } from '@/lib/providers';

/** What each usage counter means, in the order people care about. */
export const USAGE_LABELS: Array<[key: string, label: string, period: 'today' | 'total']> = [
  ['generation', 'Naming rounds', 'today'],
  ['brands', 'Brand boxes', 'total'],
  ['domain_check', 'Domain checks', 'today'],
  ['social_check', 'Handle checks', 'today'],
  ['assistant', 'AI assistant', 'today'],
];

const left = (u?: { used: number; limit: number }) => (u ? Math.max(0, u.limit - u.used) : null);
const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n));

/** "What's left" meters: number left in large type, a bar for what's used. */
export function UsageMeters({ usage, compact = false }: { usage: Usage; compact?: boolean }) {
  return (
    <div className={compact ? 'um um-compact' : 'um'}>
      {USAGE_LABELS.filter(([k]) => usage[k]).map(([k, label, period]) => {
        const u = usage[k]!;
        const l = left(u)!;
        const pct = u.limit ? Math.min(100, (u.used / u.limit) * 100) : 0;
        return (
          <div key={k} className={`um-row${l === 0 ? ' out' : ''}`}>
            <div className="um-top">
              <span className="um-label">{label}</span>
              <span className="um-left">
                <b>{fmt(l)}</b> left{period === 'today' ? ' today' : ''}
              </span>
            </div>
            <div className="um-bar" aria-hidden="true">
              <span style={{ width: `${pct}%` }} />
            </div>
            {!compact && (
              <span className="um-sub">
                {fmt(u.used)} of {fmt(u.limit)} used
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Crown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" fill="currentColor" />
    </svg>
  );
}

function UserGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.6-3.6 4.6-5.5 8-5.5s6.4 1.9 8 5.5" />
    </svg>
  );
}

/**
 * The nav's account control. Guests see "Sign in" and how many free rounds
 * are left; accounts see an avatar (Pro and Studio get a gradient ring and a
 * crown) with what's left today, and a menu with every meter.
 */
export function AccountMenu() {
  const { me, usage, refreshMe, toast } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('click', on);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('click', on);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  const rounds = left(usage?.generation);
  if (!me || me.isGuest) {
    return (
      <div className="row gap-8 hide-sm">
        {rounds !== null && (
          <span className="usage-pill" title="Free naming rounds left today">
            <b>{rounds}</b> free rounds left
          </span>
        )}
        <Link href="/login" className="btn btn-ghost btn-sm signin-btn">
          <UserGlyph /> Sign in
        </Link>
      </div>
    );
  }

  const plan = planById(me.plan);
  const paid = me.plan !== 'free';
  const display = me.name?.trim() || me.email?.split('@')[0] || 'Account';
  const initials = display
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  const boxes = left(usage?.brands);

  const signOut = async () => {
    setOpen(false);
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      await refreshMe();
      toast('Signed out');
      router.push('/');
    }
  };

  return (
    <div ref={ref} className="acct-wrap">
      <button
        type="button"
        className={`acct${paid ? ' paid' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void refreshMe();
        }}
      >
        <span className="acct-avatar" aria-hidden="true">
          {initials || '✦'}
          {paid && (
            <span className="acct-crown">
              <Crown />
            </span>
          )}
        </span>
        <span className="acct-text hide-sm">
          <span className="acct-name">{display.split(' ')[0]}</span>
          <span className="acct-meta">
            {paid ? <span className="acct-plan">{plan.name}</span> : 'Spark'}
            {rounds !== null && <> · {fmt(rounds)} rounds left</>}
          </span>
        </span>
      </button>
      {open && (
        <div role="menu" className="acct-menu">
          <div className="acct-head">
            <span className={`acct-avatar lg${paid ? ' paid' : ''}`} aria-hidden="true">
              {initials || '✦'}
            </span>
            <div className="stack gap-2" style={{ minWidth: 0 }}>
              <b className="acct-menu-name">{display}</b>
              {me.email && <span className="tiny muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.email}</span>}
            </div>
            <span className={`plan-badge${paid ? ' paid' : ''}`}>
              {paid && <Crown />} {plan.name}
            </span>
          </div>
          {boxes !== null && (
            <div className="acct-boxes">
              <span>
                <b>{boxes}</b> brand {boxes === 1 ? 'box' : 'boxes'} left
              </span>
              <span className="tiny">
                {usage!.brands!.used} of {usage!.brands!.limit.toLocaleString('en-IN')} on {plan.name}
              </span>
            </div>
          )}
          {usage && <UsageMeters usage={usage} compact />}
          <div className="acct-links">
            <Link role="menuitem" href="/dashboard" onClick={() => setOpen(false)}>
              My brands
            </Link>
            <Link role="menuitem" href="/dashboard/settings" onClick={() => setOpen(false)}>
              Settings
            </Link>
            {!paid && (
              <Link role="menuitem" href="/pricing" className="acct-upgrade" onClick={() => setOpen(false)}>
                <Crown /> Go Pro
              </Link>
            )}
            <button role="menuitem" type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
