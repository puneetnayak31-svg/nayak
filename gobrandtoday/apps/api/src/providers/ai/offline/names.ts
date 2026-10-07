/**
 * Offline name generator — a rule-based engine used when no AI key is set, or
 * as a fallback when the AI provider is down. It is labelled "offline" in the
 * UI and never presented as AI.
 *
 * Strategies: suffixed coinages, blends, compounds, evocative real words,
 * phonotactic inventions, Indian-language roots and descriptive (SEO) names.
 */
import {
  CONCEPTS,
  EVOCATIVE_WORDS,
  INDIAN_ROOTS,
  detectRisks,
  extractKeywords,
  hash32,
  maxConsonantRun,
  pronunciationGuide,
  pronunciationScore,
  rng,
  toSlug,
  type NameType,
} from '@gbt/shared';
import type { NameGenInput, RawName } from '../types';

const SYNONYMS: Record<string, string> = {
  clothing: 'fashion', apparel: 'fashion', wear: 'fashion', saree: 'fashion', kurta: 'fashion', jewelry: 'fashion', jewellery: 'fashion', streetwear: 'fashion',
  payment: 'fintech', money: 'fintech', finance: 'fintech', bank: 'fintech', lending: 'fintech', invest: 'fintech', insurance: 'fintech', upi: 'fintech', wealth: 'fintech',
  invoice: 'freelance', freelancer: 'freelance', freelance: 'freelance', gig: 'freelance',
  restaurant: 'food', cafe: 'food', coffee: 'food', bakery: 'food', snack: 'food', tea: 'food', chai: 'food', kitchen: 'food', meal: 'food', spice: 'food', food: 'food',
  grocery: 'e-commerce', shop: 'e-commerce', store: 'e-commerce', marketplace: 'e-commerce', ecommerce: 'e-commerce', d2c: 'consumer',
  doctor: 'healthcare', clinic: 'healthcare', health: 'healthcare', wellness: 'healthcare', therapy: 'healthcare', mental: 'healthcare', ayurveda: 'healthcare', healthcare: 'healthcare',
  yoga: 'fitness', gym: 'fitness', fitness: 'fitness', running: 'fitness',
  school: 'education', learning: 'education', course: 'education', tutor: 'education', kid: 'education', edtech: 'education', education: 'education', student: 'education',
  ai: 'ai', ml: 'ai', agent: 'ai', automation: 'ai', automate: 'ai', intelligence: 'ai', gpt: 'ai',
  chatbot: 'support', customer: 'support', support: 'support', helpdesk: 'support', service: 'support',
  software: 'saas', saas: 'saas', crm: 'saas', tool: 'saas', dashboard: 'saas', analytics: 'saas', workflow: 'saas', productivity: 'saas',
  creator: 'creator', youtube: 'creator', influencer: 'creator', podcast: 'media', news: 'media', newsletter: 'media', video: 'media', media: 'media', film: 'media',
  candle: 'candle', fragrance: 'candle', home: 'consumer', decor: 'consumer', gift: 'consumer',
  eco: 'sustainable', sustainable: 'sustainable', green: 'sustainable', organic: 'sustainable', climate: 'sustainable',
  travel: 'travel', trip: 'travel', tour: 'travel', pet: 'pets', dog: 'pets', cat: 'pets',
  beauty: 'beauty', skincare: 'beauty', cosmetic: 'beauty', salon: 'beauty', makeup: 'beauty',
  consulting: 'consulting', agency: 'consulting', legal: 'consulting', law: 'consulting', marketing: 'consulting',
};

