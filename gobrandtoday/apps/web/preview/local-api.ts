/**
 * The preview build's stand-in for the API server. Same routes, same shapes,
 * same business logic (GoBrand Score, kit assembly, looks, assistant), with
 * data kept in this browser. Inside a Claude viewer, names, Brand Bibles,
 * logo symbols and the assistant come from Claude (see claude.ts); elsewhere
 * the offline engine answers. Domain and handle results are never claimed:
 * a sandboxed page can't reach registries or social networks, so every
 * result is "not checked" with a one-tap link and a labelled price estimate.
 */
import {
  BriefSchema,
  EXPERT_SERVICES,
  ExpertRequestSchema,
  PLANS,
  SOCIAL_PLATFORM_IDS,
  buyLinks,
  handleAlternatives,
  normaliseHandle,
  planById,
  profileUrl,
  scoreName,
  toSlug,
  validateHandle,
  type BrandKit,
  type Brief,
  type DomainResult,
  type GoBrandScore,
  type NameCandidate,
  type SocialResult,
} from '@gbt/shared';
import { generateOfflineKit } from '../../api/src/providers/ai/offline/kit';
import { generateOfflineNames } from '../../api/src/providers/ai/offline/names';
import { offlineAssistant } from '../../api/src/providers/ai/offline/assistant';
import { KitDraftSchema, type KitDraft, type KitSection } from '../../api/src/providers/ai/types';
import { briefTitle } from '../../api/src/providers/ai/prompts';
import { applyAssistantChanges, applyLook, assembleKit, completeLooks, freshOfflineLooks, kitToDraft, mergeKit, toMarkdown, withFreshLooks } from '../../api/src/services/kit';
import { aiAssistant, aiAvailable, aiErrorNotice, aiKit, aiNames, getSample } from './claude';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/* --------------------------------- storage --------------------------------- */

interface User {
  id: string;
  email: string | null;
  name: string | null;
  isGuest: boolean;
  plan: string;
  currency: 'INR' | 'USD';
  passwordHash?: string;
  createdAt: string;
}
interface Project {
  id: string;
  title: string;
  brief: Brief;
  rounds: number;
  updatedAt: string;
  names: Array<NameCandidate & { round: number }>;
}
interface StoredBrand {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  handle: string | null;
  brief: Brief;
  kit: BrandKit | null;
  score: GoBrandScore | null;
  domains: DomainResult[] | null;
  socials: SocialResult[] | null;
  status: 'generating' | 'ready' | 'failed';
  error: string | null;
  source: 'ai' | 'offline';
  version: number;
  versions: BrandKit[];
  isPublic: boolean;
  shareSlug: string | null;
  projectId: string | null;
  readyAt: number;
  createdAt: string;
  updatedAt: string;
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; meta: unknown; createdAt: string }>;
}
interface DB {
  user: User | null;
  projects: Project[];
  saved: Array<{ id: string; name: string; slug: string; favourite: boolean; note: string | null; data: unknown; projectId: string | null; createdAt: string }>;
  brands: StoredBrand[];
  watch: Array<{ id: string; domain: string; lastStatus: string | null; lastCheckedAt: string | null }>;
  usage: Record<string, number>;
  day: string;
  experts?: Array<Record<string, unknown>>;
}

