import { env } from '../../config/env';
import { db, schema } from '../../db/client';
import { httpFetch } from '../../lib/http';
import { logger } from '../../lib/logger';

export const ANALYTICS_EVENTS = [
  'user_signed_up',
  'user_logged_in',
  'brand_created',
  'names_generated',
  'names_refined',
  'name_selected',
  'name_saved',
  'domain_checked',
  'domain_clicked',
  'social_checked',
  'brand_bible_generated',
  'logo_downloaded',
  'export',
  'purchase_link_clicked',
  'assistant_message',
  'plan_interest',
] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export interface AnalyticsProvider {
  track(event: AnalyticsEvent, userId: string | null, props?: Record<string, unknown>): void;
}

class DbAnalytics implements AnalyticsProvider {
  track(event: AnalyticsEvent, userId: string | null, props?: Record<string, unknown>) {
    db.insert(schema.analyticsEvents)
      .values({ name: event, userId, props: props ?? null })
      .catch((err) => logger.warn({ err: err.message }, 'analytics insert failed'));
  }
}

class PostHogAnalytics implements AnalyticsProvider {
  constructor(
    private readonly key: string,
    private readonly host: string,
  ) {}
  track(event: AnalyticsEvent, userId: string | null, props?: Record<string, unknown>) {
    httpFetch(`${this.host.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      timeoutMs: 3000,
      retries: 0,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ api_key: this.key, event, distinct_id: userId ?? 'anonymous', properties: props ?? {} }),
    }).catch((err) => logger.debug({ err: (err as Error).message }, 'posthog capture failed'));
  }
}

class LogAnalytics implements AnalyticsProvider {
  track(event: AnalyticsEvent, userId: string | null, props?: Record<string, unknown>) {
    logger.info({ event, userId, props }, 'analytics');
  }
}

class NoAnalytics implements AnalyticsProvider {
  track() {}
}

function create(): AnalyticsProvider {
  switch (env.ANALYTICS_PROVIDER) {
    case 'posthog':
      return env.POSTHOG_API_KEY ? new PostHogAnalytics(env.POSTHOG_API_KEY, env.POSTHOG_HOST) : new DbAnalytics();
    case 'log':
      return new LogAnalytics();
    case 'none':
      return new NoAnalytics();
    default:
      return new DbAnalytics();
  }
}

/** Fire-and-forget: analytics never slows down or fails a user request. */
export const analytics: AnalyticsProvider = create();
