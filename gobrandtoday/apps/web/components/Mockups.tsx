'use client';

import { useMemo, useState } from 'react';
import { ELEMENT_KINDS, ELEMENT_META, MOCKUP_META, PRIMARY_MOCKUPS, SOCIAL_ASSETS, elementSVG, mockupSVG, socialSVG, type BrandKit, type ElementKind, type MockupKind, type SocialAsset } from '@gbt/shared';
import { downloadElement, downloadMockup, downloadSocial, kitDomain, kitHandle, kitMockupInput, kitMockupKinds } from '@/lib/export';
import { track } from '@/lib/api';
import { useLogoFonts } from './Logo';
import { PlatformIcon } from './PlatformIcons';
import { useSignupGate } from './SignupGate';

const fill = (svg: string) => svg.replace('<svg ', '<svg style="display:block;width:100%;height:auto" ');

/** One brand application (business card, phone, merch, industry objects…) drawn with the real logo. */
export function Mockup({ kit, kind, domain, handle, caption = true, download = false }: { kit: BrandKit; kind: MockupKind; domain?: string | null; handle?: string | null; caption?: boolean; download?: boolean }) {
  const t = kit.identity.typography;
  const v = useLogoFonts([t.display, t.body, t.data]);
  const d = kitDomain(kit, domain);
  const h = kitHandle(kit, handle);
  const { guard, gate } = useSignupGate();
  const svg = useMemo(
    () => fill(mockupSVG(kind, kitMockupInput(kit, d, h))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kit, kind, d, h, v],
  );
  return (
    <figure className="mockup">
      {gate}
      <div className="mockup-art" dangerouslySetInnerHTML={{ __html: svg }} />
      {caption && (
        <figcaption>
          <span className="row between gap-8" style={{ alignItems: 'baseline' }}>
            <b>{MOCKUP_META[kind].title}</b>
            {download && (
              <button type="button" className="btn-link tiny no-print" onClick={guard(() => { track('export', { format: `mockup-${kind}` }); void downloadMockup({ kit, domain: d, handle: h }, kind); })}>
                SVG ↓
              </button>
            )}
          </span>
          <span>{MOCKUP_META[kind].note}</span>
        </figcaption>
      )}
    </figure>
  );
}

/**
 * The brand's applications, its own industry's objects first. Shows the first
 * nine (or `limit`) with a "show all" toggle.
 */
export function MockupGrid({ kit, kinds, domain, handle, caption, limit = PRIMARY_MOCKUPS, download = false }: { kit: BrandKit; kinds?: MockupKind[]; domain?: string | null; handle?: string | null; caption?: boolean; limit?: number; download?: boolean }) {
  const all = useMemo(() => kinds ?? kitMockupKinds(kit), [kinds, kit]);
  const [open, setOpen] = useState(false);
  const shown = open ? all : all.slice(0, limit);
  return (
    <div className="stack gap-16">
      <div className="mockup-grid">
        {shown.map((k) => (
          <Mockup key={k} kit={kit} kind={k} domain={domain} handle={handle} caption={caption} download={download} />
        ))}
      </div>
      {!kinds && all.length > limit && (
        <button type="button" className="btn btn-ghost btn-sm no-print" style={{ alignSelf: 'flex-start' }} onClick={() => setOpen((o) => !o)}>
          {open ? 'Show fewer' : `Show all ${all.length} applications`}
        </button>
      )}
    </div>
  );
}

