'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LOGO_STYLE_META, MARK_PATHS, swatch, toSlug, type BrandKit, type Brief, type DomainResult, type GoBrandScore, type SocialResult } from '@gbt/shared';
import { ApiError, api, track } from '@/lib/api';
import { kitMockupKinds } from '@/lib/export';
import { useApp } from '@/lib/providers';
import { BrandGuidelines } from './BrandGuidelines';
import { KitIcon, KitLogo } from './Logo';
import { ExpertsBox } from './Experts';
import { LookPicker } from './LookPicker';
import { ExportCentre } from './ExportCentre';
import { MockupGrid, PlatformStack, SocialStrip } from './Mockups';
import { PlatformIcon } from './PlatformIcons';
import { WebsiteBuilder } from './WebsiteBuilder';
import { Mark, Spark } from './Spark';
import { AvailabilityPanel, CoreTag } from './Availability';
import { CopyButton, Loading, ScoreBreakdown, ScoreCard, SourceBadge, useGoogleFonts } from './ui';

export interface BrandDTO {
  id: string;
  name: string;
  domain: string | null;
  handle: string | null;
  brief: Brief;
  kit: BrandKit | null;
  score: GoBrandScore | null;
  domains: DomainResult[] | null;
  socials: SocialResult[] | null;
  status: 'generating' | 'ready' | 'failed';
  error: string | null;
  source: 'ai' | 'offline' | null;
  version: number;
  isPublic: boolean;
  shareSlug: string | null;
}

/** True in the single-file preview build (no server: exports go through the host's save dialog, no PDF route). */
const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW === '1';

const TABS = ['Brand in a Box', 'Identity', 'Strategy', 'Launch kit', 'Website', 'Downloads', 'Assistant'] as const;
type Tab = (typeof TABS)[number];

