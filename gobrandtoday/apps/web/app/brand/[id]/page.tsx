import type { Metadata } from 'next';
import { BrandView } from '@/components/BrandView';
import { Shell } from '@/components/ui';

export const metadata: Metadata = { title: 'Your brand', robots: { index: false } };

export default async function BrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Shell>
      <BrandView id={id} />
    </Shell>
  );
}
