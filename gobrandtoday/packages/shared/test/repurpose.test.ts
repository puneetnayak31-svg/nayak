import { describe, expect, it } from 'vitest';
import { REPURPOSE_KINDS, REPURPOSE_META, contrast, paletteFromPixels, repurposeColors, repurposeSVG, type RepurposeInput } from '../src';

const px = (...cols: Array<[number, number, number, number, number]>) => {
  const out: number[] = [];
  for (const [r, g, b, a, n] of cols) for (let i = 0; i < n; i++) out.push(r, g, b, a);
  return out;
};

const input = (over: Partial<RepurposeInput> = {}): RepurposeInput => ({
  name: 'Kettlo & Co',
  tagline: 'Chai that tastes like home, delivered every morning',
  website: 'https://kettlo.in/',
  logo: { href: 'data:image/png;base64,AAAA', w: 400, h: 200, bg: null, main: '#D9480F' },
  colors: { brand: '#D9480F', ink: '#16161A', paper: '#FFFFFF', accent: '#FFC078' },
  ...over,
});

describe('paletteFromPixels', () => {
  it('returns the most used colours first and skips transparent pixels', () => {
    const p = paletteFromPixels(px([217, 72, 15, 255, 60], [255, 255, 255, 255, 30], [10, 10, 10, 255, 10], [0, 200, 0, 0, 500]));
    expect(p[0]).toBe('#D9480F');
    expect(p).toContain('#FFFFFF');
    expect(p.some((c) => c === '#00C800')).toBe(false);
  });

  it('merges near-identical colours', () => {
    const p = paletteFromPixels(px([217, 72, 15, 255, 10], [220, 74, 18, 255, 10]));
    expect(p).toHaveLength(1);
  });
});

describe('repurposeColors', () => {
  it('picks a saturated brand colour, a dark ink and a light paper', () => {
    const c = repurposeColors(['#FFFFFF', '#D9480F', '#111111', '#2F9E44']);
    expect(c.brand).toBe('#D9480F');
    expect(c.ink).toBe('#111111');
    expect(c.paper).toBe('#FFFFFF');
    expect(c.accent).toBe('#2F9E44');
  });

  it('falls back to safe defaults for a black-and-white logo', () => {
    const c = repurposeColors(['#000000', '#FFFFFF']);
    expect(c.brand).toBe('#000000');
    expect(c.paper).toBe('#FFFFFF');
    expect(c.accent).toMatch(/^#[0-9A-F]{6}$/);
    expect(repurposeColors([]).brand).toBe('#6D4AFF');
  });
});

describe('repurposeSVG', () => {
  it('renders every kind at its exact size with the logo embedded', () => {
    for (const k of REPURPOSE_KINDS) {
      const svg = repurposeSVG(k, input());
      const { w, h } = REPURPOSE_META[k];
      expect(svg).toContain(`viewBox="0 0 ${w} ${h}"`);
      expect(svg).toContain('<image href="data:image/png;base64,AAAA"');
      expect(svg).toContain('Kettlo &amp; Co');
    }
  });

  it('puts a transparent logo on a tile when it would vanish into the brand colour', () => {
    const svg = repurposeSVG('linkedin', input());
    // The logo's own colour equals the brand surface, so a paper tile goes behind it.
    expect(svg).toMatch(/<rect [^>]*fill="#FFFFFF"\/><image/);
    expect(contrast('#D9480F', '#D9480F')).toBe(1);
  });

  it('shows the website without the scheme and escapes text', () => {
    const svg = repurposeSVG('post', input({ tagline: 'Fresh <chai> & more' }));
    expect(svg).toContain('KETTLO.IN');
    expect(svg).toContain('Fresh &lt;chai&gt;');
    expect(svg).not.toContain('<chai>');
  });

  it('keeps YouTube text inside the centre safe area', () => {
    const svg = repurposeSVG('youtube', input());
    const xs = [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
    expect(xs.length).toBeGreaterThan(0);
    for (const [x, y] of xs) {
      expect(x).toBeGreaterThanOrEqual(507);
      expect(x).toBeLessThanOrEqual(507 + 1546);
      expect(y).toBeGreaterThanOrEqual(508);
      expect(y).toBeLessThanOrEqual(508 + 423);
    }
  });
});
