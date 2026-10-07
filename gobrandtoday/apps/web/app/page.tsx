import Link from 'next/link';
import { DemoPlayer } from '@/components/DemoPlayer';
import { HeroComposer } from '@/components/HeroComposer';
import { PricingCards } from '@/components/PricingCards';
import { Mark, Spark } from '@/components/Spark';
import { Shell } from '@/components/ui';

const STEPS = [
  { t: 'Describe your idea', b: 'One sentence is enough. “A cosy candle brand for Gen Z.”', shape: 'dot' },
  { t: 'Discover names', b: 'Names with meaning, pronunciation and a score — not a random list.', shape: 'diamond' },
  { t: 'Check domains & handles', b: '.com, .in, .ai and 10 social platforms, checked live.', shape: 'ring' },
  { t: 'Choose your brand', b: 'Shortlist, compare side by side, pick the one that feels right.', shape: 'heart' },
  { t: 'Generate your identity', b: 'Wordmark, mark, colours, fonts, voice and story.', shape: 'spark' },
  { t: 'Launch', b: 'Bios, launch posts, website copy and a month of content ideas.', shape: 'sun' },
] as const;

const KIT = [
  { t: 'Name', b: 'With meaning & pronunciation' },
  { t: 'Domain', b: 'Registry-checked, one-click buy' },
  { t: 'Social', b: '10 platforms + alternatives' },
  { t: 'Logo', b: 'Wordmark, icon & mark' },
  { t: 'Colours', b: '5 roles, HEX, contrast-checked' },
  { t: 'Fonts', b: 'Google Fonts trio' },
  { t: 'Tagline', b: '6–8 options' },
  { t: 'Brand strategy', b: 'Story, positioning, voice' },
  { t: 'Launch content', b: 'Posts, bios, 10 ideas' },
];

const TABS = ['thesaurus.com', 'GoDaddy', 'Hostinger', 'instagram.com/…', 'x.com/…', 'Canva', 'Google Fonts', 'Coolors', 'Notes app'];

