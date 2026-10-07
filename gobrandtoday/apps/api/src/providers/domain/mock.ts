import { hash32 } from '@gbt/shared';
import type { DomainCheck, DomainProvider } from './types';

/**
 * Deterministic fake data for development and demos. Always `verified: false`
 * and `source: 'demo'`, so the UI labels it "Demo" and never "Verified".
 */
export class MockDomainProvider implements DomainProvider {
  readonly id = 'demo' as const;
  readonly live = false;
  async check(domains: string[]): Promise<DomainCheck[]> {
    return domains.map((domain) => {
      const h = hash32(domain) % 100;
      const tld = domain.split('.').slice(1).join('.');
      const takenBias = tld === 'com' ? 55 : tld === 'ai' ? 40 : 25;
      const status = h < takenBias ? 'taken' : h < takenBias + 6 ? 'premium' : 'available';
      return { domain, status, verified: false, source: 'demo', note: 'Demo data — not a real availability check.' };
    });
  }
}
