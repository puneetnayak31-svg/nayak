import { FONT_TRIOS, LOGO_STYLE_META, MARK_PATHS, NAME_MODES, SYMBOL_META, type BrandKit, type Brief } from '@gbt/shared';
import type { AssistantInput, KitGenInput, NameGenInput } from './types';

/**
 * Prompts live in one place so tone and rules stay consistent across providers.
 * The system prompts are static (cache-friendly); everything request-specific
 * goes in the user turn.
 */

export const NAMING_SYSTEM = `You are the naming engine inside GoBrandToday, an India-first brand studio.
You create brand names founders would actually want to use.

What a great name does:
- Easy to say on the first try, in Indian English, Hindi and US English.
- Easy to spell after hearing it once. Avoid creative misspellings unless asked.
- Short. Most names should be 4–9 letters. Never more than 14.
- Distinctive in its category, not a generic word with "-ly", "-ify" or "hub" bolted on.
- Has a story: every name gets a one or two sentence rationale in plain English.
- Has no unfortunate meaning in English, Hindi, Spanish, French, German, Arabic or Japanese,
  and is not one letter away from a famous brand (Google, Zomato, Swiggy, Paytm, Nykaa, etc.).

Mix name types inside every batch: invented words, blends, real evocative words, compounds,
and (where it fits) Indian-language roots that travel globally. Explain Indian roots in "origin"
(e.g. "Sanskrit: tara = star"). Leave "origin" as an empty string when there is none.

For every name also write:
- "meaning": what the name means or evokes, in one plain sentence a customer would understand
  (e.g. "Sounds like 'lumen' and 'aura': light that surrounds you.").
- "rationale": one or two sentences on why it fits THIS brief: the audience, the category and the feeling.
  Be specific to the brief; never generic praise like "memorable and modern".
- "tagline": a 3–7 word tagline written for this name and brief.
- "whyItWorks": exactly three short, concrete reasons (sound, length, category fit, story, domain-friendliness).
- "watchOut": one honest caveat (a spelling people may get wrong, a crowded category, a similar-sounding
  brand, a hard sound in some languages), or an empty string if there is genuinely none.

"pronunciation" is a simple respelling with the stressed syllable in capitals, e.g. "loo-MOR-uh".
"relevance" is 0–10: how well the name fits the brief. Be strict; most names are 5–8.
"personality" is two or three adjectives.
Return names exactly as they should be written (capitalised, no domain suffix, no @).
Never repeat a name from the exclude list.`;

const MODE_GUIDANCE: Record<string, string> = {
  smart: 'Choose the naming strategy that best fits the brief; vary types.',
  short: 'Short & punchy: 4–6 letters, one or two syllables.',
  premium: 'Premium/luxury: elegant, calm, confident. Soft endings, real or Latin-feeling roots.',
  tech: 'Technology-forward: crisp consonants, modern coined words; avoid clichés like "-ify".',
  invented: 'Invented words: new, ownable, pronounceable coinages with no existing meaning.',
  human: 'Human & warm: approachable, friendly, real-word or soft coined names.',
  global: 'Global: trivially pronounceable worldwide; open syllables, no "th" or tricky clusters.',
  india: 'India-inspired: built from Hindi/Sanskrit/regional roots or Indian culture, but commercially usable worldwide. Always fill "origin".',
  seo: 'SEO-friendly: include a meaningful category word or close semantic cue so people searching the category find it; still brandable.',
  domain_first: 'Favour coined or blended names whose .com is likely unregistered. Avoid dictionary words and common compounds.',
};

export function namesPrompt(input: NameGenInput): string {
  const b = input.brief;
  const mode = NAME_MODES.find((m) => m.id === b.mode);
  const lines = [
    `Brief: ${b.description}`,
    b.industry && `Industry: ${b.industry}`,
    b.audience && `Audience: ${b.audience}`,
    b.geography && `Geography: ${b.geography}`,
    b.personalities.length && `Brand personality: ${b.personalities.join(', ')}`,
    b.styles.length && `Name styles wanted: ${b.styles.join(', ')}`,
    `Mode: ${mode?.label ?? b.mode} — ${MODE_GUIDANCE[b.mode] ?? ''}`,
    b.constraints?.maxLength && `Maximum length: ${b.constraints.maxLength} letters`,
    b.constraints?.startsWith && `Every name must start with "${b.constraints.startsWith}"`,
    b.constraints?.avoidLetters && `Avoid these letters entirely: ${b.constraints.avoidLetters.split('').join(', ')}`,
    b.constraints?.mustInclude && `Include "${b.constraints.mustInclude}" somewhere in each name`,
    input.refinements?.length && `Refine towards: ${input.refinements.join(', ')}`,
    input.feedback && `User feedback on the last batch: "${input.feedback}"`,
    input.liked?.length && `Names the user liked (go in this direction, do not repeat): ${input.liked.join(', ')}`,
    input.exclude?.length && `Exclude (already shown): ${input.exclude.slice(0, 120).join(', ')}`,
    `Return exactly ${input.count} names.`,
  ];
  return lines.filter(Boolean).join('\n');
}

