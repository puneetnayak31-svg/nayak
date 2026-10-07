'use client';

import Link from 'next/link';
import { PLANS, formatPrice } from '@gbt/shared';
import { track } from '@/lib/api';
import { useApp } from '@/lib/providers';
import { CurrencyToggle } from './CurrencyToggle';
import { Spark } from './Spark';

export function PricingCards() {
  const { currency } = useApp();
  return (
    <div className="stack gap-24">
      <div className="row wrap between gap-16">
        <p className="soft">Priced for India first. Switch to see US pricing.</p>
        <CurrencyToggle />
      </div>
      <div className="grid-3">
        {PLANS.map((p) => (
          <div key={p.id} className={`card stack gap-20 ${p.highlight ? 'dark' : ''}`} style={{ position: 'relative' }}>
            {p.highlight && (
              <span className="badge" style={{ position: 'absolute', top: 20, right: 20, background: 'var(--violet)', color: '#fff' }}>
                <Spark size={10} color="#fff" /> Most loved
              </span>
            )}
            <div className="stack gap-6">
              <span className="display" style={{ fontSize: 24 }}>
                {p.name}
              </span>
              <span className={p.highlight ? '' : 'soft'} style={{ color: p.highlight ? 'var(--on-dark-muted)' : undefined }}>
                {p.tagline}
              </span>
            </div>
            <div className="row gap-8" style={{ alignItems: 'baseline' }}>
              <span className="display" style={{ fontSize: 52, lineHeight: 1 }}>
                {formatPrice(p.price[currency], currency)}
              </span>
              <span className="small" style={{ color: p.highlight ? 'var(--on-dark-muted)' : 'var(--text-muted)' }}>
                {p.period}
              </span>
            </div>
            <ul className="stack gap-10" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {p.features.map((f) => (
                <li key={f} className="row gap-10" style={{ alignItems: 'flex-start' }}>
                  <Spark size={12} color={p.highlight ? '#19C3B4' : '#6D4AFF'} style={{ marginTop: 6, flex: 'none' }} />
                  <span>{f}</span>
                </li>
              ))}
              {p.soon?.map((f) => (
                <li key={f} className="row gap-10" style={{ alignItems: 'flex-start', opacity: 0.7 }}>
                  <span style={{ width: 12, flex: 'none' }} />
                  <span>
                    {f} <span className="badge line" style={{ fontSize: 10, marginLeft: 4 }}>soon</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href={p.id === 'free' ? '/create' : `/signup?plan=${p.id}`}
              className={`btn ${p.highlight ? 'btn-primary' : 'btn-outline'}`}
              style={{ marginTop: 'auto' }}
              onClick={() => p.id !== 'free' && track('plan_interest', { plan: p.id, currency })}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
      <p className="tiny muted">
        Prices {currency === 'INR' ? 'include GST where applicable' : 'in US dollars'}. Payments via {currency === 'INR' ? 'UPI, cards and netbanking (Razorpay)' : 'card (Stripe)'} — launching soon; everything is free during early access.
      </p>
    </div>
  );
}
