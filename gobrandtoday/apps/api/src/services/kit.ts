/**
 * Pure Brand Bible logic — no database, no network. Used by the API services
 * and by the in-browser preview build, so both behave identically.
 */
import {
  FONT_TRIOS,
  LOGO_STYLES,
  LOGO_STYLE_META,
  MARK_PATHS,
  buildLook,
  generateLooks,
  generatePalette,
  hash32,
  hexToRgb,
  lookFonts,
  toSlug,
  type BrandKit,
  type Brief,
  type GoBrandScore,
  type Look,
  type LogoStyle,
  type MarkShape,
} from '@gbt/shared';
import type { AssistantOutput, DraftLook, KitDraft } from '../providers/ai/types';

type Identity = BrandKit['identity'];

/* ---------------------------------- looks ---------------------------------- */

/** Turn the model's (or offline) look proposals into full looks: always 4, always different styles. */
export function completeLooks(name: string, brief: Brief, draft: DraftLook[], seed = hash32(name)): Look[] {
  const out: Look[] = [];
  const used = new Set<LogoStyle>();
  draft.forEach((d, i) => {
    if (out.length >= 4 || used.has(d.style) || !LOGO_STYLES.includes(d.style)) return;
    used.add(d.style);
    out.push(buildLook({ name, personalities: brief.personalities, industry: brief.industry }, d.style, d.hue, seed + i, { title: d.title, concept: d.concept, markShape: d.markShape }));
  });
  if (out.length < 4) {
    const extra = generateLooks({ name, personalities: brief.personalities, industry: brief.industry, geography: brief.geography, seed: seed + 97, exclude: [...used], count: 8 });
    for (const l of extra) {
      if (out.length >= 4) break;
      if (!used.has(l.style)) {
        used.add(l.style);
        out.push(l);
      }
    }
  }
  return out;
}

/** Everything in the identity that follows from the chosen look. */
export function identityFromLook(look: Look, base: Pick<Identity, 'designSystem' | 'motion'>, looks: Look[], chosen: boolean): Identity {
  const meta = LOGO_STYLE_META[look.style];
  const trio = lookFonts(look);
  const mark = MARK_PATHS[look.markShape];
  return {
    mark: { shape: look.markShape, concept: look.concept },
    wordmarkCase: 'lower',
    style: look.style,
    seed: look.seed,
    looks,
    lookChosen: chosen,
    logoDirections: [
      { name: 'Primary lockup', description: meta.construction },
      { name: 'Reversed', description: 'The same lockup on ink, with the accent colour taking the brand colour’s place.' },
      { name: 'App icon', description: 'A square tile for avatars, favicons and app stores.' },
      { name: 'Signature mark', description: `The ${mark.label.toLowerCase()}: ${mark.meaning}. Use it on its own as a bullet, loader or sticker.` },
    ],
    palette: look.palette,
    typography: { display: trio.display, body: trio.body, data: trio.data },
    designSystem: base.designSystem,
    motion: base.motion,
    usageRules: meta.usage,
  };
}

/** Assemble a complete kit. New brands start with looks offered but none chosen yet. */
export function assembleKit(name: string, brief: Brief, draft: KitDraft, opts: { seed?: number; chosen?: boolean } = {}): BrandKit {
  const looks = completeLooks(name, brief, draft.identity.looks, opts.seed);
  return {
    name,
    meaning: draft.strategy.meaning,
    story: draft.strategy.story,
    positioning: draft.strategy.positioning,
    mission: draft.strategy.mission,
    vision: draft.strategy.vision,
    audience: draft.strategy.audience,
    personality: draft.strategy.personality,
    archetype: draft.strategy.archetype,
    voice: draft.strategy.voice,
    taglines: draft.taglines,
    messaging: draft.strategy.messaging,
    identity: identityFromLook(looks[0]!, draft.identity, looks, opts.chosen ?? false),
    launch: draft.launch,
    website: draft.website,
  };
}

