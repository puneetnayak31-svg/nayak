import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parse } from '../lib/validate';
import { ANALYTICS_EVENTS, analytics } from '../providers/analytics';

/** Client-side events (e.g. a registrar link was clicked). Only known event names are accepted. */
const ClientEvent = z.object({
  name: z.enum(ANALYTICS_EVENTS),
  props: z.record(z.string(), z.union([z.string().max(200), z.number(), z.boolean()])).optional(),
});

export default async function eventRoutes(app: FastifyInstance) {
  app.post('/api/events', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } }, schema: { tags: ['system'], summary: 'Track a product event' } }, async (req) => {
    const body = parse(ClientEvent, req.body);
    analytics.track(body.name, req.user?.id ?? null, body.props);
    return { ok: true };
  });
}
