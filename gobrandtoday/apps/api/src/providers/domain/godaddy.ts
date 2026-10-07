import { httpFetch } from '../../lib/http';
import { unknown, type DomainCheck, type DomainProvider } from './types';

/**
 * GoDaddy Domains API (v1 bulk availability).
 * Requires GODADDY_API_KEY + GODADDY_API_SECRET. Note GoDaddy limits production
 * API access to qualifying accounts; use GODADDY_ENV=ote for their test env.
 */
export class GoDaddyProvider implements DomainProvider {
  readonly id = 'godaddy' as const;
  readonly live = true;
  private base: string;

  constructor(
    private readonly key: string,
    private readonly secret: string,
    envName: 'production' | 'ote',
    private readonly timeoutMs: number,
  ) {
    this.base = envName === 'ote' ? 'https://api.ote-godaddy.com' : 'https://api.godaddy.com';
  }

  async check(domains: string[]): Promise<DomainCheck[]> {
    const res = await httpFetch(`${this.base}/v1/domains/available?checkType=FAST`, {
      method: 'POST',
      timeoutMs: this.timeoutMs,
      retries: 1,
      headers: { authorization: `sso-key ${this.key}:${this.secret}`, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(domains),
    });
    if (!res.ok) throw new Error(`GoDaddy HTTP ${res.status}`);
    const body = (await res.json()) as {
      domains?: Array<{ domain: string; available: boolean; definitive?: boolean; price?: number; currency?: string }>;
    };
    const byDomain = new Map((body.domains ?? []).map((d) => [d.domain.toLowerCase(), d]));
    return domains.map((domain) => {
      const d = byDomain.get(domain);
      if (!d) return unknown(domain, 'godaddy', 'GoDaddy did not return a result.');
      return {
        domain,
        status: d.available ? 'available' : 'taken',
        verified: d.definitive !== false,
        confirmed: d.available && d.definitive !== false,
        source: 'godaddy',
        // GoDaddy prices are in micro-units.
        price: d.available && d.price ? { amount: d.price / 1_000_000, currency: d.currency ?? 'USD' } : undefined,
        note: d.definitive === false ? 'Quick check — confirm at checkout.' : undefined,
      } satisfies DomainCheck;
    });
  }
}
