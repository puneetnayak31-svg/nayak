import { describe, expect, it } from 'vitest';
import { toSlug } from '@gbt/shared';
import { generateOfflineNames } from '../src/providers/ai/offline/names';
import { generateOfflineKit } from '../src/providers/ai/offline/kit';
import { offlineAssistant } from '../src/providers/ai/offline/assistant';
import { parseModelJSON, toStrictJsonSchema } from '../src/providers/ai/llm';
import { AssistantOutputSchema, KitDraftSchema, NamesOutputSchema } from '../src/providers/ai/types';
import { assembleKit } from '../src/services/brand.service';

const brief = (o: Record<string, unknown> = {}) => ({ description: 'A cosy candle brand for Gen Z in India', personalities: ['Playful'], styles: [], tlds: ['com'], mode: 'smart' as const, ...o });

describe('offline name generator', () => {
  it('returns the requested count with rationale and pronunciation', () => {
    const names = generateOfflineNames({ brief: brief(), count: 12 });
    expect(names).toHaveLength(12);
    for (const n of names) {
      expect(n.rationale.length).toBeGreaterThan(10);
      expect(n.pronunciation).toBeTruthy();
    }
  });
  it('respects constraints and exclusions', () => {
    const names = generateOfflineNames({ brief: brief({ constraints: { maxLength: 6, avoidLetters: 'z' } }), count: 8, exclude: ['Kosho'] });
    for (const n of names) {
      expect(toSlug(n.name).length).toBeLessThanOrEqual(6);
      expect(toSlug(n.name)).not.toContain('z');
      expect(toSlug(n.name)).not.toBe('kosho');
    }
  });
  it('India-inspired mode explains its roots', () => {
    const names = generateOfflineNames({ brief: brief({ mode: 'india' }), count: 10 });
    expect(names.some((n) => n.nameType === 'indian' && n.origin.includes('='))).toBe(true);
  });
});

describe('structured output schemas', () => {
  it('closes every object and requires every property', () => {
    const s = toStrictJsonSchema(KitDraftSchema) as { additionalProperties: boolean; required: string[]; properties: Record<string, { additionalProperties?: boolean }> };
    expect(s.additionalProperties).toBe(false);
    expect(s.required).toEqual(['strategy', 'taglines', 'identity', 'launch', 'website']);
    expect(s.properties.identity!.additionalProperties).toBe(false);
    expect(JSON.stringify(toStrictJsonSchema(NamesOutputSchema))).not.toContain('$schema');
  });
  it('rejects invalid model output', () => {
    expect(() => parseModelJSON('not json', NamesOutputSchema)).toThrow(/invalid JSON/);
    expect(() => parseModelJSON('{"names":[{"name":1}]}', NamesOutputSchema)).toThrow(/validation/);
    expect(parseModelJSON('```json\n{"names":[]}\n```', NamesOutputSchema)).toEqual({ names: [] });
  });
});

describe('brand kit', () => {
  it('offline kit validates against the draft schema and assembles into a full kit', () => {
    const draft = generateOfflineKit({ name: 'Wicko', brief: brief(), sections: ['strategy', 'taglines', 'identity', 'launch', 'website'] });
    const parsed = KitDraftSchema.parse(draft);
    const kit = assembleKit('Wicko', brief(), parsed);
    expect(kit.identity.palette.map((p) => p.role)).toEqual(['ink', 'brand', 'accent', 'tint', 'paper']);
    expect(kit.launch.contentIdeas).toHaveLength(10);
    expect(kit.positioning).not.toMatch(/Gen Z in India.*Gen Z in India/);
  });
  it('offline assistant returns schema-valid changes', () => {
    const draft = KitDraftSchema.parse(generateOfflineKit({ name: 'Wicko', brief: brief(), sections: ['strategy', 'taglines', 'identity', 'launch', 'website'] }));
    const kit = assembleKit('Wicko', brief(), draft);
    for (const message of ['Make my tagline more premium', 'darker palette', 'give me 10 alternative names', 'hello']) {
      const out = AssistantOutputSchema.parse(offlineAssistant({ name: 'Wicko', brief: brief(), kit, history: [], message }));
      expect(out.reply.length).toBeGreaterThan(5);
    }
  });
});
