import type { Metadata } from 'next';
import { NameCheck } from '@/components/NameCheck';
import { Shell } from '@/components/ui';

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  const n = decodeURIComponent(name);
  return {
    title: `Is “${n}” a good brand name?`,
    description: `Domain availability, social handles and the GoBrand Score for ${n}.`,
    robots: { index: false },
  };
}

export default async function NamePage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return (
    <Shell>
      <NameCheck name={decodeURIComponent(name).slice(0, 40)} />
    </Shell>
  );
}