const KEY = 'gbt-preview-v2';
let memory: DB | null = null;
const empty = (): DB => ({ user: null, projects: [], saved: [], brands: [], watch: [], usage: {}, day: today() });
function today() {
  return new Date().toISOString().slice(0, 10);
}
function load(): DB {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    memory = raw ? (JSON.parse(raw) as DB) : empty();
  } catch {
    memory = empty();
  }
  if (memory.day !== today()) memory = { ...memory, usage: {}, day: today() };
  return memory;
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* storage blocked — keep working in memory */
  }
}
export function resetPreview() {
  memory = empty();
  save();
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const now = () => new Date().toISOString();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function me(): User {
  const db = load();
  if (!db.user) {
    let currency: 'INR' | 'USD' = 'INR';
    try {
      currency = localStorage.getItem('gbt:currency') === 'USD' ? 'USD' : 'INR';
    } catch {
      /* ignore */
    }
    db.user = { id: uid(), email: null, name: null, isGuest: true, plan: 'free', currency, createdAt: now() };
    save();
  }
  return db.user;
}

const LIMITS: Record<string, keyof (typeof PLANS)[number]['limits']> = {
  generation: 'generationsPerDay',
  domain_check: 'domainChecksPerDay',
  social_check: 'socialChecksPerDay',
  assistant: 'assistantMessagesPerDay',
};
/** Counted for the account menu and dashboard against the user's plan. The preview doesn't block when a limit is hit. */
function consume(kind: string, n = 1) {
  const db = load();
  db.usage[kind] = (db.usage[kind] ?? 0) + n;
  save();
}
function usage() {
  const db = load();
  const limits = planById(me().plan).limits;
  const daily = Object.fromEntries(Object.entries(LIMITS).map(([k, l]) => [k, { used: db.usage[k] ?? 0, limit: limits[l] as number }]));
  return { ...daily, brands: { used: db.brands.length, limit: limits.brandKits } };
}

/** The demo Pro account (also seeded in the full app by `npm run db:seed-demo`). */
export const DEMO_PRO = { email: 'demo@gobrandtoday.com', password: 'GoBrand@Pro2026', name: 'Demo Founder' } as const;

/* ------------------------------- demo checks ------------------------------- */

function region(): 'IN' | 'US' {
  try {
    return localStorage.getItem('gbt:currency') === 'USD' ? 'US' : 'IN';
  } catch {
    return 'IN';
  }
}

/**
 * The preview runs inside a sandbox that can't reach registries or social
 * platforms, so it never claims anything is free or taken. Every result is
 * "not checked" with a typical price and a one-tap link to see it live.
 */
function checkDomains(name: string, tlds: string[]): DomainResult[] {
  const label = toSlug(name);
  return tlds.map((tld) => {
    const domain = `${label}.${tld}`;
    return {
      domain,
      tld,
      status: 'unknown',
      source: 'demo',
      verified: false,
      note: 'Preview build: live registry checks run on the server version.',
      checkedAt: now(),
      buyLinks: buyLinks(domain, region()),
    } satisfies DomainResult;
  });
}

function checkHandle(raw: string): SocialResult[] {
  const handle = normaliseHandle(raw);
  return SOCIAL_PLATFORM_IDS.map((platform) => {
    const v = validateHandle(platform, handle);
    if (!v.ok) return { platform, handle, status: 'invalid', method: 'demo', verified: false, url: profileUrl(platform, handle), note: v.reason, checkedAt: now() } satisfies SocialResult;
    return {
      platform,
      handle,
      status: 'manual',
      method: 'demo',
      verified: false,
      url: profileUrl(platform, handle),
      note: 'Preview build: tap to see the profile. The server version verifies GitHub, Reddit and YouTube automatically.',
      checkedAt: now(),
    } satisfies SocialResult;
  });
}

/* -------------------------------- serialisers -------------------------------- */

function brandDTO(b: StoredBrand) {
  ensureJob(b);
  const { versions: _v, messages: _m, readyAt: _r, ...rest } = b;
  return rest;
}

const ALL_SECTIONS: KitSection[] = ['strategy', 'taglines', 'identity', 'launch', 'website'];
const jobs = new Map<string, Promise<void>>();
const withTimeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej({ code: 'timeout', message: 'Took too long' }), ms))]);

/** Build the Brand Bible in the background: Claude when available, otherwise the offline writer. */
function ensureJob(b: StoredBrand) {
  if (b.status !== 'generating' || jobs.has(b.id)) return;
  const job = (async () => {
    const tlds = b.brief.tlds?.length ? b.brief.tlds.slice(0, 5) : ['com', 'in', 'ai', 'io', 'co'];
    const domains = checkDomains(b.name, tlds);
    const socials = checkHandle(b.handle ?? b.name);
    const domain = b.domain ?? `${toSlug(b.name)}.${tlds[0]}`;
    const handle = b.handle ?? toSlug(b.name).replace(/-/g, '');
    const input = { name: b.name, brief: b.brief, sections: ALL_SECTIONS, domain, handle };
    const offline = KitDraftSchema.parse(generateOfflineKit(input)) as KitDraft;
    let draft = offline;
    let source: 'ai' | 'offline' = 'offline';
    if (await getSample()) {
      try {
        const ai = await withTimeout(aiKit(input), 240_000);
        draft = { ...offline, ...ai } as KitDraft;
        source = Object.keys(ai).length >= 3 ? 'ai' : 'offline';
      } catch {
        /* offline draft stands */
      }
    } else {
      await wait(Math.max(0, b.readyAt - Date.now()));
    }
    const kit = assembleKit(b.name, b.brief, draft);
    Object.assign(b, {
      domains,
      socials,
      domain,
      handle,
      kit,
      source,
      score: scoreName({ name: b.name, brief: b.brief.description, domains, socials, preferredTlds: tlds }),
      status: 'ready',
      version: 1,
      versions: [kit],
      updatedAt: now(),
    });
    save();
  })().finally(() => jobs.delete(b.id));
  jobs.set(b.id, job);
}

