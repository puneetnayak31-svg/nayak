import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { BrandKit, Brief, DomainResult, GoBrandScore, NameCandidate, SocialResult } from '@gbt/shared';

const created = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updated = () => timestamp('updated_at', { withTimezone: true }).defaultNow().notNull();

/* ------------------------------- identity ------------------------------- */

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  name: text('name'),
  passwordHash: text('password_hash'),
  googleId: text('google_id').unique(),
  /** Guests get a real account row so their work is saved from the first click. */
  isGuest: boolean('is_guest').default(true).notNull(),
  plan: text('plan').default('free').notNull(),
  currency: text('currency').default('INR').notNull(),
  createdAt: created(),
  updatedAt: updated(),
});

export const sessions = pgTable(
  'sessions',
  {
    /** SHA-256 of the session token — the raw token only ever lives in the cookie. */
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    userAgent: text('user_agent'),
    createdAt: created(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  plan: text('plan').notNull(),
  status: text('status').notNull(), // active | trialing | past_due | cancelled
  provider: text('provider').notNull(), // razorpay | stripe | manual
  providerRef: text('provider_ref'),
  currency: text('currency').notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: created(),
});

export const usage = pgTable(
  'usage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    kind: text('kind').notNull(),
    day: date('day').notNull(),
    count: integer('count').default(0).notNull(),
  },
  (t) => [uniqueIndex('usage_user_kind_day').on(t.userId, t.kind, t.day)],
);

/* ------------------------------- projects ------------------------------- */

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    brief: jsonb('brief').$type<Brief>().notNull(),
    rounds: integer('rounds').default(0).notNull(),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [index('projects_user_idx').on(t.userId)],
);

/** Every generated candidate, per round — the history behind a project. */
export const brandNames = pgTable(
  'brand_names',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    round: integer('round').notNull(),
    source: text('source').notNull(),
    data: jsonb('data').$type<NameCandidate>().notNull(),
    overall: real('overall'),
    createdAt: created(),
  },
  (t) => [index('brand_names_project_idx').on(t.projectId)],
);

export const savedNames = pgTable(
  'saved_names',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    favourite: boolean('favourite').default(false).notNull(),
    note: text('note'),
    data: jsonb('data').$type<Partial<NameCandidate>>(),
    createdAt: created(),
  },
  (t) => [uniqueIndex('saved_user_slug').on(t.userId, t.slug)],
);

/* ---------------------------- verification log --------------------------- */

export const domainChecks = pgTable(
  'domain_checks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    domain: text('domain').notNull(),
    tld: text('tld').notNull(),
    status: text('status').notNull(),
    source: text('source').notNull(),
    verified: boolean('verified').notNull(),
    price: jsonb('price').$type<DomainResult['price']>(),
    note: text('note'),
    checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('domain_checks_domain_idx').on(t.domain, t.checkedAt)],
);

export const socialHandleChecks = pgTable(
  'social_handle_checks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    platform: text('platform').notNull(),
    handle: text('handle').notNull(),
    status: text('status').notNull(),
    method: text('method').notNull(),
    verified: boolean('verified').notNull(),
    note: text('note'),
    checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('social_checks_handle_idx').on(t.platform, t.handle, t.checkedAt)],
);

export const domainWatch = pgTable(
  'domain_watch',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    domain: text('domain').notNull(),
    lastStatus: text('last_status'),
    lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
    createdAt: created(),
  },
  (t) => [uniqueIndex('domain_watch_user_domain').on(t.userId, t.domain)],
);

/* --------------------------------- brands -------------------------------- */

export const brands = pgTable(
  'brands',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    domain: text('domain'),
    handle: text('handle'),
    brief: jsonb('brief').$type<Brief>().notNull(),
    kit: jsonb('kit').$type<BrandKit>(),
    score: jsonb('score').$type<GoBrandScore>(),
    domains: jsonb('domains').$type<DomainResult[]>(),
    socials: jsonb('socials').$type<SocialResult[]>(),
    /** generating | ready | failed */
    status: text('status').default('generating').notNull(),
    error: text('error'),
    source: text('source'),
    version: integer('version').default(0).notNull(),
    shareSlug: text('share_slug').unique(),
    isPublic: boolean('is_public').default(false).notNull(),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [index('brands_user_idx').on(t.userId)],
);

/** Versioned Brand Bible snapshots — every assistant edit is undoable. */
export const brandGuidelines = pgTable(
  'brand_guidelines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brandId: uuid('brand_id')
      .references(() => brands.id, { onDelete: 'cascade' })
      .notNull(),
    version: integer('version').notNull(),
    kit: jsonb('kit').$type<BrandKit>().notNull(),
    reason: text('reason'),
    createdAt: created(),
  },
  (t) => [uniqueIndex('brand_guidelines_version').on(t.brandId, t.version)],
);

export const brandScores = pgTable('brand_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id')
    .references(() => brands.id, { onDelete: 'cascade' })
    .notNull(),
  score: jsonb('score').$type<GoBrandScore>().notNull(),
  overall: real('overall').notNull(),
  createdAt: created(),
});

/** Uploaded or generated files (logo renders, exports) — storage backend is pluggable. */
export const brandAssets = pgTable('brand_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id')
    .references(() => brands.id, { onDelete: 'cascade' })
    .notNull(),
  kind: text('kind').notNull(), // logo | icon | export
  format: text('format').notNull(), // svg | png | pdf | json | md
  url: text('url'),
  meta: jsonb('meta'),
  createdAt: created(),
});

export const aiMessages = pgTable(
  'ai_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brandId: uuid('brand_id')
      .references(() => brands.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    role: text('role').notNull(), // user | assistant
    content: text('content').notNull(),
    meta: jsonb('meta'),
    createdAt: created(),
  },
  (t) => [index('ai_messages_brand_idx').on(t.brandId, t.createdAt)],
);

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'),
    name: text('name').notNull(),
    props: jsonb('props'),
    createdAt: created(),
  },
  (t) => [index('analytics_name_idx').on(t.name, t.createdAt)],
);
