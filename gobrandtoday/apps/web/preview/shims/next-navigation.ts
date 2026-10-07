import { useMemo } from 'react';
import { back, navigate, useRoute } from '../router';

export function useRouter() {
  return useMemo(
    () => ({
      push: (href: string, opts?: { scroll?: boolean }) => navigate(href, opts),
      replace: (href: string, opts?: { scroll?: boolean }) => navigate(href, { ...opts, replace: true }),
      back,
      forward: () => undefined,
      refresh: () => undefined,
      prefetch: () => undefined,
    }),
    [],
  );
}

export function usePathname(): string {
  return useRoute().path;
}

export function useSearchParams(): URLSearchParams {
  const { query } = useRoute();
  return useMemo(() => new URLSearchParams(query), [query]);
}

export function useParams<T extends Record<string, string>>(): T {
  return useRoute().params as T;
}

export class NotFoundError extends Error {}
export function notFound(): never {
  throw new NotFoundError('not found');
}
export function redirect(href: string): never {
  navigate(href, { replace: true });
  throw new NotFoundError('redirect');
}