const FAQ = [
  {
    q: 'Is the domain availability real?',
    a: 'Yes. We check the registries directly (RDAP) or a registrar API, and we label every result with how it was checked. If we can’t verify something, we say “Unverified” — we never guess “Available”.',
  },
  {
    q: 'Can you check Instagram, X and TikTok handles?',
    a: 'Where a platform offers a compliant way to check (GitHub, Reddit, YouTube) we verify automatically. Instagram, X, TikTok and others don’t, so we give you a one-tap link to confirm — no scraping, no fake answers.',
  },
  {
    q: 'What is the GoBrand Score?',
    a: 'A transparent 0–10 score combining brandability, memorability, pronunciation, distinctiveness, global usability, SEO potential, domain and social availability. Every component is explained. It’s guidance, not a guarantee.',
  },
  {
    q: 'Do I own what I create?',
    a: 'Yes. Export your Brand Bible as PDF, PNG, SVG, JSON or Markdown. Fonts are free Google Fonts. Before you invest, run a proper trademark search — we flag obvious risks, but it isn’t legal clearance.',
  },
  {
    q: 'Is it built for India?',
    a: 'India-first: ₹ pricing, .in domains, Indian-language name roots, Hindi meaning checks and Indian storefronts for registrars. Switch to $ any time for US pricing.',
  },
];

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'GoBrandToday',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: 'AI brand studio: name, domain, social handles, score and brand identity in minutes.',
        offers: [
          { '@type': 'Offer', price: '0', priceCurrency: 'INR', name: 'Spark' },
          { '@type': 'Offer', price: '499', priceCurrency: 'INR', name: 'Pro' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  };

  return (
    <Shell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* 1 — Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="stack gap-24 fade-up">
            <span className="eyebrow">AI brand studio · Made in India</span>
            <h1 className="h1">
              Your idea deserves a brand
              <Spark size={44} className="twinkle" style={{ display: 'inline-block', marginLeft: 6, verticalAlign: 'baseline' }} />
            </h1>
            <p className="lead">Tell us what you’re building. We’ll find the name, domain, social handles and identity to launch it.</p>
            <div className="trust-strip">
              <span>
                <Spark size={10} /> .com · .in · .ai · .io · .co
              </span>
              <span>
                <Spark size={10} /> 10 social platforms
              </span>
              <span>
                <Spark size={10} /> Score out of 10
              </span>
            </div>
          </div>
          <div className="fade-up" style={{ animationDelay: '120ms' }}>
            <HeroComposer />
          </div>
        </div>
      </section>

      {/* 2 — How it works */}
      <section id="how" className="section" style={{ paddingTop: 24 }}>
        <div className="container stack gap-40">
          <div className="stack gap-12">
            <span className="eyebrow">How it works</span>
            <h2 className="h2">From idea to identity in minutes.</h2>
          </div>
          <div className="grid-3">
            {STEPS.map((s, i) => (
              <div key={s.t} className="card hover stack gap-16">
                <div className="row between">
                  <span className="mono muted small">{String(i + 1).padStart(2, '0')}</span>
                  <Mark shape={s.shape} size={28} color={i === 4 ? '#6D4AFF' : '#B9AEFF'} />
                </div>
                <h3 className="h3">{s.t}</h3>
                <p className="soft">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — Problem */}
      <section className="section dark" style={{ background: 'var(--ink)' }}>
        <div className="container grid-2" style={{ alignItems: 'center', gap: 48 }}>
          <div className="stack gap-20">
            <span className="eyebrow" style={{ color: 'var(--on-dark-muted)' }}>
              The problem
            </span>
            <h2 className="h2">Stop searching. Start branding.</h2>
            <p style={{ fontSize: 19, color: 'var(--on-dark-muted)', maxWidth: 520 }}>
              Finding a good name is hard. Finding one whose domain and handles are free is harder. Then you need a logo, colours, fonts and words to launch with — usually across nine tabs and three weekends.
            </p>
            <p style={{ fontSize: 19 }}>GoBrandToday puts the whole journey in one place, in the right order.</p>
          </div>
          <div className="stack gap-8" aria-hidden="true" style={{ overflow: 'hidden', paddingRight: 28 }}>
            {TABS.map((t, i) => (
              <div
                key={t}
                className="row between"
                style={{ background: '#1f1f25', border: '1px solid #2c2c35', borderRadius: 12, padding: '10px 14px', transform: `translateX(${(i % 3) * 14}px)`, opacity: 1 - i * 0.06 }}
              >
                <span className="mono small strike" style={{ color: 'var(--on-dark-muted)' }}>
                  {t}
                </span>
                <span className="tab-dots">
                  <span />
                  <span />
                </span>
              </div>
            ))}
            <div className="row gap-10" style={{ background: 'var(--paper)', color: 'var(--ink)', borderRadius: 14, padding: '14px 16px', marginTop: 6 }}>
              <Spark size={18} />
              <strong>gobrandtoday — one tab.</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 4 — Interactive example */}
      <section className="section">
        <div className="container grid-2" style={{ alignItems: 'center', gap: 48 }}>
          <div className="stack gap-20">
            <span className="eyebrow">See it work</span>
            <h2 className="h2">Watch an idea become a brand.</h2>
            <p className="lead">A chai subscription for remote teams → names with reasons → domains → handles → a complete identity. Tap any step.</p>
            <div className="row gap-12 wrap">
              <Link href="/create?brief=A%20chai%20subscription%20for%20remote%20teams&go=1" className="btn btn-primary">
                <Spark size={16} color="#fff" /> Try this example for real
              </Link>
            </div>
          </div>
          <DemoPlayer />
        </div>
      </section>

      {/* 5 — Everything you need */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container stack gap-40">
          <div className="stack gap-12">
            <span className="eyebrow">Brand in a box</span>
            <h2 className="h2">Everything you need to launch.</h2>
          </div>
          <div className="grid-3">
            {KIT.map((k, i) => (
              <div key={k.t} className={`card hover row gap-16 ${i === 4 ? 'lilac' : ''}`} style={{ alignItems: 'center' }}>
                <span className="display" style={{ fontSize: 15, width: 40, height: 40, borderRadius: 12, background: i === 4 ? '#fff' : 'var(--lilac)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                  <Spark size={16} color={i === 4 ? '#6D4AFF' : '#8F75FF'} />
                </span>
                <div className="stack">
                  <strong style={{ fontSize: 18 }}>{k.t}</strong>
                  <span className="small soft">{k.b}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section" style={{ paddingTop: 0 }}>
        <div className="container stack gap-32">
          <div className="stack gap-12">
            <span className="eyebrow">Pricing</span>
            <h2 className="h2">Free to start. Fair when you grow.</h2>
          </div>
          <PricingCards />
        </div>
      </section>

      {/* FAQ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container grid-2" style={{ gap: 48, alignItems: 'start' }}>
          <div className="stack gap-12">
            <span className="eyebrow">Honest answers</span>
            <h2 className="h2">Questions, answered.</h2>
          </div>
          <div className="stack gap-12">
            {FAQ.map((f) => (
              <details key={f.q} className="card sm" style={{ padding: '18px 20px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 17 }}>{f.q}</summary>
                <p className="soft" style={{ marginTop: 10 }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — Final CTA */}
      <section className="container" style={{ paddingBottom: 40 }}>
        <div className="card dark stack gap-24 center" style={{ alignItems: 'center', padding: 'clamp(40px,7vw,88px) 24px' }}>
          <Spark size={40} color="#19C3B4" className="twinkle" />
          <h2 className="h2">Build your brand today.</h2>
          <p style={{ color: 'var(--on-dark-muted)', fontSize: 19, maxWidth: 520 }}>Type your idea. Watch it become a brand.</p>
          <div className="row gap-12 wrap" style={{ justifyContent: 'center' }}>
            <Link href="/create" className="btn btn-primary">
              <Spark size={16} color="#fff" /> Create My Brand
            </Link>
            <Link href="/create?mode=domain_first" className="btn btn-light">
              Explore Names
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}
