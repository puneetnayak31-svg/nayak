'use client';

import { useMemo, useState } from 'react';
import { ELEMENT_KINDS, ELEMENT_META, MOCKUP_META, PRIMARY_MOCKUPS, elementSVG, mockupSVG, type BrandKit, type ElementKind, type MockupKind } from '@gbt/shared';
import { downloadElement, downloadMockup, kitDomain, kitHandle, kitMockupInput, kitMockupKinds } from '@/lib/export';
import { track } from '@/lib/api';
import { useLogoFonts } from './Logo';
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
