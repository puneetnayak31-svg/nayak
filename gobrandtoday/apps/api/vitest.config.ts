import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', testTimeout: 20_000, env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' } },
});
