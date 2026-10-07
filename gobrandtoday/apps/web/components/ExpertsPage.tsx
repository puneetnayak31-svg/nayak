'use client';

import { EXPERT_SERVICES, formatPrice } from '@gbt/shared';
import { useApp } from '@/lib/providers';
import { ExpertGlyph, ExpertRequestForm } from './Experts';

const FAQ = [
  ['Who are the experts?', 'Independent designers, composers, developers, film-makers and registered trademark attorneys we’ve worked with, mostly based in India. Every expert is reviewed on past work before they take a GoBrandToday brief.'],
  ['Do they start from scratch?', 'No. They start from your Brand Bible: name, story, voice, the look you chose, colours and type. That saves a week of discovery and keeps everything consistent.'],
  ['How does pricing work?', 'Prices shown are starting points. After your request you get a written scope and a fixed quote. You pay 50% to start and 50% on delivery. GST is added for Indian invoices.'],
  ['Who owns the work?', 'You do. Final files and full rights transfer to you on final payment. Music is licensed to you royalty-free for your brand.'],
  ['What if I’m not happy?', 'Every service includes revision rounds. If the first round misses the brief completely, you can cancel and get the 50% deposit back.'],
];

export function ExpertsPage() {
  const { currency } = useApp();
  return (
    <div className="container stack gap-48" style={{ padding: '40px var(--gutter) 80px' }}>
      <header className="stack gap-12" style={{ maxWidth: 760 }}>
        <span className="eyebrow">GoBrand Studio · bespoke services</span>
        <h1 className="display" style={{ fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 1.02, letterSpacing: '-0.04em', margin: 0 }}>
          When you’re ready for more than a kit.
        </h1>
        <p className="lead">The self-serve Brand Bible gets you launched. When you want something crafted by hand, from a custom logo to your own jingle, our experts take it from there.</p>
      </header>

      <div className="grid-2" style={{ alignItems: 'start', gap: 32 }}>
        <div className="stack gap-12">
          {EXPERT_SERVICES.map((s) => (
            <article key={s.id} className="ex-service" id={s.id}>
              <span className="ex-service-icon">
                <ExpertGlyph glyph={s.glyph} size={30} />
              </span>
              <div className="stack gap-6" style={{ minWidth: 0 }}>
                <h2 className="h3" style={{ margin: 0 }}>
                  {s.title}
                </h2>
                <p className="small soft" style={{ margin: 0 }}>
                  {s.pitch}
                </p>
                <ul className="ex-includes">
                  {s.includes.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="stack gap-2" style={{ textAlign: 'right' }}>
                <span className="tiny muted">from</span>
                <strong className="display" style={{ fontSize: 22 }}>
                  {formatPrice(s.from[currency], currency)}
                </strong>
                {s.priceNote && <span className="tiny muted">{s.priceNote}</span>}
                <span className="tiny muted">{s.turnaround}</span>
              </div>
            </article>
          ))}
        </div>
        <aside className="card stack gap-16" style={{ position: 'sticky', top: 88 }}>
          <div className="stack gap-4">
            <span className="eyebrow">Get a scope & quote</span>
            <h2 className="h3" style={{ margin: 0 }}>
              Tell us what you need
            </h2>
          </div>
          <ExpertRequestForm />
        </aside>
      </div>

      <section className="stack gap-16">
        <h2 className="h2">How it works</h2>
        <div className="grid-3">
          {[
            ['1 · Brief', 'Pick a service and tell us about your brand. Linking your Brand Bible saves a week.'],
            ['2 · Scope & quote', 'Within one working day you get a written scope, timeline and fixed price.'],
            ['3 · Make it', 'Pay 50% to start. Review drafts, request revisions, get final files and full rights.'],
          ].map(([h, b]) => (
            <div key={h} className="card stack gap-8">
              <strong className="display" style={{ fontSize: 20 }}>
                {h}
              </strong>
              <p className="soft small" style={{ margin: 0 }}>
                {b}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="stack gap-12" style={{ maxWidth: 820 }}>
        <h2 className="h2">Questions</h2>
        {FAQ.map(([q, a]) => (
          <details key={q} className="card sm">
            <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{q}</summary>
            <p className="soft small" style={{ marginBottom: 0 }}>
              {a}
            </p>
          </details>
        ))}
      </section>
    </div>
  );
}
