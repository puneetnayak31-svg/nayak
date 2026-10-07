import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { and, eq, gt } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { AppError, badRequest } from '../lib/errors';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>;
export const SESSION_COOKIE = 'gbt_sid';
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 60; // 60 days

export type User = typeof schema.users.$inferSelect;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored?.startsWith('scrypt$')) return false;
  const [, saltB64, hashB64] = stored.split('$');
  const expected = Buffer.from(hashB64!, 'base64url');
  const actual = await scrypt(password, Buffer.from(saltB64!, 'base64url'), expected.length);
  return timingSafeEqual(expected, actual);
}

const tokenId = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(userId: string, userAgent?: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await db.insert(schema.sessions).values({
    id: tokenId(token),
    userId,
    userAgent: userAgent?.slice(0, 300),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export async function userFromToken(token: string | undefined): Promise<User | null> {
  if (!token || token.length > 100) return null;
  const rows = await db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.id, tokenId(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.user ?? null;
}

export async function destroySession(token: string | undefined) {
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, tokenId(token)));
}

export async function createGuest(currency: 'INR' | 'USD' = 'INR'): Promise<User> {
  const [user] = await db.insert(schema.users).values({ isGuest: true, currency }).returning();
  return user!;
}

const normEmail = (e: string) => e.trim().toLowerCase();

/** Sign up. A guest keeps all their work: we upgrade the same row in place. */
export async function signup(current: User | null, input: { email: string; password: string; name?: string }): Promise<User> {
  const email = normEmail(input.email);
  if (input.password.length < 8) throw badRequest('Use at least 8 characters for your password.');
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (existing) throw new AppError(409, 'email_taken', 'An account with this email already exists. Try signing in.');
  const passwordHash = await hashPassword(input.password);
  if (current?.isGuest) {
    const [u] = await db
      .update(schema.users)
      .set({ email, passwordHash, name: input.name ?? null, isGuest: false, updatedAt: new Date() })
      .where(eq(schema.users.id, current.id))
      .returning();
    return u!;
  }
  const [u] = await db.insert(schema.users).values({ email, passwordHash, name: input.name ?? null, isGuest: false }).returning();
  return u!;
}

export async function login(input: { email: string; password: string }): Promise<User> {
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, normEmail(input.email)) });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError(401, 'invalid_credentials', 'That email and password don’t match.');
  }
  return user;
}

/** When a guest signs into an existing account, bring their work along. */
export async function mergeGuestInto(guest: User | null, target: User) {
  if (!guest || !guest.isGuest || guest.id === target.id) return;
  await db.transaction(async (tx) => {
    await tx.update(schema.projects).set({ userId: target.id }).where(eq(schema.projects.userId, guest.id));
    await tx.update(schema.brands).set({ userId: target.id }).where(eq(schema.brands.userId, guest.id));
    await tx.update(schema.aiMessages).set({ userId: target.id }).where(eq(schema.aiMessages.userId, guest.id));
    await tx.update(schema.domainWatch).set({ userId: target.id }).where(eq(schema.domainWatch.userId, guest.id)).catch(() => undefined);
    // Saved names have a unique (user, slug) index — move only the ones the account doesn't have.
    const saved = await tx.select().from(schema.savedNames).where(eq(schema.savedNames.userId, guest.id));
    for (const s of saved) {
      await tx
        .insert(schema.savedNames)
        .values({ ...s, id: undefined, userId: target.id })
        .onConflictDoNothing();
    }
    await tx.delete(schema.users).where(eq(schema.users.id, guest.id));
  });
}

export async function upsertGoogleUser(current: User | null, profile: { sub: string; email?: string; name?: string }): Promise<User> {
  const byGoogle = await db.query.users.findFirst({ where: eq(schema.users.googleId, profile.sub) });
  if (byGoogle) return byGoogle;
  const email = profile.email ? normEmail(profile.email) : null;
  if (email) {
    const byEmail = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
    if (byEmail) {
      const [u] = await db.update(schema.users).set({ googleId: profile.sub, isGuest: false }).where(eq(schema.users.id, byEmail.id)).returning();
      return u!;
    }
  }
  if (current?.isGuest) {
    const [u] = await db
      .update(schema.users)
      .set({ googleId: profile.sub, email, name: profile.name ?? null, isGuest: false, updatedAt: new Date() })
      .where(eq(schema.users.id, current.id))
      .returning();
    return u!;
  }
  const [u] = await db.insert(schema.users).values({ googleId: profile.sub, email, name: profile.name ?? null, isGuest: false }).returning();
  return u!;
}

export function publicUser(u: User) {
  return { id: u.id, email: u.email, name: u.name, isGuest: u.isGuest, plan: u.plan, currency: u.currency, createdAt: u.createdAt };
}
