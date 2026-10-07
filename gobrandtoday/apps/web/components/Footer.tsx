import Link from 'next/link';
import { SEO_PAGES } from '@/lib/seo-pages';
import { Wordmark } from './Spark';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container stack gap-32">
        <div className="row wrap between gap-24" style={{ alignItems: 'flex-start' }}>
          <div className="stack gap-12" style={{ maxWidth: 340 }}>
            <Wordmark size={26} />
            <p className="soft small">Your idea deserves a brand. Name, domain, handles and identity — in minutes. Made in India ✦</p>
          </div>
          <div className="row wrap gap-40" style={{ alignItems: 'flex-start' }}>
            <div className="stack gap-8 small">
              <span className="eyebrow">Product</span>
              <Link href="/create">Create my brand</Link>
              <Link href="/create?mode=domain_first">Domain-First search</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/dashboard">My brands</Link>
              <Link href="/experts">Work with an expert</Link>
              <Link href="/tools">All free tools</Link>
            </div>
            <div className="stack gap-8 small">
              <span className="eyebrow">Free tools</span>
              {SEO_PAGES.filter((p) => p.widget).map((p) => (
                <Link key={p.slug} href={`/tools/${p.slug}`}>
                  {p.short}
                </Link>
              ))}
              {SEO_PAGES.filter((p) => !p.widget).slice(0, 3).map((p) => (
                <Link key={p.slug} href={`/tools/${p.slug}`}>
                  {p.short}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="row wrap between gap-12 mono tiny muted" style={{ borderTop: '1px solid var(--line)', paddingTop: 20 }}>
          <span>© {new Date().getFullYear()} GoBrandToday</span>
          <span>Availability is checked live where platforms allow it — never guessed.</span>
          <span>Fonts: Google Fonts (free, open licence)</span>
        </div>
      </div>
    </footer>
  );
}
