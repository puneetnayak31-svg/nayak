/**
 * Browser → our own origin only (/api is proxied to the API service).
 * Adds the CSRF header and the visitor's currency, and normalises errors.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

function currency(): string {
  try {
    return localStorage.getItem('gbt:currency') === 'USD' ? 'USD' : 'INR';
  } catch {
    return 'INR';
  }
}

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const method = opts.method ?? (opts.body !== undefined ? 'POST' : 'GET');
  const res = await fetch(path, {
    method,
    credentials: 'include',
    signal: opts.signal,
    headers: {
      ...(method !== 'GET' ? { 'content-type': 'application/json', 'x-gbt-csrf': '1' } : {}),
      'x-gbt-currency': currency(),
    },
    body: method !== 'GET' ? JSON.stringify(opts.body ?? {}) : undefined,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } })?.error;
    throw new ApiError(res.status, err?.code ?? 'error', err?.message ?? (res.status >= 500 ? 'Our servers are having a moment. Please try again.' : 'Something went wrong.'));
  }
  return data as T;
}

export function track(name: string, props?: Record<string, string | number | boolean>) {
  api('/api/events', { body: { name, props } }).catch(() => undefined);
}
