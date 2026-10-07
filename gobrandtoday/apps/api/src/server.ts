import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { env } from './config/env';
import { AppError } from './lib/errors';
import { logger } from './lib/logger';
import authPlugin from './plugins/auth';
import authRoutes from './routes/auth';
import brandRoutes from './routes/brands';
import domainRoutes from './routes/domains';
import eventRoutes from './routes/events';
import nameRoutes from './routes/names';
import projectRoutes from './routes/projects';
import socialRoutes from './routes/social';
import systemRoutes from './routes/system';

export async function buildServer() {
  const app = Fastify({
    loggerInstance: logger,
    trustProxy: true,
    bodyLimit: 256 * 1024,
  });

  // Validation is done with Zod inside handlers; route `schema`s exist for the OpenAPI docs only.
  app.setValidatorCompiler(() => (data) => ({ value: data }));

  await app.register(helmet, { contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' } });
  await app.register(cors, {
    origin: [env.APP_URL],
    credentials: true,
    allowedHeaders: ['content-type', 'x-gbt-csrf', 'x-gbt-currency'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });
  await app.register(cookie, { secret: env.SESSION_SECRET });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_PER_MINUTE,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.cookies?.gbt_sid?.slice(0, 16) || req.ip,
    errorResponseBuilder: (_req, ctx) => ({
      statusCode: 429,
      error: { code: 'rate_limited', message: `Slow down a little — try again in ${Math.ceil(ctx.ttl / 1000)}s.` },
    }),
  });
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'GoBrandToday API',
        version: '1.0.0',
        description: 'Idea → name → domain → handles → GoBrand Score → Brand Bible. State-changing requests need the `x-gbt-csrf: 1` header and the session cookie.',
      },
      tags: [
        { name: 'names' },
        { name: 'domains' },
        { name: 'social' },
        { name: 'brands' },
        { name: 'assistant' },
        { name: 'projects' },
        { name: 'saved' },
        { name: 'auth' },
        { name: 'system' },
        { name: 'admin' },
      ],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/api/docs' });
  await app.register(authPlugin);

  app.setErrorHandler((err: FastifyError | AppError | ZodError, req, reply) => {
    if (err instanceof AppError) {
      return reply.code(err.status).send({ error: { code: err.code, message: err.message, details: err.details } });
    }
    if (err instanceof ZodError) {
      return reply.code(400).send({ error: { code: 'bad_request', message: err.issues[0]?.message ?? 'Invalid input' } });
    }
    const status = (err as FastifyError).statusCode ?? 500;
    if (status === 429) return reply.code(429).send(err);
    if (status >= 500) req.log.error({ err }, 'unhandled error');
    return reply.code(status).send({
      error: { code: status >= 500 ? 'server_error' : 'bad_request', message: status >= 500 ? 'Something went wrong on our side. Please try again.' : err.message },
    });
  });
  app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: { code: 'not_found', message: 'Not found.' } }));

  await app.register(systemRoutes);
  await app.register(authRoutes);
  await app.register(nameRoutes);
  await app.register(domainRoutes);
  await app.register(socialRoutes);
  await app.register(brandRoutes);
  await app.register(projectRoutes);
  await app.register(eventRoutes);
  return app;
}
