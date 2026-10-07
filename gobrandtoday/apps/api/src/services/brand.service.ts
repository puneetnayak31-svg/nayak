import { randomBytes } from 'node:crypto';
import {
  FONT_TRIOS,
  MARK_PATHS,
  generatePalette,
  scoreName,
  toSlug,
  type BrandKit,
  type Brief,
  type MarkShape,
} from '@gbt/shared';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { notFound } from '../lib/errors';
import { logger } from '../lib/logger';
import { ai, offlineAI, type AssistantOutput, type KitDraft, type KitSection } from '../providers/ai';
import { analytics } from '../providers/analytics';
import type { User } from './auth.service';
import { checkDomains } from './domain.service';
import { checkHandle } from './social.service';

export type Brand = typeof schema.brands.$inferSelect;

/* ------------------------------ kit assembly ------------------------------ */

/** Turn the model's draft into a complete kit: palette and type come from our system, not free text. */
export function assembleKit(name: string, brief: Brief, draft: KitDraft, opts: { dark?: boolean; seed?: string } = {}): BrandKit {
  const id = draft.identity;
  const trio = FONT_TRIOS[id.fontTrio] ?? FONT_TRIOS.grotesk!;
  const palette = generatePalette({ name, personalities: brief.personalities, industry: brief.industry, dark: opts.dark, seed: opts.seed });
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
    identity: {
      mark: { shape: id.markShape, concept: id.markConcept },
      wordmarkCase: 'lower',
      logoDirections: id.logoDirections,
      palette: rehue(palette, id.hue, name, brief, opts),
      typography: { display: trio.display, body: trio.body, data: trio.data },
      designSystem: id.designSystem,
      motion: id.motion,
      usageRules: id.usageRules,
    },
    launch: draft.launch,
    website: draft.website,
  };
}

/** Regenerate the palette around a chosen hue while keeping our contrast rules. */
function rehue(base: BrandKit['identity']['palette'], hue: number | undefined, name: string, brief: Brief, opts: { dark?: boolean; seed?: string }) {
  if (hue === undefined || !Number.isFinite(hue)) return base;
  return generatePalette({ name, personalities: brief.personalities, industry: brief.industry, dark: opts.dark, seed: opts.seed, hue });
}

/** Back-convert a kit into a draft so section regeneration can merge cleanly. */
function kitToDraft(kit: BrandKit): KitDraft {
  const trioId = Object.values(FONT_TRIOS).find((t) => t.display.family === kit.identity.typography.display.family)?.id ?? 'grotesk';
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
      markShape: kit.identity.mark.shape,
      markConcept: kit.identity.mark.concept,
      hue: Number.NaN,
      fontTrio: trioId,
      logoDirections: kit.identity.logoDirections,
      designSystem: kit.identity.designSystem,
      motion: kit.identity.motion,
      usageRules: kit.identity.usageRules,
    },
    launch: kit.launch,
    website: kit.website,
  };
}

async function draftFor(name: string, brief: Brief, sections: KitSection[], extra: { domain?: string; handle?: string; current?: BrandKit; instruction?: string }) {
  const input = { name, brief, sections, ...extra };
  if (ai.live) {
    try {
      return { draft: await ai.generateKit(input), source: 'ai' as const };
    } catch (err) {
      logger.warn({ err: (err as Error).message }, 'AI kit generation failed — using offline writer');
    }
  }
  return { draft: await offlineAI.generateKit(input), source: 'offline' as const };
}

/* ------------------------------- persistence ------------------------------ */

async function saveVersion(brand: Brand, kit: BrandKit, reason: string): Promise<Brand> {
  const version = brand.version + 1;
  await db.insert(schema.brandGuidelines).values({ brandId: brand.id, version, kit, reason });
  const [updated] = await db
    .update(schema.brands)
    .set({ kit, version, status: 'ready', error: null, updatedAt: new Date() })
    .where(eq(schema.brands.id, brand.id))
    .returning();
  return updated!;
}

export async function getBrand(user: User, id: string): Promise<Brand> {
  const brand = await db.query.brands.findFirst({ where: and(eq(schema.brands.id, id), eq(schema.brands.userId, user.id)) });
  if (!brand) throw notFound('Brand');
  return brand;
}

export async function listBrands(user: User) {
  return db
    .select({
      id: schema.brands.id,
      name: schema.brands.name,
      domain: schema.brands.domain,
      status: schema.brands.status,
      score: schema.brands.score,
      kit: schema.brands.kit,
      updatedAt: schema.brands.updatedAt,
    })
    .from(schema.brands)
    .where(eq(schema.brands.userId, user.id))
    .orderBy(desc(schema.brands.updatedAt));
}

/* ------------------------------- generation ------------------------------- */

export async function createBrand(
  user: User,
  input: { name: string; brief: Brief; projectId?: string; domain?: string; handle?: string; region: 'IN' | 'US' },
): Promise<Brand> {
  const [brand] = await db
    .insert(schema.brands)
    .values({
      userId: user.id,
      projectId: input.projectId ?? null,
      name: input.name.trim(),
      slug: toSlug(input.name),
      domain: input.domain ?? null,
      handle: input.handle ?? null,
      brief: input.brief,
      status: 'generating',
    })
    .returning();
  analytics.track('brand_created', user.id, { name: input.name });
  // Generate in the background; the client polls GET /api/brands/:id.
  void runGeneration(brand!, input.region);
  return brand!;
}

