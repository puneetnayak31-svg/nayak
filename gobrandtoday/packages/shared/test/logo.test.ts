import { describe, expect, it } from 'vitest';
import { LOGO_STYLES, LOGO_STYLE_META, approxMeasure, buildLook, generateLooks, iconSVG, logoSVG, lookToIdentity } from '../src';

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
    const next = generateLooks({ name: 'Kettlo', seed: 2, exclude: first.map((l) => l.style) });
    expect(next.filter((l) => first.some((f) => f.style === l.style)).length).toBeLessThanOrEqual(0);
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