function findBrand(id: string): StoredBrand {
  const b = load().brands.find((x) => x.id === id);
  if (!b) throw new ApiError(404, 'not_found', 'Brand not found.');
  return b;
}

function saveVersion(b: StoredBrand, kit: BrandKit) {
  b.kit = kit;
  b.version += 1;
  b.versions.push(kit);
  b.updatedAt = now();
  save();
}

/* ---------------------------------- router ---------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (args: { body: any; params: any; query: URLSearchParams }) => unknown | Promise<unknown>;
const routes: Array<[string, string, Handler]> = [];
const on = (method: string, pattern: string, h: Handler) => routes.push([method, pattern, h]);

on('GET', '/api/system', async () => ({
  mode: 'demo',
  ai: (await aiAvailable()) ? { provider: 'anthropic', model: 'Claude (your account)', live: true } : { provider: 'offline', live: false },
  domains: { provider: 'demo', live: false },
  images: { provider: 'none', live: false },
  social: { live: false, platforms: Object.fromEntries(SOCIAL_PLATFORM_IDS.map((p) => [p, 'demo'])) },
  features: { assistant: true, domainFirst: true, googleLogin: false },
  billing: { enabled: false, provider: 'none' },
}));
on('GET', '/api/pricing', () => ({ plans: PLANS }));
on('POST', '/api/events', () => ({ ok: true }));

on('GET', '/api/auth/me', () => {
  const u = me();
  const { passwordHash: _p, ...pub } = u;
  return { user: pub, usage: usage() };
});
async function hashPw(pw: string) {
  try {
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
    return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
  } catch {
    return `plain:${pw}`;
  }
}
on('POST', '/api/auth/signup', async ({ body }) => {
  const u = me();
  if (!body.email || !/@/.test(body.email)) throw new ApiError(400, 'bad_request', 'Enter a valid email.');
  if ((body.password ?? '').length < 8) throw new ApiError(400, 'bad_request', 'Use at least 8 characters for your password.');
  Object.assign(u, { email: String(body.email).toLowerCase(), name: body.name ?? null, isGuest: false, passwordHash: await hashPw(body.password) });
  save();
  return { user: u };
});
on('POST', '/api/auth/login', async ({ body }) => {
  const u = me();
  if (String(body.email ?? '').toLowerCase() === DEMO_PRO.email && body.password === DEMO_PRO.password) {
    Object.assign(u, { email: DEMO_PRO.email, name: DEMO_PRO.name, isGuest: false, plan: 'pro', passwordHash: await hashPw(DEMO_PRO.password) });
    save();
    return { user: u };
  }
  if (u.email !== String(body.email ?? '').toLowerCase() || u.passwordHash !== (await hashPw(body.password ?? ''))) {
    throw new ApiError(401, 'invalid_credentials', 'That email and password don’t match. (In this preview, accounts live in this browser.)');
  }
  return { user: u };
});
on('POST', '/api/auth/logout', () => {
  const db = load();
  if (db.user) Object.assign(db.user, { isGuest: true, email: null, name: null, plan: 'free', passwordHash: undefined });
  save();
  return { ok: true };
});
on('PATCH', '/api/me', ({ body }) => {
  const u = me();
  if (body.name !== undefined) u.name = body.name;
  if (body.currency === 'INR' || body.currency === 'USD') u.currency = body.currency;
  save();
  return { user: u };
});

/* names */
async function generate(body: any, refine: boolean, opts: { allowAI?: boolean } = {}) {
  me();
  const brief = BriefSchema.parse(body.brief);
  const count = Math.min(40, Math.max(4, body.count ?? 18));
  consume('generation');
  const input = { brief, count, feedback: body.feedback, refinements: body.refinements, exclude: body.exclude, liked: body.liked };
  let raw = null as ReturnType<typeof generateOfflineNames> | null;
  let source: 'ai' | 'offline' = 'offline';
  let notice: string | undefined;
  if (opts.allowAI !== false && (await getSample())) {
    try {
      raw = await withTimeout(aiNames(input), 150_000);
      source = 'ai';
    } catch (e) {
      notice = aiErrorNotice(e) || undefined;
    }
  }
  raw ??= generateOfflineNames(input);
  const exclude = new Set((body.exclude ?? []).map(toSlug));
  const k = brief.constraints ?? {};
  const names: NameCandidate[] = raw
    .map((r) => ({
      id: uid(),
      name: r.name,
      rationale: r.rationale,
      nameType: r.nameType,
      pronunciation: r.pronunciation,
      personality: r.personality,
      origin: r.origin || undefined,
      relevance: Math.max(0, Math.min(10, r.relevance)),
      tagline: r.tagline || undefined,
      meaning: r.meaning || undefined,
      whyItWorks: r.whyItWorks?.slice(0, 3),
      watchOut: r.watchOut || undefined,
      source,
      score: scoreName({ name: r.name, brief: brief.description, relevance: r.relevance, preferredTlds: brief.tlds }),
    }))
    .filter((n) => !exclude.has(toSlug(n.name)) && (!k.maxLength || toSlug(n.name).length <= k.maxLength))
    .sort((a, b) => b.score.overall - a.score.overall);
  const db = load();
  let p = body.projectId ? db.projects.find((x) => x.id === body.projectId) : undefined;
  if (!p) {
    p = { id: uid(), title: briefTitle(brief), brief, rounds: 0, updatedAt: now(), names: [] };
    db.projects.unshift(p);
  }
  p.rounds += 1;
  p.brief = brief;
  p.updatedAt = now();
  p.names.push(...names.map((n) => ({ ...n, round: p!.rounds })));
  save();
  return { projectId: p.id, round: p.rounds, names, source, notice: refine && !notice ? undefined : notice };
}
on('POST', '/api/brand/generate-names', async ({ body }) => {
  if (!(await getSample())) await wait(900);
  return generate(body, false);
});
on('POST', '/api/brand/refine-names', async ({ body }) => {
  if (!(await getSample())) await wait(900);
  return generate(body, true);
});
on('POST', '/api/brand/domain-first', async ({ body }) => {
  await wait(1400);
  const brief = BriefSchema.parse(body.brief);
  const tld = brief.tlds[0] ?? 'com';
  // The preview can't check domains, so Domain-First shows the most ownable coinages with
  // their (unchecked) domains rather than pretending to filter by availability.
  const res = await generate({ ...body, brief: { ...brief, mode: 'domain_first' }, count: 16 }, false);
  const keep = res.names
    .map((n) => ({ ...n, domains: checkDomains(n.name, [...new Set([tld, ...brief.tlds])].slice(0, 4)) }))
    .slice(0, 10)
    .map((n) => ({ ...n, score: scoreName({ name: n.name, brief: brief.description, relevance: n.relevance, domains: n.domains, preferredTlds: brief.tlds }) }));
  return { ...res, names: keep, checked: res.names.length, notice: 'Preview build: domains aren’t checked here. Tap any ending to see it at the registrar.' };
});