const EVOCATIVE_BY_CONCEPT: Record<string, string[]> = {
  ai: ['lumen', 'prism', 'vector', 'nimbus', 'zenith', 'vertex', 'atlas', 'echo'],
  saas: ['relay', 'tandem', 'compass', 'beacon', 'anchor', 'orbit'],
  fintech: ['ledger', 'anchor', 'beacon', 'marble', 'onyx', 'abacus'],
  fashion: ['velvet', 'indigo', 'saffron', 'mosaic', 'tapestry', 'quill'],
  food: ['saffron', 'clove', 'tamarind', 'mango', 'nectar', 'cardamom', 'honey'],
  healthcare: ['willow', 'juniper', 'meadow', 'harbor', 'lotus'],
  education: ['atlas', 'quill', 'lantern', 'compass', 'fable', 'kite'],
  candle: ['ember', 'lantern', 'amber', 'velvet', 'honey'],
  sustainable: ['juniper', 'meadow', 'cedar', 'willow', 'banyan', 'pebble'],
  travel: ['compass', 'atlas', 'kite', 'sparrow', 'wander', 'monsoon'],
  creator: ['canvas', 'echo', 'mosaic', 'kite', 'prism'],
  media: ['echo', 'canvas', 'prism', 'quill', 'fable'],
  support: ['harbor', 'beacon', 'anchor', 'relay', 'otter'],
  consumer: ['pebble', 'maple', 'honey', 'peacock', 'kite'],
  beauty: ['velvet', 'lotus', 'saffron', 'nectar', 'amber'],
};

const SUFFIXES: Record<string, string[]> = {
  smart: ['a', 'o', 'ora', 'io', 'ix', 'era', 'ly', 'eo'],
  short: ['o', 'a', 'i', 'ix', 'ex'],
  premium: ['ora', 'elle', 'ara', 'ena', 'ova', 'ique', 'aire'],
  tech: ['ix', 'ex', 'io', 'on', 'iq', 'yx', 'eo', 'ify'],
  invented: ['ora', 'ivo', 'ana', 'ix', 'elo', 'umi'],
  human: ['a', 'o', 'ie', 'ly', 'ful', 'well'],
  global: ['a', 'o', 'ia', 'ora', 'era', 'ano'],
  india: ['a', 'i', 'ika', 'ana', 'aya'],
  seo: ['ly', 'ify', 'hub', 'io'],
  domain_first: ['ora', 'ivo', 'eon', 'ix', 'ari', 'elo'],
  playful: ['oo', 'y', 'ie', 'o', 'zy', 'pop'],
  feminine: ['a', 'ia', 'elle', 'ina', 'ara'],
  masculine: ['ox', 'ar', 'on', 'ek', 'or'],
};

const NOUNS: Record<string, string[]> = {
  default: ['lane', 'house', 'loop', 'nest', 'field', 'works', 'stack', 'path', 'bay', 'yard'],
  india: ['wala', 'ghar', 'katta', 'adda', 'bazaar', 'mandi', 'haat'],
  seo: ['desk', 'pilot', 'works', 'labs', 'kart', 'studio', 'co', 'hq'],
};

const ONSETS = ['b', 'd', 'f', 'g', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'z', 'br', 'kr', 'tr', 'pl', 'fl', 'st', 'sh', 'j'];
const NUCLEI = ['a', 'e', 'i', 'o', 'u', 'a', 'o', 'ai', 'ee', 'oo', 'ia'];
const CODAS = ['', '', '', 'n', 'r', 'l', 'x', 's', 'm', 'k'];

const FEEL: Record<string, string> = {
  smart: 'modern',
  short: 'snappy',
  premium: 'refined',
  tech: 'crisp, technical',
  invented: 'fresh',
  human: 'warm',
  global: 'open, global',
  india: 'rooted',
  seo: 'clear',
  domain_first: 'ownable',
};

interface Draft {
  name: string;
  type: NameType;
  rationale: string;
  origin?: string;
  relevance: number;
  personality: string[];
}

function cap(s: string): string {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}

function join(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  const aEnd = a[a.length - 1]!;
  const bStart = b[0]!;
  const vowel = (c: string) => 'aeiou'.includes(c);
  if (vowel(aEnd) && vowel(bStart)) return a.slice(0, -1) + b;
  if (aEnd === bStart) return a + b.slice(1);
  return a + b;
}

function stemsOf(word: string): string[] {
  const w = toSlug(word);
  if (w.length <= 5) return [w];
  const out = new Set<string>([w.slice(0, 4), w.slice(0, 5)]);
  // Cut after the first vowel group + one consonant: "support" → "sup", "candle" → "cand".
  const m = w.match(/^[^aeiou]*[aeiou]+[^aeiou]/);
  if (m && m[0].length >= 3) out.add(m[0]);
  return [...out];
}

