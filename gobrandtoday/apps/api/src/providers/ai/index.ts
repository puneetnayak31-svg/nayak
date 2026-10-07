import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { AnthropicProvider } from './anthropic';
import { OfflineProvider } from './offline';
import { OpenAIProvider } from './openai';
import type { AIProvider } from './types';

export * from './types';

/**
 * Pick the AI provider from configuration.
 *   AI_PROVIDER=auto      → Anthropic if ANTHROPIC_API_KEY, else OpenAI if OPENAI_API_KEY, else offline
 *   AI_PROVIDER=anthropic → Claude (AI_MODEL, default claude-opus-5-5)
 *   AI_PROVIDER=openai    → OpenAI (OPENAI_MODEL)
 *   AI_PROVIDER=offline   → rule-based generator, no network
 */
export function createAIProvider(): AIProvider {
  const efforts = { names: env.AI_NAMES_EFFORT, kit: env.AI_EFFORT };
  const choice =
    env.AI_PROVIDER === 'auto'
      ? env.ANTHROPIC_API_KEY
        ? 'anthropic'
        : env.OPENAI_API_KEY
          ? 'openai'
          : 'offline'
      : env.AI_PROVIDER;

  if (choice === 'anthropic') {
    return new AnthropicProvider({ apiKey: env.ANTHROPIC_API_KEY, model: env.AI_MODEL, timeoutMs: env.AI_TIMEOUT_MS }, efforts);
  }
  if (choice === 'openai') {
    if (!env.OPENAI_API_KEY) logger.warn('AI_PROVIDER=openai but OPENAI_API_KEY is empty');
    return new OpenAIProvider({ apiKey: env.OPENAI_API_KEY, model: env.AI_MODEL ?? env.OPENAI_MODEL, timeoutMs: env.AI_TIMEOUT_MS }, efforts);
  }
  return new OfflineProvider();
}

export const ai: AIProvider = createAIProvider();
export const offlineAI = new OfflineProvider();
