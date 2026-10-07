/**
 * GoBrand Score™ — a transparent, deterministic scoring engine.
 *
 * Every component is 0–10 and comes with a plain-English note. Domain and
 * social components stay `null` (pending) until real checks have run; the
 * overall score is then re-weighted without them and marked provisional.
 *
 * The score is guidance, not a guarantee: it does not predict search
 * rankings, trademark clearance or commercial success.
 */
import type { DomainResult, GoBrandScore, RiskFlag, ScoreComponent, ScoreKey, SocialResult } from './types';
import {
  clamp,
  extractKeywords,
  levenshtein,
  maxConsonantRun,
  round1,
  syllableCount,
  toSlug,
  vowelRatio,
} from './text';
import { COMMON_WORDS, EVOCATIVE_WORDS, FAMOUS_BRANDS, GENERIC_AFFIXES, RISKY_WORDS } from './lexicon';

export const SCORE_VERSION = '1.0';
export const CALIBRATION_EXPONENT = 1.5;

export const SCORE_WEIGHTS: Record<ScoreKey, number> = {
  brandability: 18,
  memorability: 15,
  pronunciation: 13,
  distinctiveness: 12,
  global: 9,
  seo: 11,
  domain: 13,
  social: 9,
};

export const SCORE_LABELS: Record<ScoreKey, string> = {
  brandability: 'Brandability',
  memorability: 'Memorability',
  pronunciation: 'Pronunciation',
  distinctiveness: 'Distinctiveness',
  global: 'Global usability',
  seo: 'SEO potential',
  domain: 'Domain availability',
  social: 'Social availability',
};

const HARD_BIGRAMS = ['xq', 'qz', 'jj', 'vv', 'wq', 'kc', 'qx', 'zx', 'xz', 'jq', 'vq', 'fq', 'hx', 'gq', 'pq', 'qq'];

export interface ScoreInput {
  name: string;
  /** Brief text — used for keyword relevance and SEO semantics. */
  brief?: string;
  /** 0–10 relevance judged by the AI (falls back to keyword overlap). */
  relevance?: number;
  domains?: DomainResult[];
  socials?: SocialResult[];
  /** TLDs the user prefers — an available preferred TLD counts more. */
  preferredTlds?: string[];
}

/* -------------------------------- components -------------------------------- */

export function lengthScore(slug: string): number {
  const n = slug.length;
  const table: Record<number, number> = { 3: 8, 4: 10, 5: 10, 6: 10, 7: 9.6, 8: 9, 9: 8, 10: 6.8, 11: 5.8, 12: 5 };
  return table[n] ?? (n < 3 ? 5 : clamp(5 - (n - 12) * 0.6, 1.5));
}

export function pronunciationScore(slug: string): { value: number; note: string } {
  let s = 10;
  const notes: string[] = [];
  const letters = slug.replace(/[0-9]/g, '');
  if (/[0-9]/.test(slug)) {
    s -= 2;
    notes.push('digits make it harder to say aloud');
  }
  const run = maxConsonantRun(letters);
  if (run > 2) {
    s -= 1.5 * (run - 2);
    notes.push(`${run} consonants in a row`);
  }
  const vr = vowelRatio(letters);
  if (vr < 0.28) {
    s -= (0.28 - vr) * 12;
    notes.push('few vowels');
  } else if (vr > 0.65) {
    s -= (vr - 0.65) * 8;
    notes.push('vowel-heavy');
  }
  for (const bg of HARD_BIGRAMS) if (letters.includes(bg)) s -= 1.5;
  if (/q(?!u)/.test(letters)) {
    s -= 1.2;
    notes.push('"q" without "u"');
  }
  if (/(.)\1\1/.test(letters)) s -= 2;
  const digraphs = letters.match(/ee|oo|ai|ia|ea|ou|au|ei|ie|ue|ui|oa|eo/g) ?? [];
  if (digraphs.length > 1) {
    s -= 0.8 * (digraphs.length - 1);
    notes.push('several vowel pairs');
  }
  if (/yi|iy|uu|ii|yy|wu/.test(letters)) {
    s -= 1.4;
    notes.push('awkward vowel pair');
  }
  if (/[aeiou]{3}/.test(letters)) {
    s -= 1.2;
    notes.push('three vowels in a row');
  }
  if (/[^aeiouy]{2}$/.test(letters) && !/(nd|nt|rt|st|rk|ng|sk|ft|ct|lt|ck|ss|ll|rd|rn|rm|ks|ns|ts|ps|rs|ls|ms|ds|ny|ly|ry)$/.test(letters)) {
    s -= 0.8;
    notes.push('awkward ending');
  }
  if (syllableCount(letters) > 4) {
    s -= 1.2;
    notes.push('long to say');
  }
  const value = round1(clamp(s, 1));
  return { value, note: notes.length ? `Watch: ${notes.join(', ')}.` : 'Rolls off the tongue — clear syllables, natural rhythm.' };
}

