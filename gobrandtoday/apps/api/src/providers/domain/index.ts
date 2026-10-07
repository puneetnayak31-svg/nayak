import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { GoDaddyProvider } from './godaddy';
import { HostingerProvider } from './hostinger';
import { MockDomainProvider } from './mock';
import { NamecheapProvider } from './namecheap';
import { NameComProvider } from './namecom';
import { PorkbunProvider } from './porkbun';
import { RdapProvider } from './rdap';
import type { DomainProvider } from './types';

export * from './types';

type RegistrarId = 'porkbun' | 'namecom' | 'godaddy' | 'hostinger' | 'namecheap';

/** A registrar adapter, if its credentials are configured. */
function registrar(id: RegistrarId): DomainProvider | undefined {
  const t = env.DOMAIN_TIMEOUT_MS;
  switch (id) {
    case 'porkbun':
      return env.PORKBUN_API_KEY && env.PORKBUN_SECRET_KEY ? new PorkbunProvider(env.PORKBUN_API_KEY, env.PORKBUN_SECRET_KEY, t) : undefined;
    case 'namecom':
      return env.NAMECOM_USERNAME && env.NAMECOM_API_TOKEN ? new NameComProvider(env.NAMECOM_USERNAME, env.NAMECOM_API_TOKEN, env.NAMECOM_SANDBOX, t) : undefined;
    case 'godaddy':
      return env.GODADDY_API_KEY && env.GODADDY_API_SECRET ? new GoDaddyProvider(env.GODADDY_API_KEY, env.GODADDY_API_SECRET, env.GODADDY_ENV, t) : undefined;
    case 'hostinger':
      return env.HOSTINGER_API_TOKEN ? new HostingerProvider(env.HOSTINGER_API_TOKEN, t) : undefined;
    case 'namecheap':
      return env.NAMECHEAP_API_USER && env.NAMECHEAP_API_KEY && env.NAMECHEAP_CLIENT_IP
        ? new NamecheapProvider(
            {
              apiUser: env.NAMECHEAP_API_USER,
              apiKey: env.NAMECHEAP_API_KEY,
              username: env.NAMECHEAP_USERNAME ?? env.NAMECHEAP_API_USER,
              clientIp: env.NAMECHEAP_CLIENT_IP,
              sandbox: env.NAMECHEAP_SANDBOX,
            },
            t,
          )
        : undefined;
  }
}

const CONFIRM_ORDER: RegistrarId[] = ['namecom', 'porkbun', 'godaddy', 'namecheap', 'hostinger'];

/**
 * Build the configured chain:
 *  - primary: answers every lookup (RDAP by default: free, keyless, authoritative)
 *  - fallback: fills gaps when the primary can't answer
 *  - confirm: a registrar that re-checks "available" answers so we only call
 *    something available when it can actually be bought, with its real price.
 */
export function createDomainProvider(): { primary: DomainProvider; fallback?: DomainProvider; confirm?: DomainProvider } {
  const rdap = new RdapProvider(env.DOMAIN_TIMEOUT_MS);
  const fallback = env.DOMAIN_FALLBACK_PROVIDER === 'rdap' ? rdap : undefined;
  if (env.DEMO_MODE || env.DOMAIN_PROVIDER === 'mock') return { primary: new MockDomainProvider() };

  let primary: DomainProvider = rdap;
  if (env.DOMAIN_PROVIDER !== 'rdap') {
    const p = registrar(env.DOMAIN_PROVIDER);
    if (p) primary = p;
    else logger.warn(`DOMAIN_PROVIDER=${env.DOMAIN_PROVIDER} is missing credentials — using RDAP`);
  }

  let confirm: DomainProvider | undefined;
  if (env.DOMAIN_CONFIRM_PROVIDER === 'auto') {
    for (const id of CONFIRM_ORDER) {
      if (id === primary.id) continue;
      confirm = registrar(id);
      if (confirm) break;
    }
  } else if (env.DOMAIN_CONFIRM_PROVIDER !== 'none') {
    confirm = registrar(env.DOMAIN_CONFIRM_PROVIDER);
    if (!confirm) logger.warn(`DOMAIN_CONFIRM_PROVIDER=${env.DOMAIN_CONFIRM_PROVIDER} is missing credentials — skipping registrar confirmation`);
  }
  // A registrar primary already confirms its own answers.
  if (primary !== rdap) confirm = undefined;

  return { primary, fallback: primary === rdap ? undefined : fallback, confirm };
}
