import type { FastifyInstance } from 'fastify';
import { and, asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { BriefSchema, toSlug } from '@gbt/shared';
import { db, schema } from '../db/client';
import { notFound } from '../lib/errors';
import { parse } from '../lib/validate';
import { ensureUser } from '../plugins/auth';
import { briefTitle } from '../providers/ai/prompts';
import { analytics } from '../providers/analytics';

const SaveName = z.object({
  name: z.string().trim().min(1).max(40),
  projectId: z.string().uuid().optional(),
  data: z.record(z.string(), z.any()).optional(),
  favourite: z.boolean().optional(),
});
const UpdateSaved = z.object({ favourite: z.boolean().optional(), note: z.string().max(500).optional() });

export default async function projectRoutes(app: FastifyInstance) {
  app.get('/api/projects', { schema: { tags: ['projects'], summary: 'My projects (one per brief)' } }, async (req) => {
    if (!req.user) return { projects: [] };
    const projects = await db.select().from(schema.projects).where(eq(schema.projects.userId, req.user.id)).orderBy(desc(schema.projects.updatedAt)).limit(50);
    return { projects };
  });

  app.post('/api/projects', { schema: { tags: ['projects'], summary: 'Create a project from a brief' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const brief = parse(BriefSchema, req.body);
    const [p] = await db.insert(schema.projects).values({ userId: user.id, title: briefTitle(brief), brief }).returning();
    return reply.code(201).send({ project: p });
  });

  app.get('/api/projects/:id', { schema: { tags: ['projects'], summary: 'A project with every round of names' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    const project = await db.query.projects.findFirst({ where: and(eq(schema.projects.id, id), eq(schema.projects.userId, user.id)) });
    if (!project) throw notFound('Project');
    const names = await db.select().from(schema.brandNames).where(eq(schema.brandNames.projectId, id)).orderBy(desc(schema.brandNames.round), desc(schema.brandNames.overall));
    return { project, names: names.map((n) => ({ ...n.data, round: n.round })) };
  });

  app.delete('/api/projects/:id', { schema: { tags: ['projects'], summary: 'Delete a project' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    await db.delete(schema.projects).where(and(eq(schema.projects.id, id), eq(schema.projects.userId, user.id)));
    return { ok: true };
  });

  /* ------------------------------ saved names ------------------------------ */

  app.get('/api/saved', { schema: { tags: ['saved'], summary: 'Saved / favourite names' } }, async (req) => {
    if (!req.user) return { saved: [] };
    const saved = await db.select().from(schema.savedNames).where(eq(schema.savedNames.userId, req.user.id)).orderBy(desc(schema.savedNames.favourite), asc(schema.savedNames.createdAt));
    return { saved };
  });

  app.post('/api/saved', { schema: { tags: ['saved'], summary: 'Save a name to your shortlist' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const body = parse(SaveName, req.body);
    const [row] = await db
      .insert(schema.savedNames)
      .values({ userId: user.id, name: body.name, slug: toSlug(body.name), projectId: body.projectId ?? null, data: body.data ?? null, favourite: body.favourite ?? false })
      .onConflictDoUpdate({
        target: [schema.savedNames.userId, schema.savedNames.slug],
        set: { data: body.data ?? null, ...(body.favourite !== undefined ? { favourite: body.favourite } : {}) },
      })
      .returning();
    analytics.track('name_saved', user.id, { name: body.name });
    return { saved: row };
  });

  app.patch('/api/saved/:id', { schema: { tags: ['saved'], summary: 'Favourite or annotate a saved name' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    const body = parse(UpdateSaved, req.body);
    const [row] = await db.update(schema.savedNames).set(body).where(and(eq(schema.savedNames.id, id), eq(schema.savedNames.userId, user.id))).returning();
    if (!row) throw notFound('Saved name');
    return { saved: row };
  });

  app.delete('/api/saved/:id', { schema: { tags: ['saved'], summary: 'Remove a saved name' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    await db.delete(schema.savedNames).where(and(eq(schema.savedNames.id, id), eq(schema.savedNames.userId, user.id)));
    return { ok: true };
  });
}
