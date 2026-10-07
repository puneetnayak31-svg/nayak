import type { Metadata } from 'next';
import { ExpertsPage } from '@/components/ExpertsPage';
import { Shell } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Work with brand experts: bespoke logo, website, music, packaging & trademark | GoBrandToday',
  description:
    'Bespoke services from hand-picked experts in India: custom logo and identity, naming workshops, website design, sonic branding and jingles, packaging, launch videos, trademark filing and social content. Fixed quotes in INR or USD.',
  alternates: { canonical: '/experts' },
};

export default function Page() {
  return (
    <Shell>
      <ExpertsPage />
    </Shell>
  );
}
