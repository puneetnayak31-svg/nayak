import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client';

const here = path.dirname(fileURLToPath(import.meta.url));
// Works from src/db (tsx) and dist (bundled): look for the drizzle folder upwards.
const candidates = [path.resolve(here, '../../drizzle'), path.resolve(here, '../drizzle')];

async function main() {
  const fs = await import('node:fs');
  const migrationsFolder = candidates.find((p) => fs.existsSync(path.join(p, 'meta')));
  if (!migrationsFolder) throw new Error('Could not find the drizzle migrations folder.');
  await migrate(db, { migrationsFolder });
  console.log('✦ Database migrated');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
