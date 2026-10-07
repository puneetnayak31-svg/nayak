/** Small, dependency-free text helpers used by scoring, handles and generators. */

export const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/** Lowercase, ASCII letters/digits only — the canonical form for domains and handles. */
export function toSlug(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}

/** "lumora" → "Lumora", "chai stack" → "Chai Stack". */
export function displayName(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Approximate syllables: vowel groups (y counts as vowel when not leading), minus a silent final e. */
export function syllableCount(word: string): number {
  const w = toSlug(word).replace(/[0-9]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/^y/, '').match(/[aeiouy]+/g);
  let count = groups ? groups.length : 1;
  if (/[^aeiouy]e$/.test(w) && !/[^aeiouy]le$/.test(w) && count > 1) count -= 1;
  return Math.max(1, count);
}

/** Split into rough syllables for a pronunciation guide. */
export function syllables(word: string): string[] {
  const w = toSlug(word).replace(/[0-9]/g, '');
  if (!w) return [];
  const parts = w.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/g);
  if (!parts || parts.join('') !== w) return [w];
  // Merge a trailing silent "e" syllable back.
  if (parts.length > 1 && /^[^aeiouy]*e$/.test(parts[parts.length - 1]!) && !/le$/.test(w)) {
    const last = parts.pop()!;
    parts[parts.length - 1] += last;
  }
  return parts;
}

/** "lumora" → "LOO-mor-uh"-ish guide. Kept simple and honest: stress on first syllable. */
export function pronunciationGuide(word: string): string {
  const parts = syllables(word);
  if (parts.length === 0) return '';
  return parts.map((p, i) => (i === 0 ? p.toUpperCase() : p)).join('·');
}

export function vowelRatio(word: string): number {
  const w = toSlug(word).replace(/[0-9]/g, '');
  if (!w) return 0;
  let v = 0;
  for (const ch of w) if (VOWELS.has(ch) || ch === 'y') v++;
  return v / w.length;
}

export function maxConsonantRun(word: string): number {
  const w = toSlug(word);
  let max = 0;
  let run = 0;
  for (const ch of w) {
    if (/[a-z]/.test(ch) && !VOWELS.has(ch) && ch !== 'y') {
      run++;
      max = Math.max(max, run);
    } else run = 0;
  }
  return max;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length]!;
}

/** Deterministic 32-bit hash (FNV-1a) — used for seeded variety and demo data. */
export function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Seeded PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const STOPWORDS = new Set(
  (
    'a am an the and or but so if then than was were do does did not no yes our for of to in on at by with from into about as is are be been being it its this that these those ' +
    'i im i\'m we our us you your my me they them their he she his her who what which want wanna need building build ' +
    'make making create creating start starting launch company startup brand business platform app product service ' +
    'thing something name names called call new idea ideas like very really just some help helps helping people ' +
    'short tech one two word words simple good best great cool unique modern also all can will would should could ' +
    'based focused focus first type kind sort lot lots more most less around across over under via using use used'
  ).split(/\s+/),
);

/** Pull meaningful keywords out of a free-text brief. */
export function extractKeywords(text: string, max = 8): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    const base = singular(w);
    if (!seen.has(base)) {
      seen.add(base);
      out.push(base);
    }
    if (out.length >= max) break;
  }
  return out;
}

function singular(w: string): string {
  if (w.length <= 4) return w;
  if (/(ss|sh|ch|x)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1);
  return w;
}

export function clamp(n: number, lo = 0, hi = 10): number {
  return Math.min(hi, Math.max(lo, n));
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
