import { env } from './config/env';
import { pool } from './db/client';
import { logger } from './lib/logger';
import { systemInfo } from './routes/system';
import { buildServer } from './server';

const app = await buildServer();

try {
  await app.listen({ host: env.HOST, port: env.PORT });
  const info = systemInfo();
  logger.info(
    `✦ GoBrandToday API on :${env.PORT} — AI: ${info.ai.provider}${info.ai.model ? ` (${info.ai.model})` : ''} · domains: ${info.domains.provider} · mode: ${info.mode}`,
  );
} catch (err) {
  logger.error(err);
  process.exit(1);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    logger.info(`${signal} received — shutting down`);
    await app.close();
    await pool.end();
    process.exit(0);
  });
}
