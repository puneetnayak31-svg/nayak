import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { BrandKitSchema, CreateBrandRequestSchema, AssistantRequestSchema, planById, type BrandKit, type Brief } from '@gbt/shared';
import { count, eq } from 'drizzle-orm';
import { env } from '../config/env';
import { db, schema } from '../db/client';
import { AppError, limitReached } from '../lib/errors';
import { parse } from '../lib/validate';
import { ensureUser, regionOf } from '../plugins/auth';
import { KIT_SECTIONS, type KitSection } from '../providers/ai';
import { analytics } from '../providers/analytics';
import {
  askAssistant,
  chooseLook,
  moreLooks,
  assistantHistory,
  createBrand,
  getBrand,
  listBrands,
  publicBrand,
  regenerateSection,
  retryBrand,
  setSharing,
  toMarkdown,
  undo,
  updateKit,
  type Brand,
} from '../services/brand.service';
import { consume } from '../services/usage.service';

const KitPatch = BrandKitSchema.partial().extend({
  identity: BrandKitSchema.shape.identity.partial().optional(),
  messaging: BrandKitSchema.shape.messaging.partial().optional(),
  voice: BrandKitSchema.shape.voice.partial().optional(),
  website: BrandKitSchema.shape.website.partial().optional(),
  launch: z.any().optional(),
});
const Patch = z.object({
  kit: KitPatch.optional(),
  domain: z.string().max(80).optional(),
  handle: z.string().max(40).optional(),
  isPublic: z.boolean().optional(),
});
const Regenerate = z.object({ instruction: z.string().max(300).optional() });

/** Map spec-style endpoints (/api/brand/generate-taglines …) onto Brand Bible sections. */
const SECTION_ALIASES: Record<string, KitSection> = {
  'generate-guidelines': 'strategy',
  'generate-taglines': 'taglines',
  'generate-logo-concepts': 'identity',
  'generate-social-content': 'launch',
  'generate-website-copy': 'website',
};

