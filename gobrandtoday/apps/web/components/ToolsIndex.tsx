import Link from 'next/link';
import { SEO_PAGES } from '@/lib/seo-pages';
import { Spark } from './Spark';
import { Shell } from './ui';

export function ToolsIndex() {
  const utilities = SEO_PAGES.filter((p) => p.widget && p.widget !== 'repurpose');
  const repurpose = SEO_PAGES.filter((p) => p.widget === 'repurpose');
  const generators = SEO_PAGES.filter((p) => !p.widget);
  const Tile = ({ p, featured }: { p: (typeof SEO_PAGES)[number]; featured?: boolean }) => (
    <Link href={`/tools/${p.slug}`} className={`card stack gap-8 tool-tile ${featured ? 'featured' : ''}`} style={{ color: 'inherit' }}>
      <Spark size={16} />
      <strong className="display" style={{ fontSize: 20 }}>
        {p.h1.charAt(0).toUpperCase() + p.h1.slice(1)}
      </strong>
      <span className="small soft">{p.description}</span>
      <span className="small" style={{ color: 'var(--violet-hover)', fontWeight: 700 }}>
        Open →
      </span>
    </Link>
  );
  return (
    <Shell>
      <div className="container stack gap-40" style={{ padding: '40px var(--gutter) 80px' }}>
        <header className="stack gap-12" style={{ maxWidth: 720 }}>
          <span className="eyebrow">Free tools</span>
          <h1 className="display" style={{ fontSize: 'clamp(40px,6vw,64px)', lineHeight: 1.02, letterSpacing: '-0.04em', margin: 0 }}>
            Everything you need to name and launch.
          </h1>
          <p className="lead">No sign-up needed. Checks are live where platforms allow it, and never guessed.</p>
        </header>
        <section className="stack gap-16">
          <h2 className="h3">Quick checks</h2>
          <div className="grid-3">
            {utilities.map((p) => (
              <Tile key={p.slug} p={p} featured />
            ))}
          </div>
        </section>
        <section className="stack gap-16">
          <h2 className="h3">Generators</h2>
          <div className="grid-3">
            {generators.map((p) => (
              <Tile key={p.slug} p={p} />
            ))}
          </div>
        </section>
        <section className="stack gap-16">
          <div className="stack gap-4">
            <h2 className="h3">Already have a logo?</h2>
            <span className="small soft">Upload it and get banners, a profile picture and one-page brand guidelines. Made in your browser.</span>
          </div>
          <div className="grid-3">
            {repurpose.map((p) => (
              <Tile key={p.slug} p={p} />
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
