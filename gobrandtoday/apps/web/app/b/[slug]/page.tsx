'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { BrandKit, GoBrandScore } from '@gbt/shared';
import { BrandGuidelines } from '@/components/BrandGuidelines';
import { Spark } from '@/components/Spark';
import { Loading, Shell } from '@/components/ui';
import { api } from '@/lib/api';

export default function SharedBrand() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<{ name: string; domain: string | null; handle: string | null; kit: BrandKit; score: GoBrandScore | null } | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    api<{ brand: NonNullable<typeof data> }>(`/api/public/brands/${slug}`)
      .then((r) => setData(r.brand))
      .catch(() => setMissing(true));
  }, [slug]);
  return (
    <Shell>
      <div className="container stack gap-24" style={{ padding: '32px var(--gutter) 64px' }}>
        {missing ? (
          <div className="notice">This brand isn’t shared (or no longer exists).</div>
        ) : !data ? (
          <Loading title="Opening…" />
        ) : (
          <>
            <div className="row between wrap gap-12">
              <span className="eyebrow">Shared brand · read-only</span>
              <Link href="/create" className="btn btn-primary btn-sm">
                <Spark size={12} color="#fff" /> Make your own
              </Link>
            </div>
            <BrandGuidelines kit={data.kit} domain={data.domain} handle={data.handle} score={data.score?.overall} />
          </>
        )}
      </div>
    </Shell>
  );
}