export function BrandView({ id }: { id: string }) {
  const { toast, system } = useApp();
  const [brand, setBrand] = useState<BrandDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('Brand in a Box');

  const load = useCallback(async () => {
    try {
      const r = await api<{ brand: BrandDTO }>(`/api/brands/${id}`);
      setBrand(r.brand);
      return r.brand;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load this brand.');
      return null;
    }
  }, [id]);

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      const b = await load();
      if (!stop && b?.status === 'generating') timer = setTimeout(tick, 1800);
    };
    void tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [load]);

  const undo = async () => {
    try {
      const r = await api<{ brand: BrandDTO }>(`/api/brands/${id}/undo`, { method: 'POST' });
      setBrand(r.brand);
      toast('Undone');
    } catch {
      toast('Nothing to undo', 'error');
    }
  };

  const [lookBusy, setLookBusy] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const choose = async (lookId: string) => {
    setLookBusy(lookId);
    try {
      const r = await api<{ brand: BrandDTO }>(`/api/brands/${id}/look`, { body: { lookId } });
      setBrand(r.brand);
      setPicking(false);
      setTab('Identity');
      toast('Look chosen — your guidelines are ready');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not apply that look', 'error');
    } finally {
      setLookBusy(null);
    }
  };
  const more = async () => {
    setLookBusy('more');
    try {
      const r = await api<{ brand: BrandDTO }>(`/api/brands/${id}/looks`, { method: 'POST' });
      setBrand(r.brand);
      setPicking(true);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not design new looks', 'error');
    } finally {
      setLookBusy(null);
    }
  };

  const [imageryBusy, setImageryBusy] = useState<'moodboard' | 'concepts' | null>(null);
  const imagery = async (kind: 'moodboard' | 'concepts') => {
    setImageryBusy(kind);
    try {
      const r = await api<{ brand: BrandDTO }>(`/api/brands/${id}/imagery`, { body: { kind } });
      setBrand(r.brand);
      toast(kind === 'moodboard' ? 'Moodboard ready' : 'Concept sketches ready');
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'The image model didn’t answer. Try again.', 'error');
    } finally {
      setImageryBusy(null);
    }
  };

  if (error) {
    return (
      <div className="container" style={{ padding: '64px var(--gutter)' }}>
        <div className="notice error">{error}</div>
        <Link href="/dashboard" className="btn btn-ghost" style={{ marginTop: 16 }}>
          Back to my brands
        </Link>
      </div>
    );
  }
  if (!brand || brand.status === 'generating') {
    return (
      <div className="container" style={{ padding: '48px var(--gutter)' }}>
        <div className="card">
          <Loading
            title={brand ? `Building ${brand.name}…` : 'Opening your brand…'}
            steps={['Checking domains & handles', 'Writing your story and positioning', 'Designing your mark', 'Choosing colours and fonts', 'Drafting launch posts', 'Writing your website copy']}
          />
        </div>
      </div>
    );
  }
  if (brand.status === 'failed' || !brand.kit) {
    return (
      <div className="container stack gap-16" style={{ padding: '64px var(--gutter)' }}>
        <div className="notice error">{brand.error ?? 'Something went wrong.'}</div>
        <button
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start' }}
          onClick={async () => {
            const r = await api<{ brand: BrandDTO }>(`/api/brands/${id}/retry`, { method: 'POST' });
            setBrand(r.brand);
            void load();
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  const kit = brand.kit;
  if (!kit.identity.lookChosen || picking) {
    return (
      <div className="container stack gap-24" style={{ padding: '28px var(--gutter) 72px' }}>
        <LookPicker kit={kit} onChoose={choose} onMore={more} busy={lookBusy} canCancel={kit.identity.lookChosen} onCancel={() => setPicking(false)} />
      </div>
    );
  }
  return (
    <div className="container stack gap-24" style={{ padding: '28px var(--gutter) 72px' }}>
      <BrandHeader brand={brand} kit={kit} onUndo={undo} onChange={setBrand} demo={system?.mode === 'demo'} onDownloads={() => setTab('Downloads')} />
      <div className="pagetabs no-print" role="tablist" aria-label="Brand sections">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t === 'Assistant' ? (
              <span className="row gap-6">
                <Spark size={11} /> AI Assistant
              </span>
            ) : t === 'Launch kit' ? (
              <span className="row gap-6 tab-with-icons">
                Social &amp; launch kit <PlatformStack ids={['instagram', 'linkedin', 'x', 'youtube']} size={15} />
              </span>
            ) : t === 'Downloads' ? (
              <span className="row gap-6 tab-with-icons">
                Downloads <span className="tab-tag">logos · banners · PDF</span>
              </span>
            ) : (
              t
            )}
          </button>
        ))}
      </div>
      {tab === 'Brand in a Box' && <BoxTab brand={brand} kit={kit} go={setTab} />}
      {tab === 'Identity' && (
        <div className="stack gap-16">
          <div className="row between wrap gap-12 no-print">
            <span className="small soft">
              Look: <strong>{LOGO_STYLE_META[kit.identity.style].title}</strong> — {LOGO_STYLE_META[kit.identity.style].construction}
            </span>
            <div className="row gap-8">
              <button className="btn btn-ghost btn-sm" onClick={() => setPicking(true)} disabled={!!lookBusy}>
                Compare looks
              </button>
              <button className="btn btn-outline btn-sm" onClick={more} disabled={!!lookBusy}>
                <Spark size={12} /> {lookBusy === 'more' ? 'Designing…' : 'Explore 4 new looks'}
              </button>
            </div>
          </div>
          <BrandGuidelines
            kit={kit}
            domain={brand.domain}
            handle={brand.handle}
            version={brand.version}
            score={brand.score?.overall}
            onSwitchLook={choose}
            onGenerateImagery={PREVIEW ? undefined : imagery}
            imageryBusy={imageryBusy}
          />
        </div>
      )}
      {tab === 'Strategy' && <StrategyTab brand={brand} kit={kit} onChange={setBrand} />}
      {tab === 'Launch kit' && <LaunchTab brand={brand} kit={kit} onChange={setBrand} onDownloads={() => setTab('Downloads')} />}
      {tab === 'Website' && <WebsiteTab brand={brand} kit={kit} onChange={setBrand} />}
      {tab === 'Downloads' && <ExportCentre brandId={brand.id} kit={kit} domain={brand.domain} handle={brand.handle} version={brand.version} onOpenWebsite={() => setTab('Website')} />}
      {tab === 'Assistant' && <AssistantPanel brand={brand} onChange={setBrand} />}
    </div>
  );
}

