import { httpFetch } from '../../lib/http';
import { unknown, type DomainCheck, type DomainProvider } from './types';

/**
 * Porkbun API v3: POST /api/json/v3/domain/checkDomain/{domain}.
 * Free with any Porkbun account (API key + secret from porkbun.com/account/api).
 * Returns whether the registrar will sell the name *right now*, the real
 * first-year price, the renewal price and the premium flag. Porkbun allows
 * roughly one check every ten seconds per key, so it is used as a confirm
 * step for names the registry already reports as free, not for every lookup.
 */
export class PorkbunProvider implements DomainProvider {
  readonly id = 'porkbun' as const;
  readonly live = true;

  constructor(
    private readonly apiKey: string,
    private readonly secret: string,
    private readonly timeoutMs: number,
  ) {}

  async check(domains: string[]): Promise<DomainCheck[]> {
    const out: DomainCheck[] = [];
    for (const domain of domains) out.push(await this.checkOne(domain));
    return out;
  }

  private async checkOne(domain: string): Promise<DomainCheck> {
    const res = await httpFetch(`https://api.porkbun.com/api/json/v3/domain/checkDomain/${encodeURIComponent(domain)}`, {
      method: 'POST',
      timeoutMs: this.timeoutMs,
      retries: 0,
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ apikey: this.apiKey, secretapikey: this.secret }),
    });
    if (res.status === 429 || res.status === 503) return unknown(domain, 'porkbun', 'Porkbun is rate-limiting checks.');
    if (!res.ok) throw new Error(`Porkbun HTTP ${res.status}`);
    const body = (await res.json()) as {
      status?: string;
      message?: string;
      response?: { avail?: string; price?: string; regularPrice?: string; premium?: string; additional?: { renewal?: { price?: string } } };
    };
    if (body.status !== 'SUCCESS' || !body.response) return unknown(domain, 'porkbun', body.message ?? 'Porkbun did not return a result.');
    const r = body.response;
    const available = r.avail === 'yes';
    const premium = r.premium === 'yes';
    const amount = Number(r.price);
    const renewal = Number(r.additional?.renewal?.price ?? r.regularPrice);
    return {
      domain,
      status: !available ? 'taken' : premium ? 'premium' : 'available',
      verified: true,
      confirmed: available,
      source: 'porkbun',
      price: available && Number.isFinite(amount) ? { amount, currency: 'USD', renewal: Number.isFinite(renewal) ? renewal : undefined } : undefined,
      note: premium ? 'Registry premium name: priced above the usual rate.' : undefined,
    };
  }
}
