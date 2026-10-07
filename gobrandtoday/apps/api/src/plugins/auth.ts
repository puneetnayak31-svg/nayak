import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env';
import { forbidden, unauthorized } from '../lib/errors';
import { SESSION_COOKIE, SESSION_TTL_MS, createGuest, createSession, userFromToken, type User } from '../services/auth.service';

declare module 'fastify' {
  interface FastifyRequest {
    /** Resolved session user, or null. Use `ensureUser` to create a guest on demand. */
    user: User | null;
  }
}

export function setSessionCookie(reply: FastifyReply, token: string) {
  reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
    domain: env.COOKIE_DOMAIN,
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    signed: false,
  });
}

export function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, { path: '/', domain: env.COOKIE_DOMAIN });
}

/**
 * Zero-friction accounts: anyone can start immediately. The first action that
 * needs storage creates a guest account (and cookie); signing up later keeps
 * everything.
 */
export async function ensureUser(req: FastifyRequest, reply: FastifyReply): Promise<User> {
  if (req.user) return req.user;
  const currency = req.headers['x-gbt-currency'] === 'USD' ? 'USD' : 'INR';
  const user = await createGuest(currency);
  const token = await createSession(user.id, req.headers['user-agent']);
  setSessionCookie(reply, token);
  req.user = user;
  return user;
}

export function requireAccount(req: FastifyRequest): User {
  if (!req.user || req.user.isGuest) throw unauthorized('Create a free account to do this.');
  return req.user;
}

export function requireAdmin(req: FastifyRequest): User {
  const u = requireAccount(req);
  if (!u.email || !env.ADMIN_EMAILS.includes(u.email)) throw forbidden();
  return u;
}

export function regionOf(req: FastifyRequest, override?: string): 'IN' | 'US' {
  if (override === 'US' || override === 'IN') return override;
  if (req.headers['x-gbt-currency'] === 'USD') return 'US';
  return req.user?.currency === 'USD' ? 'US' : 'IN';
}

async function authPlugin(app: FastifyInstance) {
  app.decorateRequest('user', null);
  app.addHook('onRequest', async (req) => {
    req.user = await userFromToken(req.cookies[SESSION_COOKIE]);
  });
  // CSRF: state-changing requests must carry a custom header, which browsers
  // only allow cross-origin after a CORS preflight we never grant to strangers.
  app.addHook('preHandler', async (req) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.url.startsWith('/api/') && req.headers['x-gbt-csrf'] !== '1') {
      throw forbidden('Missing CSRF header.');
    }
  });
}

export default fp(authPlugin, { name: 'gbt-auth', dependencies: ['@fastify/cookie'] });
