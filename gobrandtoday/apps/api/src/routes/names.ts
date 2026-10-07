import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { BriefSchema, GenerateNamesRequestSchema, scoreName, type DomainResult, type SocialResult } from '@gbt/shared';
import { env } from '../config/env';
import { AppError } from '../lib/errors';
import { parse } from '../lib/validate';
import { ensureUser, regionOf } from '../plugins/auth';
import { analytics } from '../providers/analytics';
import { generateDomainFirst, generateNames } from '../services/naming.service';
import { consume } from '../services/usage.service';

const ScoreRequest = z.object({
  name: z.string().trim().min(1).max(40),
  brief: z.string().max(800).optional(),
  relevance: z.number().min(0).max(10).optional(),
  tlds: z.array(z.string()).max(10).optional(),
  domains: z.array(z.any()).max(12).optional(),
  socials: z.array(z.any()).max(12).optional(),
});

export default async function nameRoutes(app: FastifyInstance) {
  const aiLimit = { config: { rateLimit: { max: env.AI_RATE_LIMIT_PER_MINUTE, timeWindow: '1 minute' } } };

  const generate = async (req: FastifyRequest, reply: FastifyReply, refine: boolean) => {
    const user = await ensureUser(req, reply);
    const body = parse(GenerateNamesRequestSchema, req.body);
    await consume(user, 'generation');
    const result = await generateNames(user, body);
    analytics.track(refine ? 'names_refined' : 'names_generated', user.id, { mode: body.brief.mode, count: result.names.length, source: result.source });
    return result;
  };

  app.post('/api/brand/generate-names', { ...aiLimit, schema: { tags: ['names'], summary: 'Generate brand names from a brief', body: { type: 'object' } } }, (req, reply) =>
    generate(req, reply, false),
  );

  app.post('/api/brand/refine-names', { ...aiLimit, schema: { tags: ['names'], summary: 'Refine names conversationally (feedback, chips, constraints)', body: { type: 'object' } } }, (req, reply) =>
    generate(req, reply, true),
  );

  app.post('/api/brand/domain-first', { ...aiLimit, schema: { tags: ['names'], summary: 'Only names whose primary TLD is registrable right now' } }, async (req, reply) => {
    if (!env.FEATURE_DOMAIN_FIRST) throw new AppError(404, 'disabled', 'Domain-First search is turned off.');
    const user = await ensureUser(req, reply);
    const body = parse(GenerateNamesRequestSchema, req.body);
    await consume(user, 'generation');
    const result = await generateDomainFirst(user, body, regionOf(req));
    analytics.track('names_generated', user.id, { mode: 'domain_first', count: result.names.length, checked: result.checked });
    return result;
  });

  app.post('/api/brand/score', { schema: { tags: ['names'], summary: 'GoBrand Score for any name (optionally with check results)' } }, async (req) => {
    const body = parse(ScoreRequest, req.body);
    return scoreName({
      name: body.name,
      brief: body.brief,
      relevance: body.relevance,
      preferredTlds: body.tlds,
      domains: body.domains as DomainResult[] | undefined,
      socials: body.socials as SocialResult[] | undefined,
    });
  });

  // Exposed for clients that want to validate a brief before generating.
  app.post('/api/brand/validate-brief', { schema: { tags: ['names'], summary: 'Validate a brief' } }, async (req) => ({ brief: parse(BriefSchema, req.body) }));
}
