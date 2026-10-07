import type { BuyLink } from './types';

/**
 * Registrar search/checkout deep links. Region decides the storefront (India
 * shows INR prices). Affiliate parameters are appended from configuration so
 * referral programmes can be enabled without code changes.
 */
export interface RegistrarConfig {
  id: string;
  label: string;
  url: Record<'IN' | 'US', string>;
}

export const REGISTRARS: RegistrarConfig[] = [
  {
    id: 'hostinger',
    label: 'Hostinger',
    url: {
      IN: 'https://www.hostinger.com/in/domain-name-search?domain={domain}',
      US: 'https://www.hostinger.com/domain-name-search?domain={domain}',
    },
  },
  {
    id: 'godaddy',
    label: 'GoDaddy',
    url: {
      IN: 'https://www.godaddy.com/en-in/domainsearch/find?domainToCheck={domain}',
      US: 'https://www.godaddy.com/domainsearch/find?domainToCheck={domain}',
    },
  },
  {
    id: 'namecheap',
    label: 'Namecheap',
    url: {
      IN: 'https://www.namecheap.com/domains/registration/results/?domain={domain}',
      US: 'https://www.namecheap.com/domains/registration/results/?domain={domain}',
    },
  },
];

export function buyLinks(
  domain: string,
  region: 'IN' | 'US' = 'IN',
  affiliates: Record<string, string> = {},
): BuyLink[] {
  return REGISTRARS.map((r) => {
    let url = r.url[region].replace('{domain}', encodeURIComponent(domain));
    const extra = affiliates[r.id];
    if (extra) url += (url.includes('?') ? '&' : '?') + extra.replace(/^[?&]/, '');
    return { registrar: r.id, label: r.label, url };
  });
}
