import type { Currency } from './pricing';
import type { DomainResult, SocialResult } from './types';

/**
 * Typical first-year and renewal prices per TLD, used only as a labelled
 * estimate ("est.") until a registrar API returns the real price. INR figures
 * follow Indian storefronts (Hostinger/GoDaddy India, ex-GST); USD figures
 * follow Namecheap/Porkbun list prices. Registry premium names can cost far
 * more, which is why a live check always wins over this table.
 */
export interface PriceBand {
  first: number;
  renewal: number;
}

export const TLD_PRICES: Record<string, { INR: PriceBand; USD: PriceBand }> = {
  com: { INR: { first: 899, renewal: 1499 }, USD: { first: 9, renewal: 15 } },
  in: { INR: { first: 499, renewal: 899 }, USD: { first: 6, renewal: 11 } },
  'co.in': { INR: { first: 449, renewal: 749 }, USD: { first: 6, renewal: 9 } },
  ai: { INR: { first: 6999, renewal: 7999 }, USD: { first: 80, renewal: 92 } },
  io: { INR: { first: 3499, renewal: 5499 }, USD: { first: 31, renewal: 61 } },
  co: { INR: { first: 999, renewal: 3499 }, USD: { first: 5, renewal: 45 } },
  app: { INR: { first: 1299, renewal: 1799 }, USD: { first: 12, renewal: 20 } },
  xyz: { INR: { first: 199, renewal: 1499 }, USD: { first: 2, renewal: 19 } },
  store: { INR: { first: 299, renewal: 4999 }, USD: { first: 3, renewal: 55 } },
  studio: { INR: { first: 999, renewal: 2999 }, USD: { first: 12, renewal: 30 } },
  net: { INR: { first: 1099, renewal: 1599 }, USD: { first: 12, renewal: 17 } },
  org: { INR: { first: 899, renewal: 1399 }, USD: { first: 8, renewal: 15 } },
  dev: { INR: { first: 1199, renewal: 1699 }, USD: { first: 12, renewal: 18 } },
};

export interface PriceEstimate {
  amount: number;
  renewal: number;
  currency: Currency;
  estimated: true;
}

export function estimatePrice(tld: string, currency: Currency): PriceEstimate | null {
  const band = TLD_PRICES[tld]?.[currency];
  return band ? { amount: band.first, renewal: band.renewal, currency, estimated: true } : null;
}

/** "₹899" / "$9" — no decimals below 100, grouping for INR. */
export function formatMoney(amount: number, currency: string): string {
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;
  const rounded = amount >= 100 || Number.isInteger(amount) ? Math.round(amount) : Math.round(amount * 100) / 100;
  return sym + rounded.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US');
}

/**
 * The price we can show for a domain: a live registrar price when one came
 * back (converted only if it is already in the viewer's currency), else the
 * labelled estimate.
 */
export function displayPrice(d: Pick<DomainResult, 'tld' | 'price' | 'status'>, currency: Currency): { label: string; renewal?: string; estimated: boolean } | null {
  if (d.status === 'taken' || d.status === 'invalid') return null;
  if (d.price && d.price.currency === currency) {
    return { label: formatMoney(d.price.amount, currency), renewal: d.price.renewal ? formatMoney(d.price.renewal, currency) : undefined, estimated: false };
  }
  if (d.price && d.price.currency !== currency) {
    // A live price in another currency is still better than a guess.
    return { label: formatMoney(d.price.amount, d.price.currency), renewal: d.price.renewal ? formatMoney(d.price.renewal, d.price.currency) : undefined, estimated: false };
  }
  const est = estimatePrice(d.tld, currency);
  return est ? { label: formatMoney(est.amount, currency), renewal: formatMoney(est.renewal, currency), estimated: true } : null;
}

/* ------------------------------------------------------------------ */
/* Core availability: .com, Instagram, X, YouTube, LinkedIn            */
/* ------------------------------------------------------------------ */

export const CORE_ITEMS = [
  { key: 'com', label: '.com', kind: 'domain' },
  { key: 'instagram', label: 'Instagram', kind: 'social' },
  { key: 'x', label: 'X', kind: 'social' },
  { key: 'youtube', label: 'YouTube', kind: 'social' },
  { key: 'linkedin', label: 'LinkedIn', kind: 'social' },
] as const;

/** free: verified available · likely: registry-free but not registrar-confirmed · taken · check: needs a manual look · pending: not run yet. */
export type CoreState = 'free' | 'likely' | 'taken' | 'check' | 'pending';

export interface CoreItem {
  key: string;
  label: string;
  state: CoreState;
  url?: string;
}

export interface CoreAvailability {
  items: CoreItem[];
  free: number;
  taken: number;
  open: number;
  /** clear: nothing taken and .com free · mostly: ≤1 taken, .com not taken · blocked: .com taken or 2+ taken · pending */
  verdict: 'clear' | 'mostly' | 'blocked' | 'pending';
  headline: string;
}

export function domainState(d: Pick<DomainResult, 'status' | 'verified' | 'source'> & { confirmed?: boolean }): CoreState {
  if (d.source === 'demo') return 'check';
  if (d.status === 'taken' || d.status === 'invalid') return 'taken';
  if (d.status === 'premium') return 'free';
  if (d.status === 'available') return d.confirmed ? 'free' : d.verified ? 'likely' : 'check';
  return 'check';
}

export function socialState(s: Pick<SocialResult, 'status' | 'verified' | 'method'>): CoreState {
  if (s.method === 'demo') return 'check';
  if (s.status === 'taken' || s.status === 'invalid') return 'taken';
  if (s.status === 'available' && s.verified) return 'free';
  return 'check';
}

export function coreAvailability(domains: DomainResult[] | undefined, socials: SocialResult[] | undefined, fallbackUrls: Partial<Record<string, string>> = {}): CoreAvailability {
  const items: CoreItem[] = CORE_ITEMS.map((item) => {
    if (item.kind === 'domain') {
      const d = domains?.find((x) => x.tld === item.key);
      if (!d) return { key: item.key, label: item.label, state: domains ? 'check' : 'pending', url: fallbackUrls[item.key] };
      return { key: item.key, label: item.label, state: domainState(d), url: d.buyLinks[0]?.url ?? fallbackUrls[item.key] };
    }
    const s = socials?.find((x) => x.platform === item.key);
    if (!s) return { key: item.key, label: item.label, state: socials ? 'check' : 'pending', url: fallbackUrls[item.key] };
    return { key: item.key, label: item.label, state: socialState(s), url: s.url };
  });
  const free = items.filter((i) => i.state === 'free' || i.state === 'likely').length;
  const taken = items.filter((i) => i.state === 'taken').length;
  const open = items.filter((i) => i.state === 'check').length;
  const pending = items.some((i) => i.state === 'pending');
  const com = items[0]!;
  let verdict: CoreAvailability['verdict'];
  if (pending && !taken) verdict = 'pending';
  else if (com.state === 'taken' || taken >= 2) verdict = 'blocked';
  else if (taken === 0 && (com.state === 'free' || com.state === 'likely')) verdict = 'clear';
  else verdict = 'mostly';
  const headline =
    verdict === 'pending'
      ? 'Checking the core five…'
      : verdict === 'clear'
        ? open
          ? `Core-ready: ${free}/5 verified free, ${open} to confirm`
          : 'Core-ready: all five are free'
        : verdict === 'mostly'
          ? `Mostly free: ${free}/5 free, ${taken} taken${open ? `, ${open} to confirm` : ''}`
          : com.state === 'taken'
            ? '.com is taken'
            : `${taken} of the core five are taken`;
  return { items, free, taken, open, verdict, headline };
}
