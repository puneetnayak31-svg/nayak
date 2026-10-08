import { describe, expect, it } from 'vitest';
import {
  ELEMENT_KINDS,
  MOCKUP_KINDS,
  SECTORS,
  SECTOR_META,
  SOCIAL_ASSETS,
  buildLook,
  crc32,
  detectSector,
  elementSVG,
  heroArtSVG,
  lookToIdentity,
  makeZip,
  mockupsForSector,
  sectorForKit,
  socialSVG,
  websiteBriefText,
  type SocialAsset,
} from '../src';

describe('sectors', () => {
  it.each([
    ['A mithai shop in Jaipur selling festive gift boxes', 'sweets'],
    ['A chai subscription for remote teams', 'coffee'],
    ['Sustainable streetwear label making organic t-shirts', 'fashion'],
    ['A cosy candle brand for Gen Z', 'candles'],
    ['Vitamin C serum and skincare for oily skin', 'beauty'],
    ['A cloud kitchen delivering biryani in Hyderabad', 'food'],
    ['AI agents that automate sales follow-ups', 'tech'],
    ['Kombucha in cans, lightly sparkling', 'beverage'],
    ['A dental clinic in Pune', 'health'],
    ['Handmade gold earrings and bangles', 'jewellery'],
  ])('%s → %s', (description, sector) => {
    expect(detectSector({ description })).toBe(sector);
  });
  it('uses the industry when the words say nothing, and falls back to general', () => {
    expect(detectSector({ description: 'Something new for people', industry: 'Fintech' })).toBe('fintech');
    expect(detectSector({ description: 'Something new for people' })).toBe('general');
  });
  it('short words match whole words only ("tea" is not "team")', () => {
    expect(detectSector({ description: 'Tools for my team' })).toBe('tech');
  });
  it('orders every application with the sector’s own objects first, no duplicates', () => {
    for (const s of SECTORS) {
      const list = mockupsForSector(s, MOCKUP_KINDS);
      expect(new Set(list).size).toBe(MOCKUP_KINDS.length);
      expect(list.slice(0, SECTOR_META[s].mockups.length)).toEqual(SECTOR_META[s].mockups);
    }
    expect(mockupsForSector('sweets', MOCKUP_KINDS)[0]).toBe('sweetbox');
  });
  it('reads a stored sector, or guesses one for older kits', () => {
    const base = { positioning: 'Handmade mithai for Diwali gifting', story: '', audience: { primary: '' }, messaging: { short: '' } };
    expect(sectorForKit({ ...base, sector: 'candles' })).toBe('candles');
    expect(sectorForKit(base)).toBe('sweets');
  });
});

const input = (style: Parameters<typeof buildLook>[1]) => {
  const look = buildLook({ name: 'Mithaas' }, style, 20, 3);
  return {
    id: lookToIdentity('Mithaas', look),
    fonts: { display: 'Space Grotesk', body: 'Manrope', data: 'Space Mono' },
    tagline: 'Sweet, made by hand',
    headline: 'Mithai worth the wait',
    subheadline: 'Small batches, every morning.',
    cta: 'Order now',
    domain: 'mithaas.in',
    handle: 'mithaas',
  };
};

describe('toolkit, social kit and hero art', () => {
  for (const style of ['symbol', 'twinkle', 'monogram'] as const) {
    it.each(ELEMENT_KINDS)(`%s renders for a ${style} identity`, (kind) => {
      const svg = elementSVG(kind, input(style));
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.endsWith('</svg>')).toBe(true);
      expect(svg).not.toMatch(/NaN|undefined/);
    });
  }
  it.each(Object.keys(SOCIAL_ASSETS) as SocialAsset[])('%s is drawn at the platform size', (kind) => {
    const svg = socialSVG(kind, input('symbol'));
    expect(svg).toContain(`viewBox="0 0 ${SOCIAL_ASSETS[kind].w} ${SOCIAL_ASSETS[kind].h}"`);
    expect(svg).not.toMatch(/NaN|undefined/);
  });
  it('hero art keeps ids unique per brand', () => {
    const a = heroArtSVG(input('symbol'));
    const b = heroArtSVG({ ...input('symbol'), id: lookToIdentity('Other', buildLook({ name: 'Other' }, 'symbol', 200, 9)) });
    const id = (s: string) => s.match(/clipPath id="([^"]+)"/)?.[1];
    expect(id(a)).toBeTruthy();
    expect(id(a)).not.toBe(id(b));
  });
});

describe('zip', () => {
  it('computes CRC-32', () => {
    expect(crc32(new TextEncoder().encode('hello'))).toBe(0x3610a686);
  });
  it('writes a readable archive: headers, central directory and end record', () => {
    const zip = makeZip([
      { name: 'a.txt', data: 'hello' },
      { name: 'dir/b.svg', data: '<svg/>' },
    ]);
    const dv = new DataView(zip.buffer);
    expect(dv.getUint32(0, true)).toBe(0x04034b50);
    const end = zip.length - 22;
    expect(dv.getUint32(end, true)).toBe(0x06054b50);
    expect(dv.getUint16(end + 10, true)).toBe(2);
    const cd = dv.getUint32(end + 16, true);
    expect(dv.getUint32(cd, true)).toBe(0x02014b50);
    expect(new TextDecoder().decode(zip.subarray(30, 35))).toBe('a.txt');
  });
});

describe('website brief', () => {
  it('summarises the brief for the experts inbox within the limit', () => {
    const text = websiteBriefText({ packageId: 'store', sections: ['Gallery'], features: ['Online payments'], notes: 'x'.repeat(3000) }, { name: 'Mithaas', domain: 'mithaas.in' });
    expect(text).toMatch(/^Package: Online store/);
    expect(text).toContain('Brand: Mithaas (mithaas.in)');
    expect(text.length).toBeLessThanOrEqual(2000);
  });
});