export function spellingScore(slug: string): { value: number; note: string } {
  let s = 10;
  const notes: string[] = [];
  const rules: Array<[RegExp, number, string]> = [
    [/ph/, 0.8, '"ph" can be heard as "f"'],
    [/gh/, 0.8, 'silent "gh"'],
    [/ck/, 0.4, '"ck" vs "k"'],
    [/ough|augh/, 1.5, '"ough" spellings vary'],
    [/(ei|ie)/, 0.5, '"ei/ie" are often swapped'],
    [/([a-z])\1/, 0.6, 'double letter'],
    [/c[ei]/, 0.4, 'soft "c" sounds like "s"'],
    [/^k[rlw]|kw/, 0.8, 'creative "k" spelling'],
    [/z$/, 0.5, '"z" for "s" ending'],
    [/[aeiou]y[aeiou]/, 0.4, '"y" between vowels'],
    [/x/, 0.3, '"x" is spelled many ways'],
    [/[0-9]/, 2, 'contains digits'],
    [/ee|oo|ai|ay|ea/, 0.4, 'vowel pairs can be spelled several ways'],
    [/k/, 0.2, '"k" vs "c"'],
    [/y[^aeiou]|[^aeiou]y[^aeiou]/, 0.3, '"y" used as a vowel'],
  ];
  for (const [re, penalty, why] of rules) {
    if (re.test(slug)) {
      s -= penalty;
      notes.push(why);
    }
  }
  if (slug.length > 9) s -= (slug.length - 9) * 0.45;
  return { value: round1(clamp(s, 1)), note: notes.length ? `Possible misspellings: ${notes.slice(0, 2).join('; ')}.` : 'Spelled the way it sounds.' };
}

export function memorabilityScore(slug: string): { value: number; note: string } {
  const syl = syllableCount(slug);
  const bySyl: Record<number, number> = { 1: 8.8, 2: 9.6, 3: 8.4, 4: 6.5 };
  let s = bySyl[syl] ?? 5;
  const notes: string[] = [];
  if (EVOCATIVE_WORDS.has(slug) || COMMON_WORDS.has(slug)) {
    s += 0.6;
    notes.push('a word people already know');
  }
  // Rhythm: repeated syllable onsets (e.g. "kitkat", "papaya") or alliteration help recall.
  if (/^(.{2,3}).*\1/.test(slug) || /^([^aeiou])[aeiou]+\1/.test(slug)) {
    s += 0.5;
    notes.push('repetition aids recall');
  }
  s = s * 0.6 + lengthScore(slug) * 0.4;
  const value = round1(clamp(s, 1));
  const note = notes.length
    ? `${syl} syllable${syl === 1 ? '' : 's'}; ${notes.join(', ')}.`
    : `${syl} syllable${syl === 1 ? '' : 's'}, ${slug.length} letters — ${value >= 8.5 ? 'easy to remember after one hear.' : 'may need a second look to stick.'}`;
  return { value, note };
}

