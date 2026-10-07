import { afterEach, describe, expect, it, vi } from 'vitest';
import { GitHubChecker, ManualChecker, RedditChecker, YouTubeChecker } from '../src/providers/social/checkers';

afterEach(() => vi.unstubAllGlobals());

describe('social checkers', () => {
  it('GitHub: 404 → available, 200 → taken, 403 → unknown', async () => {
    const statuses = [404, 200, 403];
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: statuses.shift() })));
    const gh = new GitHubChecker(1000);
    expect((await gh.check('a')).status).toBe('available');
    expect((await gh.check('b')).status).toBe('taken');
    expect((await gh.check('c')).status).toBe('unknown');
  });

  it('Reddit: parses true/false bodies', async () => {
    const bodies = ['true', 'false'];
    vi.stubGlobal('fetch', vi.fn(async () => new Response(bodies.shift(), { status: 200 })));
    const r = new RedditChecker(1000);
    expect((await r.check('x')).status).toBe('available');
    expect((await r.check('y')).status).toBe('taken');
  });

  it('YouTube Data API: items → taken, empty → available', async () => {
    const bodies = [{ items: [{ id: 'UC1' }] }, { items: [] }];
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(bodies.shift()), { status: 200 })));
    const yt = new YouTubeChecker(1000, 'key');
    expect(yt.method).toBe('official_api');
    expect((await yt.check('a')).status).toBe('taken');
    expect((await yt.check('b')).status).toBe('available');
  });

  it('platforms without a public check are "manual", never guessed', async () => {
    const r = await new ManualChecker('instagram').check();
    expect(r.status).toBe('manual');
  });
});
