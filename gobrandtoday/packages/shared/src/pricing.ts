/**
 * India-first pricing. Exactly two currencies: INR (default) and USD.
 * Prices are set per currency (not FX-converted) so each market sees a
 * round, local-feeling number.
 */
export const CURRENCIES = ['INR', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

export type PlanId = 'free' | 'pro' | 'studio';

export interface PlanLimits {
  /** Name-generation rounds per day. */
  generationsPerDay: number;
  domainChecksPerDay: number;
  socialChecksPerDay: number;
  brandKits: number;
  assistantMessagesPerDay: number;
  exports: boolean;
  domainFirst: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  price: Record<Currency, number>;
  /** Shown under the price. */
  period: string;
  features: string[];
  soon?: string[];
  limits: PlanLimits;
  highlight?: boolean;
  cta: string;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Spark',
    tagline: 'Find a name you love.',
    price: { INR: 0, USD: 0 },
    period: 'free forever',
    features: [
      '5 naming rounds a day',
      'Domain checks across .com, .in, .ai and more',
      'Handle checks on 10 platforms',
      'GoBrand Score with full breakdown',
      '1 Brand in a Box',
    ],
    limits: {
      generationsPerDay: 5,
      domainChecksPerDay: 40,
      socialChecksPerDay: 20,
      brandKits: 1,
      assistantMessagesPerDay: 5,
      exports: true,
      domainFirst: true,
    },
    cta: 'Start free',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Turn your name into a brand.',
    price: { INR: 499, USD: 9 },
    period: 'per month',
    features: [
      'Unlimited naming rounds (fair use)',
      'Domain-First search — only names you can register',
      'Full Brand Bible, launch kit and website copy',
      'AI Brand Assistant',
      'PDF, PNG, SVG, JSON and Markdown exports',
      '10 brands',
    ],
    limits: {
      generationsPerDay: 200,
      domainChecksPerDay: 1000,
      socialChecksPerDay: 400,
      brandKits: 10,
      assistantMessagesPerDay: 200,
      exports: true,
      domainFirst: true,
    },
    highlight: true,
    cta: 'Go Pro',
  },
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'For agencies and serial founders.',
    price: { INR: 1999, USD: 29 },
    period: 'per month',
    features: ['Everything in Pro', 'Unlimited brands and client projects', 'Priority checks', 'Brand approvals and comments'],
    soon: ['Team seats', 'Domain and handle monitoring', 'API access'],
    limits: {
      generationsPerDay: 1000,
      domainChecksPerDay: 5000,
      socialChecksPerDay: 2000,
      brandKits: 1000,
      assistantMessagesPerDay: 1000,
      exports: true,
      domainFirst: true,
    },
    cta: 'Talk to us',
  },
];

export function planById(id: string | null | undefined): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]!;
}

export function formatPrice(amount: number, currency: Currency): string {
  if (amount === 0) return currency === 'INR' ? '₹0' : '$0';
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function regionForCurrency(currency: Currency): 'IN' | 'US' {
  return currency === 'INR' ? 'IN' : 'US';
}