/* ---------------------------------- header --------------------------------- */

function BrandHeader({ brand, kit, onUndo, onChange, demo, onDownloads }: { brand: BrandDTO; kit: BrandKit; onUndo: () => void; onChange: (b: BrandDTO) => void; demo: boolean; onDownloads: () => void }) {
  const { toast } = useApp();
  useGoogleFonts([kit.identity.typography.display, kit.identity.typography.body]);

  const share = async () => {
    try {
      const r = await api<{ brand: BrandDTO }>(`/api/brands/${brand.id}`, { method: 'PATCH', body: { isPublic: !brand.isPublic } });
      onChange(r.brand);
      if (r.brand.isPublic && r.brand.shareSlug) {
        const url = `${location.origin}/b/${r.brand.shareSlug}`;
        await navigator.clipboard?.writeText(url).catch(() => undefined);
        toast('Share link copied');
      } else toast('Sharing turned off');
    } catch {
      toast('Could not update sharing', 'error');
    }
  };

  return (
    <header className="stack gap-16">
      <div className="row between wrap gap-16" style={{ alignItems: 'flex-end' }}>
        <div className="stack gap-12" style={{ minWidth: 0 }}>
          <div className="row gap-8 wrap">
            <span className="eyebrow">Your brand in a box</span>
            {brand.source && <SourceBadge source={brand.source} />}
            <span className="badge line">v{brand.version}</span>
            {demo && <span className="badge amber">Demo data</span>}
          </div>
          <div style={{ overflow: 'hidden', maxWidth: '100%' }}>
            <KitLogo kit={kit} height={92} />
          </div>
          <p className="lead" style={{ fontSize: 19 }}>
            {kit.taglines[0]}
          </p>
        </div>
        <div className="row gap-8 wrap no-print">
          <button className="btn btn-ghost btn-sm" onClick={onUndo} title="Undo the last change">
            ↶ Undo
          </button>
          <button className="btn btn-ghost btn-sm" onClick={share}>
            {brand.isPublic ? 'Shared ✓' : 'Share'}
          </button>
          <button className="btn btn-dark btn-sm" onClick={onDownloads}>
            Download kit + social files ↓
          </button>
        </div>
      </div>
    </header>
  );
}

/* --------------------------------- box tab --------------------------------- */

