import { Hono } from 'hono';
import type { Context } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import type { ApiEnv } from './config.ts';
import { ApiError, errorResponse } from './errors.ts';
import { createErrorEvent, createLogger } from './logging.ts';
import { createAuthService, type AuthService, type AuthDatabase } from './auth.ts';
import { createInMemoryPilotRepository, type PilotRepository } from './authorization.ts';
import type { AuthIdentity } from './contracts.ts';

export interface ApiBindings extends ApiEnv {}
export interface ApiVariables { requestId: string }

export interface ApiOptions {
  readonly auth?: AuthService;
  readonly authDatabase?: AuthDatabase;
  readonly pilots?: PilotRepository;
}

function cors(app: Hono<{ Bindings: ApiBindings; Variables: ApiVariables }>): void {
  app.use('*', async (context, next) => {
    const origin = context.req.header('Origin');
    if (origin && !context.env.corsOrigins.includes(origin)) throw new ApiError(403, 'forbidden', 'Origin is not allowed.');
    await next();
    if (origin) context.header('Access-Control-Allow-Origin', origin);
    context.header('Vary', 'Origin');
    context.header('Access-Control-Allow-Headers', 'Content-Type, X-Request-ID');
    context.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    context.header('Access-Control-Allow-Credentials', 'true');
  });
  app.options('*', context => context.body(null, 204));
}

export function createApi(env: ApiEnv, options: ApiOptions = {}): Hono<{ Bindings: ApiBindings; Variables: ApiVariables }> {
  const app = new Hono<{ Bindings: ApiBindings; Variables: ApiVariables }>();
  const authService = options.auth ?? createAuthService(env, options.authDatabase);
  const pilots = options.pilots ?? createInMemoryPilotRepository([]);
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
      log('request.completed', { requestId, method: context.req.method, status: context.res.status, durationMs: Date.now() - started });
    }
  });
  app.use('*', async (context, next) => {
    context.env = env;
    await next();
  });
  app.use('*', honoLogger());
  cors(app);
  app.onError((error, context) => {
    const requestId = context.get('requestId') || 'unknown';
    log('api.error', createErrorEvent({ requestId, status: error instanceof ApiError ? error.status : 500, code: error instanceof ApiError ? error.code : 'internal_error' }));
    return errorResponse(context, error, requestId);
  });
  app.notFound(context => errorResponse(context, new ApiError(404, 'not_found', 'Route not found.'), context.get('requestId') || 'unknown'));
  app.get('/api/v1/health', context => context.json({ ok: true, service: 'tt-rocket-stars-api', requestId: context.get('requestId') }));
  app.get('/api/v1/ready', context => context.json({ ok: true, environment: context.env.environment, dependencies: { database: options.authDatabase ? 'configured' : 'not_configured', auth: 'configured' }, requestId: context.get('requestId') }));
  app.post('/api/v1/auth/local/invite', async context => {
    if (context.env.environment !== 'development' && context.env.environment !== 'test') throw new ApiError(404, 'not_found', 'Route not found.');
    const body = await context.req.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body.email !== 'string' || typeof body.name !== 'string' || typeof body.password !== 'string' || typeof body.invitationCode !== 'string') {
      throw new ApiError(400, 'bad_request', 'A valid local invitation payload is required.');
    }
    try {
      return context.json({ ok: true, user: await authService.inviteLocalUser({ email: body.email, name: body.name, password: body.password, invitationCode: body.invitationCode }) }, 201);
    } catch (error) {
      throw new ApiError(400, 'bad_request', error instanceof Error ? error.message : 'Invitation failed.');
    }
  });
  app.all('/api/v1/auth/*', context => authService.auth.handler(context.req.raw));
  const getIdentity = async (context: Context<{ Bindings: ApiBindings; Variables: ApiVariables }>): Promise<AuthIdentity> => {
    const session = await authService.auth.api.getSession({ headers: context.req.raw.headers });
    if (!session) throw new ApiError(401, 'unauthorized', 'Authentication is required.');
    return { userId: session.user.id, accountId: session.user.id, email: session.user.email };
  };
  app.get('/api/v1/me', async context => context.json({ ok: true, identity: await getIdentity(context) }));
  app.get('/api/v1/pilots/:pilotId', async context => {
    const identity = await getIdentity(context);
    const pilot = await pilots.findOwnedPilot(identity, context.req.param('pilotId'));
    if (!pilot) throw new ApiError(404, 'not_found', 'Pilot not found.');
    return context.json({ ok: true, pilot });
  });
  return app;
}
