/**
 * Offline Brand Bible writer — template-driven, personality-aware copy so the
 * full flow works without an AI key. Clearly labelled "offline" in the UI.
 */
import { extractKeywords, hash32, pickFonts, pickMark, rng, MARK_PATHS, toSlug } from '@gbt/shared';
import type { KitDraft, KitGenInput } from '../types';

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

const HUES: Record<string, number> = {
  Futuristic: 256, Technical: 222, Minimal: 228, Premium: 38, Luxury: 345, Playful: 330, Youthful: 160,
  Bold: 6, Human: 18, Trustworthy: 214, Creative: 290, Traditional: 28, Experimental: 300,
};

function cap(s: string) {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}

export function generateOfflineKit(input: KitGenInput): Partial<KitDraft> {
  const name = input.name.trim();
  const b = input.brief;
  const desc = (b.description || `a new brand called ${name}`).trim().replace(/\.$/, '');
  let what = desc
    .replace(/^(i'?m|i am|we'?re|we are|i want|we want)\s+(building|creating|making|launching|starting|to build|to start|to launch)?\s*/i, '')
    .replace(/^(a|an)\s+/i, '');
  // "candle brand for Gen Z in India" → what: "candle brand", audience: "Gen Z in India"
  const forMatch = what.match(/^(.*?)\s+(?:for|that helps|helping)\s+(.+)$/i);
  const inferredAudience = forMatch ? forMatch[2]!.trim() : undefined;
  if (forMatch && forMatch[1]!.split(' ').length >= 1) what = forMatch[1]!.trim();
  const personalities = b.personalities?.length ? b.personalities : ['Human', 'Futuristic'];
  const lead = personalities[0]!;
  const audience = b.audience || inferredAudience || inferAudience(desc);
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
  const fonts = pickFonts({ name, personalities, geography: b.geography, styles: b.styles });
  const voice = VOICES[lead] ?? VOICES.Human!;
  const [v1, v2, v3] = voice.split(' · ');

  const taglines = [
    `${cap(topic)}, made simple.`,
    `Every ${thing} deserves a little magic.`,
    `Built for ${short(audience)}.`,
    `Small brand. Big ${random() > 0.5 ? 'spark' : 'start'}.`,
    `The easier way to ${verbFor(desc)}.`,
    `${cap(v1!.toLowerCase())} by design.`,
    `Made in ${geo === 'Global' ? 'the open' : geo}, made for you.`,
  ].filter((t, i, arr) => arr.indexOf(t) === i);

  const draft: KitDraft = {
    strategy: {
      meaning: `${name} is a ${markInfo.label.toLowerCase()} of an idea: short, sayable and easy to own. It points to ${markInfo.meaning} — exactly what ${what} should feel like.`,
      story: `Every brand starts with a moment someone thinks, "there has to be a better way." ${name} began there — with ${what}. We kept it simple: do one thing really well, explain it in plain words, and make people feel looked after. The name is the promise; the work is everything after it.`,
      positioning: `For ${audience}, ${name} is ${articled(what)} that feels ${v1!.toLowerCase()} and ${v2!.toLowerCase()} — unlike the usual options, it ${random() > 0.5 ? 'takes minutes, not weeks' : 'is built around how you actually work'}.`,
      mission: `Make ${topic} ${random() > 0.5 ? 'effortless' : 'joyful'} for ${audience}.`,
      vision: `A world where anyone in ${geo === 'Global' ? 'the world' : geo} can ${verbFor(desc)} with confidence.`,
      audience: {
        primary: audience,
        secondary: geo === 'India' ? 'Diaspora and global customers who want an Indian-made option' : 'Teams and early adopters who spread the word',
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
        oneLiner: `${name} — ${what}.`,
        short: `${name} helps ${audience} ${verbFor(desc)} without the usual hassle.`,
        long: `${name} is ${articled(what)}. It's designed for ${audience}, with a ${v1!.toLowerCase()}, ${v2!.toLowerCase()} experience from the first click. No jargon, no long setup — just the thing you came for, done well.`,
        elevatorPitch: `You know how ${keywords[0] ?? 'getting started'} is harder than it should be? ${name} fixes that. It's ${articled(what)}, built for ${audience}, and it takes minutes to get value. We're starting in ${geo} and growing from there.`,
      },
    },
    taglines,
    identity: {
      markShape: mark,
      markConcept: `The full stop becomes a ${markInfo.label.toLowerCase()} — ${markInfo.meaning}. One mark, used once, at the end of the wordmark.`,
      hue: HUES[lead] ?? 256,
      fontTrio: fonts.id,
      logoDirections: [
        { name: 'Minimal wordmark', description: `"${name.toLowerCase()}" in ${fonts.display.family}, tight tracking, the ${markInfo.label.toLowerCase()} as its full stop.` },
        { name: 'Symbol + wordmark', description: `The ${markInfo.label.toLowerCase()} on a rounded tile beside the wordmark — for app icons and avatars.` },
        { name: 'Monogram', description: `A lowercase "${name[0]!.toLowerCase()}" with the mark tucked at its baseline, on an ink tile.` },
        { name: 'Abstract symbol', description: `The mark alone in brand colour — the smallest, most recognisable version.` },
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
      motion: {
        idle: 'A calm dot in brand colour.',
        thinking: 'Breathes into a soft diamond while work happens.',
        mark: `Snaps open into the ${markInfo.label.toLowerCase()} when results land.`,
        done: 'A tiny accent twin appears for "done".',
      },
      usageRules: {
        clearSpace: 'Space equal to the "o" height on every side.',
        minSize: `Wordmark 96px wide. Smaller: the "${name[0]!.toLowerCase()}" tile or the mark alone.`,
        do: 'Brand-colour mark on light; accent or soft mark on ink.',
        dont: 'One mark only in the logo. No capitals, glitter, gradients or glows.',
      },
    },
    launch: {
      bios: {
        instagram: `${cap(what)} ✦\nMade for ${audience}.\n↓ Start here: ${domain}`,
        x: `${name}: ${what}. ${taglines[0]} ${domain}`,
        linkedin: `${name} is ${articled(what)}. We help ${audience} ${verbFor(desc)} — simply, quickly and without jargon. Based in ${geo}. Visit ${domain}.`,
        youtube: `Welcome to ${name}. Short, useful videos on ${topic} for ${audience}. New videos every week. ${domain}`,
      },
      posts: {
        instagram: `Hello, world ✦\n\nMeet ${name} — ${what}.\n\nWe built it because ${keywords[0] ?? 'this'} shouldn't be this hard. Tap the link in bio to try it first.\n\n#${handle} #launch #madeinindia`,
        linkedin: `Today we're launching ${name}.\n\n${cap(what)} — built for ${audience}.\n\nWhat we believe:\n• ${cap(verbFor(desc))} should take minutes, not weeks\n• Plain words beat jargon\n• Great tools should feel personal\n\nWe'd love your feedback. Try it at ${domain} and tell us what to build next.`,
        xThread: [
          `Meet ${name} ✦ ${what}.`,
          `Why: ${keywords[0] ?? 'this'} is still harder than it should be. We wanted something ${v1!.toLowerCase()} and ${v2!.toLowerCase()}.`,
          `What it does: helps ${audience} ${verbFor(desc)} in minutes.`,
          `Who it's for: ${audience}.`,
          `Try it today → ${domain}. Replies open — tell us what to build next.`,
        ],
        announcement: `${name} is live. ${cap(what)}, made for ${audience}. Try it at ${domain}.`,
      },
      contentIdeas: [
        `Behind the name: why we chose "${name}"`,
        `The problem with ${topic} today — in 30 seconds`,
        `A day in the life of our first customer`,
        `3 mistakes people make with ${keywords[0] ?? 'getting started'}`,
        `Before / after: what changes with ${name}`,
        `Founder note: what we're building and why`,
        `Myth vs fact about ${topic}`,
        `A quick tutorial: your first 5 minutes with ${name}`,
        `Customer question of the week`,
        `What's next: a sneak peek at the roadmap`,
      ],
    },
    website: {
      headline: taglines[0]!,
      subheadline: `${name} is ${articled(what)} for ${audience}. ${cap(v1!.toLowerCase())}, ${v2!.toLowerCase()} and ready when you are.`,
      cta: random() > 0.5 ? 'Get started free' : `Try ${name}`,
      about: `We started ${name} because ${keywords[0] ?? 'this'} deserved better. We're a small team in ${geo} building ${what} — with plain words, fair prices and real support.`,
      features: [
        { title: 'Fast to start', body: 'Set up in minutes. No manual, no long calls.' },
        { title: 'Made for you', body: `Designed around how ${audience} actually work.` },
        { title: 'Fair and clear', body: geo === 'India' ? 'Simple ₹ pricing with no surprises.' : 'Simple pricing with no surprises.' },
      ],
      benefits: ['Save hours every week', 'Look professional from day one', 'Get help from real people'],
      faq: [
        { q: `What is ${name}?`, a: `${name} is ${articled(what)}.` },
        { q: 'Who is it for?', a: `${cap(audience)}.` },
        { q: 'How much does it cost?', a: 'You can start free. Paid plans unlock more as you grow.' },
        { q: 'How do I get help?', a: `Write to hello@${domain} — a real person replies.` },
      ],
      contact: `hello@${domain}`,
      seoTitle: `${name} — ${cap(what)}`.slice(0, 60),
      metaDescription: `${name} is ${articled(what)} for ${audience}. ${taglines[0]}`.slice(0, 158),
    },
  };

  const out: Partial<KitDraft> = {};
  for (const s of input.sections) (out as Record<string, unknown>)[s] = draft[s];
  return out;
}

function short(audience: string): string {
  return audience.split(/[,.]/)[0]!.trim();
}

function inferAudience(desc: string): string {
  const d = desc.toLowerCase();
  if (/gen ?z|young|student/.test(d)) return 'Gen Z in India';
  if (/small business|smb|msme|shop/.test(d)) return 'small business owners';
  if (/freelanc/.test(d)) return 'freelancers and solo founders';
  if (/developer|engineer/.test(d)) return 'developers and product teams';
  if (/parent|kid|child/.test(d)) return 'busy parents';
  if (/creator|influencer/.test(d)) return 'creators and their communities';
  return 'founders and early adopters';
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
