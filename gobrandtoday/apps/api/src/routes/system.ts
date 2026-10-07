import type { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';
import { PLANS, type SystemInfo } from '@gbt/shared';
import { env } from '../config/env';
import { db, schema } from '../db/client';
import { requireAdmin } from '../plugins/auth';
import { ai } from '../providers/ai';
import { billing } from '../providers/billing';
import { domainProviderInfo } from '../services/domain.service';
import { socialLive, socialProviderInfo } from '../services/social.service';

export function systemInfo(): SystemInfo {
  return {
    mode: env.DEMO_MODE ? 'demo' : 'live',
    ai: { provider: ai.id, model: ai.model, live: ai.live },
    domains: { provider: domainProviderInfo.id, live: domainProviderInfo.live },
    social: { live: socialLive, platforms: socialProviderInfo },
  };
}

export default async function systemRoutes(app: FastifyInstance) {
  app.get('/health', { schema: { tags: ['system'], summary: 'Liveness + database check' } }, async (_req, reply) => {
    try {
      await db.execute(sql`select 1`);
      return { ok: true };
    } catch {
      return reply.code(503).send({ ok: false });
    }
  });

  app.get('/api/system', { schema: { tags: ['system'], summary: 'Which providers are live (shown as badges in the UI)' } }, async () => ({
    ...systemInfo(),
    features: { assistant: env.FEATURE_ASSISTANT, domainFirst: env.FEATURE_DOMAIN_FIRST, googleLogin: env.FEATURE_GOOGLE_LOGIN && !!env.GOOGLE_CLIENT_ID },
    billing: { enabled: billing.enabled, provider: billing.id },
  }));

  app.get('/api/pricing', { schema: { tags: ['system'], summary: 'Plans in INR and USD' } }, async () => ({ plans: PLANS }));

  app.get('/api/admin/status', { schema: { tags: ['admin'], summary: 'Configuration, usage and provider health (admins only)' } }, async (req) => {
    requireAdmin(req);
    const [users] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.users);
    const [brands] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.brands);
    const usage = await db.execute(sql`select kind, sum(count)::int as total from usage where day >= current_date - 7 group by kind`);
    const events = await db.execute(sql`select name, count(*)::int as total from analytics_events where created_at > now() - interval '7 days' group by name order by total desc`);
    return {
      system: systemInfo(),
      config: {
        aiProvider: env.AI_PROVIDER,
        domainProvider: env.DOMAIN_PROVIDER,
        domainFallback: env.DOMAIN_FALLBACK_PROVIDER,
        socialProvider: env.SOCIAL_PROVIDER,
        profileProbes: env.SOCIAL_PROFILE_PROBES,
        analytics: env.ANALYTICS_PROVIDER,
        rateLimitPerMinute: env.RATE_LIMIT_PER_MINUTE,
        features: { assistant: env.FEATURE_ASSISTANT, domainFirst: env.FEATURE_DOMAIN_FIRST, googleLogin: env.FEATURE_GOOGLE_LOGIN },
      },
      totals: { users: users?.n ?? 0, brands: brands?.n ?? 0 },
      usageLast7Days: usage.rows,
      eventsLast7Days: events.rows,
    };
  });
}
