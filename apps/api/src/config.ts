import { z } from 'zod';

const environmentSchema = z.object({
  API_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  API_CORS_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  API_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_BASE_URL: z.string().url().default('http://localhost:8787'),
  AUTH_LOCAL_INVITATION_CODE: z.string().min(8).default('local-test-invitation'),
});

let generatedAuthSecret: string | undefined;

export interface ApiEnv {
  readonly environment: 'development' | 'test' | 'staging' | 'production';
  readonly corsOrigins: readonly string[];
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
  readonly authSecret: string;
  readonly authBaseUrl: string;
  readonly localInvitationCode: string;
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export function parseApiEnv(input: Record<string, unknown> = {}): ApiEnv {
  const result = environmentSchema.safeParse(input);
  if (!result.success) throw new ConfigurationError('API runtime configuration is invalid.');
  const corsOrigins = result.data.API_CORS_ORIGINS.split(',').map(value => value.trim()).filter(Boolean);
  if (corsOrigins.length === 0) throw new ConfigurationError('API_CORS_ORIGINS must contain at least one origin.');
  if ((result.data.API_ENV === 'production' || result.data.API_ENV === 'staging') && !result.data.AUTH_SECRET) {
    throw new ConfigurationError('AUTH_SECRET is required outside local development.');
  }
  generatedAuthSecret ??= crypto.randomUUID() + crypto.randomUUID();
  return Object.freeze({
    environment: result.data.API_ENV,
    corsOrigins: Object.freeze(corsOrigins),
    logLevel: result.data.API_LOG_LEVEL,
    authSecret: result.data.AUTH_SECRET ?? generatedAuthSecret,
    authBaseUrl: result.data.AUTH_BASE_URL,
    localInvitationCode: result.data.AUTH_LOCAL_INVITATION_CODE,
  });
}

export function parseWorkerEnv(env: Record<string, unknown>): ApiEnv {
  return parseApiEnv(env);
}
