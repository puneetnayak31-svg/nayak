import { httpFetch } from '../../lib/http';
import { unknown, type DomainCheck, type DomainProvider } from './types';

/**
 * Hostinger API — POST /api/domains/v1/availability (Bearer token from
 * hPanel → API). Checks one name across many TLDs per request.
 * Rate limit is ~10 requests/minute, so results are cached aggressively and
 * the service falls back to RDAP when throttled.
 */
export class HostingerProvider implements DomainProvider {
  readonly id = 'hostinger' as const;
  readonly live = true;

  constructor(
    private readonly token: string,
    private readonly timeoutMs: number,
  ) {}

  async check(domains: string[]): Promise<DomainCheck[]> {
    // Group by second-level label: "lumora.com", "lumora.in" → lumora: [com, in]
    const groups = new Map<string, string[]>();
    for (const d of domains) {
      const [label, ...rest] = d.split('.');
      groups.set(label!, [...(groups.get(label!) ?? []), rest.join('.')]);
    }
    const results = new Map<string, DomainCheck>();
    for (const [label, tlds] of groups) {
      const res = await httpFetch('https://developers.hostinger.com/api/domains/v1/availability', {
        method: 'POST',
        timeoutMs: this.timeoutMs,
        retries: 0,
        headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ domain: label, tlds, with_alternatives: false }),
      });
      if (!res.ok) throw new Error(`Hostinger HTTP ${res.status}`);
      const body = (await res.json()) as Array<{ domain: string | null; is_available: boolean; is_alternative?: boolean; restriction?: string | null }>;
      for (const item of body) {
        if (!item.domain || item.is_alternative) continue;
        const domain = item.domain.toLowerCase();
        results.set(domain, {
          domain,
          status: item.is_available ? 'available' : 'taken',
          verified: true,
          source: 'hostinger',
          note: item.restriction ?? undefined,
        });
      }
    }
    return domains.map((d) => results.get(d) ?? unknown(d, 'hostinger', 'Hostinger did not return a result.'));
  }
}