export function distinctivenessScore(slug: string, briefKeywords: string[] = []): { value: number; note: string } {
  let s = 8.6;
  const notes: string[] = [];
  if (EVOCATIVE_WORDS.has(slug)) {
    s -= 1.6;
    notes.push('a real word — memorable, but shared with others');
  }
  if (COMMON_WORDS.has(slug)) {
    s -= 3.2;
    notes.push('a common dictionary word — crowded to own');
  }
  for (const suf of GENERIC_AFFIXES.suffixes) {
    if (slug.length > suf.length + 2 && slug.endsWith(suf)) {
      s -= 1.2;
      notes.push(`"-${suf}" is a common startup suffix`);
      break;
    }
  }
  for (const pre of GENERIC_AFFIXES.prefixes) {
    if (pre.length >= 2 && slug.length > pre.length + 3 && slug.startsWith(pre) && COMMON_WORDS.has(slug.slice(pre.length))) {
      s -= 1;
      notes.push(`"${pre}-" prefix feels generic`);
      break;
    }
  }
  const literal = briefKeywords.filter((k) => k.length > 3 && slug.includes(k));
  if (literal.length > 0) {
    s -= 0.8 * literal.length;
    notes.push('describes the category literally');
  }
  // Compound of two common words, e.g. "cloudbank" — clear but less ownable.
  for (let i = 3; i <= slug.length - 3; i++) {
    if (COMMON_WORDS.has(slug.slice(0, i)) && COMMON_WORDS.has(slug.slice(i))) {
      s -= 1.2;
      notes.push('two everyday words joined');
      break;
    }
  }
  if (!COMMON_WORDS.has(slug) && !EVOCATIVE_WORDS.has(slug) && literal.length === 0 && notes.length === 0) {
    s += 0.5;
  }
  return { value: round1(clamp(s, 1)), note: notes.length ? `${capitalise(notes[0]!)}.` : 'Ownable — stands apart from its category.' };
}

export function relevanceScore(slug: string, briefKeywords: string[]): number {
  if (briefKeywords.length === 0) return 6.5;
  let best = 0;
  for (const k of briefKeywords) {
    if (k.length < 3) continue;
    if (slug.includes(k)) best = Math.max(best, 9);
    else if (slug.includes(k.slice(0, 4))) best = Math.max(best, 7.5);
    else if (slug.includes(k.slice(0, 3))) best = Math.max(best, 6.5);
  }
  return best || 5.5;
}

export function globalScore(slug: string, risks: RiskFlag[]): { value: number; note: string } {
  let s = 9.6;
  const notes: string[] = [];
  const high = risks.filter((r) => r.level === 'high').length;
  const warn = risks.filter((r) => r.level === 'warn' && /means|reads|sounds/.test(r.message)).length;
  s -= high * 4 + warn * 1.5;
  if (/th/.test(slug)) {
    s -= 0.5;
    notes.push('"th" is hard in many languages');
  }
  if (/w/.test(slug)) s -= 0.2;
  if (/[^aeiou]{3}/.test(slug)) s -= 0.6;
  if (/[aeiou]$/.test(slug)) s += 0.3;
  if (slug.length > 10) s -= 0.6;
  const value = round1(clamp(s, 0.5));
  return {
    value,
    note: high ? 'Has an unfortunate meaning in another language — see risks.' : notes[0] ? `${capitalise(notes[0])}.` : 'Travels well — easy to say across Hindi, English and European languages.',
  };
}

export function seoScore(
  slug: string,
  parts: { distinct: number; spelling: number; relevance: number; length: number },
): { value: number; explanation: string } {
  const v = parts.distinct * 0.35 + parts.spelling * 0.25 + parts.relevance * 0.25 + parts.length * 0.15;
  const value = round1(clamp(v, 1));
  const bits: string[] = [];
  bits.push(parts.spelling >= 8.5 ? 'Low spelling complexity, so people can type it after hearing it once.' : 'Some spelling ambiguity — people may mistype it when searching.');
  bits.push(
    parts.distinct >= 8.5
      ? 'A distinctive term with little search competition for the exact name.'
      : 'Shares words with existing searches, so ranking for the bare name will take more work.',
  );
  bits.push(
    parts.relevance >= 8
      ? 'Strong semantic link to your category helps discovery.'
      : parts.relevance >= 6.5
        ? 'Moderate semantic relevance — flexible if you expand beyond one category.'
        : 'Little literal relevance, so pair it with a descriptive tagline on your site.',
  );
  return { value, explanation: `${bits.join(' ')} This is a naming heuristic, not a ranking prediction.` };
}