async function runGeneration(brand: Brand, region: 'IN' | 'US') {
  try {
    const tlds = brand.brief.tlds?.length ? brand.brief.tlds.slice(0, 5) : ['com', 'in', 'ai', 'io', 'co'];
    // Verify first, so the launch copy can use the real domain and handle.
    const [domains, socials] = await Promise.all([
      checkDomains(brand.name, tlds, region).catch(() => []),
      checkHandle(brand.handle ?? brand.name).catch(() => []),
    ]);
    const firstFree = domains.find((d) => d.status === 'available');
    const domain = brand.domain ?? firstFree?.domain ?? `${toSlug(brand.name)}.${tlds[0]}`;
    const handle = brand.handle ?? toSlug(brand.name);
    const kitResult = await draftFor(brand.name, brand.brief, ['strategy', 'taglines', 'identity', 'launch', 'website'], { domain, handle });
    const draft = kitResult.draft as KitDraft;
    const kit = assembleKit(brand.name, brand.brief, draft);
    const score = scoreName({ name: brand.name, brief: brand.brief.description, domains, socials, preferredTlds: tlds });
    await db
      .update(schema.brands)
      .set({ domains, socials, score, domain, handle, source: kitResult.source })
      .where(eq(schema.brands.id, brand.id));
    await db.insert(schema.brandScores).values({ brandId: brand.id, score, overall: score.overall });
    await saveVersion({ ...brand, domain, handle }, kit, 'Generated');
    analytics.track('brand_bible_generated', brand.userId, { source: kitResult.source });
  } catch (err) {
    logger.error({ err, brandId: brand.id }, 'brand generation failed');
    await db
      .update(schema.brands)
      .set({ status: 'failed', error: 'Something went wrong while building your brand. Please try again.' })
      .where(eq(schema.brands.id, brand.id));
  }
}

export async function retryBrand(user: User, id: string, region: 'IN' | 'US'): Promise<Brand> {
  const brand = await getBrand(user, id);
  const [b] = await db.update(schema.brands).set({ status: 'generating', error: null }).where(eq(schema.brands.id, brand.id)).returning();
  void runGeneration(b!, region);
  return b!;
}

/** Regenerate one part of the Brand Bible (taglines, launch kit, website copy…). */
export async function regenerateSection(user: User, id: string, section: KitSection, instruction?: string): Promise<Brand> {
  const brand = await getBrand(user, id);
  if (!brand.kit) throw notFound('Brand kit');
  const { draft } = await draftFor(brand.name, brand.brief, [section], {
    domain: brand.domain ?? undefined,
    handle: brand.handle ?? undefined,
    current: brand.kit,
    instruction,
  });
  const merged = { ...kitToDraft(brand.kit), ...draft } as KitDraft;
  let kit = assembleKit(brand.name, brand.brief, merged);
  // Keep the existing palette unless the identity itself was regenerated.
  if (section !== 'identity') kit = { ...kit, identity: { ...kit.identity, palette: brand.kit.identity.palette, typography: brand.kit.identity.typography } };
  return saveVersion(brand, kit, `Regenerated ${section}`);
}

/* ------------------------------- edits & undo ------------------------------ */

export async function updateKit(user: User, id: string, patch: Partial<BrandKit>, reason = 'Edited'): Promise<Brand> {
  const brand = await getBrand(user, id);
  if (!brand.kit) throw notFound('Brand kit');
  const kit: BrandKit = {
    ...brand.kit,
    ...patch,
    identity: { ...brand.kit.identity, ...(patch.identity ?? {}) },
    messaging: { ...brand.kit.messaging, ...(patch.messaging ?? {}) },
    voice: { ...brand.kit.voice, ...(patch.voice ?? {}) },
    launch: { ...brand.kit.launch, ...(patch.launch ?? {}), bios: { ...brand.kit.launch.bios, ...(patch.launch?.bios ?? {}) }, posts: { ...brand.kit.launch.posts, ...(patch.launch?.posts ?? {}) } },
    website: { ...brand.kit.website, ...(patch.website ?? {}) },
  };
  return saveVersion(brand, kit, reason);
}

export async function undo(user: User, id: string): Promise<Brand> {
  const brand = await getBrand(user, id);
  const versions = await db
    .select()
    .from(schema.brandGuidelines)
    .where(eq(schema.brandGuidelines.brandId, brand.id))
    .orderBy(desc(schema.brandGuidelines.version))
    .limit(2);
  const previous = versions[1];
  if (!previous) return brand;
  return saveVersion(brand, previous.kit, `Restored version ${previous.version}`);
}

/* -------------------------------- assistant -------------------------------- */

