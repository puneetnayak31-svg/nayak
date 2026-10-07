import { httpFetch } from '../../lib/http';
import { unknown, type DomainCheck, type DomainProvider } from './types';

/**
 * Namecheap API — namecheap.domains.check. Requires an API user/key and a
 * whitelisted client IP. Returns premium flags and premium prices.
 */
export class NamecheapProvider implements DomainProvider {
  readonly id = 'namecheap' as const;
  readonly live = true;

  constructor(
    private readonly cfg: { apiUser: string; apiKey: string; username: string; clientIp: string; sandbox: boolean },
    private readonly timeoutMs: number,
  ) {}

  async check(domains: string[]): Promise<DomainCheck[]> {
    const base = this.cfg.sandbox ? 'https://api.sandbox.namecheap.com/xml.response' : 'https://api.namecheap.com/xml.response';
    const params = new URLSearchParams({
      ApiUser: this.cfg.apiUser,
      ApiKey: this.cfg.apiKey,
      UserName: this.cfg.username,
      ClientIp: this.cfg.clientIp,
      Command: 'namecheap.domains.check',
      DomainList: domains.join(','),
    });
    const res = await httpFetch(`${base}?${params}`, { timeoutMs: this.timeoutMs, retries: 1 });
    if (!res.ok) throw new Error(`Namecheap HTTP ${res.status}`);
    const xml = await res.text();
    if (/Status="ERROR"/.test(xml)) throw new Error(`Namecheap error: ${xml.match(/<Error[^>]*>([^<]*)</)?.[1] ?? 'unknown'}`);
    return domains.map((domain) => parseNamecheapResult(xml, domain) ?? unknown(domain, 'namecheap', 'Namecheap did not return a result.'));
  }
}

export function parseNamecheapResult(xml: string, domain: string): DomainCheck | undefined {
  const re = new RegExp(`<DomainCheckResult[^>]*Domain="${domain.replace(/\./g, '\\.')}"[^>]*/?>`, 'i');
  const tag = xml.match(re)?.[0];
  if (!tag) return undefined;
  const attr = (name: string) => tag.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1];
  const available = attr('Available') === 'true';
  const premium = attr('IsPremiumName') === 'true';
  const premiumPrice = Number(attr('PremiumRegistrationPrice') ?? 0);
  return {
    domain,
    status: available ? (premium ? 'premium' : 'available') : 'taken',
    verified: true,
    source: 'namecheap',
    price: premium && premiumPrice > 0 ? { amount: premiumPrice, currency: 'USD', renewal: Number(attr('PremiumRenewalPrice') ?? 0) || undefined } : undefined,
    note: premium ? 'Premium domain — priced above standard registration.' : undefined,
  };
}