export function domainScore(all: DomainResult[] | undefined, preferred: string[] = []): { value: number | null; note: string } {
  // Sample/demo results never move the score: only real checks count.
  const domains = all?.filter((d) => d.source !== 'demo');
  if (!domains || domains.length === 0) return { value: null, note: 'Check domains to complete this score.' };
  const verified = domains.filter((d) => d.status !== 'unknown');
  if (verified.length === 0) return { value: null, note: 'We could not verify domains yet — try again.' };
  const status = (tld: string) => domains.find((d) => d.tld === tld)?.status;
  const avail = (tld: string) => status(tld) === 'available';
  let s: number;
  let note: string;
  if (avail('com')) {
    s = 10;
    note = '.com is available.';
  } else if (status('com') === 'premium') {
    s = 6.5;
    note = '.com is a premium (paid) domain.';
  } else {
    const order = [...preferred.filter((t) => t !== 'com'), 'in', 'ai', 'io', 'co', 'app', 'xyz'];
    const firstFree = order.find((t) => avail(t));
    if (firstFree) {
      s = firstFree === 'in' || firstFree === 'ai' || firstFree === 'io' ? 7.6 : 6.8;
      if (preferred.includes(firstFree)) s += 0.4;
      note = `.com is taken; .${firstFree} is available.`;
    } else if (domains.some((d) => d.status === 'premium')) {
      s = 4.5;
      note = 'Only premium domains are left.';
    } else if (domains.some((d) => d.status === 'unknown')) {
      s = 4;
      note = '.com is taken; other extensions could not be verified yet.';
    } else {
      s = 2;
      note = 'All checked domains are taken.';
    }
  }
  const freeCount = domains.filter((d) => d.status === 'available').length;
  s += Math.min(0.6, Math.max(0, freeCount - 1) * 0.2);
  return { value: round1(clamp(s)), note };
}

export function socialScore(all: SocialResult[] | undefined): { value: number | null; note: string } {
  const socials = all?.filter((s) => s.method !== 'demo');
  if (!socials || socials.length === 0) return { value: null, note: 'Check handles to complete this score.' };
  const decided = socials.filter((s) => s.status === 'available' || s.status === 'taken');
  if (decided.length === 0) return { value: null, note: 'No platform could be verified automatically — use the quick links.' };
  const free = decided.filter((s) => s.status === 'available').length;
  const ratio = free / decided.length;
  return {
    value: round1(clamp(2 + ratio * 8)),
    note: `${free} of ${decided.length} verified platform${decided.length === 1 ? '' : 's'} available.`,
  };
}

/* ---------------------------------- risks ----------------------------------- */

export function detectRisks(name: string): RiskFlag[] {
  const slug = toSlug(name);
  const risks: RiskFlag[] = [];
  for (const r of RISKY_WORDS) {
    const hit = r.substring ? slug.includes(r.word) : slug === r.word || splitsInto(slug, r.word);
    if (hit) {
      const severe = /vulgar|slur|hate|violent/.test(r.meaning);
      risks.push({ level: severe ? 'high' : 'warn', message: `"${r.word}" means ${r.meaning}.` });
    }
  }
  for (const brand of FAMOUS_BRANDS) {
    if (slug === brand) {
      risks.push({ level: 'high', message: `Identical to the existing brand "${brand}".` });
    } else if (brand.length >= 4 && Math.abs(brand.length - slug.length) <= 1 && levenshtein(slug, brand) === 1) {
      risks.push({ level: 'warn', message: `One letter away from "${brand}" — risk of confusion.` });
    }
  }
  if (slug.length > 14) risks.push({ level: 'info', message: 'Long names are harder to fit on icons and handles.' });
  if (/[0-9]/.test(slug)) risks.push({ level: 'info', message: 'Digits in a name are often misheard ("4" vs "four").' });
  return dedupeRisks(risks);
}

