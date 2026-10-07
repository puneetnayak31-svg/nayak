import { hash32, type SocialPlatformId } from '@gbt/shared';
import type { HandleCheck, SocialChecker } from './types';

/** Deterministic demo data — always labelled "Demo", never "Verified". */
export class MockChecker implements SocialChecker {
  readonly method = 'demo' as const;
  constructor(readonly platform: SocialPlatformId) {}
  async check(handle: string): Promise<HandleCheck> {
    const h = hash32(`${this.platform}:${handle}`) % 100;
    return { status: h < 45 ? 'taken' : 'available', method: this.method, note: 'Demo data — not a real check.' };
  }
}
