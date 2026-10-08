import { describe, expect, it } from 'vitest';
import { LOGO_STYLES, contrast, LOGO_STYLE_META, approxMeasure, buildLook, generateLooks, iconSVG, logoSVG, lookToIdentity } from '../src';

describe('looks', () => {
  it('offers four different styles with clearly different hues', () => {
    const looks = generateLooks({ name: 'Kettlo', personalities: ['Playful'], industry: 'Food' });
    expect(looks).toHaveLength(4);
    expect(new Set(looks.map((l) => l.style)).size).toBe(4);
    const hues = looks.map((l) => l.hue).sort((a, b) => a - b);
    for (let i = 1; i < hues.length; i++) expect(hues[i]! - hues[i - 1]!).toBeGreaterThan(40);
  });
  it('can avoid styles already shown', () => {
    const first = generateLooks({ name: 'Kettlo', seed: 1 });
    const next = generateLooks({ name: 'Kettlo', seed: 2, exclude: first.map((l) => l.style), excludeFamilies: first.map((l) => l.symbol?.family ?? '') });
    const symbolic = ['symbol', 'emblem', 'lettermark'];
    // Wordmark constructions never repeat; symbol constructions may, but always with a new symbol.
    expect(next.filter((l) => !symbolic.includes(l.style) && first.some((f) => f.style === l.style))).toHaveLength(0);
    const firstFamilies = first.map((l) => l.symbol?.family).filter(Boolean);
    expect(next.filter((l) => l.symbol?.family && firstFamilies.includes(l.symbol.family))).toHaveLength(0);
  });
  it('always offers at least two looks with a real symbol', () => {
    for (let seed = 0; seed < 25; seed++) {
      const looks = generateLooks({ name: 'Chaiwala', seed });
      expect(looks.filter((l) => ['symbol', 'emblem', 'lettermark'].includes(l.style)).length).toBeGreaterThanOrEqual(2);
      expect(new Set(looks.map((l) => l.id)).size).toBe(4);
    }
  });
  it('is deterministic per seed', () => {
    expect(generateLooks({ name: 'Sutra', seed: 5 })).toEqual(generateLooks({ name: 'Sutra', seed: 5 }));
  });
});

describe('logo rendering', () => {
  it.each(LOGO_STYLES)('%s renders light, dark, mono and icon SVGs', (style) => {
    const id = lookToIdentity('Kettlo Tea', buildLook({ name: 'Kettlo Tea' }, style, 200, 3));
    for (const variant of ['light', 'dark', 'mono'] as const) {
      const out = logoSVG(id, { variant, measure: approxMeasure, background: true });
      expect(out.svg.startsWith('<svg')).toBe(true);
      expect(out.width).toBeGreaterThan(out.height * 0.6);
      expect(out.svg).not.toContain('NaN');
      expect(out.svg).not.toContain('undefined');
    }
    const icon = iconSVG(id);
    expect(icon.width).toBe(128);
    expect(icon.svg).not.toContain('NaN');
  });
  it('escapes names safely', () => {
    const id = lookToIdentity('<b>&', buildLook({ name: '<b>&' }, 'twinkle', 10, 1));
    expect(logoSVG(id).svg).not.toContain('<b>');
  });
  it('every style documents its usage rules', () => {
    for (const s of LOGO_STYLES) expect(LOGO_STYLE_META[s].usage.dont.length).toBeGreaterThan(10);
  });
});

describe('logo science fixes', () => {
  it('keeps the mark visible on ink in the dark version (≥ 3:1) for every hue', () => {
    for (let hue = 0; hue < 360; hue += 15) {
      const look = buildLook({ name: 'Kettlo' }, 'twinkle', hue, 3);
      const id = lookToIdentity('Kettlo', look);
      const svg = logoSVG(id, { variant: 'dark' }).svg;
      const ink = look.palette.find((p) => p.role === 'ink')!.hex;
      const fills = [...svg.matchAll(/fill="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1]!).filter((h) => h.toUpperCase() !== ink.toUpperCase());
      for (const f of fills) expect(contrast(f, ink)).toBeGreaterThanOrEqual(3);
    }
  });
  it('draws the reverse version in white only (plus knock-outs)', () => {
    const look = buildLook({ name: 'Kettlo' }, 'symbol', 200, 1);
    const svg = logoSVG(lookToIdentity('Kettlo', look), { variant: 'reverse' }).svg;
    const brand = look.palette.find((p) => p.role === 'brand')!.hex.toUpperCase();
    const colours = new Set([...svg.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1]!.toUpperCase()));
    for (const c of colours) expect(['#FFFFFF', brand]).toContain(c);
  });
  it('never draws a moving year: the editorial lockup shows EST. only when a year is given', () => {
    const look = buildLook({ name: 'Kettlo' }, 'editorial', 30, 1);
    const id = lookToIdentity('Kettlo', look);
    expect(logoSVG(id).svg).not.toContain('EST.');
    expect(logoSVG({ ...id, founded: 2024 }).svg).toContain('EST. 2024');
  });
  it('labels every construction with its logo type', () => {
    for (const m of Object.values(LOGO_STYLE_META)) {
      expect(m.type.length).toBeGreaterThan(3);
      expect(m.typeNote.length).toBeGreaterThan(20);
    }
  });
});
