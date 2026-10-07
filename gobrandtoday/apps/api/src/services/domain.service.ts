import { buyLinks, toSlug, type DomainResult } from '@gbt/shared';
import { env } from '../config/env';
import { db, schema } from '../db/client';
import { cache, cached } from '../lib/cache';
import { logger } from '../lib/logger';
import { createDomainProvider, type DomainCheck } from '../providers/domain';

const { primary, fallback } = createDomainProvider();
export const domainProviderInfo = { id: primary.id, live: primary.live, fallback: fallback?.id ?? null };

const AFFILIATES: Record<string, string> = Object.fromEntries(
  [
    ['hostinger', env.AFFILIATE_HOSTINGER],
    ['godaddy', env.AFFILIATE_GODADDY],
    ['namecheap', env.AFFILIATE_NAMECHEAP],
  ].filter(([, v]) => !!v) as Array<[string, string]>,
);

/** A valid DNS label: letters, digits, inner hyphens, 1–63 chars. */
export function domainLabel(name: string): string | null {
  const label = toSlug(name);
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label) ? label : null;
}

/**
 * Cache policy: "taken" changes rarely (24h); "available" can disappear any
 * minute (20 min); "unknown" is never cached so a retry really retries.
 */
const ttl = (c: DomainCheck) => (c.status === 'taken' ? 24 * 3600_000 : c.status === 'unknown' ? 0 : 20 * 60_000);

async function checkWithFallback(domains: string[]): Promise<DomainCheck[]> {
  try {
    const out = await primary.check(domains);
    // Fill gaps from the fallback (e.g. a registrar that doesn't sell a TLD).
    if (fallback && fallback !== primary) {
      const gaps = out.filter((c) => c.status === 'unknown').map((c) => c.domain);
      if (gaps.length) {
        const filled = await fallback.check(gaps).catch(() => []);
        return out.map((c) => filled.find((f) => f.domain === c.domain && f.status !== 'unknown') ?? c);
      }
    }
    return out;
  } catch (err) {
    logger.warn({ provider: primary.id, err: (err as Error).message }, 'domain provider failed');
    if (fallback && fallback !== primary) return fallback.check(domains);
    return domains.map((domain) => ({ domain, status: 'unknown' as const, verified: false, source: primary.id, note: "We couldn't verify this one right now." }));
  }
}

export async function checkDomains(name: string, tlds: string[], region: 'IN' | 'US'): Promise<DomainResult[]> {
  const label = domainLabel(name);
  const now = new Date().toISOString();
  if (!label) {
    return tlds.map((tld) => ({
      domain: `${toSlug(name)}.${tld}`,
      tld,
      status: 'invalid' as const,
      source: primary.id,
      verified: false,
      note: 'Not a valid domain name (letters, numbers and hyphens only).',
      checkedAt: now,
      buyLinks: [],
    }));
  }
  const domains = [...new Set(tlds)].map((tld) => `${label}.${tld}`);
  const results = await Promise.all(
    domains.map((d) => cached(cache, `domain:${primary.id}:${d}`, ttl, async () => (await checkWithFallback([d]))[0]!)),
  );

  // Persist the verification log (fire-and-forget; never blocks the response).
  db.insert(schema.domainChecks)
    .values(results.map((r) => ({ domain: r.domain, tld: r.domain.slice(label.length + 1), status: r.status, source: r.source, verified: r.verified, price: r.price ?? null, note: r.note ?? null })))
    .catch((err) => logger.warn({ err: err.message }, 'domain check log failed'));

  return results.map((r) => {
    const tld = r.domain.slice(label.length + 1);
    return {
      domain: r.domain,
      tld,
      status: r.status,
      source: r.source,
      verified: r.verified,
      price: r.price,
      note: r.note,
      checkedAt: now,
      buyLinks: r.status === 'available' || r.status === 'premium' || r.status === 'unknown' ? buyLinks(r.domain, region, AFFILIATES) : [],
    };
  });
}

/** Clear cached results so "Recheck" hits the registry again. */
export async function forgetDomains(name: string, tlds: string[]) {
  const label = domainLabel(name);
  if (!label) return;
  await Promise.all(tlds.map((t) => cache.delete(`domain:${primary.id}:${label}.${t}`)));
}
