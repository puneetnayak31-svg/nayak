import { SOCIAL_PLATFORM_IDS, type SocialPlatformId } from '@gbt/shared';
import { env } from '../../config/env';
import { GitHubChecker, ManualChecker, RedditChecker, YouTubeChecker } from './checkers';
import { MockChecker } from './mock';
import type { SocialChecker } from './types';

export * from './types';

/**
 * Registry of per-platform checkers. To add a platform (or a licensed
 * aggregator API), implement SocialChecker and register it here.
 */
export function createSocialCheckers(): Record<SocialPlatformId, SocialChecker> {
  const out = {} as Record<SocialPlatformId, SocialChecker>;
  const demo = env.DEMO_MODE || env.SOCIAL_PROVIDER === 'mock';
  for (const p of SOCIAL_PLATFORM_IDS) out[p] = demo ? new MockChecker(p) : new ManualChecker(p);
  if (demo) return out;
  out.github = new GitHubChecker(env.SOCIAL_TIMEOUT_MS, env.GITHUB_TOKEN);
  out.reddit = new RedditChecker(env.SOCIAL_TIMEOUT_MS);
  if (env.YOUTUBE_API_KEY || env.SOCIAL_PROFILE_PROBES) out.youtube = new YouTubeChecker(env.SOCIAL_TIMEOUT_MS, env.YOUTUBE_API_KEY);
  return out;
}
