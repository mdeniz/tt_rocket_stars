import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth/minimal';
import type { BetterAuthOptions, Auth } from 'better-auth';
import type { ApiEnv } from './config.ts';
import { schema } from './db/schema.ts';

export type AuthDatabase = unknown;

export interface AuthService {
  readonly auth: Auth<any>;
  readonly inviteLocalUser: (input: { email: string; name: string; password: string; invitationCode: string }) => Promise<{ id: string; email: string }>;
  readonly resetUrls: string[];
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createAuthService(env: ApiEnv, database?: AuthDatabase): AuthService {
  const resetUrls: string[] = [];
  const authBaseUrl = env.authBaseUrl ?? 'http://localhost:8787';
  const authSecret = env.authSecret ?? crypto.randomUUID() + crypto.randomUUID();
  const localInvitationCode = env.localInvitationCode ?? 'local-test-invitation';
  const options: BetterAuthOptions = {
    ...(database ? { database: drizzleAdapter(database as any, { provider: 'pg', schema }) } : {}),
    baseURL: authBaseUrl,
    basePath: '/api/v1/auth',
    secret: authSecret,
    trustedOrigins: [...env.corsOrigins, authBaseUrl],
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ url }) => { resetUrls.push(url); },
    },
    rateLimit: { enabled: true, window: 60, max: 20, storage: 'memory' },
    advanced: { useSecureCookies: env.environment !== 'development' && env.environment !== 'test', ipAddress: { ipAddressHeaders: ['x-forwarded-for', 'cf-connecting-ip'] } },
  };
  const auth = betterAuth(options);

  return {
    auth,
    resetUrls,
    async inviteLocalUser(input) {
      if (input.invitationCode !== localInvitationCode) throw new Error('Invalid invitation code.');
      const email = normalizeEmail(input.email);
      const context = await auth.$context;
      const existing = await context.internalAdapter.findUserByEmail(email);
      if (existing) throw new Error('An account already exists for this email.');
      const created = await context.internalAdapter.createUser({
        id: crypto.randomUUID(),
        name: input.name.trim(),
        email,
        emailVerified: true,
      }, { method: 'email-password' });
      await context.internalAdapter.createAccount({
        id: crypto.randomUUID(),
        accountId: created.id,
        providerId: 'credential',
        userId: created.id,
        password: await context.password.hash(input.password),
      });
      return { id: created.id, email };
    },
  };
}
