import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, parseModelJSON, toStrictJsonSchema, type JSONRequest } from './llm';
import { AIProviderError, type Effort } from './types';

export const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-5-5';

/**
 * Claude via the official SDK. Structured outputs keep responses schema-valid;
 * server-side fallbacks ("default") re-run a declined request on Anthropic's
 * recommended fallback model instead of failing the user's request.
 */
export class AnthropicProvider extends LLMProvider {
  readonly id = 'anthropic' as const;
  private client: Anthropic;

  constructor(
    opts: { apiKey?: string; model?: string; timeoutMs: number },
    efforts: { names: Effort; kit: Effort },
    readonly model = opts.model ?? DEFAULT_ANTHROPIC_MODEL,
  ) {
    super(efforts);
    this.client = new Anthropic({ apiKey: opts.apiKey, timeout: opts.timeoutMs, maxRetries: 2 });
  }

  protected async completeJSON<T>(req: JSONRequest<T>): Promise<T> {
    let message: Anthropic.Beta.Messages.BetaMessage;
    try {
      // Streaming avoids HTTP timeouts on long outputs; we only need the final message.
      message = await this.client.beta.messages
        .stream({
          model: this.model,
          max_tokens: req.maxTokens,
          system: [{ type: 'text', text: req.system, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: req.prompt }],
          output_config: { effort: req.effort, format: { type: 'json_schema', schema: toStrictJsonSchema(req.schema) } },
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
        })
        .finalMessage();
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) throw new AIProviderError('Claude is rate limited right now', 'upstream');
      if (err instanceof Anthropic.AuthenticationError) throw new AIProviderError('Anthropic API key is invalid', 'not_configured');
      if (err instanceof Anthropic.APIError) throw new AIProviderError(`Anthropic API error: ${err.message}`, 'upstream');
      throw new AIProviderError(`Could not reach Anthropic: ${(err as Error).message}`, 'upstream');
    }
    if (message.stop_reason === 'refusal') throw new AIProviderError('The model declined this request', 'refusal');
    if (message.stop_reason === 'max_tokens') throw new AIProviderError('The model ran out of room', 'truncated');
    const text = message.content
      .filter((b): b is Anthropic.Beta.Messages.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    return parseModelJSON(text, req.schema);
  }
}
