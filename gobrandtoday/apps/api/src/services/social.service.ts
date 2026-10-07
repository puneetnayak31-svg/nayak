import {
  SOCIAL_PLATFORM_IDS,
  handleAlternatives,
  normaliseHandle,
  profileUrl,
  validateHandle,
  type HandleSuggestion,
  type SocialPlatformId,
  type SocialResult,
} from '@gbt/shared';
import { env } from '../config/env';
import { db, schema } from '../db/client';
import { cache, cached } from '../lib/cache';
import { logger } from '../lib/logger';
import { createSocialCheckers, type HandleCheck } from '../providers/social';

const checkers = createSocialCheckers();

export const socialProviderInfo = Object.fromEntries(SOCIAL_PLATFORM_IDS.map((p) => [p, checkers[p].method])) as Record<string, string>;
export const socialLive = !(env.DEMO_MODE || env.SOCIAL_PROVIDER === 'mock');

const ttl = (c: HandleCheck) => (c.status === 'taken' ? 12 * 3600_000 : c.status === 'available' ? 15 * 60_000 : c.status === 'manual' ? 24 * 3600_000 : 0);

async function checkOne(platform: SocialPlatformId, handle: string): Promise<SocialResult> {
  const checker = checkers[platform];
  const checkedAt = new Date().toISOString();
  const valid = validateHandle(platform, handle);
  if (!valid.ok) {
    return { platform, handle, status: 'invalid', method: checker.method, verified: false, url: profileUrl(platform, handle), note: valid.reason, checkedAt };
  }
  let r: HandleCheck;
  try {
    r = await cached(cache, `social:${platform}:${handle}`, ttl, () => checker.check(handle));
  } catch (err) {
    logger.debug({ platform, handle, err: (err as Error).message }, 'social check failed');
    r = { status: 'unknown', method: checker.method, note: "We couldn't verify this handle right now." };
  }
  const verified = (r.status === 'available' || r.status === 'taken') && r.method !== 'demo';
  return { platform, handle, status: r.status, method: r.method, verified, url: profileUrl(platform, handle), note: r.note, checkedAt };
}

export async function checkHandle(rawHandle: string, platforms: SocialPlatformId[] = SOCIAL_PLATFORM_IDS): Promise<SocialResult[]> {
  const handle = normaliseHandle(rawHandle);
  const results = await Promise.all(platforms.map((p) => checkOne(p, handle)));
  db.insert(schema.socialHandleChecks)
    .values(results.filter((r) => r.status !== 'manual').map((r) => ({ platform: r.platform, handle: r.handle, status: r.status, method: r.method, verified: r.verified, note: r.note ?? null })))
    .catch(() => undefined);
  return results;
}

/**
 * Alternatives for a taken handle. Each suggestion is verified on whichever
 * platforms support automatic checks; everything else stays a "suggestion".
 */
export async function alternatives(name: string, region: 'IN' | 'US', max = 6): Promise<HandleSuggestion[]> {
  const verifiable = SOCIAL_PLATFORM_IDS.filter((p) => checkers[p].method !== 'manual');
  const list = handleAlternatives(name, { region, max });
  return Promise.all(
    list.map(async (handle) => {
      const results = await Promise.all(verifiable.filter((p) => validateHandle(p, handle).ok).map((p) => checkOne(p, handle)));
      return {
        handle,
        verifiedOn: results.filter((r) => r.status === 'available' && r.verified).map((r) => r.platform),
        suggestion: true,
      };
    }),
  );
}
