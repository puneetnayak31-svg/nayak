import Link from 'next/link';
import { SOCIAL_PLATFORMS } from '@gbt/shared';
import { PlatformIcon } from './PlatformIcons';

const TLDS = ['.com', '.in', '.ai', '.io', '.co'];

/** The ready-to-post files every brand kit includes, each with the platform it's sized for. */
const ASSETS: Array<{ id: string; label: string; glyph: 'avatar' | 'book' | string }> = [
  { id: 'avatar', label: 'Profile picture', glyph: 'avatar' },
  { id: 'linkedin', label: 'LinkedIn banner', glyph: 'linkedin' },
  { id: 'youtube', label: 'YouTube banner', glyph: 'youtube' },
  { id: 'x', label: 'X header', glyph: 'x' },
  { id: 'instagram', label: 'Launch post', glyph: 'instagram' },
  { id: 'book', label: 'Brand guidelines', glyph: 'book' },
];

function Glyph({ g }: { g: string }) {
  if (g === 'avatar')
    return (
      <span className="pf-icon hc-glyph" style={{ width: 20, height: 20, background: 'linear-gradient(135deg,#6D4AFF,#19C3B4)', borderRadius: 999 }} aria-hidden="true">
        <svg viewBox="0 0 24 24" width={13} height={13}>
          <circle cx="12" cy="9" r="4" fill="#fff" />
          <path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4z" fill="#fff" />
        </svg>
      </span>
    );
  if (g === 'book')
    return (
      <span className="pf-icon hc-glyph" style={{ width: 20, height: 20, background: '#16161A' }} aria-hidden="true">
        <svg viewBox="0 0 24 24" width={13} height={13}>
          <path d="M5 4.5h9.5a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z" fill="none" stroke="#fff" strokeWidth="1.8" />
          <path d="M9 9h5M9 12.5h5" stroke="#B9AEFF" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
    );
  return <PlatformIcon id={g} size={20} />;
}

/**
 * The landing page's promise, shown rather than listed: a name whose ending
 * rolls through the five key domains, the ten platforms we check handles on,
 * and the social files the kit includes. Illustrative only: nothing here
 * claims a real name is free.
 */
export function HeroChecks() {
  return (
    <div className="hc" aria-label="We check .com, .in, .ai, .io and .co domains and handles on 10 social platforms, then make your profile picture, banners and brand guidelines">
      <div className="hc-row hc-row-domain">
        <span className="hc-label">Domains, checked live with prices</span>
        <div className="hc-domain-line">
          <div className="hc-domain" aria-hidden="true">
            <span className="hc-name">yourbrand</span>
            <span className="hc-tld">
              <span className="hc-reel">
                {[...TLDS, TLDS[0]].map((t, i) => (
                  <span key={`${t}${i}`}>{t}</span>
                ))}
              </span>
            </span>
          </div>
          <div className="hc-chips" aria-hidden="true">
            {TLDS.map((t) => (
              <span key={t} className="hc-chip">
                {t}
              </span>
            ))}
            <span className="hc-chip more">+5 more</span>
          </div>
        </div>
      </div>
      <div className="hc-row">
        <span className="hc-label">
          <b>@yourbrand</b> on 10 social platforms
        </span>
        <div className="hc-icons">
          {SOCIAL_PLATFORMS.map((p, i) => (
            <span key={p.id} className="hc-icon" style={{ animationDelay: `${120 + i * 60}ms` }}>
              <PlatformIcon id={p.id} size={30} title={p.label} />
            </span>
          ))}
        </div>
      </div>
      <div className="hc-row hc-row-assets">
        <span className="hc-label">Then your brand, ready to post</span>
        <div className="hc-assets">
          {ASSETS.map((a, i) => (
            <span key={a.id} className="hc-asset" style={{ animationDelay: `${700 + i * 70}ms` }}>
              <Glyph g={a.glyph} />
              {a.label}
            </span>
          ))}
        </div>
        <span className="tiny muted">
          Already have a logo? <Link href="/tools/logo-to-social-kit">Turn it into banners and a profile picture →</Link>
        </span>
      </div>
    </div>
  );
}
