import OpenAI from 'openai';
import { LLMProvider, parseModelJSON, toStrictJsonSchema, type JSONRequest } from './llm';
import { AIProviderError, type Effort } from './types';

/** OpenAI via the official SDK (Chat Completions + strict JSON schema). */
export class OpenAIProvider extends LLMProvider {
  readonly id = 'openai' as const;
  private client: OpenAI;

  constructor(
    opts: { apiKey?: string; model: string; timeoutMs: number },
    efforts: { names: Effort; kit: Effort },
    readonly model = opts.model,
  ) {
    super(efforts);
    this.client = new OpenAI({ apiKey: opts.apiKey, timeout: opts.timeoutMs, maxRetries: 2 });
  }

  protected async completeJSON<T>(req: JSONRequest<T>): Promise<T> {
    try {
      const res = await this.client.chat.completions.create({
        model: this.model,
        max_completion_tokens: req.maxTokens,
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: req.schemaName, strict: true, schema: toStrictJsonSchema(req.schema) },
        },
      });
      const choice = res.choices[0];
      if (choice?.message.refusal) throw new AIProviderError('The model declined this request', 'refusal');
      if (choice?.finish_reason === 'length') throw new AIProviderError('The model ran out of room', 'truncated');
      return parseModelJSON(choice?.message.content ?? '', req.schema);
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      throw new AIProviderError(`OpenAI error: ${(err as Error).message}`, 'upstream');
    }
  }
}