function BoxTab({ brand, kit, go }: { brand: BrandDTO; kit: BrandKit; go: (t: Tab) => void }) {
  const p = kit.identity.palette;
  return (
    <div className="stack gap-20">
      <div className="box-grid">
        <div className="card box-hero" style={{ background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
          <KitLogo kit={kit} width="min(100%, 520px)" maxHeight={210} />
        </div>
        <div className="card dark stack gap-12" style={{ background: swatch(p, 'ink'), alignItems: 'center', justifyContent: 'center' }}>
          <KitLogo kit={kit} variant="dark" width="min(100%, 260px)" maxHeight={110} />
        </div>
        <div className="card row gap-16" style={{ background: swatch(p, 'tint'), borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          <KitIcon kit={kit} size={84} />
          <Mark shape={kit.identity.mark.shape} size={30} color={swatch(p, 'brand')} />
        </div>
      </div>

      <div className="grid-4">
        <div className="card sm stack gap-10 span-2">
          <div className="row gap-16 wrap" style={{ alignItems: 'baseline' }}>
            <span className="stack gap-2">
              <span className="eyebrow">Domain</span>
              <span className="mono" style={{ fontSize: 17, wordBreak: 'break-all' }}>{brand.domain ?? `${toSlug(brand.name)}.com`}</span>
            </span>
            <span className="stack gap-2">
              <span className="eyebrow">Handle</span>
              <span className="mono" style={{ fontSize: 17 }}>@{brand.handle ?? toSlug(brand.name).replace(/-/g, '')}</span>
            </span>
          </div>
          <CoreTag name={brand.name} domains={brand.domains ?? undefined} socials={brand.socials ?? undefined} size="sm" />
        </div>
        <div className="card sm stack gap-8">
          <span className="eyebrow">Personality</span>
          <span style={{ fontWeight: 700 }}>{kit.voice.summary}</span>
          <span className="small soft">{kit.archetype.name}</span>
        </div>
        {brand.score && <ScoreCard score={brand.score} />}
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card stack gap-16">
          <div className="row between">
            <span className="eyebrow">Colours</span>
            <button className="btn-link small" onClick={() => go('Identity')}>
              Full guidelines →
            </button>
          </div>
          <div className="row gap-8">
            {p.map((s) => (
              <div key={s.role} className="stack gap-6 grow">
                <div style={{ height: 72, borderRadius: 14, background: s.hex, border: '1px solid rgba(0,0,0,.06)' }} />
                <span className="tiny" style={{ fontWeight: 700 }}>
                  {s.name}
                </span>
                <span className="mono tiny muted">{s.hex}</span>
              </div>
            ))}
          </div>
          <span className="eyebrow">Fonts</span>
          <div className="stack gap-4">
            <span style={{ fontFamily: `'${kit.identity.typography.display.family}'`, fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>{kit.identity.typography.display.family}</span>
            <span style={{ fontFamily: `'${kit.identity.typography.body.family}'` }} className="soft">
              {kit.identity.typography.body.family} for body · {kit.identity.typography.data.family} for data
            </span>
          </div>
          <span className="eyebrow">Look</span>
          <p className="soft">
            <strong>{kit.identity.looks.find((l) => l.style === kit.identity.style && l.seed === kit.identity.seed)?.title ?? LOGO_STYLE_META[kit.identity.style].title}.</strong> {kit.identity.mark.concept}
          </p>
        </div>
        <div className="card stack gap-16">
          <span className="eyebrow">Positioning</span>
          <p style={{ fontSize: 18 }}>{kit.positioning}</p>
          <span className="eyebrow">Taglines</span>
          <ul className="stack gap-6" style={{ margin: 0, paddingLeft: 18 }}>
            {kit.taglines.slice(0, 5).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <span className="eyebrow">Launch post</span>
          <p className="soft small" style={{ whiteSpace: 'pre-wrap' }}>
            {kit.launch.posts.announcement}
          </p>
          <span className="eyebrow">Website headline</span>
          <p className="display" style={{ fontSize: 24 }}>
            {kit.website.headline}
          </p>
        </div>
      </div>

      <div className="stack gap-12">
        <div className="row between wrap gap-8">
          <h3 className="h3">{brand.name} in the wild</h3>
          <button className="btn-link small" onClick={() => go('Identity')}>
            All applications →
          </button>
        </div>
        <MockupGrid kit={kit} kinds={kitMockupKinds(kit).slice(0, 3)} domain={brand.domain} handle={brand.handle} caption={false} />
      </div>

      <div className="stack gap-12">
        <div className="row between wrap gap-8">
          <h3 className="h3 row gap-8" style={{ alignItems: 'center' }}>
            Ready to post <PlatformStack ids={['instagram', 'linkedin', 'x', 'youtube']} size={20} />
          </h3>
          <button className="btn-link small" onClick={() => go('Launch kit')}>
            Social &amp; launch kit →
          </button>
        </div>
        <SocialStrip kit={kit} domain={brand.domain} handle={brand.handle} />
      </div>

      {(brand.domains || brand.socials) && (
        <div className="stack gap-12">
          <h3 className="h3">Where {brand.name} can live</h3>
          <AvailabilityPanel name={brand.name} domains={brand.domains ?? undefined} socials={brand.socials ?? undefined} />
        </div>
      )}
      <ExpertsBox tags={[...kit.personality, brand.brief.industry ?? '']} brandId={brand.id} brandName={brand.name} />

      {brand.score && (
        <details className="card">
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>How the GoBrand Score was calculated</summary>
          <div style={{ marginTop: 16 }}>
            <ScoreBreakdown score={brand.score} />
          </div>
        </details>
      )}
    </div>
  );
}

/* -------------------------------- text tabs -------------------------------- */

function Block({ title, text, children, platform }: { title: string; text?: string; children?: React.ReactNode; platform?: string }) {
  return (
    <div className="card sm stack gap-10">
      <div className="row between gap-12">
        <span className="row gap-8 block-title">
          {platform && <PlatformIcon id={platform} size={22} />}
          <span className="eyebrow">{title}</span>
        </span>
        {text && <CopyButton text={text} />}
      </div>
      {children ?? <p style={{ whiteSpace: 'pre-wrap' }}>{text}</p>}
    </div>
  );
}

function Regenerate({ brand, section, label, onChange }: { brand: BrandDTO; section: string; label: string; onChange: (b: BrandDTO) => void }) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  const [instruction, setInstruction] = useState('');
  return (
    <form
      className="row gap-8 wrap no-print"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = await api<{ brand: BrandDTO }>(`/api/brands/${brand.id}/sections/${section}`, { body: { instruction: instruction || undefined } });
          onChange(r.brand);
          setInstruction('');
          toast(`${label} rewritten`);
        } catch (err) {
          toast(err instanceof ApiError ? err.message : 'Could not regenerate', 'error');
        } finally {
          setBusy(false);
        }
      }}
    >
      <input className="input sm grow" style={{ minWidth: 200 }} value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="Optional direction — “more premium”, “for parents”" aria-label={`Direction for ${label}`} />
      <button className="btn btn-ghost btn-sm" disabled={busy}>
        <Spark size={12} /> {busy ? 'Rewriting…' : `Rewrite ${label.toLowerCase()}`}
      </button>
    </form>
  );
}

function StrategyTab({ brand, kit, onChange }: { brand: BrandDTO; kit: BrandKit; onChange: (b: BrandDTO) => void }) {
  return (
    <div className="stack gap-16">
      <Regenerate brand={brand} section="strategy" label="Strategy" onChange={onChange} />
      <div className="grid-2">
        <Block title="Brand meaning" text={kit.meaning} />
        <Block title="Positioning" text={kit.positioning} />
        <Block title="Mission" text={kit.mission} />
        <Block title="Vision" text={kit.vision} />
      </div>
      <Block title="Brand story" text={kit.story} />
      <div className="grid-3">
        <Block title="Target audience" text={`${kit.audience.primary}${kit.audience.secondary ? `\nAlso: ${kit.audience.secondary}` : ''}`}>
          <div className="stack gap-8">
            <strong>{kit.audience.primary}</strong>
            {kit.audience.secondary && <span className="small soft">Also: {kit.audience.secondary}</span>}
            <ul style={{ margin: 0, paddingLeft: 18 }} className="small soft">
              {kit.audience.insights.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        </Block>
        <Block title="Personality" text={kit.personality.join(', ')}>
          <div className="chips">
            {kit.personality.map((p) => (
              <span key={p} className="chip static sm on">
                {p}
              </span>
            ))}
          </div>
        </Block>
        <Block title="Archetype" text={`${kit.archetype.name} — ${kit.archetype.description}`}>
          <strong>{kit.archetype.name}</strong>
          <span className="small soft">{kit.archetype.description}</span>
        </Block>
      </div>
      <div className="card dark stack gap-16">
        <span className="eyebrow" style={{ color: 'var(--on-dark-muted)' }}>
          Tone of voice
        </span>
        <span className="display" style={{ fontSize: 28 }}>
          {kit.voice.summary}
        </span>
        <div className="grid-3">
          <div className="stack gap-6">
            <span className="tiny" style={{ fontWeight: 700, color: 'var(--violet-muted)' }}>
              SAY
            </span>
            {kit.voice.say.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <div className="stack gap-6">
            <span className="tiny" style={{ fontWeight: 700, color: 'var(--on-dark-muted)' }}>
              NOT
            </span>
            {kit.voice.not.map((s) => (
              <span key={s} style={{ textDecoration: 'line-through', color: 'var(--on-dark-muted)' }}>
                {s}
              </span>
            ))}
          </div>
          <div className="stack gap-6">
            <span className="tiny" style={{ fontWeight: 700 }}>
              PRINCIPLES
            </span>
            {kit.voice.principles.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
      </div>
      <Regenerate brand={brand} section="taglines" label="Taglines" onChange={onChange} />
      <Block title="Tagline options" text={kit.taglines.join('\n')}>
        <ol className="stack gap-8" style={{ margin: 0, paddingLeft: 20 }}>
          {kit.taglines.map((t) => (
            <li key={t} className="display" style={{ fontSize: 22, fontWeight: 500 }}>
              {t}
            </li>
          ))}
        </ol>
      </Block>
      <div className="grid-2">
        <Block title="One-line description" text={kit.messaging.oneLiner} />
        <Block title="Short description" text={kit.messaging.short} />
        <Block title="Long description" text={kit.messaging.long} />
        <Block title="Elevator pitch" text={kit.messaging.elevatorPitch} />
      </div>
      <div className="card stack gap-12">
        <span className="eyebrow">Design system</span>
        <div className="grid-3" style={{ gap: 16 }}>
          {Object.entries(kit.identity.designSystem).map(([k, v]) => (
            <div key={k} className="stack gap-4">
              <strong style={{ textTransform: 'capitalize' }}>{k}</strong>
              <span className="small soft">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LaunchTab({ brand, kit, onChange, onDownloads }: { brand: BrandDTO; kit: BrandKit; onChange: (b: BrandDTO) => void; onDownloads: () => void }) {
  const L = kit.launch;
  return (
    <div className="stack gap-24">
      <section className="stack gap-12">
        <div className="row between wrap gap-12" style={{ alignItems: 'flex-end' }}>
          <div className="stack gap-6">
            <span className="eyebrow">Ready-to-post images</span>
            <h3 className="h3">Your social media kit</h3>
            <span className="small soft">Profile picture, launch post and banners for LinkedIn, X and YouTube, each at the platform’s exact size.</span>
          </div>
          <button type="button" className="btn btn-dark btn-sm no-print" onClick={onDownloads}>
            All files in Downloads →
          </button>
        </div>
        <SocialStrip kit={kit} domain={brand.domain} handle={brand.handle} download />
      </section>
      <section className="stack gap-16">
        <div className="stack gap-6">
          <span className="eyebrow">Words for every platform</span>
          <h3 className="h3">Bios, launch posts and a first month of ideas</h3>
        </div>
        <Regenerate brand={brand} section="launch" label="Launch kit" onChange={onChange} />
        <div className="grid-2">
          <Block title="Instagram bio" platform="instagram" text={L.bios.instagram} />
          <Block title="X bio" platform="x" text={L.bios.x} />
          <Block title="LinkedIn company description" platform="linkedin" text={L.bios.linkedin} />
          <Block title="YouTube description" platform="youtube" text={L.bios.youtube} />
        </div>
        <div className="grid-2">
          <Block title="Instagram launch post" platform="instagram" text={L.posts.instagram} />
          <Block title="LinkedIn launch post" platform="linkedin" text={L.posts.linkedin} />
        </div>
        <div className="grid-2">
          <Block title="X thread" platform="x" text={L.posts.xThread.join('\n\n')}>
            <ol className="stack gap-10" style={{ margin: 0, paddingLeft: 20 }}>
              {L.posts.xThread.map((t) => (
                <li key={t} style={{ whiteSpace: 'pre-line' }}>{t}</li>
              ))}
            </ol>
          </Block>
          <Block title="Short announcement" text={L.posts.announcement} />
        </div>
        <Block title="10 content ideas for your first month" text={L.contentIdeas.map((c, i) => `${i + 1}. ${c}`).join('\n')}>
          <ol className="grid-2" style={{ margin: 0, paddingLeft: 20, gap: 10 }}>
            {L.contentIdeas.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
        </Block>
      </section>
    </div>
  );
}

function WebsiteTab({ brand, kit, onChange }: { brand: BrandDTO; kit: BrandKit; onChange: (b: BrandDTO) => void }) {
  const W = kit.website;
  const p = kit.identity.palette;
  const brandColor = swatch(p, 'brand');
  const display = `'${kit.identity.typography.display.family}'`;
  return (
    <div className="stack gap-16">
      <WebsiteBuilder brandId={brand.id} kit={kit} domain={brand.domain} handle={brand.handle} />
      <h3 className="h3" style={{ marginTop: 8 }}>Website copy</h3>
      <Regenerate brand={brand} section="website" label="Website copy" onChange={onChange} />
      <div className="grid-2">
        <Block title="Headline" text={W.headline} />
        <Block title="Subheadline" text={W.subheadline} />
        <Block title="About" text={W.about} />
        <Block title="Benefits" text={W.benefits.join('\n')}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {W.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Block>
      </div>
      <Block title="FAQ" text={W.faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')}>
        <div className="stack gap-12">
          {W.faq.map((f) => (
            <div key={f.q}>
              <strong>{f.q}</strong>
              <p className="soft small">{f.a}</p>
            </div>
          ))}
        </div>
      </Block>
      <div className="grid-3">
        <Block title="Contact" text={W.contact} />
        <Block title="SEO title" text={W.seoTitle} />
        <Block title="Meta description" text={W.metaDescription} />
      </div>
    </div>
  );
}

/* --------------------------------- assistant -------------------------------- */

const SUGGESTIONS = ['Make my tagline more premium', 'Give me 10 alternatives to this name', 'Make the brand feel more Gen Z', 'Give me a darker colour palette', 'Rewrite my positioning', 'Create an Instagram carousel', 'Create a launch campaign', 'Give me a website homepage'];

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  meta?: { names?: string[]; changed?: string[]; source?: string } | null;
}

function AssistantPanel({ brand, onChange }: { brand: BrandDTO; onChange: (b: BrandDTO) => void }) {
  const { toast, system } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ messages: Msg[] }>(`/api/brands/${brand.id}/assistant`)
      .then((r) => setMsgs(r.messages))
      .catch(() => undefined);
  }, [brand.id]);
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), [msgs.length, busy]);

  const send = async (message: string) => {
    if (!message.trim() || busy) return;
    setBusy(true);
    setText('');
    setMsgs((m) => [...m, { id: `u${Date.now()}`, role: 'user', content: message }]);
    try {
      const r = await api<{ reply: string; names: string[]; changed: string[]; source: string; brand: BrandDTO }>(`/api/brands/${brand.id}/assistant`, { body: { message } });
      setMsgs((m) => [...m, { id: `a${Date.now()}`, role: 'assistant', content: r.reply, meta: { names: r.names, changed: r.changed, source: r.source } }]);
      if (r.changed.length) onChange(r.brand);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'The assistant is unavailable', 'error');
      setMsgs((m) => m.slice(0, -1));
      setText(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <div className="card stack gap-16" style={{ minHeight: 480 }}>
        <div className="row between">
          <div className="row gap-8">
            <Spark size={16} />
            <strong>AI Brand Assistant</strong>
          </div>
          {!system?.ai.live && <span className="badge amber">Offline mode</span>}
        </div>
        <div className="chat grow" style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
          {msgs.length === 0 && <p className="muted small">I know everything about {brand.name}. Ask me to change something — I’ll update your kit, and you can always undo.</p>}
          {msgs.map((m) => (
            <div key={m.id} className={`bubble ${m.role}`}>
              <RichText text={m.content} />
              {m.meta?.changed && m.meta.changed.length > 0 && (
                <div className="row gap-6 wrap" style={{ marginTop: 8 }}>
                  {m.meta.changed.map((c) => (
                    <span key={c} className="badge aqua">
                      ✓ updated {c}
                    </span>
                  ))}
                </div>
              )}
              {m.meta?.names && m.meta.names.length > 0 && (
                <div className="chips" style={{ marginTop: 10 }}>
                  {m.meta.names.map((n) => (
                    <Link key={n} href={`/name/${encodeURIComponent(n)}`} className="chip sm" target="_blank">
                      {n}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="bubble assistant row gap-10">
              <Spark size={14} className="twinkle" /> Thinking…
            </div>
          )}
          <div ref={end} />
        </div>
        <form
          className="row gap-8"
          onSubmit={(e) => {
            e.preventDefault();
            void send(text);
          }}
        >
          <input className="input sm grow" value={text} onChange={(e) => setText(e.target.value)} placeholder="Make my tagline more premium…" aria-label="Message the assistant" maxLength={1000} />
          <button className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>
            Send
          </button>
        </form>
      </div>
      <div className="stack gap-12">
        <span className="eyebrow">Try asking</span>
        <div className="chips">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => send(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Tiny, safe markdown: **bold**, *italic*, line breaks. No HTML injection. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <span key={i}>
          {line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, j) =>
            part.startsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part.startsWith('*') && part.length > 2 ? <em key={j}>{part.slice(1, -1)}</em> : part,
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      ))}
    </>
  );
}
