import type { FastifyInstance } from 'fastify';
import { EXPERT_SERVICES, ExpertRequestSchema } from '@gbt/shared';
import { env } from '../config/env';
import { db, schema } from '../db/client';
import { httpFetch } from '../lib/http';
import { logger } from '../lib/logger';
import { parse } from '../lib/validate';
import { ensureUser } from '../plugins/auth';
import { analytics } from '../providers/analytics';

/** "Work with an expert": the service catalogue and request intake. */
export default async function expertRoutes(app: FastifyInstance) {
  app.get('/api/experts', { schema: { tags: ['experts'], summary: 'Bespoke services offered by human experts' } }, async () => ({ services: EXPERT_SERVICES }));

  app.post(
    '/api/experts/requests',
    { config: { rateLimit: { max: 5, timeWindow: '1 hour' } }, schema: { tags: ['experts'], summary: 'Request a bespoke service; an expert replies with a scope and quote' } },
    async (req, reply) => {
      const user = await ensureUser(req, reply);
      const body = parse(ExpertRequestSchema, req.body);
      const service = EXPERT_SERVICES.find((s) => s.id === body.service)!;
      const also = (body.also ?? []).filter((id) => id !== body.service && EXPERT_SERVICES.some((s) => s.id === id));
      // Only link a brand the requester owns.
      let brandId: string | null = null;
      if (body.brandId) {
        const b = await db.query.brands.findFirst({ where: (t, { and, eq }) => and(eq(t.id, body.brandId!), eq(t.userId, user.id)) });
        brandId = b?.id ?? null;
      }
      const [row] = await db
        .insert(schema.expertRequests)
        .values({
          userId: user.id,
          brandId,
          service: [service.id, ...also].join(','),
          name: body.name,
          email: body.email.toLowerCase(),
          phone: body.phone || null,
          budget: body.budget ?? null,
          timeline: body.timeline ?? null,
          details: body.details ?? null,
          currency: body.currency,
        })
        .returning({ id: schema.expertRequests.id });
      analytics.track('expert_requested', user.id, { service: service.id, also: also.join(',') });
      if (env.EXPERTS_WEBHOOK_URL) {
        // Fire-and-forget hand-off to the team's inbox/CRM. Never blocks the user.
        httpFetch(env.EXPERTS_WEBHOOK_URL, {
          method: 'POST',
          retries: 1,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            text: `New expert request: ${service.title}${also.length ? ` (+${also.join(', ')})` : ''} from ${body.name} <${body.email}>`,
            request: { id: row!.id, ...body, also, brandId },
          }),
        }).catch((err) => logger.warn({ err: (err as Error).message }, 'experts webhook failed'));
      }
      return { ok: true, id: row!.id, message: `Thanks, ${body.name.split(' ')[0]}. An expert will email you a scope and quote within one working day.` };
    },
  );
}
