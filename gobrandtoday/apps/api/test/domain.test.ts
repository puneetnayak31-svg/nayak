import { afterEach, describe, expect, it, vi } from 'vitest';
import { RdapProvider } from '../src/providers/domain/rdap';
import { parseNamecheapResult } from '../src/providers/domain/namecheap';
import { GoDaddyProvider } from '../src/providers/domain/godaddy';
import { HostingerProvider } from '../src/providers/domain/hostinger';
import { MockDomainProvider } from '../src/providers/domain/mock';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

afterEach(() => vi.unstubAllGlobals());

describe('RdapProvider', () => {
  it('maps registry 404 → available (verified) and 200 → taken', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('data.iana.org')) return json({ services: [[['com'], ['https://rdap.example/com/v1/']]] });
        if (url.endsWith('/free.com')) return new Response('', { status: 404 });
        return json({ status: ['active'] });
      }),
    );
    const out = await new RdapProvider(2000).check(['free.com', 'google.com']);
    expect(out[0]).toMatchObject({ domain: 'free.com', status: 'available', verified: true, source: 'rdap' });
    expect(out[1]).toMatchObject({ domain: 'google.com', status: 'taken', verified: true });
  });

  it('never claims "available" when the registry cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }));
    const [r] = await new RdapProvider(500).check(['zzqqxx-not-a-real-domain-gbt.com']);
    expect(r!.status).not.toBe('available');
    expect(r!.verified).toBe(false);
  });
});

describe('registrar adapters', () => {
  it('parses Namecheap XML including premium names', () => {
    const xml = `<ApiResponse Status="OK"><CommandResponse><DomainCheckResult Domain="lumora.com" Available="false" IsPremiumName="false"/><DomainCheckResult Domain="kivo.ai" Available="true" IsPremiumName="true" PremiumRegistrationPrice="2400.00" PremiumRenewalPrice="90"/><DomainCheckResult Domain="nuvo.in" Available="true" IsPremiumName="false"/></CommandResponse></ApiResponse>`;
    expect(parseNamecheapResult(xml, 'lumora.com')!.status).toBe('taken');
    expect(parseNamecheapResult(xml, 'kivo.ai')).toMatchObject({ status: 'premium', price: { amount: 2400, currency: 'USD', renewal: 90 } });
    expect(parseNamecheapResult(xml, 'nuvo.in')!.status).toBe('available');
    expect(parseNamecheapResult(xml, 'missing.io')).toBeUndefined();
  });

  it('GoDaddy converts micro-unit prices and sends the sso-key header', async () => {
    const fetchMock = vi.fn(async () => json({ domains: [{ domain: 'kivo.com', available: true, definitive: true, price: 11990000, currency: 'USD' }] }));
    vi.stubGlobal('fetch', fetchMock);
    const [r] = await new GoDaddyProvider('k', 's', 'ote', 2000).check(['kivo.com']);
    expect(r).toMatchObject({ status: 'available', price: { amount: 11.99, currency: 'USD' } });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>).authorization).toBe('sso-key k:s');
  });

  it('Hostinger groups TLDs per name and ignores alternatives', async () => {
    const fetchMock = vi.fn(async () =>
      json([
        { domain: 'kivo.com', is_available: false, is_alternative: false },
        { domain: 'kivo.in', is_available: true, is_alternative: false },
        { domain: 'kivoapp.com', is_available: true, is_alternative: true },
      ]),
    );
    vi.stubGlobal('fetch', fetchMock);
    const out = await new HostingerProvider('t', 2000).check(['kivo.com', 'kivo.in']);
    expect(out.map((r) => r.status)).toEqual(['taken', 'available']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).toEqual({ domain: 'kivo', tlds: ['com', 'in'], with_alternatives: false });
  });

  it('mock data is never marked verified', async () => {
    const out = await new MockDomainProvider().check(['a.com', 'b.in', 'c.ai']);
    expect(out.every((r) => r.verified === false && r.source === 'demo')).toBe(true);
  });
});
