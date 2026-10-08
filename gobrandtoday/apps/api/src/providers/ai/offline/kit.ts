/**
 * Offline Brand Bible writer — template-driven, personality-aware copy so the
 * full flow works without an AI key. Clearly labelled "offline" in the UI.
 */
import { extractKeywords, generateLooks, hash32, pickMark, rng, MARK_PATHS, toSlug } from '@gbt/shared';
import type { KitDraft, KitGenInput } from '../types';
import { SECTOR_VOICE, launchCopy, understandBrief } from './copy';

const GENERIC = new Set(['brand', 'company', 'platform', 'app', 'startup', 'business', 'product', 'service', 'website', 'tool', 'solution']);

const ARCHETYPES: Record<string, { name: string; description: string }> = {
  Futuristic: { name: 'The Magician', description: 'Makes the impossible feel effortless — turns complexity into a small moment of wonder.' },
  Technical: { name: 'The Sage', description: 'Earns trust through clarity, rigour and knowing exactly how things work.' },
  Minimal: { name: 'The Sage', description: 'Says less, means more. Clarity is the product.' },
  Premium: { name: 'The Ruler', description: 'Calm confidence and quality without needing to shout.' },
  Luxury: { name: 'The Lover', description: 'Sensory, intimate and beautifully made.' },
  Playful: { name: 'The Jester', description: 'Brings joy to everyday moments and never takes itself too seriously.' },
  Youthful: { name: 'The Explorer', description: 'Restless, curious and always up for the next thing.' },
  Bold: { name: 'The Rebel', description: 'Challenges the default and says what others won’t.' },
  Human: { name: 'The Caregiver', description: 'Warm, generous and genuinely on your side.' },
  Trustworthy: { name: 'The Everyperson', description: 'Dependable, honest and refreshingly normal.' },
  Creative: { name: 'The Creator', description: 'Imaginative, crafted and always making something new.' },
  Traditional: { name: 'The Sage', description: 'Carries wisdom forward — heritage made relevant.' },
  Experimental: { name: 'The Explorer', description: 'Tries the new thing first and reports back.' },
};

const VOICES: Record<string, string> = {
  Futuristic: 'Light · Clever · Quietly magical',
  Technical: 'Precise · Clear · Helpful',
  Minimal: 'Calm · Clear · Considered',
  Premium: 'Assured · Warm · Unhurried',
  Luxury: 'Sensory · Elegant · Intimate',
  Playful: 'Bright · Witty · Kind',
  Youthful: 'Fresh · Direct · Fun',
  Bold: 'Loud · Honest · Fearless',
  Human: 'Warm · Plain · Encouraging',
  Trustworthy: 'Honest · Steady · Clear',
  Creative: 'Curious · Vivid · Playful',
  Traditional: 'Rooted · Generous · Proud',
  Experimental: 'Curious · Unexpected · Sharp',
};


function cap(s: string) {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}