/* checks */
on('POST', '/api/domain/check', async ({ body }) => {
  await wait(500);
  me();
  consume('domain_check', (body.tlds ?? []).length);
  return { name: body.name, results: checkDomains(body.name, body.tlds ?? ['com', 'in', 'ai']) };
});
on('POST', '/api/social/check', async ({ body }) => {
  await wait(600);
  me();
  consume('social_check');
  const results = checkHandle(body.handle);
  const alts = body.alternatives
    ? handleAlternatives(body.handle, { region: region() }).map((h) => ({
        handle: h,
        verifiedOn: [] as string[],
        suggestion: true,
      }))
    : [];
  return { handle: results[0]?.handle ?? body.handle, results, alternatives: alts };
});

/* saved */
on('GET', '/api/saved', () => ({ saved: [...load().saved].sort((a, b) => Number(b.favourite) - Number(a.favourite)) }));
on('POST', '/api/saved', ({ body }) => {
  const db = load();
  const slug = toSlug(body.name);
  let row = db.saved.find((s) => s.slug === slug);
  if (!row) {
    row = { id: uid(), name: body.name, slug, favourite: !!body.favourite, note: null, data: body.data ?? null, projectId: body.projectId ?? null, createdAt: now() };
    db.saved.push(row);
  } else row.data = body.data ?? row.data;
  save();
  return { saved: row };
});
on('PATCH', '/api/saved/:id', ({ body, params }) => {
  const row = load().saved.find((s) => s.id === params.id);
  if (!row) throw new ApiError(404, 'not_found', 'Saved name not found.');
  Object.assign(row, body);
  save();
  return { saved: row };
});
on('DELETE', '/api/saved/:id', ({ params }) => {
  const db = load();
  db.saved = db.saved.filter((s) => s.id !== params.id);
  save();
  return { ok: true };
});