/** The user picked a look: rebuild the identity around it and mark it chosen. */
export function applyLook(kit: BrandKit, lookId: string): BrandKit {
  const look = kit.identity.looks.find((l) => l.id === lookId);
  if (!look) throw new Error('Unknown look');
  return { ...kit, identity: identityFromLook(look, kit.identity, kit.identity.looks, true) };
}

/** Offer four new looks (different from the current options). */
export function withFreshLooks(kit: BrandKit, brief: Brief, looks: Look[]): BrandKit {
  return { ...kit, identity: { ...kit.identity, looks, lookChosen: false } };
}

export function freshOfflineLooks(kit: BrandKit, brief: Brief, seed: number): Look[] {
  const current = kit.identity.looks.map((l) => l.style);
  return generateLooks({ name: kit.name, personalities: brief.personalities, industry: brief.industry, geography: brief.geography, seed, exclude: current });
}

/** Back-convert a kit into a draft so one section can be regenerated and merged. */
export function kitToDraft(kit: BrandKit): KitDraft {
  return {
    strategy: {
      meaning: kit.meaning,
      story: kit.story,
      positioning: kit.positioning,
      mission: kit.mission,
      vision: kit.vision,
      audience: { primary: kit.audience.primary, secondary: kit.audience.secondary ?? '', insights: kit.audience.insights },
      personality: kit.personality,
      archetype: kit.archetype,
      voice: kit.voice,
      messaging: kit.messaging,
    },
    taglines: kit.taglines,
    identity: {
      looks: kit.identity.looks.map((l) => ({ title: l.title, concept: l.concept, style: l.style, hue: l.hue, markShape: l.markShape })),
      designSystem: kit.identity.designSystem,
      motion: kit.identity.motion,
    },
    launch: kit.launch,
    website: kit.website,
  };
}

/* -------------------------------- assistant -------------------------------- */

export function hexToHue(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round(((h * 60) + 360) % 360);
}

/** Map typed assistant changes onto a kit patch. Returns null when nothing changed. */
export function applyAssistantChanges(kit: BrandKit, brief: Brief, changes: AssistantOutput['changes']): Partial<BrandKit> | null {
  const patch: Partial<BrandKit> = {};
  let touched = false;
  const set = <K extends keyof BrandKit>(k: K, v: BrandKit[K]) => {
    patch[k] = v;
    touched = true;
  };
  if (changes.taglines?.length) set('taglines', changes.taglines);
  if (changes.positioning) set('positioning', changes.positioning);
  if (changes.story) set('story', changes.story);
  if (changes.mission) set('mission', changes.mission);
  if (changes.vision) set('vision', changes.vision);
  if (changes.oneLiner) set('messaging', { ...kit.messaging, oneLiner: changes.oneLiner });
  if (changes.voiceSummary) set('voice', { ...kit.voice, summary: changes.voiceSummary });
  if (changes.contentIdeas?.length) set('launch', { ...kit.launch, contentIdeas: changes.contentIdeas });
  if (changes.instagramBio || changes.instagramPost || changes.linkedinPost || changes.xThread?.length) {
    const base = patch.launch ?? kit.launch;
    set('launch', {
      ...base,
      bios: { ...base.bios, instagram: changes.instagramBio ?? base.bios.instagram },
      posts: {
        ...base.posts,
        instagram: changes.instagramPost ?? base.posts.instagram,
        linkedin: changes.linkedinPost ?? base.posts.linkedin,
        xThread: changes.xThread?.length ? changes.xThread : base.posts.xThread,
      },
    });
  }
  if (changes.websiteHeadline || changes.websiteSubheadline) {
    set('website', { ...kit.website, headline: changes.websiteHeadline ?? kit.website.headline, subheadline: changes.websiteSubheadline ?? kit.website.subheadline });
  }

  let identity: Identity = { ...kit.identity };
  let identityTouched = false;
  const brandHex = identity.palette.find((p) => p.role === 'brand')?.hex ?? '#6D4AFF';
  if (changes.logoStyle && changes.logoStyle !== identity.style) {
    const look = buildLook({ name: kit.name, personalities: brief.personalities, industry: brief.industry }, changes.logoStyle, hexToHue(brandHex), identity.seed + 1, {});
    identity = identityFromLook(look, identity, [look, ...identity.looks.filter((l) => l.style !== look.style)].slice(0, 4), true);
    identityTouched = true;
  }
  if (changes.markShape && MARK_PATHS[changes.markShape as MarkShape]) {
    const m = MARK_PATHS[changes.markShape as MarkShape];
    identity.mark = { shape: changes.markShape as MarkShape, concept: `${identity.mark.concept.split('.')[0]}. Signature mark: the ${m.label.toLowerCase()} — ${m.meaning}.` };
    identityTouched = true;
  }
  if (changes.fontTrio && FONT_TRIOS[changes.fontTrio]) {
    const t = FONT_TRIOS[changes.fontTrio]!;
    identity.typography = { display: t.display, body: t.body, data: t.data };
    identityTouched = true;
  }
  if (changes.hue !== null && Number.isFinite(changes.hue)) {
    identity.palette = generatePalette({ name: kit.name, personalities: brief.personalities, industry: brief.industry, hue: changes.hue, seed: String(Date.now()) });
    identityTouched = true;
  }
  if (changes.darkerPalette) {
    identity.palette = generatePalette({ name: kit.name, personalities: brief.personalities, industry: brief.industry, dark: true, hue: hexToHue(brandHex), seed: 'dark' });
    identityTouched = true;
  }
  if (identityTouched) set('identity', identity);
  return touched ? patch : null;
}

