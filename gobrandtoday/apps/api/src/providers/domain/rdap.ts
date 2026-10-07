import { promises as dns } from 'node:dns';
import { cached, cache } from '../../lib/cache';
import { httpFetch, mapLimit } from '../../lib/http';
import { logger } from '../../lib/logger';
import { unknown, type DomainCheck, type DomainProvider } from './types';

/**
 * RDAP — the registries' own, free, keyless lookup protocol (RFC 9083), the
 * successor to WHOIS. A 404 from the authoritative registry means the domain
 * is not registered; 200 means it is. Premium pricing is not visible over
 * RDAP, so "available" is always shown with "price confirmed at checkout".
 *
 * Servers are discovered from the IANA bootstrap file; a small built-in map
 * covers the most common TLDs if the bootstrap can't be fetched.
 */
const IANA_BOOTSTRAP = 'https://data.iana.org/rdap/dns.json';

const FALLBACK_SERVERS: Record<string, string> = {
  com: 'https://rdap.verisign.com/com/v1/',
  net: 'https://rdap.verisign.com/net/v1/',
  app: 'https://pubapi.registry.google/rdap/',
  dev: 'https://pubapi.registry.google/rdap/',
  xyz: 'https://rdap.centralnic.com/xyz/',
  in: 'https://rdap.nixiregistry.in/rdap/',
  ai: 'https://rdap.identitydigital.services/rdap/',
  io: 'https://rdap.nic.io/',
};

type Bootstrap = Record<string, string>;

async function loadBootstrap(timeoutMs: number): Promise<Bootstrap> {
  return cached<Bootstrap>(
    cache,
    'rdap:bootstrap',
    (v) => (Object.keys(v).length > Object.keys(FALLBACK_SERVERS).length ? 24 * 3600_000 : 5 * 60_000),
    async () => {
      try {
        const res = await httpFetch(IANA_BOOTSTRAP, { timeoutMs, retries: 1 });
        if (!res.ok) throw new Error(`IANA bootstrap HTTP ${res.status}`);
        const json = (await res.json()) as { services: Array<[string[], string[]]> };
        const map: Bootstrap = { ...FALLBACK_SERVERS };
        for (const [tlds, urls] of json.services) {
          const url = urls.find((u) => u.startsWith('https://')) ?? urls[0];
          if (!url) continue;
          for (const tld of tlds) map[tld.toLowerCase()] = url.endsWith('/') ? url : `${url}/`;
        }
        return map;
      } catch (err) {
        logger.warn({ err: (err as Error).message }, 'RDAP bootstrap unavailable, using built-in servers');
        return { ...FALLBACK_SERVERS };
      }
    },
  );
}

export class RdapProvider implements DomainProvider {
  readonly id = 'rdap' as const;
  readonly live = true;
  constructor(private readonly timeoutMs: number) {}

  async check(domains: string[]): Promise<DomainCheck[]> {
    const bootstrap = await loadBootstrap(this.timeoutMs);
    return mapLimit(domains, 6, (d) => this.checkOne(d, bootstrap));
  }

  private async checkOne(domain: string, bootstrap: Bootstrap): Promise<DomainCheck> {
    const labels = domain.split('.');
    // Registry is decided by the effective TLD: "co.in" is served by the ".in" registry.
    const tld = labels[labels.length - 1]!;
    const server = bootstrap[tld];
    if (!server) return this.dnsFallback(domain);
    try {
      const res = await httpFetch(`${server}domain/${encodeURIComponent(domain)}`, {
        timeoutMs: this.timeoutMs,
        retries: 1,
        headers: { accept: 'application/rdap+json' },
      });
      if (res.status === 404) {
        return { domain, status: 'available', verified: true, source: 'rdap', note: 'Not registered at the registry. Price and premium status are confirmed at checkout.' };
      }
      if (res.ok) {
        const body = (await res.json().catch(() => ({}))) as { status?: string[] };
        const statuses = body.status ?? [];
        const note = statuses.some((s) => /redemption|pending delete/i.test(s))
          ? 'Registered but expiring — it may become available soon.'
          : 'Registered.';
        return { domain, status: 'taken', verified: true, source: 'rdap', note };
      }
      if (res.status === 429) return unknown(domain, 'rdap', 'The registry is rate-limiting checks — try again in a minute.');
      return this.dnsFallback(domain);
    } catch (err) {
      logger.debug({ domain, err: (err as Error).message }, 'RDAP lookup failed');
      return this.dnsFallback(domain);
    }
  }

  /** No RDAP for this TLD (or it failed): DNS can prove "taken", never "available". */
  private async dnsFallback(domain: string): Promise<DomainCheck> {
    try {
      const ns = await dns.resolveNs(domain);
      if (ns.length > 0) return { domain, status: 'taken', verified: true, source: 'dns', note: 'Has live DNS — it is registered.' };
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOTFOUND') {
        return unknown(domain, 'dns', 'No DNS records — likely unregistered. Confirm at checkout.');
      }
    }
    return unknown(domain, 'rdap', "We couldn't verify this one right now.");
  }
}
