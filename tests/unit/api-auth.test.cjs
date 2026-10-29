const test = require('node:test');
const assert = require('node:assert/strict');

const env = {
  environment: 'test',
  corsOrigins: ['http://localhost:5173'],
  logLevel: 'info',
  authSecret: 'local-test-secret-that-is-long-enough-123',
  authBaseUrl: 'http://localhost:8787',
  localInvitationCode: 'local-test-invitation',
};
const origin = 'http://localhost:5173';

async function load() {
  return import('../../apps/api/src/app.ts');
}

async function invite(app, email, name = 'Local Pilot') {
  const response = await app.request('http://localhost/api/v1/auth/local/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, 'X-Forwarded-For': '127.0.0.1' },
    body: JSON.stringify({ email, name, password: 'correct-horse-battery-staple', invitationCode: env.localInvitationCode }),
  });
  assert.equal(response.status, 201);
}

async function signIn(app, email) {
  const response = await app.request('http://localhost/api/v1/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, 'X-Forwarded-For': `192.0.2.${email.charCodeAt(0)}` },
    body: JSON.stringify({ email, password: 'correct-horse-battery-staple' }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie');
  assert.ok(cookie);
  return cookie.split(';', 1)[0];
}

test('local auth is invitation-only and supports recovery, revocation, and logout', async () => {
  const { createApi } = await load();
  const app = createApi(env);
  const publicSignup = await app.request('http://localhost/api/v1/auth/sign-up/email', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ name: 'Blocked', email: 'blocked@example.test', password: 'correct-horse-battery-staple' }),
  });
  assert.equal(publicSignup.status, 400);
  await invite(app, 'pilot@example.test');
  const cookie = await signIn(app, 'pilot@example.test');
  const me = await app.request('http://localhost/api/v1/me', { headers: { Cookie: cookie, Origin: origin } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).identity.email, 'pilot@example.test');

  const reset = await app.request('http://localhost/api/v1/auth/request-password-reset', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ email: 'pilot@example.test', redirectTo: 'http://localhost:5173/reset' }),
  });
  assert.equal(reset.status, 200);

  const revoke = await app.request('http://localhost/api/v1/auth/revoke-sessions', {
    method: 'POST', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({}),
  });
  assert.equal(revoke.status, 200);
  const revoked = await app.request('http://localhost/api/v1/me', { headers: { Cookie: cookie, Origin: origin } });
  assert.equal(revoked.status, 401);

  const secondCookie = await signIn(app, 'pilot@example.test');
  const logout = await app.request('http://localhost/api/v1/auth/sign-out', { method: 'POST', headers: { Cookie: secondCookie, Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
  assert.equal(logout.status, 200);
  const loggedOut = await app.request('http://localhost/api/v1/me', { headers: { Cookie: secondCookie, Origin: origin } });
  assert.equal(loggedOut.status, 401);
});

test('protected resources use the authenticated account and isolate pilots', async () => {
  const { createApi } = await load();
  const { createAuthService } = await import('../../apps/api/src/auth.ts');
  const auth = createAuthService(env);
  const first = createApi(env, { auth });
  await invite(first, 'first@example.test');
  const firstCookie = await signIn(first, 'first@example.test');
  const second = createApi(env, { auth });
  await invite(second, 'second@example.test');
  const secondCookie = await signIn(second, 'second@example.test');
  const { createInMemoryPilotRepository } = await import('../../apps/api/src/authorization.ts');
  const app = createApi(env, { auth, pilots: createInMemoryPilotRepository([]) });
  const anonymous = await app.request('http://localhost/api/v1/pilots/pilot-1');
  assert.equal(anonymous.status, 401);
  // The test repository is deliberately owned by the first account; a second session must not cross the boundary.
  const firstMe = await first.request('http://localhost/api/v1/me', { headers: { Cookie: firstCookie } });
  const accountId = (await firstMe.json()).identity.accountId;
  const ownedApp = createApi(env, { auth, pilots: createInMemoryPilotRepository([{ id: 'pilot-1', accountId, name: 'Owned' }]) });
  assert.equal((await ownedApp.request('http://localhost/api/v1/pilots/pilot-1', { headers: { Cookie: firstCookie } })).status, 200);
  assert.equal((await ownedApp.request('http://localhost/api/v1/pilots/pilot-1', { headers: { Cookie: secondCookie } })).status, 404);
});
