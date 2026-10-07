import Link from 'next/link';
import { Spark } from '@/components/Spark';
import { Shell } from '@/components/ui';

export default function NotFound() {
  return (
    <Shell>
      <div className="container stack gap-16 center" style={{ alignItems: 'center', padding: '96px var(--gutter)' }}>
        <Spark size={40} className="twinkle" />
        <h1 className="h2">This page hasn’t been named yet.</h1>
        <p className="soft">But your idea could be. Let’s find it a brand.</p>
        <Link href="/create" className="btn btn-primary">
          <Spark size={14} color="#fff" /> Create my brand
        </Link>
      </div>
    </Shell>
  );
}
