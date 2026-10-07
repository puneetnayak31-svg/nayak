import type { FastifyInstance } from 'fastify';
import { SocialBulkRequestSchema, SocialCheckRequestSchema, type SocialPlatformId } from '@gbt/shared';
import { parse } from '../lib/validate';
import { ensureUser, regionOf } from '../plugins/auth';
import { analytics } from '../providers/analytics';
import { alternatives, checkHandle } from '../services/social.service';
import { consume } from '../services/usage.service';

export default async function socialRoutes(app: FastifyInstance) {
  app.post('/api/social/check', { schema: { tags: ['social'], summary: 'Check a handle across platforms (+ verified alternatives)', body: { type: 'object' } } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const body = parse(SocialCheckRequestSchema, req.body);
    await consume(user, 'social_check');
    const platforms = body.platforms as SocialPlatformId[] | undefined;
    const results = await checkHandle(body.handle, platforms);
    const anyTaken = results.some((r) => r.status === 'taken' || r.status === 'manual');
    const alts = body.alternatives && anyTaken ? await alternatives(body.handle, regionOf(req)) : [];
    analytics.track('social_checked', user.id, { handle: body.handle });
    return { handle: results[0]?.handle ?? body.handle, results, alternatives: alts };
  });

  app.post('/api/social/check-bulk', { schema: { tags: ['social'], summary: 'Check several handles', body: { type: 'object' } } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const body = parse(SocialBulkRequestSchema, req.body);
    await consume(user, 'social_check', body.handles.length);
    const platforms = body.platforms as SocialPlatformId[] | undefined;
    const results = await Promise.all(body.handles.map(async (h) => ({ handle: h, results: await checkHandle(h, platforms) })));
    return { results };
  });
}
