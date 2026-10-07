import type { DomainResult, DomainSource, DomainStatus } from '@gbt/shared';

export interface DomainCheck {
  domain: string;
  status: DomainStatus;
  /** True only when a registry/registrar answered definitively. */
  verified: boolean;
  /** A registrar (not only the registry) says it can be bought right now. */
  confirmed?: boolean;
  source: DomainSource;
  price?: DomainResult['price'];
  note?: string;
}

/**
 * A domain availability backend. Implementations must never guess: when the
 * upstream can't answer, return `unknown` rather than `available`.
 */
export interface DomainProvider {
  readonly id: DomainSource;
  /** False for demo/mock data. */
  readonly live: boolean;
  check(domains: string[]): Promise<DomainCheck[]>;
}

export const unknown = (domain: string, source: DomainSource, note: string): DomainCheck => ({
  domain,
  status: 'unknown',
  verified: false,
  source,
  note,
});
