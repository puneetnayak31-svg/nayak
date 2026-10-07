import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Studio } from '@/components/Studio';
import { Shell } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Create your brand',
  description: 'Describe your idea, get brandable names with domain and handle checks, refine, compare and build your brand.',
  alternates: { canonical: '/create' },
};

export default function CreatePage() {
  return (
    <Shell footer={false}>
      <Suspense>
        <Studio />
      </Suspense>
    </Shell>
  );
}