/** One brand-toolkit element (supergraphic, pattern, icons…). */
export function ToolkitElement({ kit, kind, domain, handle }: { kit: BrandKit; kind: ElementKind; domain?: string | null; handle?: string | null }) {
  const t = kit.identity.typography;
  const v = useLogoFonts([t.display, t.body, t.data]);
  const d = kitDomain(kit, domain);
  const h = kitHandle(kit, handle);
  const { guard, gate } = useSignupGate();
  const svg = useMemo(
    () => fill(elementSVG(kind, { ...kitMockupInput(kit, d, h), personalities: kit.personality })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kit, kind, d, h, v],
  );
  return (
    <figure className="mockup">
      {gate}
      <div className="mockup-art" dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption>
        <span className="row between gap-8" style={{ alignItems: 'baseline' }}>
          <b>{ELEMENT_META[kind].title}</b>
          <button type="button" className="btn-link tiny no-print" onClick={guard(() => { track('export', { format: `element-${kind}` }); void downloadElement({ kit, domain: d, handle: h }, kind); })}>
            SVG ↓
          </button>
        </span>
        <span>{ELEMENT_META[kind].note}</span>
      </figcaption>
    </figure>
  );
}

export function ToolkitGrid({ kit, domain, handle }: { kit: BrandKit; domain?: string | null; handle?: string | null }) {
  return (
    <div className="toolkit-grid">
      {ELEMENT_KINDS.map((k) => (
        <div key={k} className={`tk-${k}`}>
          <ToolkitElement kit={kit} kind={k} domain={domain} handle={handle} />
        </div>
      ))}
    </div>
  );
}

/** Which platform icon labels each social file. */
export const SOCIAL_PLATFORM: Record<SocialAsset, string[]> = {
  avatar: ['instagram', 'linkedin', 'x', 'youtube'],
  post: ['instagram', 'linkedin'],
  linkedin: ['linkedin'],
  x: ['x'],
  youtube: ['youtube'],
};

/** A row of small, overlapping platform icons. */
export function PlatformStack({ ids, size = 18 }: { ids: string[]; size?: number }) {
  return (
    <span className="pf-stack" aria-hidden="true">
      {ids.map((id) => (
        <PlatformIcon key={id} id={id} size={size} />
      ))}
    </span>
  );
}

/**
 * The brand's ready-to-post social files (profile picture, launch post,
 * LinkedIn, X and YouTube banners), drawn live with the real logo.
 */
export function SocialStrip({ kit, domain, handle, download = false }: { kit: BrandKit; domain?: string | null; handle?: string | null; download?: boolean }) {
  const t = kit.identity.typography;
  const v = useLogoFonts([t.display, t.body, t.data]);
  const d = kitDomain(kit, domain);
  const h = kitHandle(kit, handle);
  const { guard, gate } = useSignupGate();
  const kinds = Object.keys(SOCIAL_ASSETS) as SocialAsset[];
  const svgs = useMemo(
    () => Object.fromEntries(kinds.map((k) => [k, fill(socialSVG(k, kitMockupInput(kit, d, h)))])) as Record<SocialAsset, string>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kit, d, h, v],
  );
  return (
    <div className="social-strip">
      {gate}
      {[kinds.filter((k) => k === 'avatar' || k === 'post' || k === 'youtube'), kinds.filter((k) => k === 'x' || k === 'linkedin')].map((row, ri) => (
        <div key={ri} className="ss-row">
          {row.map((k) => (
            <figure key={k} className={`ss-item ss-${k}`} style={{ flexGrow: SOCIAL_ASSETS[k].w / SOCIAL_ASSETS[k].h }}>
              <div className={`ss-art${k === 'avatar' ? ' round' : ''}`} dangerouslySetInnerHTML={{ __html: svgs[k] }} />
              <figcaption className="row between gap-6">
                <span className="row gap-6" style={{ alignItems: 'center', minWidth: 0 }}>
                  <PlatformStack ids={SOCIAL_PLATFORM[k]} size={16} />
                  <span className="ss-title">{SOCIAL_ASSETS[k].title}</span>
                </span>
                {download ? (
                  <button type="button" className="btn-link tiny no-print" onClick={guard(() => { track('export', { format: `social-${k}` }); void downloadSocial({ kit, domain: d, handle: h }, k); })}>
                    PNG ↓
                  </button>
                ) : (
                  <span className="tiny muted">{SOCIAL_ASSETS[k].size}</span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      ))}
    </div>
  );
}
