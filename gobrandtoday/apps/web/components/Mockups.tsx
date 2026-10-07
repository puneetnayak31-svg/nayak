'use client';

import { useMemo } from 'react';
import { MOCKUP_KINDS, MOCKUP_META, mockupSVG, toSlug, type BrandKit, type MockupKind } from '@gbt/shared';
import { canvasMeasure, kitIdentity, useLogoFonts } from './Logo';

/** One brand application (business card, phone, merch…) drawn with the real logo. */
export function Mockup({ kit, kind, domain, handle, caption = true }: { kit: BrandKit; kind: MockupKind; domain?: string | null; handle?: string | null; caption?: boolean }) {
  const t = kit.identity.typography;
  const v = useLogoFonts([t.display, t.body, t.data]);
  const svg = useMemo(() => {
    const id = kitIdentity(kit);
    return mockupSVG(kind, {
      id,
      measure: typeof document === 'undefined' ? undefined : canvasMeasure,
      fonts: { display: t.display.family, body: t.body.family, data: t.data.family },
      tagline: kit.taglines[0] ?? kit.messaging.oneLiner,
      headline: kit.website.headline,
      subheadline: kit.website.subheadline,
      cta: kit.website.cta,
      domain: domain ?? `${toSlug(kit.name)}.com`,
      handle: handle ?? toSlug(kit.name).replace(/-/g, ''),
    }).replace('<svg ', '<svg style="display:block;width:100%;height:auto" ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kit, kind, domain, handle, v]);
  return (
    <figure className="mockup">
      <div className="mockup-art" dangerouslySetInnerHTML={{ __html: svg }} />
      {caption && (
        <figcaption>
          <b>{MOCKUP_META[kind].title}</b>
          <span>{MOCKUP_META[kind].note}</span>
        </figcaption>
      )}
    </figure>
  );
}

export function MockupGrid({ kit, kinds = [...MOCKUP_KINDS], domain, handle, caption }: { kit: BrandKit; kinds?: MockupKind[]; domain?: string | null; handle?: string | null; caption?: boolean }) {
  return (
    <div className="mockup-grid">
      {kinds.map((k) => (
        <Mockup key={k} kit={kit} kind={k} domain={domain} handle={handle} caption={caption} />
      ))}
    </div>
  );
}
