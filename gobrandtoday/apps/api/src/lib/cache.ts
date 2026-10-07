/**
 * A small TTL + LRU cache with in-flight de-duplication.
 * The `CacheStore` interface lets a Redis implementation drop in later
 * (see docs/ARCHITECTURE.md) without touching the services.
 */
export interface CacheStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export class MemoryCache implements CacheStore {
  private map = new Map<string, { value: unknown; expires: number }>();
  constructor(private readonly maxEntries = 5_000) {}

  async get<T>(key: string): Promise<T | undefined> {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    // Refresh LRU position.
    this.map.delete(key);
    this.map.set(key, hit);
    return hit.value as T;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    if (this.map.size >= this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { value, expires: Date.now() + ttlMs });
  }

  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }
}

const inflight = new Map<string, Promise<unknown>>();

/** Cache-aside with request coalescing: concurrent callers share one upstream call. */
export async function cached<T>(
  store: CacheStore,
  key: string,
  ttlMs: (value: T) => number,
  load: () => Promise<T>,
): Promise<T> {
  const hit = await store.get<T>(key);
  if (hit !== undefined) return hit;
  const running = inflight.get(key);
  if (running) return running as Promise<T>;
  const p = (async () => {
    try {
      const value = await load();
      const ttl = ttlMs(value);
      if (ttl > 0) await store.set(key, value, ttl);
      return value;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

export const cache: CacheStore = new MemoryCache();