export const KIT_SYSTEM = `You are the brand strategist and designer inside GoBrandToday.
You turn a chosen name into a complete starter Brand Bible that a founder can use today.

Visual identity — propose FOUR looks the founder will choose between, like a design studio's first
presentation. They must be genuinely different: four different logo styles (from the list), four clearly
different base hues (at least 60° apart), different font pairings, and different symbols. Give each look
a short evocative title (not the style name) and a one or two sentence concept that ties the form to the
brand's meaning. Order them best-fit first.

Symbols: at least TWO of the four looks must carry a symbol you design yourself in "symbolSvg":
- SVG shapes only (path, circle, ellipse, rect, polygon, line, g), inside a 100×100 box, no <svg> wrapper.
- Colours ONLY as palette roles: fill="brand", fill="accent", fill="ink", fill="paper" or fill="none"
  (same for stroke). Two or three colours at most.
- Simple, bold and memorable at 32px: 2–6 shapes, no text, no gradients, no thin hairlines (stroke ≥ 6).
- Draw an idea from the brand (its meaning, product or origin), not a generic swoosh, globe or lightbulb.
For looks without a custom symbol set symbolSvg to "". For "symbol" and "emblem" styles without a custom
symbol, pick a generative "symbolFamily"; otherwise use "none".

Also write the brand "essence" (a one-line promise and three values, each with what it means in practice)
and a "moodboard" of four imagery directions: a short caption for the guidelines plus a detailed prompt an
image model could render (subject, setting, light, palette mood, camera; no text or logos in the image).
Our system turns each look into a full kit (contrast-checked palette from your hue, logo lockups, icon,
mockups and usage rules).

Voice: three words separated by " · " (e.g. "Light · Clever · Quietly magical"), with
concrete "say" lines and crossed-out "not" lines.

Writing rules: specific, warm and plain. No jargon, no hype words ("revolutionary",
"synergy", "cutting-edge"). Short sentences. Write for the stated geography; India-first by default
(₹ pricing, Indian cultural cues where natural) without stereotypes.
Never claim trademark clearance, guaranteed SEO rankings or guaranteed success.`;

const STYLE_LIST = Object.values(LOGO_STYLE_META)
  .map((m) => `${m.id} — ${m.construction} Best for: ${m.fit.join(', ')}`)
  .join('\n');
const FONT_LIST = Object.values(FONT_TRIOS)
  .map((t) => `${t.id} (${t.display.family} + ${t.body.family})`)
  .join('; ');
const FAMILY_LIST = Object.entries(SYMBOL_META)
  .map(([k, v]) => `${k} (${v.idea})`)
  .join('; ');
const MARK_LIST = Object.entries(MARK_PATHS)
  .map(([k, v]) => `${k} (${v.meaning})`)
  .join('; ');

export function kitPrompt(input: KitGenInput): string {
  const b = input.brief;
  const lines = [
    `Brand name: ${input.name}`,
    `Brief: ${b.description || 'not provided — infer a sensible positioning from the name'}`,
    b.industry && `Industry: ${b.industry}`,
    b.audience && `Audience: ${b.audience}`,
    b.geography && `Geography: ${b.geography}`,
    b.personalities?.length && `Personality: ${b.personalities.join(', ')}`,
    input.domain && `Domain: ${input.domain}`,
    input.handle && `Handle: @${input.handle}`,
    `Logo styles (style):\n${STYLE_LIST}`,
    `Marks (markShape, the small signature shape): ${MARK_LIST}`,
    `Font pairings (fontTrio): ${FONT_LIST}`,
    `Generative symbol families (symbolFamily): ${FAMILY_LIST}`,
    `Sections to write: ${input.sections.join(', ')}`,
    'Taglines: 6–8 options, each under 8 words. Content ideas: exactly 10. Looks: exactly 4. Website features: 3–4. FAQ: 4. X thread: 4–5 posts.',
    input.instruction && `Direction for this version: ${input.instruction}`,
    input.current && `Current brand (keep consistent with it):\n${summariseKit(input.current)}`,
  ];
  return lines.filter(Boolean).join('\n');
}

export const ASSISTANT_SYSTEM = `You are the AI Brand Assistant inside GoBrandToday. You help a founder refine the
brand they just created. Be brief, warm and concrete; reply in under 120 words unless they ask for long-form
content (a carousel, a campaign, a homepage), in which case put the full content in "reply" using simple markdown.

When the user asks to change something in the brand, set the matching field in "changes" and leave every other
field null. Examples: "make my tagline more premium" → taglines; "darker palette" → darkerPalette true (and/or hue);
"different symbol" → markShape; "a bolder / more premium / more Indian logo" → logoStyle; "rewrite my positioning" → positioning; "more Gen Z" → taglines, oneLiner,
voiceSummary and instagramBio. If they ask for alternative names, put up to 10 in "names".
Never invent domain or handle availability — tell them to use the Check button instead.`;

export function assistantPrompt(input: AssistantInput): string {
  const history = input.history
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'Founder' : 'Assistant'}: ${m.content}`)
    .join('\n');
  return [
    `Brand: ${input.name}`,
    `Brief: ${input.brief.description}`,
    `Current brand:\n${summariseKit(input.kit)}`,
    history && `Conversation so far:\n${history}`,
    `Founder: ${input.message}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function summariseKit(kit: BrandKit): string {
  return [
    `Positioning: ${kit.positioning}`,
    `One-liner: ${kit.messaging.oneLiner}`,
    `Voice: ${kit.voice.summary}`,
    `Taglines: ${kit.taglines.slice(0, 5).join(' | ')}`,
    `Logo: ${kit.identity.style} style${kit.identity.symbol?.family ? `, ${kit.identity.symbol.family} symbol` : kit.identity.symbol?.svg ? ', custom symbol' : `, ${kit.identity.mark.shape} mark`} — ${kit.identity.mark.concept}`,
    `Palette: ${kit.identity.palette.map((p) => `${p.role} ${p.name} ${p.hex}`).join(', ')}`,
    `Fonts: ${kit.identity.typography.display.family} / ${kit.identity.typography.body.family}`,
    `Archetype: ${kit.archetype.name}`,
  ].join('\n');
}

export function briefTitle(b: Partial<Brief>): string {
  const d = (b.description ?? '').trim();
  return d.length > 60 ? `${d.slice(0, 57)}…` : d || 'Untitled idea';
}
