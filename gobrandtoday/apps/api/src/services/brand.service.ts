import { randomBytes } from 'node:crypto';
import { scoreName, toSlug, type BrandKit, type Brief } from '@gbt/shared';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { notFound } from '../lib/errors';
import { logger } from '../lib/logger';
import { ai, offlineAI, type AssistantOutput, type KitDraft, type KitSection } from '../providers/ai';
import { analytics } from '../providers/analytics';
import type { User } from './auth.service';
import { checkDomains } from './domain.service';
import { checkHandle } from './social.service';
import { applyAssistantChanges, applyLook, assembleKit, completeLooks, freshOfflineLooks, kitToDraft, mergeKit, withFreshLooks } from './kit';

export { toMarkdown } from './kit';

export type Brand = typeof schema.brands.$inferSelect;

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
  let kit: BrandKit;
  if (section === 'identity') {
    // New looks to choose from; the current identity stays until the user picks.
    const looks = completeLooks(brand.name, brand.brief, merged.identity.looks, Date.now() % 100000);
    kit = withFreshLooks({ ...brand.kit, identity: { ...brand.kit.identity, designSystem: merged.identity.designSystem, motion: merged.identity.motion } }, brand.brief, looks);
  } else {
    const fresh = assembleKit(brand.name, brand.brief, merged);
    kit = { ...fresh, identity: brand.kit.identity };
  }
  return saveVersion(brand, kit, `Regenerated ${section}`);
}

/* ------------------------------- edits & undo ------------------------------ */

export async function updateKit(user: User, id: string, patch: Partial<BrandKit>, reason = 'Edited'): Promise<Brand> {
  const brand = await getBrand(user, id);
  if (!brand.kit) throw notFound('Brand kit');
  const kit = mergeKit(brand.kit, patch);
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

/* ---------------------------------- looks ---------------------------------- */

export async function chooseLook(user: User, id: string, lookId: string): Promise<Brand> {
  const brand = await getBrand(user, id);
  if (!brand.kit) throw notFound('Brand kit');
  if (!brand.kit.identity.looks.some((l) => l.id === lookId)) throw notFound('Look');
  return saveVersion(brand, applyLook(brand.kit, lookId), 'Chose a look');
}

/** Four new looks, different from the ones on screen. Uses the AI when available. */
export async function moreLooks(user: User, id: string): Promise<Brand> {
  const brand = await getBrand(user, id);
  if (!brand.kit) throw notFound('Brand kit');
  const seed = Date.now() % 1_000_000;
  let looks = freshOfflineLooks(brand.kit, brand.brief, seed);
  if (ai.live) {
    try {
      const { draft } = await draftFor(brand.name, brand.brief, ['identity'], {
        current: brand.kit,
        instruction: `Propose four new looks. Avoid these styles already shown: ${brand.kit.identity.looks.map((l) => l.style).join(', ')}.`,
      });
      if (draft.identity?.looks?.length) looks = completeLooks(brand.name, brand.brief, draft.identity.looks, seed);
    } catch (err) {
      logger.warn({ err: (err as Error).message }, 'AI looks failed — using offline looks');
    }
  }
  return saveVersion(brand, withFreshLooks(brand.kit, brand.brief, looks), 'More looks');
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

  const patch = applyAssistantChanges(brand.kit, brand.brief, out.changes);
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