/** Words that describe the market, not the product — poor raw material for names. */
const WEAK_WORDS = new Set(['india', 'indian', 'bharat', 'gen', 'genz', 'small', 'big', 'premium', 'brand', 'business', 'businesse', 'customer', 'platform', 'company', 'global', 'local', 'online', 'digital', 'young', 'people', 'user', 'team', 'z']);

export interface OfflineContext {
  concepts: string[];
  words: string[];
  categories: string[];
  keywords: string[];
}

export function analyseBrief(input: NameGenInput): OfflineContext {
  const text = `${input.brief.description} ${input.brief.industry ?? ''} ${input.brief.audience ?? ''}`;
  const keywords = extractKeywords(text, 10);
  const categories = new Set<string>();
  for (const k of keywords) {
    const cat = SYNONYMS[k] ?? (CONCEPTS[k] ? k : undefined);
    if (cat) categories.add(cat);
  }
  if (input.brief.industry) {
    const ind = input.brief.industry.toLowerCase();
    if (CONCEPTS[ind]) categories.add(ind);
  }
  const concepts: string[] = [];
  for (const c of categories) concepts.push(...(CONCEPTS[c] ?? []));
  const usefulKeywords = keywords.filter((k) => k.length >= 3 && k.length <= 10 && !SYNONYMS[k] && !WEAK_WORDS.has(k));
  const words = [...new Set([...concepts, ...usefulKeywords])].filter((w) => !WEAK_WORDS.has(w));
  if (words.length < 4) words.push('nova', 'lumen', 'orbit', 'kite', 'spark');
  return { concepts, words, categories: [...categories], keywords };
}

