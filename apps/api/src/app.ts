import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import type { ApiEnv } from './config.ts';
import { ApiError, errorResponse } from './errors.ts';
import { createLogger } from './logging.ts';

export interface ApiBindings extends ApiEnv {}
export interface ApiVariables { requestId: string }

function cors(app: Hono<{ Bindings: ApiBindings; Variables: ApiVariables }>): void {
  app.use('*', async (context, next) => {
    const origin = context.req.header('Origin');
    if (origin && !context.env.corsOrigins.includes(origin)) throw new ApiError(403, 'forbidden', 'Origin is not allowed.');
    await next();
    if (origin) context.header('Access-Control-Allow-Origin', origin);
    context.header('Vary', 'Origin');
    context.header('Access-Control-Allow-Headers', 'Content-Type, X-Request-ID');
    context.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  });
  app.options('*', context => context.body(null, 204));
}

export function createApi(env: ApiEnv): Hono<{ Bindings: ApiBindings; Variables: ApiVariables }> {
  const app = new Hono<{ Bindings: ApiBindings; Variables: ApiVariables }>();
  const log = createLogger();
  app.use('*', async (context, next) => {
    const candidate = context.req.header('X-Request-ID');
    const requestId = candidate && /^[A-Za-z0-9._-]{1,128}$/.test(candidate)
      ? candidate
      : crypto.randomUUID().replaceAll('-', '').slice(0, 16);
    context.set('requestId', requestId);
    context.header('X-Request-ID', requestId);
    const started = Date.now();
    try {
      await next();
    } finally {
      log('request.completed', { requestId, method: context.req.method, path: context.req.path, status: context.res.status, durationMs: Date.now() - started });
    }
  });
  app.use('*', async (context, next) => {
    context.env = env;
    await next();
  });
  app.use('*', honoLogger());
  cors(app);
  app.onError((error, context) => errorResponse(context, error, context.get('requestId') || 'unknown'));
  app.notFound(context => errorResponse(context, new ApiError(404, 'not_found', 'Route not found.'), context.get('requestId') || 'unknown'));
  app.get('/api/v1/health', context => context.json({ ok: true, service: 'tt-rocket-stars-api', requestId: context.get('requestId') }));
  app.get('/api/v1/ready', context => context.json({ ok: true, environment: context.env.environment, dependencies: { database: 'not_configured', auth: 'not_configured' }, requestId: context.get('requestId') }));
  return app;
}