export function applyAssistantChanges(brand: Brand, changes: AssistantOutput['changes']): Partial<BrandKit> | null {
  const kit = brand.kit!;
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
    set('launch', {
      ...(patch.launch ?? kit.launch),
      bios: { ...kit.launch.bios, instagram: changes.instagramBio ?? kit.launch.bios.instagram },
      posts: {
        ...kit.launch.posts,
        instagram: changes.instagramPost ?? kit.launch.posts.instagram,
        linkedin: changes.linkedinPost ?? kit.launch.posts.linkedin,
        xThread: changes.xThread?.length ? changes.xThread : kit.launch.posts.xThread,
      },
    });
  }
  if (changes.websiteHeadline || changes.websiteSubheadline) {
    set('website', { ...kit.website, headline: changes.websiteHeadline ?? kit.website.headline, subheadline: changes.websiteSubheadline ?? kit.website.subheadline });
  }
  const identity = { ...kit.identity };
  let identityTouched = false;
  if (changes.markShape && MARK_PATHS[changes.markShape as MarkShape]) {
    identity.mark = { shape: changes.markShape as MarkShape, concept: `The full stop becomes a ${MARK_PATHS[changes.markShape as MarkShape].label.toLowerCase()} — ${MARK_PATHS[changes.markShape as MarkShape].meaning}.` };
    identityTouched = true;
  }
  if (changes.fontTrio && FONT_TRIOS[changes.fontTrio]) {
    const t = FONT_TRIOS[changes.fontTrio]!;
    identity.typography = { display: t.display, body: t.body, data: t.data };
    identityTouched = true;
  }
  if (changes.hue !== null && Number.isFinite(changes.hue)) {
    identity.palette = rehue(identity.palette, changes.hue, brand.name, brand.brief, { seed: String(Date.now()) });
    identityTouched = true;
  }
  if (changes.darkerPalette) {
    identity.palette = generatePalette({ name: brand.name, personalities: brand.brief.personalities, industry: brand.brief.industry, dark: true, seed: 'dark' });
    identityTouched = true;
  }
  if (identityTouched) set('identity', identity);
  return touched ? patch : null;
}

export async function assistantHistory(user: User, brandId: string) {
  await getBrand(user, brandId);
  return db.select().from(schema.aiMessages).where(eq(schema.aiMessages.brandId, brandId)).orderBy(asc(schema.aiMessages.createdAt)).limit(100);
}

export async function askAssistant(user: User, brandId: string, message: string) {
  const brand = await getBrand(user, brandId);
  if (!brand.kit) throw notFound('Brand kit');
  const history = (await assistantHistory(user, brandId)).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  const input = { name: brand.name, brief: brand.brief, kit: brand.kit, history, message };
  let out: AssistantOutput;
  let source: 'ai' | 'offline' = 'offline';
  if (ai.live) {
    try {
      out = await ai.assistant(input);
      source = 'ai';
    } catch (err) {
      logger.warn({ err: (err as Error).message }, 'assistant AI failed — offline reply');
      out = await offlineAI.assistant(input);
    }
  } else out = await offlineAI.assistant(input);

  const patch = applyAssistantChanges(brand, out.changes);
  const updated = patch ? await updateKit(user, brand.id, patch, `Assistant: ${message.slice(0, 60)}`) : brand;
  await db.insert(schema.aiMessages).values([
    { brandId, userId: user.id, role: 'user', content: message },
    { brandId, userId: user.id, role: 'assistant', content: out.reply, meta: { names: out.names, changed: patch ? Object.keys(patch) : [], source } },
  ]);
  analytics.track('assistant_message', user.id, { source, changed: !!patch });
  return { reply: out.reply, names: out.names, changed: patch ? Object.keys(patch) : [], source, brand: updated };
}

/* ------------------------------ sharing/export ----------------------------- */

export async function setSharing(user: User, id: string, isPublic: boolean): Promise<Brand> {
  const brand = await getBrand(user, id);
  const shareSlug = brand.shareSlug ?? `${brand.slug}-${randomBytes(4).toString('hex')}`;
  const [b] = await db.update(schema.brands).set({ isPublic, shareSlug }).where(eq(schema.brands.id, brand.id)).returning();
  return b!;
}

export async function publicBrand(slug: string): Promise<Brand> {
  const brand = await db.query.brands.findFirst({ where: and(eq(schema.brands.shareSlug, slug), eq(schema.brands.isPublic, true)) });
  if (!brand) throw notFound('Brand');
  return brand;
}

export function toMarkdown(brand: Brand): string {
  const k = brand.kit!;
  const lines = [
    `# ${k.name}`,
    `> ${k.taglines[0] ?? ''}`,
    '',
    `**Domain:** ${brand.domain ?? '—'} · **Handle:** @${brand.handle ?? toSlug(k.name)} · **GoBrand Score:** ${brand.score?.overall ?? '—'}/10`,
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
    `**Mark:** ${MARK_PATHS[k.identity.mark.shape].label} — ${k.identity.mark.concept}`,
    '',
    '### Logo directions',
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
    ...k.website.benefits.map((b) => `- ${b}`),
    '',
    '**FAQ**',
    ...k.website.faq.flatMap((f) => [`- **${f.q}** ${f.a}`]),
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