/** Merge a partial kit patch (deep for the nested objects users edit). */
export function mergeKit(kit: BrandKit, patch: Partial<BrandKit>): BrandKit {
  return {
    ...kit,
    ...patch,
    identity: { ...kit.identity, ...(patch.identity ?? {}) },
    messaging: { ...kit.messaging, ...(patch.messaging ?? {}) },
    voice: { ...kit.voice, ...(patch.voice ?? {}) },
    launch: {
      ...kit.launch,
      ...(patch.launch ?? {}),
      bios: { ...kit.launch.bios, ...(patch.launch?.bios ?? {}) },
      posts: { ...kit.launch.posts, ...(patch.launch?.posts ?? {}) },
    },
    website: { ...kit.website, ...(patch.website ?? {}) },
  };
}

/* --------------------------------- export --------------------------------- */

export function toMarkdown(b: { name: string; domain: string | null; handle: string | null; score: GoBrandScore | null; kit: BrandKit }): string {
  const k = b.kit;
  const style = LOGO_STYLE_META[k.identity.style];
  const lines = [
    `# ${k.name}`,
    `> ${k.taglines[0] ?? ''}`,
    '',
    `**Domain:** ${b.domain ?? '—'} · **Handle:** @${b.handle ?? toSlug(k.name)} · **GoBrand Score:** ${b.score?.overall ?? '—'}/10`,
    '',
    '## Strategy',
    `**Meaning.** ${k.meaning}`,
    '',
    `**Story.** ${k.story}`,
    '',
    `**Positioning.** ${k.positioning}`,
    '',
    `**Mission.** ${k.mission}`,
    '',
    `**Vision.** ${k.vision}`,
    '',
    `**Audience.** ${k.audience.primary}${k.audience.secondary ? ` (also: ${k.audience.secondary})` : ''}`,
    ...k.audience.insights.map((i) => `- ${i}`),
    '',
    `**Personality.** ${k.personality.join(', ')}`,
    '',
    `**Archetype.** ${k.archetype.name} — ${k.archetype.description}`,
    '',
    '## Voice',
    `**${k.voice.summary}**`,
    '',
    ...k.voice.say.map((s) => `- Say: “${s}”`),
    ...k.voice.not.map((s) => `- Not: ~~${s}~~`),
    ...k.voice.principles.map((s) => `- ${s}`),
    '',
    '## Taglines',
    ...k.taglines.map((t) => `- ${t}`),
    '',
    '## Messaging',
    `- **One-liner:** ${k.messaging.oneLiner}`,
    `- **Short:** ${k.messaging.short}`,
    `- **Long:** ${k.messaging.long}`,
    `- **Elevator pitch:** ${k.messaging.elevatorPitch}`,
    '',
    '## Identity',
    `**Look:** ${style.title} — ${style.construction}`,
    '',
    `**Concept:** ${k.identity.mark.concept}`,
    '',
    `**Signature mark:** ${MARK_PATHS[k.identity.mark.shape].label}`,
    '',
    '### Lockups',
    ...k.identity.logoDirections.map((d) => `- **${d.name}:** ${d.description}`),
    '',
    '### Colour',
    '| Role | Name | HEX | Use |',
    '|---|---|---|---|',
    ...k.identity.palette.map((p) => `| ${p.role} | ${p.name} | \`${p.hex}\` | ${p.usage} |`),
    '',
    '### Typography (Google Fonts)',
    `- **Display:** ${k.identity.typography.display.family} — ${k.identity.typography.display.why}`,
    `- **Body:** ${k.identity.typography.body.family} — ${k.identity.typography.body.why}`,
    `- **Data:** ${k.identity.typography.data.family} — ${k.identity.typography.data.why}`,
    '',
    '### Design system',
    ...Object.entries(k.identity.designSystem).map(([key, v]) => `- **${key}:** ${v}`),
    '',
    '### Motion',
    `1. Idle — ${k.identity.motion.idle}`,
    `2. Thinking — ${k.identity.motion.thinking}`,
    `3. Mark — ${k.identity.motion.mark}`,
    `4. Done — ${k.identity.motion.done}`,
    '',
    '### Usage rules',
    `- **Clear space:** ${k.identity.usageRules.clearSpace}`,
    `- **Minimum size:** ${k.identity.usageRules.minSize}`,
    `- **Do:** ${k.identity.usageRules.do}`,
    `- **Don't:** ${k.identity.usageRules.dont}`,
    '',
    '### Looks we explored',
    ...k.identity.looks.map((l) => `- **${l.title}** (${LOGO_STYLE_META[l.style].title}): ${l.concept}`),
    '',
    '## Launch kit',
    `**Instagram bio**\n\n${k.launch.bios.instagram}`,
    '',
    `**X bio**\n\n${k.launch.bios.x}`,
    '',
    `**LinkedIn**\n\n${k.launch.bios.linkedin}`,
    '',
    `**YouTube**\n\n${k.launch.bios.youtube}`,
    '',
    `**Instagram post**\n\n${k.launch.posts.instagram}`,
    '',
    `**LinkedIn post**\n\n${k.launch.posts.linkedin}`,
    '',
    '**X thread**',
    ...k.launch.posts.xThread.map((t, i) => `${i + 1}. ${t}`),
    '',
    `**Announcement**\n\n${k.launch.posts.announcement}`,
    '',
    '**30 days of content**',
    ...k.launch.contentIdeas.map((c, i) => `${i + 1}. ${c}`),
    '',
    '## Website',
    `# ${k.website.headline}`,
    k.website.subheadline,
    '',
    `[${k.website.cta}]`,
    '',
    `**About.** ${k.website.about}`,
    '',
    ...k.website.features.map((f) => `- **${f.title}:** ${f.body}`),
    '',
    ...k.website.benefits.map((x) => `- ${x}`),
    '',
    '**FAQ**',
    ...k.website.faq.map((f) => `- **${f.q}** ${f.a}`),
    '',
    `**Contact:** ${k.website.contact}`,
    '',
    `SEO title: ${k.website.seoTitle}`,
    `Meta description: ${k.website.metaDescription}`,
    '',
    '---',
    '_Made with GoBrandToday. The GoBrand Score is guidance, not a guarantee of trademark clearance, search rankings or success._',
  ];
  return lines.join('\n');
}