export function generateOfflineNames(input: NameGenInput): RawName[] {
  const mode = input.brief.mode;
  const refinements = [...(input.refinements ?? []), ...(input.feedback ? [input.feedback] : [])].join(' ').toLowerCase();
  const styles = input.brief.styles.map((s) => s.toLowerCase());
  const geography = (input.brief.geography ?? '').toLowerCase();
  const ctx = analyseBrief(input);
  const seed = hash32(`${input.brief.description}|${mode}|${refinements}|${(input.exclude ?? []).length}`);
  const random = rng(seed);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(random() * arr.length)]!;

  // Refinement flags
  const wantsShort = /short|punch|tiny|7 char/.test(refinements) || styles.includes('short') || mode === 'short';
  const wantsIndian = /indian|desi|hindi|sanskrit/.test(refinements) || styles.includes('indian-inspired') || mode === 'india';
  const wantsPlayful = /playful|fun|corporate|gen ?z|youth/.test(refinements) || styles.includes('playful');
  const wantsPremium = /premium|luxury|serious|elegant/.test(refinements) || styles.includes('premium') || mode === 'premium';
  const lessTech = /less tech|less techy|human|warm/.test(refinements);
  const futuristic = /futur|tech/.test(refinements) && !lessTech;
  const feminine = /feminine/.test(refinements);
  const masculine = /masculine/.test(refinements);
  const easy = /easier|pronounce|simple/.test(refinements) || mode === 'global';
  const twoWords = styles.includes('two words');
  const descriptive = styles.includes('descriptive') || mode === 'seo';
  const realWord = styles.includes('real word');
  const invented = styles.includes('invented') || styles.includes('abstract') || mode === 'invented' || mode === 'domain_first';

  const suffixPool = [
    ...(SUFFIXES[mode] ?? SUFFIXES.smart!),
    ...(wantsPlayful ? SUFFIXES.playful! : []),
    ...(wantsPremium ? SUFFIXES.premium! : []),
    ...(futuristic ? SUFFIXES.tech! : []),
    ...(feminine ? SUFFIXES.feminine! : []),
    ...(masculine ? SUFFIXES.masculine! : []),
  ].filter((s) => !(lessTech && ['ix', 'ex', 'iq', 'yx', 'ify', 'io'].includes(s)));

  const weights: Record<string, number> = {
    suffixed: 3,
    blend: 3,
    compound: twoWords ? 4 : 1.5,
    real: realWord ? 4 : 2,
    invented: invented ? 5 : 2,
    indian: wantsIndian ? 6 : geography === 'india' ? 1.5 : 0.6,
    descriptive: descriptive ? 5 : 0.6,
  };
  if (mode === 'short') Object.assign(weights, { compound: 0.3, descriptive: 0.2 });
  if (mode === 'india') Object.assign(weights, { descriptive: 1.2, compound: 1.5 });
  const strategies = Object.entries(weights);
  const totalWeight = strategies.reduce((a, [, w]) => a + w, 0);
  const pickStrategy = () => {
    let r = random() * totalWeight;
    for (const [s, w] of strategies) {
      r -= w;
      if (r <= 0) return s;
    }
    return 'suffixed';
  };

  const feel = FEEL[mode] ?? 'modern';
  const subject = ctx.keywords.find((k) => k.length > 3) ?? 'your idea';
  const specific = [...new Set(ctx.categories.flatMap((c) => EVOCATIVE_BY_CONCEPT[c] ?? []))];
  const evocativePool = specific.length >= 3 ? specific : [...new Set([...specific, ...[...EVOCATIVE_WORDS].slice(0, 16)])];

  const make = (strategy: string): Draft | null => {
    switch (strategy) {
      case 'suffixed': {
        const word = pick(ctx.words);
        const stem = pick(stemsOf(word));
        const suf = pick(suffixPool);
        const name = join(stem, suf);
        return {
          name,
          type: 'invented',
          rationale: `Coined from "${word}" with a ${feel} "-${suf}" ending — it hints at ${subject} without spelling it out.`,
          relevance: ctx.concepts.includes(word) || ctx.keywords.includes(word) ? 7.6 : 6.4,
          personality: ['Modern', cap(feel.split(',')[0]!)],
        };
      }
      case 'blend': {
        const a = pick(ctx.words);
        const b = pick(ctx.words.filter((w) => w !== a).concat(evocativePool));
        if (!b || a.length < 3 || b.length < 3) return null;
        // True portmanteau: cut both words at a shared letter so they overlap.
        const options: string[] = [];
        for (let i = 2; i < a.length; i++) {
          for (let j = 1; j < b.length - 1; j++) {
            if (a[i] === b[j]) options.push(a.slice(0, i) + b.slice(j));
          }
        }
        const good = options.filter((o) => o.length >= 4 && o.length <= 8 && o !== a && o !== b);
        if (good.length === 0) return null;
        const name = pick(good);
        return {
          name,
          type: 'blend',
          rationale: `A blend of "${a}" and "${b}" — two ideas folded into one short word.`,
          relevance: 7.4,
          personality: ['Clever', 'Fresh'],
        };
      }
      case 'compound': {
        const a = pick([...ctx.words.filter((w) => w.length <= 6), ...evocativePool]);
        const nouns = wantsIndian ? NOUNS.india! : NOUNS.default!;
        const noun = pick(nouns);
        const name = twoWords ? `${cap(a)} ${cap(noun)}` : join(a, noun);
        return {
          name,
          type: 'compound',
          rationale: `"${cap(a)}" + "${noun}" — a clear picture that feels like a place you'd want to be.`,
          relevance: 7,
          personality: ['Friendly', 'Clear'],
        };
      }
      case 'real': {
        const w = pick(evocativePool);
        return {
          name: w,
          type: 'real_word',
          rationale: `A real word with the right feeling: "${w}" evokes ${wantsPremium ? 'quality and calm' : 'something vivid and memorable'} for ${subject}.`,
          relevance: 6.8,
          personality: ['Evocative', 'Human'],
        };
      }
      case 'invented': {
        const syllables = wantsShort ? 2 : random() > 0.7 ? 3 : 2;
        let name = '';
        for (let i = 0; i < syllables; i++) {
          // Clusters only at the very start; simple vowels keep it sayable.
          const onset = i === 0 && !easy && random() > 0.6 ? pick(ONSETS) : pick(ONSETS.filter((o) => o.length === 1));
          const nucleus = i === 0 && random() > 0.8 ? pick(NUCLEI) : pick(['a', 'e', 'i', 'o', 'u', 'a', 'o']);
          name += onset + nucleus;
        }
        if (random() > 0.55) name += pick(CODAS.filter(Boolean));
        if (name.length > 7) return null;
        return {
          name,
          type: 'abstract',
          rationale: `A brand-new word with no baggage — easy to own and easy to trademark-search, and its ${feel} sound gives ${subject} room to grow.`,
          relevance: 5.8,
          personality: ['Ownable', 'Fresh'],
        };
      }
      case 'indian': {
        const r = pick(INDIAN_ROOTS);
        const variant = random();
        let name: string;
        let how: string;
        if (variant < 0.5 || r.root.length >= 6) {
          name = r.root;
          how = `"${r.root}" means ${r.meaning}`;
        } else if (variant < 0.8) {
          const suf = pick(['ly', 'o', 'ra', 'ka', 'ya']);
          name = join(r.root, suf);
          how = `from "${r.root}" (${r.meaning}) with a light "-${suf}" ending`;
        } else {
          const other = pick(INDIAN_ROOTS.filter((x) => x.root !== r.root && x.root.length <= 4));
          name = join(r.root, other.root);
          how = `"${r.root}" (${r.meaning}) + "${other.root}" (${other.meaning})`;
        }
        return {
          name,
          type: 'indian',
          origin: `${r.lang}: ${r.root} = ${r.meaning}`,
          rationale: `Rooted in India — ${how}. Simple enough for anyone, anywhere, to say.`,
          relevance: 6.4,
          personality: ['Rooted', 'Warm'],
        };
      }
      case 'descriptive': {
        const k = pick(ctx.keywords.filter((x) => x.length >= 3 && x.length <= 8 && !WEAK_WORDS.has(x)).concat(ctx.concepts.slice(0, 3)));
        if (!k) return null;
        const noun = pick(wantsIndian ? [...NOUNS.seo!, 'wala', 'kart'] : NOUNS.seo!);
        const name = twoWords ? `${cap(k)} ${cap(noun)}` : join(k, noun);
        return {
          name,
          type: 'descriptive',
          rationale: `Says what it does — "${k}" is a word your customers already search for, so discovery comes easier.`,
          relevance: 8.8,
          personality: ['Clear', 'Practical'],
        };
      }
    }
    return null;
  };

  const exclude = new Set((input.exclude ?? []).map((n) => toSlug(n)));
  const c = input.brief.constraints ?? {};
  const maxLen = Math.min(c.maxLength ?? 14, wantsShort ? 7 : 14);
  const avoid = (c.avoidLetters ?? '').toLowerCase();
  const startsWith = (c.startsWith ?? '').toLowerCase();
  const mustInclude = toSlug(c.mustInclude ?? '');
  const seen = new Set<string>();
  const drafts: Draft[] = [];

  for (let i = 0; i < input.count * 30 && drafts.length < input.count * 4; i++) {
    let d = make(pickStrategy());
    if (!d) continue;
    if (startsWith && !toSlug(d.name).startsWith(startsWith)) {
      // Nudge rather than discard: prefix-join the required start.
      d = { ...d, name: join(startsWith, toSlug(d.name)) };
    }
    const slug = toSlug(d.name);
    if (slug.length < 3 || slug.length > maxLen) continue;
    if (seen.has(slug) || exclude.has(slug)) continue;
    if (avoid && [...avoid].some((ch) => slug.includes(ch))) continue;
    if (mustInclude && !slug.includes(mustInclude)) continue;
    if (maxConsonantRun(slug) > 2) continue;
    if (pronunciationScore(slug).value < (easy ? 8.5 : 7)) continue;
    if (detectRisks(slug).some((r) => r.level !== 'info')) continue;
    seen.add(slug);
    drafts.push(d);
  }

  // Diversity: round-robin across types, best pronunciation first within each.
  const byType = new Map<NameType, Draft[]>();
  for (const d of drafts) byType.set(d.type, [...(byType.get(d.type) ?? []), d]);
  for (const list of byType.values()) list.sort((a, b) => pronunciationScore(toSlug(b.name)).value - pronunciationScore(toSlug(a.name)).value);
  const out: Draft[] = [];
  while (out.length < input.count && [...byType.values()].some((l) => l.length)) {
    for (const list of byType.values()) {
      const next = list.shift();
      if (next) out.push(next);
      if (out.length >= input.count) break;
    }
  }

  return out.map((d) => ({
    name: d.name.includes(' ') ? d.name : cap(d.name),
    rationale: d.rationale,
    nameType: d.type,
    pronunciation: pronunciationGuide(d.name.replace(/\s+/g, '')),
    personality: [...new Set(d.personality)],
    origin: d.origin ?? '',
    relevance: d.relevance,
  }));
}
