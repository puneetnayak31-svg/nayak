import Link from 'next/link';
import { ExpertsBox } from '@/components/Experts';
import { HeroComposer } from '@/components/HeroComposer';
import { Spark } from '@/components/Spark';
import { ToolWidget } from '@/components/ToolWidgets';
import { Shell } from '@/components/ui';
import { SEO_PAGES, type SeoPage } from '@/lib/seo-pages';

/** The body of a /tools/* landing page (shared by the Next route and the preview build). */
export function ToolContent({ p }: { p: SeoPage }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebApplication', name: `GoBrandToday ${p.h1}`, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' } },
      { '@type': 'FAQPage', mainEntity: p.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GoBrandToday', item: '/' },
          { '@type': 'ListItem', position: 2, name: p.h1, item: `/tools/${p.slug}` },
        ],
      },
    ],
  };
  return (
    <Shell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="hero">
        <div className="container hero-grid">
          <div className="stack gap-20">
            <span className="eyebrow">Free tool</span>
            <h1 className="h1" style={{ fontSize: 'clamp(40px,6vw,76px)' }}>
              {p.h1}
              <Spark size={34} className="twinkle" style={{ display: 'inline-block', marginLeft: 6 }} />
            </h1>
            <p className="lead">{p.intro}</p>
            {!p.widget && (
              <p className="small muted">
                Try: <Link href={`/create?brief=${encodeURIComponent(p.example)}&mode=${p.mode}&go=1`}>“{p.example}”</Link>
              </p>
            )}
          </div>
          {p.widget ? <ToolWidget kind={p.widget} example={p.example} /> : <HeroComposer defaultMode={p.mode} />}
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container grid-3">
          {p.points.map((pt) => (
            <div key={pt.t} className="card stack gap-10">
              <Spark size={18} />
              <h2 className="h3">{pt.t}</h2>
              <p className="soft">{pt.b}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <ExpertsBox />
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container stack gap-16" style={{ maxWidth: 820 }}>
          <h2 className="h2">FAQ</h2>
          {p.faq.map((f) => (
            <details key={f.q} className="card sm" style={{ padding: '18px 20px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{f.q}</summary>
              <p className="soft" style={{ marginTop: 10 }}>
                {f.a}
              </p>
            </details>
          ))}
          <div className="row gap-8 wrap" style={{ marginTop: 16 }}>
            <Link href="/tools" className="chip sm">
              All free tools
            </Link>
            {SEO_PAGES.filter((x) => x.slug !== p.slug).map((x) => (
              <Link key={x.slug} href={`/tools/${x.slug}`} className="chip sm">
                {x.short}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}