export function generateOfflineKit(input: KitGenInput): Partial<KitDraft> {
  const name = input.name.trim();
  const b = input.brief;
  const desc = (b.description || `a new brand called ${name}`).trim().replace(/\.$/, '');
  // Read the brief into parts ("mithai shop" / "handmade sweets…" / "Jaipur") so no field pastes it back verbatim.
  const sense = understandBrief(desc, b.industry);
  const what = sense.category;
  const sv = SECTOR_VOICE[sense.sector];
  const inferredAudience = sense.audience;
  const personalities = b.personalities?.length ? b.personalities : ['Human', 'Futuristic'];
  const lead = personalities[0]!;
  const audience = b.audience || inferredAudience || inferAudience(desc) || sv.audience;
  const geo = b.geography || 'India';
  const random = rng(hash32(`kit:${name}:${desc}`));
  const keywords = extractKeywords(what, 6).filter((k) => !GENERIC.has(k));
  const topic = keywords.slice(0, 2).join(' ') || 'your idea';
  // The product noun: last meaningful word ("cosy candle brand" → "candle").
  const thing = [...keywords].reverse().find((k) => k.length > 2) ?? 'idea';
  const handle = input.handle ?? toSlug(name);
  const domain = input.domain ?? `${toSlug(name)}.com`;
  const mark = pickMark({ name, personalities, industry: b.industry, geography: b.geography });
  const markInfo = MARK_PATHS[mark];
  const voice = VOICES[lead] ?? VOICES.Human!;
  const [v1, v2, v3] = voice.split(' · ');

  const taglines = [
    `${cap(sv.promise)}.`,
    `${cap(topic)}, made simple.`,
    `Every ${thing} deserves a little magic.`,
    `Built for ${short(audience)}.`,
    `Small brand. Big ${random() > 0.5 ? 'spark' : 'start'}.`,
    `The easier way to ${verbFor(desc)}.`,
    `${cap(v1!.toLowerCase())} by design.`,
    `Made with care, made for you.`,
  ].filter((t, i, arr) => arr.indexOf(t) === i);

  const draft: KitDraft = {
    strategy: {
      meaning: `${name} is short, sayable and easy to own — a name with room to grow. It carries the feeling ${what} should have: ${markInfo.meaning}.`,
      story: `Every brand starts with a moment someone thinks, "there has to be a better way." ${name} began there — with ${what}. We kept it simple: do one thing really well, explain it in plain words, and make people feel looked after. The name is the promise; the work is everything after it.`,
      positioning: `For ${audience}, ${name} is ${articled(what)} that feels ${v1!.toLowerCase()} and ${v2!.toLowerCase()} — unlike the usual options, it ${random() > 0.5 ? 'takes minutes, not weeks' : 'is built around how you actually work'}.`,
      mission: `Make ${topic} ${random() > 0.5 ? 'effortless' : 'joyful'} for ${audience}.`,
      vision: `A world where anyone in ${geo === 'Global' ? 'the world' : geo} can ${verbFor(desc)} with confidence.`,
      audience: {
        primary: audience,
        secondary: geo === 'India' ? 'Diaspora and global customers who find you online' : 'Teams and early adopters who spread the word',
        insights: [
          'They want results quickly and hate jargon.',
          'They trust recommendations from people like them.',
          'Price matters — but so does feeling respected.',
        ],
      },
      personality: personalities.slice(0, 4),
      archetype: ARCHETYPES[lead] ?? ARCHETYPES.Human!,
      voice: {
        summary: voice,
        say: [`${cap(verbFor(desc))} in minutes.`, `Here's what we'd do next.`, `You're all set.`],
        not: [`Our proprietary platform leverages synergies.`, `Revolutionary, disruptive, game-changing.`],
        principles: [`Be ${v1!.toLowerCase()}: say it in one breath.`, `Be ${v2!.toLowerCase()}: show, then tell.`, `Be ${v3!.toLowerCase()}: leave people feeling capable.`],
      },
      messaging: {
        oneLiner: `${name}: ${sv.promise}.`,
        short: `${name} helps ${audience} ${verbFor(desc)} without the usual hassle.`,
        long: `${name} is ${articled(what)}${sense.place ? ` from ${sense.place}` : ''}${sense.offer ? `, offering ${sense.offer}` : ''}. It's designed for ${audience}, with a ${v1!.toLowerCase()}, ${v2!.toLowerCase()} experience from the first click. No jargon, no long setup — just the thing you came for, done well.`,
        elevatorPitch: `You know how ${keywords[0] ?? 'getting started'} is harder than it should be? ${name} fixes that. It's ${articled(what)}, built for ${audience}, and it takes minutes to get value. We're starting in ${geo} and growing from there.`,
      },
    },
    taglines,
    identity: {
      looks: generateLooks({ name, personalities, industry: b.industry, geography: b.geography, seed: input.seed }).map((l) => ({
        title: l.title,
        concept: l.concept,
        style: l.style,
        hue: l.hue,
        markShape: l.markShape,
        fontTrio: l.fontTrio,
        wordCase: l.case ?? 'lower',
        symbolFamily: l.symbol?.family ?? 'none',
        symbolSvg: '',
      })),
      essence: {
        promise: `${cap(verbFor(desc))}, without the hassle.`,
        values: [
          { name: v1!, meaning: `Every screen, post and reply should feel ${v1!.toLowerCase()}. If it doesn't, cut it.` },
          { name: v2!, meaning: `We show rather than tell: real examples, real numbers, real people.` },
          { name: v3!, meaning: `People should leave ${name} feeling more capable than when they arrived.` },
        ],
      },
      moodboard: [
        { caption: `Real ${audience} in real places, natural light`, prompt: `candid lifestyle photo of ${audience}${/india/i.test(audience) ? '' : ' in India'}, ${topic}, natural window light, warm tones, editorial, shallow depth of field` },
        { caption: 'Close-up texture that echoes the palette', prompt: `macro texture photograph related to ${topic}, soft gradients, minimal, calm, brand moodboard, high detail` },
        { caption: 'The product moment: hands, screens and objects', prompt: `hands using ${what} on a phone and desk, flat lay, clean background, soft shadows, modern brand photography` },
        { caption: 'Place and culture, quietly Indian', prompt: `quiet modern Indian street or interior at golden hour, ${topic} mood, cinematic, uncluttered, film photography` },
      ],
      designSystem: {
        buttons: 'Solid brand-colour primary buttons with white text, 16px radius; outlined ink secondary buttons.',
        cards: 'White cards on paper, 1px soft border, 24–28px radius, generous padding.',
        website: 'Lots of whitespace, one idea per section, big display headlines, a single primary CTA.',
        social: 'Ink or tint backgrounds, one bold line of display type, the mark as the only ornament.',
        photography: 'Natural light, real people and real places, warm and unposed.',
        illustration: 'Simple geometric shapes borrowed from the mark; never more than two colours.',
        iconography: 'Rounded 2px line icons; the mark replaces the generic "sparkle" icon.',
        imagery: 'Soft tints and plenty of breathing room. No stock-photo handshakes.',
        spacing: '8px base grid; sections breathe at 80–120px on desktop.',
        radius: '16px for controls, 24–28px for cards, fully round for chips.',
        personality: `${voice}.`,
      },
    },
    launch: (() => {
      const l = launchCopy({ name, sense, audience, geo, domain, handle, tone: [v1!, v2!, v3!] });
      return { bios: l.bios, posts: l.posts, contentIdeas: l.contentIdeas };
    })(),
    website: {
      headline: taglines[0]!,
      subheadline: `${name} is ${articled(what)}${sense.place ? ` from ${sense.place}` : ''}${sense.offer ? ` making ${sense.offer}` : ''}, for ${audience}. ${cap(sv.promise)}.`,
      cta: sv.cta,
      about: `${sv.problem} We started ${name} to change that: a small team in ${sense.place ?? geo} that sets out to ${sv.verb}, with plain words, fair prices and real support.`,
      features: [
        { title: 'Fast to start', body: 'Set up in minutes. No manual, no long calls.' },
        { title: 'Made for you', body: `Designed around how ${audience} actually work.` },
        { title: 'Fair and clear', body: geo === 'India' ? 'Simple ₹ pricing with no surprises.' : 'Simple pricing with no surprises.' },
      ],
      benefits: ['Save hours every week', 'Look professional from day one', 'Get help from real people'],
      faq: [
        { q: `What is ${name}?`, a: `${name} is ${articled(what)}${sense.place ? ` in ${sense.place}` : ''}${sense.offer ? `. We make ${sense.offer}` : ''}.` },
        { q: 'Who is it for?', a: `${cap(audience)}.` },
        { q: 'How much does it cost?', a: 'You can start free. Paid plans unlock more as you grow.' },
        { q: 'How do I get help?', a: `Write to hello@${domain} — a real person replies.` },
      ],
      contact: `hello@${domain}`,
      seoTitle: `${name} — ${cap(what)}${sense.place ? ` in ${sense.place}` : ''}`.slice(0, 60),
      metaDescription: `${name} is ${articled(what)}${sense.offer ? ` for ${sense.offer}` : ''}, made for ${audience}. ${cap(sv.promise)}.`.slice(0, 158),
    },
  };

  const out: Partial<KitDraft> = {};
  for (const s of input.sections) (out as Record<string, unknown>)[s] = draft[s];
  return out;
}

