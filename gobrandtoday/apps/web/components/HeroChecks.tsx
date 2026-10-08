import { SOCIAL_PLATFORMS } from '@gbt/shared';
import { PlatformIcon } from './PlatformIcons';

const TLDS = ['.com', '.in', '.ai', '.io', '.co'];

/**
 * The landing page's promise, shown rather than listed: a name whose ending
 * rolls through the five key domains, and the ten platforms we check handles
 * on. Illustrative only: nothing here claims a real name is free.
 */
export function HeroChecks() {
  return (
    <div className="hc" aria-label="We check .com, .in, .ai, .io and .co domains and handles on 10 social platforms">
      <div className="hc-row">
        <span className="hc-label">Domains, checked live with prices</span>
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
      <div className="hc-row">
        <span className="hc-label">
          <b>@yourbrand</b> on 10 social platforms
        </span>
        <div className="hc-icons">
          {SOCIAL_PLATFORMS.map((p, i) => (
            <span key={p.id} className="hc-icon" style={{ animationDelay: `${120 + i * 60}ms` }}>
              <PlatformIcon id={p.id} size={38} title={p.label} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
