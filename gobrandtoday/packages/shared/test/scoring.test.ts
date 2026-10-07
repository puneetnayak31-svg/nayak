import { describe, expect, it } from 'vitest';
import { detectRisks, domainScore, scoreName, socialScore, pronunciationScore, distinctivenessScore } from '../src/scoring';
import type { DomainResult, SocialResult } from '../src/types';

const d = (tld: string, status: DomainResult['status']): DomainResult => ({
  domain: `x.${tld}`,
  tld,
  status,
  source: 'rdap',
  verified: true,
  checkedAt: new Date().toISOString(),
  buyLinks: [],
});
const s = (platform: string, status: SocialResult['status']): SocialResult => ({
  platform,
  handle: 'x',
  status,
  method: 'official_api',
  verified: status !== 'manual',
  url: '',
  checkedAt: new Date().toISOString(),
});

describe('scoreName', () => {
  it('is provisional until domain and social checks exist', () => {
    const score = scoreName({ name: 'Lumora', brief: 'AI customer support for Indian small businesses' });
    expect(score.provisional).toBe(true);
    expect(score.components.find((c) => c.key === 'domain')!.value).toBeNull();
    expect(score.overall).toBeGreaterThan(6);
    expect(score.overall).toBeLessThanOrEqual(10);
    expect(score.overall100).toBe(Math.round(score.overall100));
  });

  it('becomes final with checks and rewards an available .com', () => {
    const base = { name: 'Lumora', brief: 'ai support' };
    const free = scoreName({ ...base, domains: [d('com', 'available')], socials: [s('github', 'available')] });
    const taken = scoreName({ ...base, domains: [d('com', 'taken'), d('in', 'taken')], socials: [s('github', 'taken')] });
    expect(free.provisional).toBe(false);
    expect(free.overall).toBeGreaterThan(taken.overall);
  });

  it('prefers short, sayable names over consonant soup', () => {
    expect(scoreName({ name: 'Kivo' }).overall).toBeGreaterThan(scoreName({ name: 'Xqrtzplmnk' }).overall);
  });

  it('weights sum to 100', () => {
    const score = scoreName({ name: 'Tara' });
    expect(score.components.reduce((a, c) => a + c.weight, 0)).toBe(100);
  });

  it('explains SEO without promising rankings', () => {
    expect(scoreName({ name: 'Chaiwala', brief: 'chai delivery' }).seo.explanation).toMatch(/not a ranking prediction/);
  });
});

describe('components', () => {
  it('flags consonant clusters', () => {
    expect(pronunciationScore('strngth').value).toBeLessThan(pronunciationScore('lumo').value);
  });
  it('penalises common words', () => {
    expect(distinctivenessScore('cloud').value).toBeLessThan(distinctivenessScore('kivora').value);
  });
  it('domainScore handles fallback TLDs', () => {
    expect(domainScore([d('com', 'taken'), d('in', 'available')]).value).toBeGreaterThan(5);
    expect(domainScore([d('com', 'unknown')]).value).toBeNull();
  });
  it('socialScore ignores manual-only platforms', () => {
    expect(socialScore([s('instagram', 'manual')]).value).toBeNull();
    expect(socialScore([s('github', 'available'), s('reddit', 'taken')]).value).toBe(6);
  });
});

describe('detectRisks', () => {
  it('catches confusingly similar famous brands', () => {
    expect(detectRisks('Zomatu').some((r) => r.message.includes('zomato'))).toBe(true);
  });
  it('catches unfortunate meanings', () => {
    expect(detectRisks('Giftly').some((r) => r.message.includes('poison'))).toBe(true);
  });
  it('leaves clean names alone', () => {
    expect(detectRisks('Lumora').filter((r) => r.level !== 'info')).toHaveLength(0);
  });
});