function splitsInto(slug: string, word: string): boolean {
  // Whole-word match at the start or end of a compound ("giftly" → "gift" + "ly").
  return (slug.startsWith(word) && slug.length - word.length <= 3) || (slug.endsWith(word) && slug.length - word.length <= 3 && word.length >= 4);
}

function dedupeRisks(r: RiskFlag[]): RiskFlag[] {
  const seen = new Set<string>();
  return r.filter((x) => (seen.has(x.message) ? false : (seen.add(x.message), true)));
}

/* ---------------------------------- total ----------------------------------- */

export function scoreName(input: ScoreInput): GoBrandScore {
  const slug = toSlug(input.name);
  const keywords = input.brief ? extractKeywords(input.brief, 10) : [];
  const risks = detectRisks(slug);

  const pron = pronunciationScore(slug);
  const spell = spellingScore(slug);
  const rel = input.relevance ?? relevanceScore(slug, keywords);
  const memRaw = memorabilityScore(slug);
  // Meaning helps recall: a name tied to the idea sticks better than a random coinage.
  const mem = { ...memRaw, value: round1(clamp(memRaw.value + (rel - 7) * 0.3, 1)) };
  const dist = distinctivenessScore(slug, keywords);
  const glob = globalScore(slug, risks);
  const len = lengthScore(slug);
  const seo = seoScore(slug, { distinct: dist.value, spelling: spell.value, relevance: rel, length: len });
  const brandabilityValue = round1(
    clamp(pron.value * 0.2 + mem.value * 0.2 + dist.value * 0.15 + spell.value * 0.1 + len * 0.1 + rel * 0.25 - (risks.some((r) => r.level === 'high') ? 3 : 0)),
  );
  const dom = domainScore(input.domains, input.preferredTlds);
  const soc = socialScore(input.socials);

  const components: ScoreComponent[] = [
    { key: 'brandability', value: brandabilityValue, note: brandNote(brandabilityValue) },
    { key: 'memorability', value: mem.value, note: mem.note },
    { key: 'pronunciation', value: pron.value, note: pron.note },
    { key: 'distinctiveness', value: dist.value, note: dist.note },
    { key: 'global', value: glob.value, note: glob.note },
    { key: 'seo', value: seo.value, note: 'Naming heuristic — see explanation.' },
    { key: 'domain', value: dom.value, note: dom.note },
    { key: 'social', value: soc.value, note: soc.note },
  ].map((c) => ({ ...c, key: c.key as ScoreKey, label: SCORE_LABELS[c.key as ScoreKey], weight: SCORE_WEIGHTS[c.key as ScoreKey] }));

  let total = 0;
  let weight = 0;
  for (const c of components) {
    if (c.value === null) continue;
    total += c.value * c.weight;
    weight += c.weight;
  }
  // Calibration curve: spreads results so "good" (≈7.5) and "great" (≈9) feel different.
  const mean = weight ? total / weight : 0;
  const overall10 = 10 * Math.pow(mean / 10, CALIBRATION_EXPONENT);
  return {
    overall100: Math.round(overall10 * 10),
    overall: round1(overall10),
    provisional: components.some((c) => c.value === null),
    components,
    seo,
    risks,
    version: SCORE_VERSION,
  };
}

function brandNote(v: number): string {
  if (v >= 9) return 'Feels like a brand already — short, sayable and ownable.';
  if (v >= 8) return 'Strong brand material with minor trade-offs.';
  if (v >= 6.5) return 'Workable, but a sharper variant may serve you better.';
  return 'Hard to build a brand on as-is.';
}

function capitalise(s: string): string {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}
