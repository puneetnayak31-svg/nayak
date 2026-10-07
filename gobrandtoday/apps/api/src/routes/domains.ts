import type { FastifyInstance } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { DomainBulkRequestSchema, DomainCheckRequestSchema } from '@gbt/shared';
import { db, schema } from '../db/client';
import { parse } from '../lib/validate';
import { ensureUser, regionOf } from '../plugins/auth';
import { analytics } from '../providers/analytics';
import { checkDomains, forgetDomains } from '../services/domain.service';
import { consume } from '../services/usage.service';

export default async function domainRoutes(app: FastifyInstance) {
  app.post('/api/domain/check', { schema: { tags: ['domains'], summary: 'Check one name across TLDs', body: { type: 'object' } } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const body = parse(DomainCheckRequestSchema.extend({ fresh: z.boolean().optional() }), req.body);
    await consume(user, 'domain_check', body.tlds.length);
    if (body.fresh) await forgetDomains(body.name, body.tlds);
    const results = await checkDomains(body.name, body.tlds, regionOf(req, body.region));
    analytics.track('domain_checked', user.id, { name: body.name, tlds: body.tlds.length });
    return { name: body.name, results };
  });

  app.post('/api/domain/check-bulk', { schema: { tags: ['domains'], summary: 'Check up to 12 names (shortlist) across TLDs', body: { type: 'object' } } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const body = parse(DomainBulkRequestSchema, req.body);
    await consume(user, 'domain_check', body.names.length * body.tlds.length);
    const region = regionOf(req, body.region);
    const results = await Promise.all(body.names.map(async (name) => ({ name, results: await checkDomains(name, body.tlds, region) })));
    analytics.track('domain_checked', user.id, { names: body.names.length, tlds: body.tlds.length });
    return { results };
  });

  /* ----------------------------- watchlist ----------------------------- */

  app.get('/api/watch', { schema: { tags: ['domains'], summary: 'Your domain watchlist' } }, async (req) => {
    if (!req.user) return { items: [] };
    const items = await db.select().from(schema.domainWatch).where(eq(schema.domainWatch.userId, req.user.id)).orderBy(desc(schema.domainWatch.createdAt));
    return { items };
  });

  app.post('/api/watch', { schema: { tags: ['domains'], summary: 'Watch a taken domain' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { domain, status } = parse(z.object({ domain: z.string().regex(/^[a-z0-9-]+(\.[a-z]{2,10})+$/), status: z.string().max(20).optional() }), req.body);
    const [item] = await db
      .insert(schema.domainWatch)
      .values({ userId: user.id, domain, lastStatus: status ?? null, lastCheckedAt: new Date() })
      .onConflictDoNothing()
      .returning();
    return { item: item ?? null };
  });

  app.post('/api/watch/:id/recheck', { schema: { tags: ['domains'], summary: 'Re-check a watched domain now' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    const item = await db.query.domainWatch.findFirst({ where: and(eq(schema.domainWatch.id, id), eq(schema.domainWatch.userId, user.id)) });
    if (!item) return reply.code(404).send({ error: { code: 'not_found', message: 'Not found' } });
    const [label, ...rest] = item.domain.split('.');
    await forgetDomains(label!, [rest.join('.')]);
    const [r] = await checkDomains(label!, [rest.join('.')], regionOf(req));
    const [updated] = await db.update(schema.domainWatch).set({ lastStatus: r!.status, lastCheckedAt: new Date() }).where(eq(schema.domainWatch.id, item.id)).returning();
    return { item: updated, result: r };
  });

  app.delete('/api/watch/:id', { schema: { tags: ['domains'], summary: 'Stop watching' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const { id } = req.params as { id: string };
    await db.delete(schema.domainWatch).where(and(eq(schema.domainWatch.id, id), eq(schema.domainWatch.userId, user.id)));
    return { ok: true };
  });
}
