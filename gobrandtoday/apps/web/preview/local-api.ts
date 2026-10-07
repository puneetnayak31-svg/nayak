/**
 * The preview build's stand-in for the API server. Same routes, same shapes,
 * same business logic (offline name generator, GoBrand Score, kit assembly,
 * looks, assistant), with data kept in this browser. Domain and handle checks
 * use the clearly-labelled demo provider, because a sandboxed preview page
 * can't reach registries or social networks.
 */
import {
  BriefSchema,
  PLANS,
  SOCIAL_PLATFORM_IDS,
  buyLinks,
  handleAlternatives,
  hash32,
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
import { applyAssistantChanges, applyLook, assembleKit, freshOfflineLooks, kitToDraft, mergeKit, toMarkdown, withFreshLooks } from '../../api/src/services/kit';

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
  source: 'offline';
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
/** The preview is generous: Pro limits for everyone, still counted for the dashboard. */
function consume(kind: string, n = 1) {
  const db = load();
  db.usage[kind] = (db.usage[kind] ?? 0) + n;
  save();
}
function usage() {
  const db = load();
  const limits = planById('pro').limits;
  return Object.fromEntries(Object.entries(LIMITS).map(([k, l]) => [k, { used: db.usage[k] ?? 0, limit: limits[l] as number }]));
}

/* ------------------------------- demo checks ------------------------------- */

function region(): 'IN' | 'US' {
  try {
    return localStorage.getItem('gbt:currency') === 'USD' ? 'US' : 'IN';
  } catch {
    return 'IN';
  }
}

function checkDomains(name: string, tlds: string[]): DomainResult[] {
  const label = toSlug(name);
  return tlds.map((tld) => {
    const domain = `${label}.${tld}`;
    const h = hash32(domain) % 100;
    const takenBias = tld === 'com' ? 55 : tld === 'ai' ? 40 : 25;
    const status = h < takenBias ? 'taken' : h < takenBias + 6 ? 'premium' : 'available';
    return {
      domain,
      tld,
      status,
      source: 'demo',
      verified: false,
      note: 'Demo data — the full app checks the registry live.',
      checkedAt: now(),
      buyLinks: status === 'taken' ? [] : buyLinks(domain, region()),
    } satisfies DomainResult;
  });
}

function checkHandle(raw: string): SocialResult[] {
  const handle = normaliseHandle(raw);
  return SOCIAL_PLATFORM_IDS.map((platform) => {
    const v = validateHandle(platform, handle);
    if (!v.ok) return { platform, handle, status: 'invalid', method: 'demo', verified: false, url: profileUrl(platform, handle), note: v.reason, checkedAt: now() } satisfies SocialResult;
    const h = hash32(`${platform}:${handle}`) % 100;
    return {
      platform,
      handle,
      status: h < 45 ? 'taken' : 'available',
      method: 'demo',
      verified: false,
      url: profileUrl(platform, handle),
      note: 'Demo data — the full app verifies GitHub, Reddit and YouTube live.',
      checkedAt: now(),
    } satisfies SocialResult;
  });
}

/* -------------------------------- serialisers -------------------------------- */

function brandDTO(b: StoredBrand) {
  maybeFinish(b);
  const { versions: _v, messages: _m, readyAt: _r, ...rest } = b;
  return rest;
}

function maybeFinish(b: StoredBrand) {
  if (b.status === 'generating' && Date.now() >= b.readyAt) {
    const tlds = b.brief.tlds?.length ? b.brief.tlds.slice(0, 5) : ['com', 'in', 'ai', 'io', 'co'];
    const domains = checkDomains(b.name, tlds);
    const socials = checkHandle(b.handle ?? b.name);
    const domain = b.domain ?? domains.find((d) => d.status === 'available')?.domain ?? `${toSlug(b.name)}.${tlds[0]}`;
    const handle = b.handle ?? toSlug(b.name);
    const draft = KitDraftSchema.parse(generateOfflineKit({ name: b.name, brief: b.brief, sections: ['strategy', 'taglines', 'identity', 'launch', 'website'], domain, handle })) as KitDraft;
    const kit = assembleKit(b.name, b.brief, draft);
    Object.assign(b, {
      domains,
      socials,
      domain,
      handle,
      kit,
      score: scoreName({ name: b.name, brief: b.brief.description, domains, socials, preferredTlds: tlds }),
      status: 'ready',
      version: 1,
      versions: [kit],
      updatedAt: now(),
    });
    save();
  }
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

on('GET', '/api/system', () => ({
  mode: 'demo',
  ai: { provider: 'offline', live: false },
  domains: { provider: 'demo', live: false },
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
  if (u.email !== String(body.email ?? '').toLowerCase() || u.passwordHash !== (await hashPw(body.password ?? ''))) {
    throw new ApiError(401, 'invalid_credentials', 'That email and password don’t match. (In this preview, accounts live in this browser.)');
  }
  return { user: u };
});
on('POST', '/api/auth/logout', () => {
  const db = load();
  if (db.user) Object.assign(db.user, { isGuest: true, email: null, name: null, passwordHash: undefined });
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
function generate(body: any, refine: boolean) {
  me();
  const brief = BriefSchema.parse(body.brief);
  const count = Math.min(40, Math.max(4, body.count ?? 18));
  consume('generation');
  const raw = generateOfflineNames({ brief, count, feedback: body.feedback, refinements: body.refinements, exclude: body.exclude, liked: body.liked });
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
      relevance: r.relevance,
      source: 'offline' as const,
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
  return { projectId: p.id, round: p.rounds, names, source: 'offline' as const, notice: refine ? undefined : undefined };
}
on('POST', '/api/brand/generate-names', async ({ body }) => {
  await wait(900);
  return generate(body, false);
});
on('POST', '/api/brand/refine-names', async ({ body }) => {
  await wait(900);
  return generate(body, true);
});
on('POST', '/api/brand/domain-first', async ({ body }) => {
  await wait(1400);
  const brief = BriefSchema.parse(body.brief);
  const tld = brief.tlds[0] ?? 'com';
  const res = generate({ ...body, brief: { ...brief, mode: 'domain_first' }, count: 30 }, false);
  const keep = res.names
    .map((n) => ({ ...n, domains: checkDomains(n.name, [...new Set([tld, ...brief.tlds])].slice(0, 4)) }))
    .filter((n) => n.domains[0]!.status === 'available')
    .slice(0, 10)
    .map((n) => ({ ...n, score: scoreName({ name: n.name, brief: brief.description, relevance: n.relevance, domains: n.domains, preferredTlds: brief.tlds }) }));
  return { ...res, names: keep, checked: res.names.length };
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
    maybeFinish(b);
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
  await wait(1100);
  const b = findBrand(params.id);
  if (!b.kit) throw new ApiError(409, 'not_ready', 'Still building.');
  saveVersion(b, withFreshLooks(b.kit, b.brief, freshOfflineLooks(b.kit, b.brief, Date.now() % 1_000_000)));
  return { brand: brandDTO(b) };
});
on('POST', '/api/brands/:id/sections/:section', async ({ params, body }) => {
  await wait(900);
  const b = findBrand(params.id);
  if (!b.kit) throw new ApiError(409, 'not_ready', 'Still building.');
  const section = params.section as KitSection;
  const draft = generateOfflineKit({ name: b.name, brief: { ...b.brief, description: `${b.brief.description}${body.instruction ? ` (${body.instruction})` : ''}` }, sections: [section], domain: b.domain ?? undefined, handle: b.handle ?? undefined, seed: Date.now() % 100000 });
  const merged = { ...kitToDraft(b.kit), ...draft } as KitDraft;
  if (section === 'identity') saveVersion(b, withFreshLooks(b.kit, b.brief, freshOfflineLooks(b.kit, b.brief, Date.now() % 1_000_000)));
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
  await wait(900);
  const b = findBrand(params.id);
  if (!b.kit) throw new ApiError(409, 'not_ready', 'Still building.');
  consume('assistant');
  const out = offlineAssistant({ name: b.name, brief: b.brief, kit: b.kit, history: b.messages.map((m) => ({ role: m.role, content: m.content })), message: body.message });
  const patch = applyAssistantChanges(b.kit, b.brief, out.changes);
  if (patch) saveVersion(b, mergeKit(b.kit, patch));
  const changed = patch ? Object.keys(patch) : [];
  b.messages.push({ id: uid(), role: 'user', content: body.message, meta: null, createdAt: now() });
  b.messages.push({ id: uid(), role: 'assistant', content: out.reply, meta: { names: out.names, changed, source: 'offline' }, createdAt: now() });
  save();
  return { reply: out.reply, names: out.names, changed, source: 'offline', brand: brandDTO(b) };
});
on('GET', '/api/public/brands/:slug', ({ params }) => {
  const b = load().brands.find((x) => x.shareSlug === params.slug && x.isPublic);
  if (!b) throw new ApiError(404, 'not_found', 'Brand not found.');
  return { brand: { name: b.name, domain: b.domain, handle: b.handle, kit: b.kit, score: b.score, updatedAt: b.updatedAt } };
});

on('GET', '/api/brands/:id/export', ({ params, query }) => {
  const b = findBrand(params.id);
  if (!b.kit) throw new ApiError(409, 'not_ready', 'Still building.');
  return query.get('format') === 'md' ? brandMarkdown(b.id) : JSON.stringify(brandDTO(b), null, 2);
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
