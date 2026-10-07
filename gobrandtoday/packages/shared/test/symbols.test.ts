import { describe, expect, it } from 'vitest';
import { MOCKUP_KINDS, SYMBOL_FAMILIES, buildLook, familySymbol, lookToIdentity, mockupSVG, resolveSymbolColors, sanitizeSymbolSvg, hexToCmyk } from '../src';

const C = { brand: '#6D4AFF', accent: '#19C3B4', ink: '#16161A', tint: '#ECE7FF', paper: '#FAFAF7' };

describe('generative symbols', () => {
  it.each(SYMBOL_FAMILIES)('%s draws valid, seed-dependent markup', (f) => {
    const a = familySymbol(f, 'Kettlo:1', C);
    const b = familySymbol(f, 'Nuvora:7', C);
    expect(a).toMatch(/^<(g|path|circle|rect|ellipse)/);
    expect(a).not.toMatch(/NaN|undefined/);
    expect(a).not.toBe(b);
  });
});

describe('sanitizeSymbolSvg', () => {
  it('keeps simple shapes and maps colours to palette roles', () => {
    const out = sanitizeSymbolSvg('<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="brand"/><path d="M10 10 L90 90" stroke="#ff0000" stroke-width="8" fill="none"/></svg>')!;
    expect(out).toContain('<circle cx="50" cy="50" r="30" fill="brand"/>');
    expect(out).toContain('stroke="brand"');
    expect(resolveSymbolColors(out, C)).toContain(`fill="${C.brand}"`);
  });
  it('strips scripts, event handlers, links, styles and foreign elements', () => {
    const evil =
      '<script>alert(1)</script><circle cx="1" cy="1" r="1" onload="alert(1)" fill="ink"/><a href="javascript:alert(1)"><rect x="0" y="0" width="5" height="5"/></a>' +
      '<image href="https://evil.example/x.png"/><foreignObject><div>hi</div></foreignObject><rect x="1" y="1" width="2" height="2" style="fill:red" fill="url(#x)"/><use href="#a"/>';
    const out = sanitizeSymbolSvg(evil)!;
    expect(out).not.toMatch(/script|onload|href|image|foreignObject|style=|url\(|<use|<a /i);
    expect(out).toContain('<circle cx="1" cy="1" r="1" fill="ink"/>');
    expect(out).toContain('fill="brand"');
  });
  it('rejects path data with anything but commands and numbers', () => {
    expect(sanitizeSymbolSvg('<path d="M0 0 L10 10 &lt;script"/>')).toBeNull();
    expect(sanitizeSymbolSvg('<g><path d="M0 0 L10 10Z"/></g>')).toBe('<g><path d="M0 0 L10 10Z" fill="brand"/></g>');
  });
  it('returns null when nothing drawable is left', () => {
    expect(sanitizeSymbolSvg('<text>Hi</text>')).toBeNull();
    expect(sanitizeSymbolSvg('')).toBeNull();
  });
});

describe('mockups', () => {
  it.each(MOCKUP_KINDS)('%s renders a complete SVG with the logo inside', (kind) => {
    const look = buildLook({ name: 'Chaiwala' }, 'symbol', 30, 2);
    const svg = mockupSVG(kind, {
      id: lookToIdentity('Chaiwala', look),
      fonts: { display: 'Space Grotesk', body: 'Manrope', data: 'Space Mono' },
      tagline: 'Chai that shows up on time',
      headline: 'Fresh chai at your desk',
      subheadline: 'A chai subscription for offices.',
      cta: 'Start',
      domain: 'chaiwala.in',
      handle: 'chaiwala',
    });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('</svg>');
    expect(svg).not.toMatch(/NaN|undefined/);
    // The logo/icon is nested and resized into the scene (or the symbol is drawn in place).
    expect(svg).toMatch(/preserveAspectRatio="x(Mid|Min|Max)YMid meet"|<g transform="translate\(/);
  });
  it('converts HEX to CMYK', () => {
    expect(hexToCmyk('#000000')).toEqual([0, 0, 0, 100]);
    expect(hexToCmyk('#FF0000')).toEqual([0, 100, 100, 0]);
  });
});