/* projects */
on('GET', '/api/projects', () => ({ projects: load().projects.map(({ names: _n, ...p }) => p) }));
on('GET', '/api/projects/:id', ({ params }) => {
  const p = load().projects.find((x) => x.id === params.id);
  if (!p) throw new ApiError(404, 'not_found', 'Project not found.');
  const { names, ...project } = p;
  return { project, names: [...names].sort((a, b) => b.round - a.round || b.score.overall - a.score.overall) };
});

/* brands */
on('GET', '/api/brands', () => ({
  brands: load().brands.map((b) => {
    ensureJob(b);
    return {
      id: b.id,
      name: b.name,
      domain: b.domain,
      status: b.status,
      overall: b.score?.overall ?? null,
      palette: b.kit?.identity.palette ?? null,
      mark: b.kit?.identity.mark.shape ?? null,
      style: b.kit?.identity.style ?? null,
      seed: b.kit?.identity.seed ?? 0,
      symbol: b.kit?.identity.symbol ?? null,
      case: b.kit?.identity.case ?? null,
      fonts: b.kit?.identity.typography ?? null,
      tagline: b.kit?.taglines[0] ?? null,
      updatedAt: b.updatedAt,
    };
  }),
}));
on('POST', '/api/brands', ({ body }) => {
  me();
  const brief = BriefSchema.parse({ personalities: [], styles: [], tlds: ['com', 'in', 'ai', 'io', 'co'], mode: 'smart', ...body.brief, description: body.brief?.description || `A new brand called ${body.name}` });
  const b: StoredBrand = {
    id: uid(),
    name: String(body.name).trim(),
    slug: toSlug(body.name),
    domain: body.domain ?? null,
    handle: body.handle ?? null,
    brief,
    kit: null,
    score: null,
    domains: null,
    socials: null,
    status: 'generating',
    error: null,
    source: 'offline',
    version: 0,
    versions: [],
    isPublic: false,
    shareSlug: null,
    projectId: body.projectId ?? null,
    readyAt: Date.now() + 3200,
    createdAt: now(),
    updatedAt: now(),
    messages: [],
  };
  load().brands.unshift(b);
  save();
  consume('generation');
  return { brand: brandDTO(b) };
});
on('GET', '/api/brands/:id', ({ params }) => ({ brand: brandDTO(findBrand(params.id)) }));
on('PATCH', '/api/brands/:id', ({ params, body }) => {
  const b = findBrand(params.id);
  if (body.domain !== undefined) b.domain = body.domain;
  if (body.handle !== undefined) b.handle = body.handle;
  if (body.kit && b.kit) saveVersion(b, mergeKit(b.kit, body.kit));
  if (body.isPublic !== undefined) {
    b.isPublic = !!body.isPublic;
    b.shareSlug ??= `${b.slug}-${uid().slice(0, 6)}`;
  }
  save();
  return { brand: brandDTO(b) };
});
on('DELETE', '/api/brands/:id', ({ params }) => {
  const db = load();
  db.brands = db.brands.filter((b) => b.id !== params.id);
  save();
  return { ok: true };
});
on('POST', '/api/brands/:id/retry', ({ params }) => {
  const b = findBrand(params.id);
  Object.assign(b, { status: 'generating', readyAt: Date.now() + 2500 });
  save();
  return { brand: brandDTO(b) };
});
on('POST', '/api/brands/:id/look', async ({ params, body }) => {
  await wait(700);
  const b = findBrand(params.id);
  if (!b.kit) throw new ApiError(409, 'not_ready', 'Still building.');
  saveVersion(b, applyLook(b.kit, body.lookId));
  return { brand: brandDTO(b) };
});
on('POST', '/api/brands/:id/looks', async ({ params }) => {
  const b = findBrand(params.id);
  if (!b.kit) throw new ApiError(409, 'not_ready', 'Still building.');
  const seed = Date.now() % 1_000_000;
  let looks = freshOfflineLooks(b.kit, b.brief, seed);
  if (await getSample()) {
    try {
      const draft = await withTimeout(
        aiKit({ name: b.name, brief: b.brief, sections: ['identity'], current: b.kit, instruction: `Propose four new looks with new custom symbols. Avoid these styles already shown: ${b.kit.identity.looks.map((l) => l.style).join(', ')}.` }),
        180_000,
      );
      if (draft.identity?.looks?.length) looks = completeLooks(b.name, b.brief, draft.identity.looks, seed);
    } catch {
      /* offline looks */
    }
  } else await wait(1100);
  saveVersion(b, withFreshLooks(b.kit, b.brief, looks));
  return { brand: brandDTO(b) };
});
on('POST', '/api/brands/:id/sections/:section', async ({ params, body }) => {
  const b = findBrand(params.id);
  if (!b.kit) throw new ApiError(409, 'not_ready', 'Still building.');
  const section = params.section as KitSection;
  let draft: Partial<KitDraft> | null = null;
  if (await getSample()) {
    try {
      draft = await withTimeout(aiKit({ name: b.name, brief: b.brief, sections: [section], domain: b.domain ?? undefined, handle: b.handle ?? undefined, current: b.kit, instruction: body.instruction }), 180_000);
    } catch {
      draft = null;
    }
  } else await wait(900);
  draft ??= generateOfflineKit({ name: b.name, brief: { ...b.brief, description: `${b.brief.description}${body.instruction ? ` (${body.instruction})` : ''}` }, sections: [section], domain: b.domain ?? undefined, handle: b.handle ?? undefined, seed: Date.now() % 100000 });
  const merged = { ...kitToDraft(b.kit), ...draft } as KitDraft;
  if (section === 'identity') {
    const looks = draft.identity?.looks?.length ? completeLooks(b.name, b.brief, draft.identity.looks, Date.now() % 100000) : freshOfflineLooks(b.kit, b.brief, Date.now() % 1_000_000);
    saveVersion(b, withFreshLooks({ ...b.kit, identity: { ...b.kit.identity, ...(draft.identity ? { designSystem: draft.identity.designSystem, essence: draft.identity.essence, moodboard: draft.identity.moodboard } : {}) } }, b.brief, looks));
  }
  else {
    const fresh = assembleKit(b.name, b.brief, merged);
    saveVersion(b, { ...fresh, identity: b.kit.identity });
  }
  return { brand: brandDTO(b) };
});
on('POST', '/api/brands/:id/undo', ({ params }) => {
  const b = findBrand(params.id);
  if (b.versions.length >= 2) {
    const prev = b.versions[b.versions.length - 2]!;
    saveVersion(b, prev);
  }
  return { brand: brandDTO(b) };
});
on('GET', '/api/brands/:id/assistant', ({ params }) => ({ messages: findBrand(params.id).messages }));
on('POST', '/api/brands/:id/assistant', async ({ params, body }) => {
  const b = findBrand(params.id);
  if (!b.kit) throw new ApiError(409, 'not_ready', 'Still building.');
  consume('assistant');
  const input = { name: b.name, brief: b.brief, kit: b.kit, history: b.messages.map((m) => ({ role: m.role, content: m.content })), message: body.message };
  let source: 'ai' | 'offline' = 'offline';
  let out = null as ReturnType<typeof offlineAssistant> | null;
  if (await getSample()) {
    try {
      out = await withTimeout(aiAssistant(input), 150_000);
      source = 'ai';
    } catch {
      out = null;
    }
  } else await wait(900);
  out ??= offlineAssistant(input);
  const patch = applyAssistantChanges(b.kit, b.brief, out.changes);
  if (patch) saveVersion(b, mergeKit(b.kit, patch));
  const changed = patch ? Object.keys(patch) : [];
  b.messages.push({ id: uid(), role: 'user', content: body.message, meta: null, createdAt: now() });
  b.messages.push({ id: uid(), role: 'assistant', content: out.reply, meta: { names: out.names, changed, source }, createdAt: now() });
  save();
  return { reply: out.reply, names: out.names, changed, source, brand: brandDTO(b) };
});
on('GET', '/api/public/brands/:slug', ({ params }) => {
  const b = load().brands.find((x) => x.shareSlug === params.slug && x.isPublic);
  if (!b) throw new ApiError(404, 'not_found', 'Brand not found.');
  return { brand: { name: b.name, domain: b.domain, handle: b.handle, kit: b.kit, score: b.score, updatedAt: b.updatedAt } };
});

