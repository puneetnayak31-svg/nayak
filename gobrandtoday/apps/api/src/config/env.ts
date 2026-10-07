import { z } from 'zod';

/**
 * All configuration comes from environment variables, validated once at boot.
 * Nothing secret is ever hard-coded or sent to the browser.
 */
const bool = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.string().default('info'),

  APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().default('postgres://gbt:gbt@localhost:5432/gobrandtoday'),
  DATABASE_SSL: bool,

  SESSION_SECRET: z.string().min(16).default('dev-only-session-secret-change-me'),
  COOKIE_SECURE: bool,
  COOKIE_DOMAIN: z.string().optional(),

  /** Demo mode forces mock domain + social providers. Everything is labelled "Demo". */
  DEMO_MODE: bool,

  AI_PROVIDER: z.enum(['auto', 'anthropic', 'openai', 'offline']).default('auto'),
  AI_MODEL: z.string().optional(),
  AI_EFFORT: z.enum(['low', 'medium', 'high']).default('medium'),
  AI_NAMES_EFFORT: z.enum(['low', 'medium', 'high']).default('low'),
  AI_TIMEOUT_MS: z.coerce.number().default(120_000),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-5'),

  DOMAIN_PROVIDER: z.enum(['rdap', 'godaddy', 'hostinger', 'namecheap', 'mock']).default('rdap'),
  DOMAIN_FALLBACK_PROVIDER: z.enum(['rdap', 'none']).default('rdap'),
  DOMAIN_TIMEOUT_MS: z.coerce.number().default(6_000),
  GODADDY_API_KEY: z.string().optional(),
  GODADDY_API_SECRET: z.string().optional(),
  GODADDY_ENV: z.enum(['production', 'ote']).default('production'),
  HOSTINGER_API_TOKEN: z.string().optional(),
  NAMECHEAP_API_USER: z.string().optional(),
  NAMECHEAP_API_KEY: z.string().optional(),
  NAMECHEAP_USERNAME: z.string().optional(),
  NAMECHEAP_CLIENT_IP: z.string().optional(),
  NAMECHEAP_SANDBOX: bool,
  AFFILIATE_HOSTINGER: z.string().optional(),
  AFFILIATE_GODADDY: z.string().optional(),
  AFFILIATE_NAMECHEAP: z.string().optional(),

  SOCIAL_PROVIDER: z.enum(['live', 'mock']).default('live'),
  SOCIAL_TIMEOUT_MS: z.coerce.number().default(5_000),
  SOCIAL_PROFILE_PROBES: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
  GITHUB_TOKEN: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  /** Public URL of the API as the browser sees it (for OAuth redirects). Defaults to APP_URL because the web app proxies /api. */
  PUBLIC_API_URL: z.string().url().optional(),

  ANALYTICS_PROVIDER: z.enum(['db', 'posthog', 'log', 'none']).default('db'),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().default('https://us.i.posthog.com'),

  BILLING_PROVIDER: z.enum(['none', 'razorpay', 'stripe']).default('none'),

  ADMIN_EMAILS: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((e) => e.trim().toLowerCase()) : [])),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().default(120),
  AI_RATE_LIMIT_PER_MINUTE: z.coerce.number().default(20),

  FEATURE_ASSISTANT: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
  FEATURE_DOMAIN_FIRST: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
  FEATURE_GOOGLE_LOGIN: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const env = parsed.data;
  if (env.NODE_ENV === 'production' && env.SESSION_SECRET.startsWith('dev-only')) {
    throw new Error('SESSION_SECRET must be set in production.');
  }
  return env;
}

export const env = loadEnv();
