import { describe, expect, it } from 'vitest';
import { brandBookHTML, cssTokens, jsonTokens, kitTokens, tailwindTokens, toSlug, websiteHTML } from '@gbt/shared';
import { generateOfflineNames } from '../src/providers/ai/offline/names';
import { generateOfflineKit } from '../src/providers/ai/offline/kit';
import { offlineAssistant } from '../src/providers/ai/offline/assistant';
import { parseModelJSON, toStrictJsonSchema } from '../src/providers/ai/llm';
import { AssistantOutputSchema, KitDraftSchema, NamesOutputSchema } from '../src/providers/ai/types';
import { applyAssistantChanges, applyLook, assembleKit } from '../src/services/kit';

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
    expect(kit.identity.palette.map((p: { role: string }) => p.role)).toEqual(['ink', 'brand', 'accent', 'tint', 'paper']);
    expect(kit.launch.contentIdeas).toHaveLength(10);
    expect(kit.positioning).not.toMatch(/Gen Z in India.*Gen Z in India/);
  });
  it('offers four looks in four different styles and hues, then applies the chosen one', () => {
    const draft = KitDraftSchema.parse(generateOfflineKit({ name: 'Wicko', brief: brief(), sections: ['strategy', 'taglines', 'identity', 'launch', 'website'] }));
    const kit = assembleKit('Wicko', brief(), draft);
    const looks = kit.identity.looks;
    expect(looks).toHaveLength(4);
    expect(new Set(looks.map((l) => l.style)).size).toBe(4);
    expect(new Set(looks.map((l) => l.palette.find((p) => p.role === 'brand')!.hex)).size).toBe(4);
    expect(kit.identity.lookChosen).toBe(false);
    const picked = applyLook(kit, looks[2]!.id);
    expect(picked.identity.style).toBe(looks[2]!.style);
    expect(picked.identity.palette).toEqual(looks[2]!.palette);
    expect(picked.identity.lookChosen).toBe(true);
  });
  it('assistant can switch the logo style', () => {
    const draft = KitDraftSchema.parse(generateOfflineKit({ name: 'Wicko', brief: brief(), sections: ['strategy', 'taglines', 'identity', 'launch', 'website'] }));
    const kit = applyLook(assembleKit('Wicko', brief(), draft), assembleKit('Wicko', brief(), draft).identity.looks[0]!.id);
    const out = offlineAssistant({ name: 'Wicko', brief: brief(), kit, history: [], message: 'Make the logo more Indian' });
    const patch = applyAssistantChanges(kit, brief(), out.changes)!;
    expect(patch.identity!.style).toBe(kit.identity.style === 'heritage' ? patch.identity!.style : 'heritage');
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

describe('exports built from a kit', () => {
  const kit = assembleKit('Mithaas', brief({ description: 'A mithai shop selling festive gift boxes' }), KitDraftSchema.parse(generateOfflineKit({ name: 'Mithaas', brief: brief({ description: 'A mithai shop selling festive gift boxes' }), sections: ['strategy', 'taglines', 'identity', 'launch', 'website'] })));
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="10" height="10"></svg>';
  it('stores the sector on new kits', () => {
    expect(kit.sector).toBe('sweets');
  });
  it('website draft is a complete, escaped HTML page in the brand', () => {
    const html = websiteHTML({ kit: { ...kit, website: { ...kit.website, headline: 'Sweets <b>& more</b>' } }, domain: 'mithaas.in', handle: 'mithaas', logo: svg, logoDark: svg, icon: svg, heroArt: svg });
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Sweets &lt;b&gt;&amp; more&lt;/b&gt;');
    expect(html).toContain(kit.identity.palette.find((p) => p.role === 'brand')!.hex);
    expect(html).not.toMatch(/undefined|NaN/);
  });
  it('brand book HTML includes every section it was given', () => {
    const html = brandBookHTML({ kit, domain: 'mithaas.in', handle: 'mithaas', logos: { light: svg, dark: svg, mono: svg, icon: svg }, mockups: [{ title: 'Mithai box', note: 'n', svg }], elements: [{ title: 'Pattern', note: 'n', svg }], sectorLabel: 'Sweets & confectionery' });
    for (const s of ['Brand essence', 'Logo', 'Colour', 'Typography', 'Brand toolkit', 'Voice', 'Applications', 'Mithai box']) expect(html).toContain(s);
    expect(html).not.toMatch(/undefined|NaN/);
  });
  it('tokens come out in three formats', () => {
    const t = kitTokens(kit);
    expect(cssTokens(t)).toMatch(/--color-brand: #[0-9A-F]{6}/i);
    expect(tailwindTokens(t)).toContain('fontFamily');
    expect(() => JSON.parse(jsonTokens(t))).not.toThrow();
  });
});

describe('launch kit copy', () => {
  const kitFor = (name: string, description: string) =>
    generateOfflineKit({ name, brief: brief({ description }), sections: ['launch'] }).launch!;
  const desc = 'A mithai shop in Jaipur selling handmade sweets and festive gift boxes';
  it('never pastes the brief back into launch copy', () => {
    const l = kitFor('Mithaas', desc);
    const all = [...Object.values(l.bios), l.posts.instagram, l.posts.linkedin, l.posts.announcement, ...l.posts.xThread].join('\n');
    expect(all).not.toContain(desc);
    expect(all.toLowerCase()).not.toContain('a mithai shop in jaipur selling');
  });
  it('writes to each platform’s limits and conventions', () => {
    const l = kitFor('Mithaas', desc);
    expect(l.bios.instagram.length).toBeLessThanOrEqual(150);
    expect(l.bios.instagram.split('\n')).toHaveLength(3);
    expect(l.bios.x.length).toBeLessThanOrEqual(160);
    for (const t of l.posts.xThread) expect(t.length).toBeLessThanOrEqual(270);
    expect(l.posts.instagram).toMatch(/#jaipur/);
    expect(l.contentIdeas).toHaveLength(10);
    expect(l.contentIdeas[0]).toMatch(/^(Reel|Carousel|Story|Short|Post)/);
  });
  it('uses the business’s own world (sector) and the name itself', () => {
    const sweets = kitFor('Mithaas', desc);
    expect(sweets.posts.instagram).toMatch(/#mithai/);
    expect(sweets.posts.instagram).toContain('mitha');
    const chai = kitFor('Kettlo', 'A chai subscription for remote teams');
    expect(chai.bios.instagram).toMatch(/☕/);
  });
  it('gives two names for the same idea different copy', () => {
    const a = kitFor('Mithaas', desc);
    const b = kitFor('Sonaghar', desc);
    expect(a.posts.instagram).not.toBe(b.posts.instagram);
    expect(a.posts.linkedin).not.toBe(b.posts.linkedin);
  });
});
