/**
 * A tiny in-memory router for the single-file preview build. The preview runs
 * inside a sandboxed page that serves one document, so routes live in memory
 * (not in the URL) and every internal link is handled here.
 */
import { useSyncExternalStore } from 'react';

export interface RouteState {
  path: string;
  query: string;
  params: Record<string, string>;
}

let state: RouteState = { path: '/', query: '', params: {} };
const listeners = new Set<() => void>();
const history: string[] = [];

export const ROUTES = [
  '/',
  '/create',
  '/name/:name',
  '/brand/:id/guidelines',
  '/brand/:id',
  '/b/:slug',
  '/pricing',
  '/login',
  '/signup',
  '/tools/:slug',
  '/dashboard',
  '/dashboard/:section',
] as const;

export function match(path: string): { route: string; params: Record<string, string> } | null {
  for (const r of ROUTES) {
    const rp = r.split('/');
    const pp = path.split('/');
    if (rp.length !== pp.length) continue;
    const params: Record<string, string> = {};
    let ok = true;
    rp.forEach((seg, i) => {
      if (seg.startsWith(':')) params[seg.slice(1)] = decodeURIComponent(pp[i] ?? '');
      else if (seg !== pp[i]) ok = false;
    });
    if (ok) return { route: r, params };
  }
  return null;
}

export function navigate(href: string, opts: { replace?: boolean; scroll?: boolean } = {}) {
  const [pathAndQuery, hash] = href.split('#');
  const [rawPath, query = ''] = (pathAndQuery || state.path).split('?');
  const path = rawPath || state.path;
  if (!opts.replace) history.push(`${state.path}${state.query ? `?${state.query}` : ''}`);
  state = { path, query, params: match(path)?.params ?? {} };
  listeners.forEach((l) => l());
  if (hash) setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 60);
  else if (opts.scroll !== false && !opts.replace) window.scrollTo({ top: 0 });
}

export function back() {
  const prev = history.pop();
  if (prev) navigate(prev, { replace: true });
}

export function useRoute(): RouteState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

export function isInternal(href: string | null | undefined): href is string {
  return !!href && href.startsWith('/') && !href.startsWith('//');
}
