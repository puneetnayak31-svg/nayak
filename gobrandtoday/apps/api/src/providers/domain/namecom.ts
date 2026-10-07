import { httpFetch } from '../../lib/http';
import { unknown, type DomainCheck, type DomainProvider } from './types';

/**
 * Name.com API v4: POST /v4/domains:checkAvailability (HTTP basic auth with
 * your username and API token from name.com/account/settings/api).
 * Up to 50 names per call, with purchasable/premium flags and USD prices.
 */
export class NameComProvider implements DomainProvider {
  readonly id = 'namecom' as const;
  readonly live = true;
  private readonly base: string;

  constructor(
    private readonly username: string,
    private readonly token: string,
    sandbox: boolean,
    private readonly timeoutMs: number,
  ) {
    this.base = sandbox ? 'https://api.dev.name.com' : 'https://api.name.com';
  }

  async check(domains: string[]): Promise<DomainCheck[]> {
    const res = await httpFetch(`${this.base}/v4/domains:checkAvailability`, {
      method: 'POST',
      timeoutMs: this.timeoutMs,
      retries: 1,
      headers: {
        authorization: `Basic ${Buffer.from(`${this.username}:${this.token}`).toString('base64')}`,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({ domainNames: domains }),
    });
    if (!res.ok) throw new Error(`Name.com HTTP ${res.status}`);
    const body = (await res.json()) as {
      results?: Array<{ domainName: string; purchasable?: boolean; premium?: boolean; purchasePrice?: number; renewalPrice?: number }>;
    };
    const byDomain = new Map((body.results ?? []).map((r) => [r.domainName.toLowerCase(), r]));
    return domains.map((domain) => {
      const r = byDomain.get(domain);
      if (!r) return unknown(domain, 'namecom', 'Name.com did not return a result.');
      const available = r.purchasable === true;
      return {
        domain,
        status: !available ? 'taken' : r.premium ? 'premium' : 'available',
        verified: true,
        confirmed: available,
        source: 'namecom',
        price: available && r.purchasePrice ? { amount: r.purchasePrice, currency: 'USD', renewal: r.renewalPrice } : undefined,
        note: r.premium ? 'Registry premium name: priced above the usual rate.' : undefined,
      } satisfies DomainCheck;
    });
  }
}
