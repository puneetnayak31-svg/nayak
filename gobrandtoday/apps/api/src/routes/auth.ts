import { randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../config/env';
import { db, schema } from '../db/client';
import { httpFetch } from '../lib/http';
import { parse } from '../lib/validate';
import { clearSessionCookie, ensureUser, setSessionCookie } from '../plugins/auth';
import { analytics } from '../providers/analytics';
import {
  SESSION_COOKIE,
  createSession,
  destroySession,
  login,
  mergeGuestInto,
  publicUser,
  signup,
  upsertGoogleUser,
} from '../services/auth.service';
import { usageToday } from '../services/usage.service';
import { eq } from 'drizzle-orm';

const Credentials = z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200) });
const Signup = Credentials.extend({ name: z.string().trim().max(80).optional() });
const Profile = z.object({ name: z.string().trim().max(80).optional(), currency: z.enum(['INR', 'USD']).optional() });

export default async function authRoutes(app: FastifyInstance) {
  const strict = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };

  app.get('/api/auth/me', { schema: { tags: ['auth'], summary: 'Current user (guest or account) and today’s usage' } }, async (req) => {
    if (!req.user) return { user: null };
    return { user: publicUser(req.user), usage: await usageToday(req.user) };
  });

  app.post('/api/auth/signup', { ...strict, schema: { tags: ['auth'], summary: 'Create an account (keeps guest work)' } }, async (req, reply) => {
    const body = parse(Signup, req.body);
    const user = await signup(req.user, body);
    await destroySession(req.cookies[SESSION_COOKIE]);
    setSessionCookie(reply, await createSession(user.id, req.headers['user-agent']));
    analytics.track('user_signed_up', user.id, { method: 'email' });
    return { user: publicUser(user) };
  });

  app.post('/api/auth/login', { ...strict, schema: { tags: ['auth'], summary: 'Sign in with email + password' } }, async (req, reply) => {
    const body = parse(Credentials, req.body);
    const user = await login(body);
    await mergeGuestInto(req.user, user);
    await destroySession(req.cookies[SESSION_COOKIE]);
    setSessionCookie(reply, await createSession(user.id, req.headers['user-agent']));
    analytics.track('user_logged_in', user.id, { method: 'email' });
    return { user: publicUser(user) };
  });

  app.post('/api/auth/logout', { schema: { tags: ['auth'], summary: 'Sign out' } }, async (req, reply) => {
    await destroySession(req.cookies[SESSION_COOKIE]);
    clearSessionCookie(reply);
    return { ok: true };
  });

  app.patch('/api/me', { schema: { tags: ['auth'], summary: 'Update name or currency (INR/USD)' } }, async (req, reply) => {
    const user = await ensureUser(req, reply);
    const body = parse(Profile, req.body);
    const [u] = await db.update(schema.users).set({ ...body, updatedAt: new Date() }).where(eq(schema.users.id, user.id)).returning();
    return { user: publicUser(u!) };
  });

  /* ----------------------------- Google OAuth ----------------------------- */

  const googleEnabled = () => env.FEATURE_GOOGLE_LOGIN && !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET;
  const redirectUri = () => `${env.PUBLIC_API_URL ?? env.APP_URL}/api/auth/google/callback`;

  app.get('/api/auth/google', { schema: { tags: ['auth'], summary: 'Start Google sign-in' } }, async (_req, reply) => {
    if (!googleEnabled()) return reply.redirect(`${env.APP_URL}/login?error=google_not_configured`);
    const state = randomBytes(16).toString('base64url');
    reply.setCookie('gbt_oauth_state', state, { path: '/', httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production', maxAge: 600 });
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri(),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  app.get('/api/auth/google/callback', { schema: { tags: ['auth'], summary: 'Google OAuth callback' } }, async (req, reply) => {
    const q = req.query as { code?: string; state?: string };
    if (!googleEnabled() || !q.code || !q.state || q.state !== req.cookies.gbt_oauth_state) {
      return reply.redirect(`${env.APP_URL}/login?error=google_failed`);
    }
    reply.clearCookie('gbt_oauth_state', { path: '/' });
    try {
      const tokenRes = await httpFetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        timeoutMs: 8000,
        retries: 0,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: q.code,
          client_id: env.GOOGLE_CLIENT_ID!,
          client_secret: env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri(),
          grant_type: 'authorization_code',
        }),
      });
      const tokens = (await tokenRes.json()) as { access_token?: string };
      if (!tokens.access_token) throw new Error('No access token');
      const infoRes = await httpFetch('https://openidconnect.googleapis.com/v1/userinfo', {
        timeoutMs: 8000,
        retries: 0,
        headers: { authorization: `Bearer ${tokens.access_token}` },
      });
      const info = (await infoRes.json()) as { sub: string; email?: string; email_verified?: boolean; name?: string };
      if (!info.sub) throw new Error('No Google profile');
      const user = await upsertGoogleUser(req.user, { sub: info.sub, email: info.email_verified ? info.email : undefined, name: info.name });
      await mergeGuestInto(req.user, user);
      await destroySession(req.cookies[SESSION_COOKIE]);
      setSessionCookie(reply, await createSession(user.id, req.headers['user-agent']));
      analytics.track('user_logged_in', user.id, { method: 'google' });
      return reply.redirect(`${env.APP_URL}/dashboard`);
    } catch (err) {
      req.log.warn({ err: (err as Error).message }, 'google oauth failed');
      return reply.redirect(`${env.APP_URL}/login?error=google_failed`);
    }
  });
}
