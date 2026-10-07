import type { Metadata } from 'next';
import { ExpertsBox } from '@/components/Experts';
import { PricingCards } from '@/components/PricingCards';
import { Shell } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Free to start. Pro is ₹499 a month ($9 in the US). Studio for agencies at ₹1,999 ($29).',
  alternates: { canonical: '/pricing' },
};

export default function PricingPage() {
  return (
    <Shell>
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container stack gap-40">
          <div className="stack gap-12">
            <span className="eyebrow">Pricing</span>
            <h1 className="h1" style={{ fontSize: 'clamp(40px,6vw,72px)' }}>
              Free to start. Fair when you grow.
            </h1>
            <p className="lead">India-first pricing in rupees. Prefer dollars? Flip the switch.</p>
          </div>
          <PricingCards />
          <ExpertsBox compact={false} title="Beyond the plans: bespoke work by experts" />
        </div>
      </section>
    </Shell>
  );
}
