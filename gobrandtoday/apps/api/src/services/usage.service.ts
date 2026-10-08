import { planById, type PlanLimits } from '@gbt/shared';
import { and, eq, sql } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { limitReached } from '../lib/errors';
import type { User } from './auth.service';

export type UsageKind = 'generation' | 'domain_check' | 'social_check' | 'assistant';

const LIMIT_KEY: Record<UsageKind, keyof PlanLimits> = {
  generation: 'generationsPerDay',
  domain_check: 'domainChecksPerDay',
  social_check: 'socialChecksPerDay',
  assistant: 'assistantMessagesPerDay',
};

const MESSAGES: Record<UsageKind, string> = {
  generation: "You've used today's free naming rounds. Come back tomorrow, or go Pro for unlimited rounds.",
  domain_check: "You've hit today's domain-check limit. It resets at midnight.",
  social_check: "You've hit today's handle-check limit. It resets at midnight.",
  assistant: "You've used today's assistant messages. Go Pro for more.",
};

const today = () => new Date().toISOString().slice(0, 10);

/** Atomically count usage and enforce the plan's daily limit. */
export async function consume(user: User, kind: UsageKind, amount = 1): Promise<void> {
  const limit = planById(user.plan).limits[LIMIT_KEY[kind]] as number;
  const [row] = await db
    .insert(schema.usage)
    .values({ userId: user.id, kind, day: today(), count: amount })
    .onConflictDoUpdate({
      target: [schema.usage.userId, schema.usage.kind, schema.usage.day],
      set: { count: sql`${schema.usage.count} + ${amount}` },
    })
    .returning({ count: schema.usage.count });
  if (row && row.count > limit) {
    // Roll back this attempt so the counter reflects real usage.
    await db
      .update(schema.usage)
      .set({ count: sql`${schema.usage.count} - ${amount}` })
      .where(and(eq(schema.usage.userId, user.id), eq(schema.usage.kind, kind), eq(schema.usage.day, today())));
    throw limitReached(MESSAGES[kind]);
  }
}

/** Today's usage per daily quota, plus `brands` (total brand boxes against the plan's cap). */
export async function usageToday(user: User): Promise<Record<string, { used: number; limit: number }>> {
  const rows = await db
    .select()
    .from(schema.usage)
    .where(and(eq(schema.usage.userId, user.id), eq(schema.usage.day, today())));
  const limits = planById(user.plan).limits;
  const out: Record<string, { used: number; limit: number }> = {};
  for (const kind of Object.keys(LIMIT_KEY) as UsageKind[]) {
    out[kind] = { used: rows.find((r) => r.kind === kind)?.count ?? 0, limit: limits[LIMIT_KEY[kind]] as number };
  }
  // Brand boxes are a running total, not a daily count: shown beside the daily meters so people see what's left.
  const [b] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.brands).where(eq(schema.brands.userId, user.id));
  out.brands = { used: b?.n ?? 0, limit: limits.brandKits };
  return out;
}
