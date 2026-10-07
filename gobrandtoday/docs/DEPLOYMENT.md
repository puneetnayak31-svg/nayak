# Deployment

Two stateless Node services plus Postgres. No vendor-specific code.

## Production checklist
- [ ] `NODE_ENV=production`, a long random `SESSION_SECRET` (the API refuses to boot without one)
- [ ] `APP_URL` = public web URL; `NEXT_PUBLIC_SITE_URL` = canonical URL (SEO)
- [ ] HTTPS in front of both services (cookies are `Secure` in production)
- [ ] `DATABASE_URL` (+ `DATABASE_SSL=true` for most managed Postgres)
- [ ] `npm run db:migrate` (the API Docker image runs it on start)
- [ ] `API_ORIGIN` set **at web build time** (Next.js bakes rewrites into the build)
- [ ] Optional keys: AI, registrar, YouTube, GitHub, Google OAuth, PostHog
- [ ] `ADMIN_EMAILS` to unlock `/api/admin/status`

## Docker Compose (single server)
```bash
cp .env.example .env    # set SESSION_SECRET, APP_URL, keys…
docker compose up --build -d
```
This starts Postgres (`:5432`), the API (`:4000`, migrations run on start) and the web app (`:3000`). Put Caddy, nginx or a cloud load balancer in front for TLS.

## Separate images
```bash
docker build -f apps/api/Dockerfile -t gobrandtoday-api .
docker build -f apps/web/Dockerfile --build-arg API_ORIGIN=https://api.internal:4000 \
             --build-arg NEXT_PUBLIC_SITE_URL=https://gobrandtoday.com -t gobrandtoday-web .
```

## Render / Railway / Fly.io
* **API**: root `gobrandtoday/`, build `npm ci && npm run build --workspace @gbt/api`, start `npm run db:migrate && npm run start --workspace @gbt/api` (or use `apps/api/Dockerfile`). Health check: `/health`.
* **Web**: build `npm ci && npm run build --workspace @gbt/web` with `API_ORIGIN` pointing at the API's private URL; start `npm run start --workspace @gbt/web`.
* **Postgres**: any managed instance.

## Vercel (web) + any Node host (API)
Deploy `apps/web` to Vercel (root directory `gobrandtoday/apps/web`, with `API_ORIGIN` set to the API URL in project env). Deploy the API anywhere that runs Node 20+. Keep both on the same parent domain (e.g. `gobrandtoday.com` and `api.gobrandtoday.com`). The browser only ever talks to the web origin, so no CORS setup is needed.

## Scaling notes
* Both services are stateless. Run more replicas behind a load balancer.
* The in-memory cache is per instance. For many replicas, implement `CacheStore` with Redis (`apps/api/src/lib/cache.ts`).
* Brand generation runs in-process (`202` + polling). At higher volume, move `runGeneration` onto a queue (BullMQ, SQS) — the interface stays the same.
* Rate limits are per instance by default. `@fastify/rate-limit` accepts a Redis store.
