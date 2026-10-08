'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import type { BrandDTO } from '@/components/BrandView';
import { BrandGuidelines } from '@/components/BrandGuidelines';
import { Loading } from '@/components/ui';
import { api } from '@/lib/api';
import { useApp } from '@/lib/providers';
import { SignupPrompt } from '@/components/SignupGate';

/** Print-ready guidelines. ?print=1 opens the browser's "Save as PDF" dialog once fonts are ready. */
function Guidelines() {
  const { id } = useParams<{ id: string }>();
  const q = useSearchParams();
  const [brand, setBrand] = useState<BrandDTO | null>(null);
  const { me } = useApp();
  // Printing to PDF is a download: accounts only (guests see the sign-up prompt instead).
  const guest = !me || me.isGuest;
  useEffect(() => {
    api<{ brand: BrandDTO }>(`/api/brands/${id}`).then((r) => setBrand(r.brand));
  }, [id]);
  useEffect(() => {
    if (!brand?.kit || q.get('print') !== '1' || guest) return;
    const t = setTimeout(() => document.fonts.ready.then(() => window.print()), 900);
    return () => clearTimeout(t);
  }, [brand, q, guest]);
  if (!brand?.kit) return <Loading title="Preparing your guidelines…" />;
  if (guest && q.get('print') === '1') return <SignupPrompt onClose={() => history.back()} />;
  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: 16 }}>
      <p className="no-print notice" style={{ marginBottom: 16 }}>
        Use your browser’s Print → “Save as PDF”. Turn on “Background graphics” for the colour panels.
      </p>
      <BrandGuidelines kit={brand.kit} domain={brand.domain} handle={brand.handle} version={brand.version} score={brand.score?.overall} />
    </div>
  );
}

export default function GuidelinesPage() {
  return (
    <Suspense>
      <Guidelines />
    </Suspense>
  );
}
