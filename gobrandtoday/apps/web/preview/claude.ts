/**
 * Real AI in the preview: when this page runs inside a Claude viewer, the
 * `sample` capability lets it ask Claude (on the viewer's own account, with
 * their consent). We send the same system prompts and JSON schemas the
 * server uses, validate the answer with the same zod schemas, and fall back
 * to the offline engine whenever Claude isn't available or declines.
 */
import { z } from 'zod';
import { ASSISTANT_SYSTEM, KIT_SYSTEM, NAMING_SYSTEM, assistantPrompt, kitPrompt, namesPrompt } from '../../api/src/providers/ai/prompts';
import {
  AssistantOutputSchema,
  KitDraftSchema,
  LaunchDraftSchema,
  NamesOutputSchema,
  StrategyDraftSchema,
  WebsiteDraftSchema,
  IdentityDraftSchema,
  type AssistantInput,
  type AssistantOutput,
  type KitDraft,
  type KitGenInput,
  type NameGenInput,
  type RawName,
} from '../../api/src/providers/ai/types';
import { toStrictJsonSchema } from '../../api/src/providers/ai/llm';

type SampleFn = ((input: string, opts?: Record<string, unknown>) => Promise<{ text: string }>) & {
  json: <T = unknown>(input: string, opts?: Record<string, unknown>) => Promise<T>;
};

let samplePromise: Promise<SampleFn | null> | null = null;
let declined = false;

/** The viewer's Claude, or null outside a Claude viewer / after a decline. */
export function getSample(timeoutMs = 12_000): Promise<SampleFn | null> {
  if (declined) return Promise.resolve(null);
  samplePromise ??= (async () => {
    const c = (globalThis as { claude?: { use?: (n: string) => Promise<unknown> } }).claude;
    if (!c?.use) return null;
    try {
      return (await Promise.race([c.use('sample'), new Promise((r) => setTimeout(() => r(null), timeoutMs))])) as SampleFn | null;
    } catch {
      return null;
    }
  })();
  return samplePromise;
}

/** Quick check for the system badge: don't hold the page for the full timeout. */
export async function aiAvailable(): Promise<boolean> {
  if (declined) return false;
  return !!(await Promise.race([getSample(), new Promise<null>((r) => setTimeout(() => r(null), 1500))]));
}

export interface AiError {
  code: string;
  message: string;
}

async function askJSON<T>(system: string, prompt: string, schema: z.ZodType<T>, tier: 'quick' | 'default' | 'complex' = 'default'): Promise<unknown> {
  const sample = await getSample();
  if (!sample) throw { code: 'unavailable', message: 'Claude is not available in this view.' } satisfies AiError;
  const jsonSchema = JSON.stringify(toStrictJsonSchema(schema));
  const input = `${system}\n\n---\n\n${prompt}\n\n---\n\nReply with ONLY one JSON value matching this JSON Schema (no markdown, no commentary):\n${jsonSchema}`;
  try {
    return await sample.json(input, { modelTier: tier });
  } catch (e) {
    const err = e as AiError;
    if (err?.code === 'not_granted' || err?.code === 'capability_disabled' || err?.code === 'capability_removed') declined = true;
    throw err;
  }
}

export async function aiNames(input: NameGenInput): Promise<RawName[]> {
  const out = await askJSON(NAMING_SYSTEM, namesPrompt(input), NamesOutputSchema);
  const parsed = NamesOutputSchema.safeParse(out);
  if (parsed.success) return parsed.data.names;
  // Keep whatever individual names are valid.
  const list = (out as { names?: unknown[] })?.names ?? [];
  const ok = list.map((n) => NamesOutputSchema.shape.names.element.safeParse(n)).filter((r) => r.success).map((r) => r.data!);
  if (!ok.length) throw { code: 'invalid_output', message: 'Claude’s answer didn’t match the expected shape.' } satisfies AiError;
  return ok;
}

const SECTION_SCHEMAS = {
  strategy: StrategyDraftSchema,
  taglines: z.array(z.string()),
  identity: IdentityDraftSchema,
  launch: LaunchDraftSchema,
  website: WebsiteDraftSchema,
} as const;

/**
 * A kit draft from Claude for the requested sections. Sections that come back
 * malformed are simply left out, so the caller can fill them offline.
 */
export async function aiKit(input: KitGenInput): Promise<Partial<KitDraft>> {
  const shape = Object.fromEntries(input.sections.map((s) => [s, KitDraftSchema.shape[s]]));
  const schema = z.object(shape) as unknown as z.ZodType<Partial<KitDraft>>;
  const out = (await askJSON(KIT_SYSTEM, kitPrompt(input), schema)) as Record<string, unknown>;
  const draft: Partial<KitDraft> = {};
  for (const s of input.sections) {
    const r = (SECTION_SCHEMAS[s] as z.ZodType).safeParse(out?.[s]);
    if (r.success) (draft as Record<string, unknown>)[s] = r.data;
  }
  if (!Object.keys(draft).length) throw { code: 'invalid_output', message: 'Claude’s answer didn’t match the expected shape.' } satisfies AiError;
  return draft;
}

export async function aiAssistant(input: AssistantInput): Promise<AssistantOutput> {
  const out = await askJSON(ASSISTANT_SYSTEM, assistantPrompt(input), AssistantOutputSchema);
  const parsed = AssistantOutputSchema.safeParse(out);
  if (parsed.success) return parsed.data;
  // Accept a reply even if the change set is off: never apply unvalidated changes.
  const reply = typeof (out as { reply?: unknown })?.reply === 'string' ? (out as { reply: string }).reply : null;
  if (!reply) throw { code: 'invalid_output', message: 'Claude’s answer didn’t match the expected shape.' } satisfies AiError;
  return { reply, names: [], changes: Object.fromEntries(Object.keys(AssistantOutputSchema.shape.changes.shape).map((k) => [k, null])) as AssistantOutput['changes'] };
}

export function aiErrorNotice(e: unknown): string {
  const code = (e as AiError)?.code;
  if (code === 'not_granted') return 'Claude wasn’t allowed for this page, so these come from our offline generator.';
  if (code === 'rate_limited') return 'Claude is busy right now, so these come from our offline generator. Try again in a minute.';
  if (code === 'unavailable') return '';
  return 'Claude didn’t answer this time, so these come from our offline generator.';
}