function serialize(b: Brand) {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    domain: b.domain,
    handle: b.handle,
    brief: b.brief,
    kit: b.kit,
    score: b.score,
    domains: b.domains,
    socials: b.socials,
    status: b.status,
    error: b.error,
    source: b.source,
    version: b.version,
    isPublic: b.isPublic,
    shareSlug: b.shareSlug,
    projectId: b.projectId,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

export default async function brandRoutes(app: FastifyInstance) {
  const aiLimit = { config: { rateLimit: { max: env.AI_RATE_LIMIT_PER_MINUTE, timeWindow: '1 minute' } } };

  app.get('/api/brands', { schema: { tags: ['brands'], summary: 'My brands' } }, async (req) => {
    if (!req.user) return { brands: [] };
    const rows = await listBrands(req.user);
    return {
      brands: rows.map((r) => ({
        id: r.id,
        name: r.name,
        domain: r.domain,
        status: r.status,
        overall: r.score?.overall ?? null,
        palette: r.kit?.identity.palette ?? null,
        mark: r.kit?.identity.mark.shape ?? null,
        style: r.kit?.identity.style ?? null,
        seed: r.kit?.identity.seed ?? 0,
        fonts: r.kit?.identity.typography ?? null,
        tagline: r.kit?.taglines[0] ?? null,
        updatedAt: r.updatedAt,
      })),
    };
  });

  app.post('/api/brands', { ...aiLimit, schema: { tags: ['brands'], summary: 'Build a brand from a name (async — poll GET /api/brands/:id)', body: { type: 'object' } } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const body = parse(CreateBrandRequestSchema, req.body);
    const [{ n }] = (await db.select({ n: count() }).from(schema.brands).where(eq(schema.brands.userId, user.id))) as [{ n: number }];
    if (n >= planById(user.plan).limits.brandKits) {
      throw limitReached(user.isGuest ? 'Create a free account to build more brands.' : 'You’ve reached your plan’s brand limit. Go Pro to build up to 10.');
    }
    const brief = body.brief as Brief;
    const brand = await createBrand(user, { name: body.name, brief, projectId: body.projectId, domain: body.domain, handle: body.handle, region: regionOf(req) });
    analytics.track('name_selected', user.id, { name: body.name });
    return reply.code(202).send({ brand: serialize(brand) });
  });

  app.get('/api/brands/:id', { schema: { tags: ['brands'], summary: 'A brand with its full Brand Bible' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    return { brand: serialize(await getBrand(user, id)) };
  });

  app.patch('/api/brands/:id', { schema: { tags: ['brands'], summary: 'Edit the kit, domain, handle or sharing' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    const body = parse(Patch, req.body);
    let brand = await getBrand(user, id);
    if (body.domain !== undefined || body.handle !== undefined) {
      const [b] = await db
        .update(schema.brands)
        .set({ domain: body.domain ?? brand.domain, handle: body.handle ?? brand.handle, updatedAt: new Date() })
        .where(eq(schema.brands.id, brand.id))
        .returning();
      brand = b!;
    }
    if (body.kit) brand = await updateKit(user, id, body.kit as Partial<BrandKit>, 'Edited');
    if (body.isPublic !== undefined) brand = await setSharing(user, id, body.isPublic);
    return { brand: serialize(brand) };
  });

  app.delete('/api/brands/:id', { schema: { tags: ['brands'], summary: 'Delete a brand' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    const brand = await getBrand(user, id);
    await db.delete(schema.brands).where(eq(schema.brands.id, brand.id));
    return { ok: true };
  });

  app.post('/api/brands/:id/retry', { ...aiLimit, schema: { tags: ['brands'], summary: 'Retry a failed generation' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    return reply.code(202).send({ brand: serialize(await retryBrand(user, id, regionOf(req))) });
  });

  app.post('/api/brands/:id/sections/:section', { ...aiLimit, schema: { tags: ['brands'], summary: 'Regenerate one section: strategy | taglines | identity | launch | website' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id, section } = req.params as { id: string; section: string };
    if (!KIT_SECTIONS.includes(section as KitSection)) throw new AppError(400, 'bad_section', `Unknown section "${section}".`);
    const body = parse(Regenerate, req.body);
    await consume(user, 'assistant');
    return { brand: serialize(await regenerateSection(user, id, section as KitSection, body.instruction)) };
  });

  for (const [alias, section] of Object.entries(SECTION_ALIASES)) {
    app.post(`/api/brand/${alias}`, { ...aiLimit, schema: { tags: ['brands'], summary: `Alias: regenerate "${section}" for { brandId }` } }, async (req, reply) => {
      const user = await ensureUser(req, reply);
      const body = parse(Regenerate.extend({ brandId: z.string().uuid() }), req.body);
      await consume(user, 'assistant');
      return { brand: serialize(await regenerateSection(user, body.brandId, section, body.instruction)) };
    });
  }

  app.post('/api/brands/:id/look', { schema: { tags: ['brands'], summary: 'Pick one of the offered looks; the guidelines are rebuilt around it' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    const { lookId } = parse(z.object({ lookId: z.string().min(1).max(80) }), req.body);
    return { brand: serialize(await chooseLook(user, id, lookId)) };
  });

  app.post('/api/brands/:id/looks', { ...aiLimit, schema: { tags: ['brands'], summary: 'Offer four new looks' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    return { brand: serialize(await moreLooks(user, id)) };
  });

  app.post('/api/brands/:id/undo', { schema: { tags: ['brands'], summary: 'Undo the last change (versioned)' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    return { brand: serialize(await undo(user, id)) };
  });

  app.get('/api/brands/:id/assistant', { schema: { tags: ['assistant'], summary: 'Assistant history for a brand' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    const messages = await assistantHistory(user, id);
    return { messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content, meta: m.meta, createdAt: m.createdAt })) };
  });

  app.post('/api/brands/:id/assistant', { ...aiLimit, schema: { tags: ['assistant'], summary: 'Ask the AI Brand Assistant (may update the kit)' } }, async (req, reply) => {
    if (!env.FEATURE_ASSISTANT) throw new AppError(404, 'disabled', 'The assistant is turned off.');
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    const body = parse(AssistantRequestSchema, req.body);
    await consume(user, 'assistant');
    const out = await askAssistant(user, id, body.message);
    return { ...out, brand: serialize(out.brand) };
  });

  app.get('/api/brands/:id/export', { schema: { tags: ['brands'], summary: 'Export as json or md' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    const { format = 'json' } = req.query as { format?: string };
    const brand = await getBrand(user, id);
    if (!brand.kit) throw new AppError(409, 'not_ready', 'Your brand is still being built.');
    analytics.track('export', user.id, { format });
    if (format === 'md') {
      return reply
        .header('content-type', 'text/markdown; charset=utf-8')
        .header('content-disposition', `attachment; filename="${brand.slug}-brand-bible.md"`)
        .send(toMarkdown({ ...brand, kit: brand.kit }));
    }
    return reply
      .header('content-disposition', `attachment; filename="${brand.slug}-brand-bible.json"`)
      .send({ ...serialize(brand), exportedAt: new Date().toISOString(), generator: 'GoBrandToday' });
  });

  app.get('/api/public/brands/:slug', { schema: { tags: ['brands'], summary: 'A shared brand (read-only)' } }, async (req) => {
    const { slug } = req.params as { slug: string };
    const b = await publicBrand(slug);
    return { brand: { name: b.name, domain: b.domain, handle: b.handle, kit: b.kit, score: b.score, updatedAt: b.updatedAt } };
  });
}
