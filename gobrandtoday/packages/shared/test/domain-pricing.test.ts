import { describe, expect, it } from 'vitest';
import { coreAvailability, displayPrice, estimatePrice, type DomainResult, type SocialResult } from '../src';

const d = (tld: string, status: DomainResult['status'], extra: Partial<DomainResult> = {}): DomainResult => ({
  domain: `kivo.${tld}`,
  tld,
  status,
  source: 'rdap',
  verified: true,
  checkedAt: '',
  buyLinks: [{ registrar: 'hostinger', label: 'Hostinger', url: 'https://example.com' }],
  ...extra,
});
const s = (platform: string, status: SocialResult['status'], method: SocialResult['method'] = 'official_api'): SocialResult => ({
  platform,
  handle: 'kivo',
  status,
  method,
  verified: method !== 'manual' && method !== 'demo',
  url: `https://example.com/${platform}`,
  checkedAt: '',
});

describe('domain prices', () => {
  it('labels table prices as estimates in the viewer currency', () => {
    expect(estimatePrice('com', 'INR')).toMatchObject({ amount: 899, renewal: 1499, estimated: true });
    expect(displayPrice(d('com', 'available'), 'USD')).toMatchObject({ label: '$9', estimated: true });
  });
  it('prefers a live registrar price and hides prices for taken names', () => {
    expect(displayPrice(d('ai', 'premium', { price: { amount: 2400, currency: 'USD', renewal: 90 } }), 'USD')).toMatchObject({ label: '$2,400', estimated: false });
    expect(displayPrice(d('com', 'taken'), 'INR')).toBeNull();
  });
});

describe('coreAvailability', () => {
  it('is "clear" when .com is free and nothing is taken, counting manual platforms as to-confirm', () => {
    const c = coreAvailability([d('com', 'available', { confirmed: true })], [s('youtube', 'available'), s('instagram', 'manual', 'manual'), s('x', 'manual', 'manual'), s('linkedin', 'manual', 'manual')]);
    expect(c.verdict).toBe('clear');
    expect(c.free).toBe(2);
    expect(c.open).toBe(3);
    expect(c.items.map((i) => i.state)).toEqual(['free', 'check', 'check', 'free', 'check']);
  });
  it('is "blocked" when .com is taken', () => {
    expect(coreAvailability([d('com', 'taken')], [s('youtube', 'available')]).verdict).toBe('blocked');
  });
  it('never counts demo data as free', () => {
    const c = coreAvailability([d('com', 'available', { source: 'demo', verified: false })], [s('youtube', 'available', 'demo')]);
    expect(c.free).toBe(0);
    expect(c.items[0]!.state).toBe('check');
  });
  it('treats registry-only availability as "likely"', () => {
    expect(coreAvailability([d('com', 'available', { confirmed: false })], []).items[0]!.state).toBe('likely');
  });
});
