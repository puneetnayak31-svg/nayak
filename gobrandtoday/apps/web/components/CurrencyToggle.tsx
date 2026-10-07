'use client';

import { useApp } from '@/lib/providers';

/** India-first pricing: exactly two options, ₹ and $. */
export function CurrencyToggle() {
  const { currency, setCurrency } = useApp();
  return (
    <div className="seg" role="group" aria-label="Currency">
      <button type="button" aria-pressed={currency === 'INR'} onClick={() => setCurrency('INR')}>
        ₹<span className="hide-sm"> INR</span>
      </button>
      <button type="button" aria-pressed={currency === 'USD'} onClick={() => setCurrency('USD')}>
        $<span className="hide-sm"> USD</span>
      </button>
    </div>
  );
}
