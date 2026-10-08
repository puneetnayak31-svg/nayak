/**
 * Create (or refresh) a demo Pro account so the paid experience can be tried:
 * `npm run db:seed-demo`. Email from DEMO_PRO_EMAIL; password from
 * DEMO_PRO_PASSWORD. Outside production the password falls back to the same
 * one the preview build accepts, so the two can be tried the same way.
 */
import { eq } from 'drizzle-orm';
import { env } from '../config/env';
import { hashPassword } from '../services/auth.service';
import { db, pool, schema } from './client';

const LOCAL_DEFAULT = 'GoBrand@Pro2026';

async function main() {
  const email = env.DEMO_PRO_EMAIL.toLowerCase();
  const password = env.DEMO_PRO_PASSWORD ?? (env.NODE_ENV === 'production' ? null : LOCAL_DEFAULT);
  if (!password) throw new Error('Set DEMO_PRO_PASSWORD to seed the demo account in production.');
  const values = { email, name: 'Demo Founder', passwordHash: await hashPassword(password), isGuest: false, plan: 'pro', updatedAt: new Date() };
  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));
  if (existing) await db.update(schema.users).set(values).where(eq(schema.users.id, existing.id));
  else await db.insert(schema.users).values(values);
  console.log(`✦ Demo Pro account ready: ${email}${env.DEMO_PRO_PASSWORD ? '' : ` / ${password}`}`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