on('GET', '/api/brands/:id/export', ({ params, query }) => {
  if (me().isGuest) throw new ApiError(401, 'unauthorized', 'Create a free account to do this.');
  const b = findBrand(params.id);
  if (!b.kit) throw new ApiError(409, 'not_ready', 'Still building.');
  return query.get('format') === 'md' ? brandMarkdown(b.id) : JSON.stringify(brandDTO(b), null, 2);
});

/* imagery: needs the server's image model */
on('POST', '/api/brands/:id/imagery', () => {
  throw new ApiError(501, 'not_in_preview', 'Image generation runs on the server version (free FLUX models). The preview can’t load external images.');
});

/* experts */
on('GET', '/api/experts', () => ({ services: EXPERT_SERVICES }));
on('POST', '/api/experts/requests', async ({ body }) => {
  await wait(700);
  const req = ExpertRequestSchema.parse(body);
  const db = load();
  db.experts = [{ id: uid(), ...req, createdAt: now() }, ...(db.experts ?? [])];
  save();
  return { ok: true, message: `Thanks, ${req.name.split(' ')[0]}. In the live product an expert emails you a scope and quote within one working day. (Preview: your request is saved in this browser only.)` };
});

/* watchlist */
on('GET', '/api/watch', () => ({ items: load().watch }));
on('POST', '/api/watch', ({ body }) => {
  const db = load();
  if (db.watch.some((w) => w.domain === body.domain)) return { item: null };
  const item = { id: uid(), domain: body.domain, lastStatus: body.status ?? null, lastCheckedAt: now() };
  db.watch.unshift(item);
  save();
  return { item };
});
on('POST', '/api/watch/:id/recheck', ({ params }) => {
  const w = load().watch.find((x) => x.id === params.id);
  if (!w) throw new ApiError(404, 'not_found', 'Not found.');
  const [label, ...rest] = w.domain.split('.');
  const [r] = checkDomains(label!, [rest.join('.')]);
  Object.assign(w, { lastStatus: r!.status, lastCheckedAt: now() });
  save();
  return { item: w, result: r };
});
on('DELETE', '/api/watch/:id', ({ params }) => {
  const db = load();
  db.watch = db.watch.filter((w) => w.id !== params.id);
  save();
  return { ok: true };
});

