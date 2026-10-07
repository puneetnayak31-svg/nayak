import type { SocialMethod, SocialPlatformId, SocialStatus } from '@gbt/shared';

export interface HandleCheck {
  status: SocialStatus;
  method: SocialMethod;
  note?: string;
}

/**
 * One platform's availability checker. Implementations use only official
 * APIs or documented public endpoints; platforms that offer neither return
 * `manual` with a one-tap link, never a guess.
 */
export interface SocialChecker {
  readonly platform: SocialPlatformId;
  readonly method: SocialMethod;
  check(handle: string): Promise<HandleCheck>;
}
