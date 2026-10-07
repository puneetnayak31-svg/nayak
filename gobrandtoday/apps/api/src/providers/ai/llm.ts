import { z } from 'zod';
import {
  ASSISTANT_SYSTEM,
  KIT_SYSTEM,
  NAMING_SYSTEM,
  assistantPrompt,
  kitPrompt,
  namesPrompt,
} from './prompts';
import {
  AIProviderError,
  AssistantOutputSchema,
  KitDraftSchema,
  NamesOutputSchema,
  type AIProvider,
  type AssistantInput,
  type AssistantOutput,
  type Effort,
  type KitDraft,
  type KitGenInput,
  type NameGenInput,
  type RawName,
} from './types';

export interface JSONRequest<T> {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  schemaName: string;
  effort: Effort;
  maxTokens: number;
}

/**
 * Convert a Zod schema into the strict JSON-Schema subset structured-output
 * APIs accept: every object closed (`additionalProperties: false`) and every
 * property required (nullable fields express "optional").
 */
export function toStrictJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { target: 'draft-7' }) as Record<string, unknown>;
  delete json.$schema;
  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    const obj = node as Record<string, unknown>;
    if (obj.type === 'object' && obj.properties && typeof obj.properties === 'object') {
      obj.additionalProperties = false;
      obj.required = Object.keys(obj.properties as object);
    }
    // Numeric/string bounds are not supported by every provider; validation happens in Zod.
    for (const k of ['minLength', 'maxLength', 'minimum', 'maximum', 'pattern', 'minItems', 'maxItems', 'format', 'exclusiveMinimum', 'exclusiveMaximum']) delete obj[k];
    Object.values(obj).forEach(visit);
  };
  visit(json);
  return json;
}

/** Parse model text into JSON, tolerating a stray code fence. */
export function parseModelJSON<T>(text: string, schema: z.ZodType<T>): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    throw new AIProviderError('Model returned invalid JSON', 'invalid_output');
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new AIProviderError(`Model output failed validation: ${parsed.error.issues[0]?.message}`, 'invalid_output');
  return parsed.data;
}

/**
 * Shared behaviour for real LLM providers. Subclasses implement one method —
 * `completeJSON` — so adding a provider is ~50 lines.
 */
export abstract class LLMProvider implements AIProvider {
  abstract readonly id: 'anthropic' | 'openai';
  abstract readonly model: string;
  readonly live = true;

  constructor(protected readonly efforts: { names: Effort; kit: Effort }) {}

  protected abstract completeJSON<T>(req: JSONRequest<T>): Promise<T>;

  async generateNames(input: NameGenInput): Promise<RawName[]> {
    const out = await this.completeJSON({
      system: NAMING_SYSTEM,
      prompt: namesPrompt(input),
      schema: NamesOutputSchema,
      schemaName: 'brand_names',
      effort: this.efforts.names,
      maxTokens: 16_000,
    });
    return out.names;
  }

  async generateKit(input: KitGenInput): Promise<Partial<KitDraft>> {
    const shape = Object.fromEntries(input.sections.map((s) => [s, true])) as Partial<Record<keyof KitDraft, true>>;
    const schema = KitDraftSchema.pick(shape as Record<keyof KitDraft, true>);
    return this.completeJSON({
      system: KIT_SYSTEM,
      prompt: kitPrompt(input),
      schema: schema as unknown as z.ZodType<Partial<KitDraft>>,
      schemaName: 'brand_kit',
      effort: this.efforts.kit,
      maxTokens: 32_000,
    });
  }

  async assistant(input: AssistantInput): Promise<AssistantOutput> {
    return this.completeJSON({
      system: ASSISTANT_SYSTEM,
      prompt: assistantPrompt(input),
      schema: AssistantOutputSchema,
      schemaName: 'assistant_reply',
      effort: 'low',
      maxTokens: 16_000,
    });
  }
}
