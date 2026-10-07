import type { SocialPlatformId } from '@gbt/shared';
import { httpFetch } from '../../lib/http';
import type { HandleCheck, SocialChecker } from './types';

const unknown = (method: HandleCheck['method'], note: string): HandleCheck => ({ status: 'unknown', method, note });

/** GitHub REST API — GET /users/{username}: 404 means no user or organisation has it. */
export class GitHubChecker implements SocialChecker {
  readonly platform = 'github' as const;
  readonly method = 'official_api' as const;
  constructor(
    private readonly timeoutMs: number,
    private readonly token?: string,
  ) {}
  async check(handle: string): Promise<HandleCheck> {
    const res = await httpFetch(`https://api.github.com/users/${encodeURIComponent(handle)}`, {
      timeoutMs: this.timeoutMs,
      retries: 1,
      headers: {
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
      },
    });
    if (res.status === 404) return { status: 'available', method: this.method };
    if (res.ok) return { status: 'taken', method: this.method };
    if (res.status === 403 || res.status === 429) return unknown(this.method, 'GitHub rate limit reached — add GITHUB_TOKEN for more checks.');
    return unknown(this.method, `GitHub returned ${res.status}.`);
  }
}

/** Reddit's documented username_available endpoint — returns true/false. */
export class RedditChecker implements SocialChecker {
  readonly platform = 'reddit' as const;
  readonly method = 'public_endpoint' as const;
  constructor(private readonly timeoutMs: number) {}
  async check(handle: string): Promise<HandleCheck> {
    const res = await httpFetch(`https://www.reddit.com/api/username_available.json?user=${encodeURIComponent(handle)}`, {
      timeoutMs: this.timeoutMs,
      retries: 1,
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return unknown(this.method, `Reddit returned ${res.status}.`);
    const body = (await res.text()).trim();
    if (body === 'true') return { status: 'available', method: this.method };
    if (body === 'false') return { status: 'taken', method: this.method, note: 'Taken or reserved.' };
    return unknown(this.method, 'Unexpected response from Reddit.');
  }
}

/**
 * YouTube handles. With YOUTUBE_API_KEY we use the Data API
 * (channels?forHandle=@handle). Without it, an optional single HTTP probe of
 * the public handle URL (404 = no channel). Either way, "available" means no
 * channel uses the handle today — YouTube may still reserve some handles.
 */
export class YouTubeChecker implements SocialChecker {
  readonly platform = 'youtube' as const;
  readonly method;
  constructor(
    private readonly timeoutMs: number,
    private readonly apiKey?: string,
  ) {
    this.method = apiKey ? ('official_api' as const) : ('profile_probe' as const);
  }
  async check(handle: string): Promise<HandleCheck> {
    if (this.apiKey) {
      const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(`@${handle}`)}&key=${this.apiKey}`;
      const res = await httpFetch(url, { timeoutMs: this.timeoutMs, retries: 1 });
      if (!res.ok) return unknown(this.method, `YouTube API returned ${res.status}.`);
      const body = (await res.json()) as { items?: unknown[] };
      return body.items && body.items.length > 0
        ? { status: 'taken', method: this.method }
        : { status: 'available', method: this.method, note: 'No channel uses this handle. YouTube confirms when you claim it.' };
    }
    const res = await httpFetch(`https://www.youtube.com/@${encodeURIComponent(handle)}`, {
      method: 'HEAD',
      timeoutMs: this.timeoutMs,
      retries: 0,
      redirect: 'manual',
    });
    if (res.status === 404) return { status: 'available', method: this.method, note: 'No public channel at this handle. YouTube confirms when you claim it.' };
    if (res.status === 200) return { status: 'taken', method: this.method };
    return unknown(this.method, 'YouTube did not give a clear answer.');
  }
}

const MANUAL_NOTES: Partial<Record<SocialPlatformId, string>> = {
  instagram: "Instagram doesn't offer a public availability check. Tap to look — it takes two seconds.",
  threads: 'Threads uses your Instagram username. Tap to look.',
  x: "X's API doesn't offer a free availability check. Tap to look.",
  tiktok: "TikTok doesn't offer a public availability check. Tap to look.",
  linkedin: 'LinkedIn page URLs can only be checked when you create the page. Tap to look.',
  facebook: "Facebook doesn't offer a public availability check. Tap to look.",
  pinterest: "Pinterest doesn't offer a public availability check. Tap to look.",
};

/** For platforms without a compliant check: a clear "check it yourself" result. */
export class ManualChecker implements SocialChecker {
  readonly method = 'manual' as const;
  constructor(readonly platform: SocialPlatformId) {}
  async check(): Promise<HandleCheck> {
    return { status: 'manual', method: this.method, note: MANUAL_NOTES[this.platform] ?? 'Tap to check on the platform.' };
  }
}
