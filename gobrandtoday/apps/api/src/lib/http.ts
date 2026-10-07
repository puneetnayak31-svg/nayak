/**
 * fetch with a hard timeout and bounded retries for idempotent requests.
 * Every third-party call in the codebase goes through here.
 */
export interface HttpOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  /** Retry on these statuses (default: 429, 502, 503, 504). */
  retryOn?: number[];
}

export class HttpTimeoutError extends Error {
  constructor(url: string) {
    super(`Request to ${new URL(url).host} timed out`);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function httpFetch(url: string, opts: HttpOptions = {}): Promise<Response> {
  const { timeoutMs = 6_000, retries = 1, retryOn = [429, 502, 503, 504], ...init } = opts;
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= retries) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        signal: ctrl.signal,
        headers: { 'user-agent': 'GoBrandToday/1.0 (+https://gobrandtoday.com)', ...(init.headers ?? {}) },
      });
      if (retryOn.includes(res.status) && attempt < retries) {
        const retryAfter = Number(res.headers.get('retry-after'));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 3_000) : 300 * 2 ** attempt);
        attempt++;
        continue;
      }
      return res;
    } catch (err) {
      lastError = (err as Error).name === 'AbortError' ? new HttpTimeoutError(url) : err;
      if (attempt >= retries) break;
      await sleep(300 * 2 ** attempt);
      attempt++;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError ?? new Error(`Request to ${url} failed`);
}

/** Run async tasks with a concurrency cap (keeps us polite to upstream APIs). */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]!, i);
    }
  });
  await Promise.all(workers);
  return out;
}
