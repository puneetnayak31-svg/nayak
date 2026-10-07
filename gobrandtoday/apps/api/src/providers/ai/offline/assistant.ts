import { MARK_SHAPES, type MarkShape } from '@gbt/shared';
import type { AssistantInput, AssistantOutput } from '../types';
import { generateOfflineNames } from './names';

const empty = (): AssistantOutput['changes'] => ({
  taglines: null,
  positioning: null,
  story: null,
  mission: null,
  vision: null,
  oneLiner: null,
  voiceSummary: null,
  hue: null,
  darkerPalette: null,
  markShape: null,
  fontTrio: null,
  instagramBio: null,
  instagramPost: null,
  linkedinPost: null,
  xThread: null,
  websiteHeadline: null,
  websiteSubheadline: null,
  contentIdeas: null,
});

const HUE_WORDS: Array<[RegExp, number]> = [
  [/red|chilli/, 4],
  [/orange|saffron|coral/, 24],
  [/yellow|gold|marigold|turmeric/, 44],
  [/green|leaf|eco/, 140],
  [/teal|aqua/, 178],
  [/blue/, 214],
  [/indigo/, 236],
  [/violet|purple/, 262],
  [/pink|rani/, 330],
];

/** Intent-matching assistant used without an AI key. Honest about its limits. */
export function offlineAssistant(input: AssistantInput): AssistantOutput {
  const m = input.message.toLowerCase();
  const changes = empty();
  const name = input.name;

  if (/(alternative|other|more) names?|rename|10 names/.test(m)) {
    const names = generateOfflineNames({ brief: { ...input.brief, mode: 'smart' }, count: 10, exclude: [name] }).map((n) => n.name);
    return { reply: `Here are 10 alternatives in the same spirit as ${name}. Tap any to check its domain and handles.`, names, changes };
  }
  if (/tagline/.test(m)) {
    const premium = /premium|luxury|elegant/.test(m);
    const genz = /gen ?z|young|fun|playful/.test(m);
    changes.taglines = premium
      ? [`Quietly exceptional.`, `${name}. Nothing extra.`, `Made with intent.`, `The considered choice.`, `Less noise. More ${name.toLowerCase()}.`]
      : genz
        ? [`no cap, just ${name.toLowerCase()} ✦`, `main character energy.`, `${name.toLowerCase()} hits different.`, `built for the group chat.`, `vibe first. always.`]
        : [`${name}, made simple.`, `Start small. Shine bright.`, `Your next favourite thing.`, `Made for the way you work.`, `A little magic for big ideas.`];
    return { reply: `New tagline options are in your kit. My pick: "${changes.taglines[0]}"`, names: [], changes };
  }
  if (/dark|moody|night/.test(m) && /palette|colou?r/.test(m)) {
    changes.darkerPalette = true;
    return { reply: 'Done — your palette is now deeper and moodier, with contrast still checked for accessibility.', names: [], changes };
  }
  for (const [re, hue] of HUE_WORDS) {
    if (re.test(m) && /palette|colou?r|brand/.test(m)) {
      changes.hue = hue;
      return { reply: 'Updated your palette around that colour. All five roles were regenerated and contrast-checked.', names: [], changes };
    }
  }
  const shape = MARK_SHAPES.find((s) => m.includes(s)) as MarkShape | undefined;
  if (shape || /symbol|mark|logo/.test(m)) {
    const current = input.kit.identity.mark.shape;
    changes.markShape = shape ?? MARK_SHAPES[(MARK_SHAPES.indexOf(current) + 3) % MARK_SHAPES.length]!;
    return { reply: `Swapped your mark to a ${changes.markShape}. The wordmark, icon tile and motion story all updated.`, names: [], changes };
  }
  if (/position/.test(m)) {
    changes.positioning = `${name} is the simplest way for ${input.kit.audience.primary} to get started — clear, fast and genuinely helpful, without the jargon of the usual options.`;
    return { reply: 'Rewrote your positioning to be shorter and sharper.', names: [], changes };
  }
  if (/gen ?z|younger|youth/.test(m)) {
    changes.voiceSummary = 'Bright · Direct · Fun';
    changes.oneLiner = `${name.toLowerCase()} — ${input.kit.messaging.oneLiner.split('—')[1]?.trim() ?? 'made for you'} ✦`;
    changes.instagramBio = `${input.kit.messaging.oneLiner.split('—')[1]?.trim() ?? name} ✦\nno boring stuff, promise.\n↓ try it`;
    changes.taglines = [`${name.toLowerCase()} hits different.`, `built for the group chat.`, `vibe first. always.`];
    return { reply: 'Gave the brand a Gen Z tune-up: voice, one-liner, Instagram bio and taglines.', names: [], changes };
  }
  if (/carousel/.test(m)) {
    const slides = [
      `**Slide 1** — ${input.kit.taglines[0] ?? name}`,
      `**Slide 2** — The problem: ${input.kit.audience.insights[0] ?? 'it is harder than it should be.'}`,
      `**Slide 3** — Meet ${name}: ${input.kit.messaging.short}`,
      `**Slide 4** — How it works: 1) Sign up 2) Tell us what you need 3) Done.`,
      `**Slide 5** — ${input.kit.website.cta} → link in bio ✦`,
    ];
    return { reply: `Here's a 5-slide Instagram carousel:\n\n${slides.join('\n')}`, names: [], changes };
  }
  if (/campaign|launch/.test(m)) {
    return {
      reply: `**Launch campaign — 2 weeks**\n\n1. *Teaser (days 1–3):* the mark alone, "something's coming".\n2. *Reveal (day 4):* the wordmark + "${input.kit.taglines[0] ?? ''}".\n3. *Founder story (day 6):* why ${name} exists.\n4. *Proof (days 8–12):* three early-user stories.\n5. *Offer (day 14):* early-bird pricing for the first 100.\n\nPosts for each are in your Launch kit tab.`,
      names: [],
      changes,
    };
  }
  if (/homepage|website|landing/.test(m)) {
    changes.websiteHeadline = input.kit.taglines[1] ?? input.kit.website.headline;
    changes.websiteSubheadline = input.kit.messaging.short;
    return { reply: 'Refreshed your homepage headline and subheadline. The full page copy is in the Website tab.', names: [], changes };
  }
  return {
    reply:
      'I can change taglines, positioning, palette colours, the mark, and launch or website copy — or suggest alternative names. Try "make my tagline more premium" or "give me a darker palette". (Running in offline mode — connect an AI key for open-ended requests.)',
    names: [],
    changes,
  };
}
