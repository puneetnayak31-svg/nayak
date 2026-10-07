import { describe, expect, it } from 'vitest';
import { contrast, generatePalette, googleFontsHref, handleAlternatives, pickFonts, pickMark, validateHandle, normaliseHandle, buyLinks, syllables, extractKeywords } from '../src';

describe('palette', () => {
  it('creates five roles with an AA-contrast brand colour', () => {
    const p = generatePalette({ name: 'Lumora', personalities: ['Futuristic'], industry: 'AI' });
    expect(p.map((x) => x.role)).toEqual(['ink', 'brand', 'accent', 'tint', 'paper']);
    const brand = p.find((x) => x.role === 'brand')!.hex;
    expect(contrast(brand, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    for (const sw of p) expect(sw.hex).toMatch(/^#[0-9A-F]{6}$/);
  });
  it('is deterministic per name', () => {
    expect(generatePalette({ name: 'Kivo' })).toEqual(generatePalette({ name: 'Kivo' }));
  });
});

describe('marks & fonts', () => {
  it('picks a mark and fonts deterministically', () => {
    expect(pickMark({ name: 'Tara', personalities: ['Traditional'] })).toBe(pickMark({ name: 'Tara', personalities: ['Traditional'] }));
    expect(pickFonts({ name: 'Tara', personalities: ['Traditional'] }).display.family).toBeTruthy();
  });
  it('builds a valid Google Fonts URL', () => {
    const href = googleFontsHref([{ family: 'Space Grotesk', weights: [700, 500] }, { family: 'Rozha One', weights: [400] }]);
    expect(href).toContain('family=Space+Grotesk:wght@500;700');
    expect(href).toContain('family=Rozha+One&');
  });
});

describe('handles', () => {
  it('normalises and validates', () => {
    expect(normaliseHandle('@Chai Stack!')).toBe('chaistack');
    expect(validateHandle('x', 'abc').ok).toBe(false);
    expect(validateHandle('x', 'chaistack').ok).toBe(true);
    expect(validateHandle('github', 'chai--stack').ok).toBe(false);
  });
  it('suggests India-first alternatives', () => {
    const alts = handleAlternatives('Chai Stack', { region: 'IN' });
    expect(alts).toContain('getchaistack');
    expect(alts).toContain('chaistackindia');
  });
});

describe('registrar links', () => {
  it('uses India storefronts for INR and appends affiliate params', () => {
    const links = buyLinks('lumora.in', 'IN', { hostinger: 'REFERRALCODE=abc' });
    expect(links.find((l) => l.registrar === 'hostinger')!.url).toBe('https://www.hostinger.com/in/domain-name-search?domain=lumora.in&REFERRALCODE=abc');
    expect(links.find((l) => l.registrar === 'godaddy')!.url).toContain('/en-in/');
  });
});

describe('text', () => {
  it('splits syllables and extracts keywords', () => {
    expect(syllables('lumora').join('')).toBe('lumora');
    expect(extractKeywords('I am building an AI platform for Indian small businesses')).toEqual(['ai', 'indian', 'small', 'business']);
  });
});