function short(audience: string): string {
  return audience.split(/[,.]/)[0]!.trim();
}

function inferAudience(desc: string): string | undefined {
  const d = desc.toLowerCase();
  if (/gen ?z|young|student/.test(d)) return 'Gen Z in India';
  if (/small business|smb|msme/.test(d)) return 'small business owners';
  if (/freelanc/.test(d)) return 'freelancers and solo founders';
  if (/developer|engineer/.test(d)) return 'developers and product teams';
  if (/parent|kid|child/.test(d)) return 'busy parents';
  if (/creator|influencer/.test(d)) return 'creators and their communities';
  return undefined;
}

function verbFor(desc: string): string {
  const d = desc.toLowerCase();
  if (/support|customer/.test(d)) return 'look after every customer';
  if (/pay|invoice|money|fintech/.test(d)) return 'get paid on time';
  if (/learn|course|tutor|school/.test(d)) return 'learn something new';
  if (/food|chai|coffee|meal|kitchen/.test(d)) return 'enjoy something delicious';
  if (/fashion|cloth|wear/.test(d)) return 'dress the way they feel';
  if (/candle|home|decor/.test(d)) return 'make home feel like home';
  if (/health|wellness|clinic/.test(d)) return 'feel better every day';
  if (/brand|name/.test(d)) return 'launch a brand';
  return 'get more done';
}

function articled(phrase: string): string {
  const p = phrase.trim();
  if (/^(the|a|an)\s/i.test(p)) return p;
  return /^[aeiou]/i.test(p) ? `an ${p}` : `a ${p}`;
}
