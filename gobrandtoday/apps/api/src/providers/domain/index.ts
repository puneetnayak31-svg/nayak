import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { GoDaddyProvider } from './godaddy';
import { HostingerProvider } from './hostinger';
import { MockDomainProvider } from './mock';
import { NamecheapProvider } from './namecheap';
import { RdapProvider } from './rdap';
import type { DomainProvider } from './types';

export * from './types';

/** Build the configured provider. Missing credentials fall back to RDAP (free, keyless). */
export function createDomainProvider(): { primary: DomainProvider; fallback?: DomainProvider } {
  const rdap = new RdapProvider(env.DOMAIN_TIMEOUT_MS);
  const fallback = env.DOMAIN_FALLBACK_PROVIDER === 'rdap' ? rdap : undefined;
  if (env.DEMO_MODE || env.DOMAIN_PROVIDER === 'mock') return { primary: new MockDomainProvider() };

  switch (env.DOMAIN_PROVIDER) {
    case 'godaddy':
      if (env.GODADDY_API_KEY && env.GODADDY_API_SECRET) {
        return { primary: new GoDaddyProvider(env.GODADDY_API_KEY, env.GODADDY_API_SECRET, env.GODADDY_ENV, env.DOMAIN_TIMEOUT_MS), fallback };
      }
      break;
    case 'hostinger':
      if (env.HOSTINGER_API_TOKEN) return { primary: new HostingerProvider(env.HOSTINGER_API_TOKEN, env.DOMAIN_TIMEOUT_MS), fallback };
      break;
    case 'namecheap':
      if (env.NAMECHEAP_API_USER && env.NAMECHEAP_API_KEY && env.NAMECHEAP_CLIENT_IP) {
        return {
          primary: new NamecheapProvider(
            {
              apiUser: env.NAMECHEAP_API_USER,
              apiKey: env.NAMECHEAP_API_KEY,
              username: env.NAMECHEAP_USERNAME ?? env.NAMECHEAP_API_USER,
              clientIp: env.NAMECHEAP_CLIENT_IP,
              sandbox: env.NAMECHEAP_SANDBOX,
            },
            env.DOMAIN_TIMEOUT_MS,
          ),
          fallback,
        };
      }
      break;
    default:
      return { primary: rdap };
  }
  logger.warn(`DOMAIN_PROVIDER=${env.DOMAIN_PROVIDER} is missing credentials — using RDAP`);
  return { primary: rdap };
}
