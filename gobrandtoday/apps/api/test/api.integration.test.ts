import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { buildServer as BuildServer } from '../src/server';
import { pool } from '../src/db/client';

/**
 * Full HTTP flow against a real Postgres (skipped when DATABASE_URL isn't reachable).
 * External providers are not called: brand building uses the offline writer and
 * domain/social checks degrade gracefully.
 */
let app: Awaited<ReturnType<typeof BuildServer>> | null = null;
let dbUp = false;

beforeAll(async () => {
  try {
    await pool.query('select 1 from users limit 1');
    dbUp = true;
  } catch {
    dbUp = false;
    return;
  }
  const { buildServer } = await import('../src/server');
  app = await buildServer();
});
afterAll(async () => {
  await app?.close();
  await pool.end();
});

const H = { 'content-type': 'application/json', 'x-gbt-csrf': '1' };

describe.runIf(process.env.SKIP_DB_TESTS !== '1')('API (integration)', () => {
  it('rejects state changes without the CSRF header', async () => {
    if (!dbUp) return;
    const r = await app!.inject({ method: 'POST', url: '/api/brand/generate-names', payload: {} });
    expect(r.statusCode).toBe(403);
  });

  it('guest → names → save → brand → assistant → undo → export', async () => {
    if (!dbUp) return;
    const gen = await app!.inject({ method: 'POST', url: '/api/brand/generate-names', headers: H, payload: { brief: { description: 'Fintech for freelancers', mode: 'short' }, count: 6 } });
    expect(gen.statusCode).toBe(200);
    const cookie = gen.headers['set-cookie'] as string;
    expect(cookie).toMatch(/gbt_sid=.*HttpOnly/i);
    const sid = cookie.split(';')[0]!;
    const body = gen.json() as { names: Array<{ name: string; score: { overall: number }; tagline?: string; whyItWorks?: string[]; meaning?: string }>; projectId: string };
    expect(body.names.length).toBeGreaterThan(0);
    // Every name carries its story, not just a label.
    expect(body.names[0]!.tagline).toBeTruthy();
    expect(body.names[0]!.meaning).toBeTruthy();
    expect(body.names[0]!.whyItWorks?.length).toBe(3);

    const save = await app!.inject({ method: 'POST', url: '/api/saved', headers: { ...H, cookie: sid }, payload: { name: body.names[0]!.name } });
    expect(save.statusCode).toBe(200);

    const create = await app!.inject({ method: 'POST', url: '/api/brands', headers: { ...H, cookie: sid }, payload: { name: body.names[0]!.name, brief: { description: 'Fintech for freelancers' } } });
    expect(create.statusCode).toBe(202);
    const id = (create.json() as { brand: { id: string } }).brand.id;

    let status = 'generating';
    for (let i = 0; i < 40 && status === 'generating'; i++) {
      await new Promise((r) => setTimeout(r, 250));
      status = ((await app!.inject({ url: `/api/brands/${id}`, headers: { cookie: sid } })).json() as { brand: { status: string } }).brand.status;
    }
    expect(status).toBe('ready');

    const ask = await app!.inject({ method: 'POST', url: `/api/brands/${id}/assistant`, headers: { ...H, cookie: sid }, payload: { message: 'Make my tagline more premium' } });
    expect((ask.json() as { changed: string[] }).changed).toContain('taglines');
    const undo = await app!.inject({ method: 'POST', url: `/api/brands/${id}/undo`, headers: { ...H, cookie: sid }, payload: {} });
    expect((undo.json() as { brand: { version: number } }).brand.version).toBe(3);

    const md = await app!.inject({ url: `/api/brands/${id}/export?format=md`, headers: { cookie: sid } });
    expect(md.headers['content-type']).toContain('markdown');
    expect(md.body).toContain('## Identity');
    expect(md.body).toContain('## Essence');
    expect(md.body).not.toContain('### Motion');

    // Imagery: the default image provider (Pollinations, keyless) returns stable URLs.
    const img = await app!.inject({ method: 'POST', url: `/api/brands/${id}/imagery`, headers: { ...H, cookie: sid }, payload: { kind: 'moodboard' } });
    expect(img.statusCode).toBe(200);
    const mood = (img.json() as { brand: { kit: { identity: { moodboard: Array<{ imageUrl: string; caption: string }> } } } }).brand.kit.identity.moodboard;
    expect(mood).toHaveLength(4);
    expect(mood[0]!.imageUrl).toMatch(/^https:\/\/image\.pollinations\.ai\/prompt\//);
    const badKind = await app!.inject({ method: 'POST', url: `/api/brands/${id}/imagery`, headers: { ...H, cookie: sid }, payload: { kind: 'logo' } });
    expect(badKind.statusCode).toBe(400);

    // Another visitor cannot read it.
    const other = await app!.inject({ url: `/api/brands/${id}` });
    expect(other.statusCode).toBe(404);
  });

  it('signup upgrades the guest and keeps their work', async () => {
    if (!dbUp) return;
    const gen = await app!.inject({ method: 'POST', url: '/api/projects', headers: H, payload: { description: 'Chai for remote teams' } });
    const sid = (gen.headers['set-cookie'] as string).split(';')[0]!;
    const email = `t${Date.now()}@example.com`;
    const su = await app!.inject({ method: 'POST', url: '/api/auth/signup', headers: { ...H, cookie: sid }, payload: { email, password: 'correct horse battery' } });
    expect(su.statusCode).toBe(200);
    const sid2 = (su.headers['set-cookie'] as string).split(';')[0]!;
    const projects = await app!.inject({ url: '/api/projects', headers: { cookie: sid2 } });
    expect((projects.json() as { projects: unknown[] }).projects).toHaveLength(1);
    const bad = await app!.inject({ method: 'POST', url: '/api/auth/login', headers: H, payload: { email, password: 'wrong password' } });
    expect(bad.statusCode).toBe(401);
  });

  it('experts: lists services and takes a validated request', async () => {
    if (!dbUp) return;
    const list = await app!.inject({ url: '/api/experts' });
    const services = (list.json() as { services: Array<{ id: string }> }).services;
    expect(services.length).toBeGreaterThanOrEqual(7);
    expect(services.map((s) => s.id)).toContain('sonic');
    const bad = await app!.inject({ method: 'POST', url: '/api/experts/requests', headers: H, payload: { service: 'identity', name: 'Asha', email: 'not-an-email' } });
    expect(bad.statusCode).toBe(400);
    const ok = await app!.inject({
      method: 'POST',
      url: '/api/experts/requests',
      headers: H,
      payload: { service: 'sonic', also: ['video', 'nope'], name: 'Asha Rao', email: 'asha@example.com', budget: 'Not sure yet', details: 'A jingle for our chai brand', currency: 'INR' },
    });
    expect(ok.statusCode).toBe(200);
    const id = (ok.json() as { id: string }).id;
    const row = await pool.query('select service, email from expert_requests where id = $1', [id]);
    expect(row.rows[0]).toEqual({ service: 'sonic,video', email: 'asha@example.com' });
  });
});
