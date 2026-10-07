import { randomUUID } from 'node:crypto';
import { scoreName, toSlug, type Brief, type GenerateNamesRequest, type NameCandidate } from '@gbt/shared';
import { eq, sql } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { logger } from '../lib/logger';
import { ai, offlineAI, type RawName } from '../providers/ai';
import { briefTitle } from '../providers/ai/prompts';
import { checkDomains } from './domain.service';
import type { User } from './auth.service';

export interface NamesResult {
  projectId: string;
  round: number;
  names: NameCandidate[];
  source: 'ai' | 'offline';
  notice?: string;
}

function toCandidate(raw: RawName, brief: Brief, source: 'ai' | 'offline'): NameCandidate | null {
  const name = raw.name.trim().replace(/\.(com|in|ai|io|co)$/i, '').replace(/^@/, '');
  if (!toSlug(name) || toSlug(name).length > 20) return null;
  return {
    id: randomUUID(),
    name,
    rationale: raw.rationale,
    nameType: raw.nameType,
    pronunciation: raw.pronunciation,
    personality: raw.personality.slice(0, 3),
    origin: raw.origin || undefined,
    relevance: Math.max(0, Math.min(10, raw.relevance)),
    tagline: raw.tagline?.trim() || undefined,
    meaning: raw.meaning?.trim() || undefined,
    whyItWorks: raw.whyItWorks?.filter(Boolean).slice(0, 3),
    watchOut: raw.watchOut?.trim() || undefined,
    source,
    score: scoreName({ name, brief: brief.description, relevance: raw.relevance, preferredTlds: brief.tlds }),
  };
}

/** Enforce hard constraints even if a model ignores them. */
function passesConstraints(c: NameCandidate, brief: Brief, exclude: Set<string>): boolean {
  const slug = toSlug(c.name);
  const k = brief.constraints ?? {};
  if (exclude.has(slug)) return false;
  if (k.maxLength && slug.length > k.maxLength) return false;
  if (k.startsWith && !slug.startsWith(k.startsWith.toLowerCase())) return false;
  if (k.avoidLetters && [...k.avoidLetters.toLowerCase()].some((ch) => slug.includes(ch))) return false;
  if (k.mustInclude && !slug.includes(toSlug(k.mustInclude))) return false;
  if (c.score.risks.some((r) => r.level === 'high')) return false;
  return true;
}

async function rawNames(req: GenerateNamesRequest): Promise<{ raw: RawName[]; source: 'ai' | 'offline'; notice?: string }> {
  const input = { brief: req.brief, count: req.count, feedback: req.feedback, refinements: req.refinements, exclude: req.exclude, liked: req.liked };
  if (!ai.live) return { raw: await offlineAI.generateNames(input), source: 'offline' };
  try {
    return { raw: await ai.generateNames(input), source: 'ai' };
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'AI naming failed — using offline generator');
    return {
      raw: await offlineAI.generateNames(input),
      source: 'offline',
      notice: 'Our AI is busy, so these come from our offline generator. Try again in a moment for AI names.',
    };
  }
}

async function ensureProject(user: User, req: GenerateNamesRequest): Promise<{ id: string; round: number }> {
  if (req.projectId) {
    const p = await db.query.projects.findFirst({ where: eq(schema.projects.id, req.projectId) });
    if (p && p.userId === user.id) {
      const [u] = await db
        .update(schema.projects)
        .set({ rounds: sql`${schema.projects.rounds} + 1`, brief: req.brief, updatedAt: new Date() })
        .where(eq(schema.projects.id, p.id))
        .returning({ rounds: schema.projects.rounds });
      return { id: p.id, round: u!.rounds };
    }
  }
  const [p] = await db.insert(schema.projects).values({ userId: user.id, title: briefTitle(req.brief), brief: req.brief, rounds: 1 }).returning();
  return { id: p!.id, round: 1 };
}

export async function generateNames(user: User, req: GenerateNamesRequest): Promise<NamesResult> {
  const exclude = new Set((req.exclude ?? []).map(toSlug));
  const { raw, source, notice } = await rawNames(req);
  const seen = new Set<string>();
  const names = raw
    .map((r) => toCandidate(r, req.brief, source))
    .filter((c): c is NameCandidate => !!c && passesConstraints(c, req.brief, exclude))
    .filter((c) => (seen.has(toSlug(c.name)) ? false : (seen.add(toSlug(c.name)), true)))
    .sort((a, b) => b.score.overall - a.score.overall);

  const project = await ensureProject(user, req);
  if (names.length) {
    await db.insert(schema.brandNames).values(
      names.map((n) => ({ projectId: project.id, name: n.name, slug: toSlug(n.name), round: project.round, source: n.source, data: n, overall: n.score.overall })),
    );
  }
  return { projectId: project.id, round: project.round, names, source, notice };
}

/**
 * Domain-First: generate, check the primary TLD, keep only registrable names,
 * repeat (max 3 rounds) until we have enough. Fewer, better names.
 */
export async function generateDomainFirst(
  user: User,
  req: GenerateNamesRequest,
  region: 'IN' | 'US',
  onProgress?: (msg: string) => void,
): Promise<NamesResult & { checked: number }> {
  const target = Math.min(req.count, 12);
  const primaryTld = req.brief.tlds[0] ?? 'com';
  const tlds = [...new Set([primaryTld, ...req.brief.tlds])].slice(0, 4);
  const keep: NameCandidate[] = [];
  const exclude = new Set(req.exclude ?? []);
  let checked = 0;
  let last: NamesResult | undefined;
  for (let round = 0; round < 3 && keep.length < target; round++) {
    onProgress?.(`Round ${round + 1}: generating names…`);
    last = await generateNames(user, { ...req, brief: { ...req.brief, mode: 'domain_first' }, count: 24, exclude: [...exclude], projectId: last?.projectId ?? req.projectId });
    last.names.forEach((n) => exclude.add(n.name));
    const results = await Promise.all(last.names.map((n) => checkDomains(n.name, [primaryTld], region)));
    checked += results.length;
    last.names.forEach((n, i) => {
      if (results[i]![0]?.status === 'available' && keep.length < target) keep.push(n);
    });
    onProgress?.(`Round ${round + 1}: ${keep.length} registrable so far`);
  }
  // Fill in the remaining TLDs for the survivors and re-score with real data.
  const withDomains = await Promise.all(
    keep.map(async (n) => {
      const domains = await checkDomains(n.name, tlds, region);
      return { ...n, domains, score: scoreName({ name: n.name, brief: req.brief.description, relevance: n.relevance, domains, preferredTlds: req.brief.tlds }) };
    }),
  );
  return { ...(last as NamesResult), names: withDomains.sort((a, b) => b.score.overall - a.score.overall), checked };
}