/** Markdown for the preview's "Copy Brand Bible" action. */
export function brandMarkdown(id: string): string {
  const b = findBrand(id);
  return b.kit ? toMarkdown({ name: b.name, domain: b.domain, handle: b.handle, score: b.score, kit: b.kit }) : '';
}

/* ----------------------------------- api ----------------------------------- */

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const method = opts.method ?? (opts.body !== undefined ? 'POST' : 'GET');
  const [p, q = ''] = path.split('?');
  for (const [m, pattern, handler] of routes) {
    if (m !== method) continue;
    const rp = pattern.split('/');
    const pp = p!.split('/');
    if (rp.length !== pp.length) continue;
    const params: Record<string, string> = {};
    if (!rp.every((seg, i) => (seg.startsWith(':') ? ((params[seg.slice(1)] = decodeURIComponent(pp[i]!)), true) : seg === pp[i]))) continue;
    try {
      return (await handler({ body: opts.body ?? {}, params, query: new URLSearchParams(q) })) as T;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      const msg = (err as { issues?: Array<{ message: string }> }).issues?.[0]?.message ?? (err as Error).message;
      throw new ApiError(400, 'bad_request', msg || 'Something went wrong.');
    }
  }
  throw new ApiError(404, 'not_found', `Not available in the preview: ${method} ${p}`);
}

export function track() {}
