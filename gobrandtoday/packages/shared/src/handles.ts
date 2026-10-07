import type { SocialPlatformId } from './options';
import { toSlug } from './text';

/**
 * Username rules per platform (public documentation as of 2026).
 * Used to reject impossible handles before we spend a network call.
 */
export const HANDLE_RULES: Record<SocialPlatformId, { min: number; max: number; pattern: RegExp; hint: string }> = {
  instagram: { min: 1, max: 30, pattern: /^[a-z0-9._]+$/, hint: 'letters, numbers, periods and underscores, up to 30' },
  threads: { min: 1, max: 30, pattern: /^[a-z0-9._]+$/, hint: 'same as Instagram, up to 30' },
  x: { min: 4, max: 15, pattern: /^[a-z0-9_]+$/, hint: 'letters, numbers and underscores, 4–15' },
  tiktok: { min: 2, max: 24, pattern: /^[a-z0-9._]+$/, hint: 'letters, numbers, periods and underscores, 2–24' },
  youtube: { min: 3, max: 30, pattern: /^[a-z0-9._-]+$/, hint: 'letters, numbers, periods, dashes and underscores, 3–30' },
  linkedin: { min: 3, max: 100, pattern: /^[a-z0-9-]+$/, hint: 'letters, numbers and dashes' },
  facebook: { min: 5, max: 50, pattern: /^[a-z0-9.]+$/, hint: 'letters, numbers and periods, at least 5' },
  pinterest: { min: 3, max: 30, pattern: /^[a-z0-9_]+$/, hint: 'letters, numbers and underscores, 3–30' },
  reddit: { min: 3, max: 20, pattern: /^[a-z0-9_-]+$/, hint: 'letters, numbers, dashes and underscores, 3–20' },
  github: { min: 1, max: 39, pattern: /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*$/, hint: 'letters, numbers and single dashes, up to 39' },
};

/** Normalise user input ("@Chai Stack!") into a handle candidate ("chaistack"). */
export function normaliseHandle(input: string): string {
  const raw = input.trim().replace(/^@+/, '').toLowerCase();
  // Keep the separators platforms allow; collapse everything else.
  const cleaned = raw.replace(/[^a-z0-9._-]+/g, '');
  return cleaned || toSlug(input);
}

export function validateHandle(platform: SocialPlatformId, handle: string): { ok: true } | { ok: false; reason: string } {
  const rule = HANDLE_RULES[platform];
  if (handle.length < rule.min || handle.length > rule.max || !rule.pattern.test(handle)) {
    return { ok: false, reason: `Not a valid ${platform} username (${rule.hint}).` };
  }
  return { ok: true };
}

/**
 * Close alternatives when the exact handle is taken.
 * These are SUGGESTIONS — the UI must only call them available once verified.
 */
export function handleAlternatives(name: string, opts: { region?: 'IN' | 'US'; max?: number } = {}): string[] {
  const base = toSlug(name);
  if (!base) return [];
  const candidates = [
    `get${base}`,
    `${base}hq`,
    `try${base}`,
    `${base}app`,
    `use${base}`,
    `${base}official`,
    `join${base}`,
    opts.region === 'US' ? `${base}co` : `${base}india`,
    `${base}.co`,
    `${base}_`,
    `the${base}`,
    `${base}studio`,
  ];
  const seen = new Set<string>([base]);
  const out: string[] = [];
  for (const c of candidates) {
    if (!seen.has(c) && c.length <= 30) {
      seen.add(c);
      out.push(c);
    }
  }
  return out.slice(0, opts.max ?? 8);
}
