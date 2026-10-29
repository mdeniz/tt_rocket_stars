const test = require('node:test');
const assert = require('node:assert/strict');

async function load() {
  return import('../../apps/api/src/app.ts');
}

const env = {
  environment: 'test',
  corsOrigins: ['http://localhost:5173'],
  logLevel: 'info',
};

test('health and readiness return versioned JSON contracts', async () => {
  const { createApi } = await load();
  const app = createApi(env);
  const health = await app.request('http://localhost/api/v1/health');
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { ok: true, service: 'tt-rocket-stars-api', requestId: health.headers.get('X-Request-ID') });
  const ready = await app.request('http://localhost/api/v1/ready');
  assert.equal(ready.status, 200);
  assert.equal((await ready.json()).dependencies.database, 'not_configured');
});

test('request IDs are preserved and generated safely', async () => {
  const { createApi } = await load();
  const app = createApi(env);
  const preserved = await app.request('http://localhost/api/v1/health', { headers: { 'X-Request-ID': 'test-request-1' } });
  assert.equal(preserved.headers.get('X-Request-ID'), 'test-request-1');
  const generated = await app.request('http://localhost/api/v1/health');
  assert.match(generated.headers.get('X-Request-ID'), /^[A-Za-z0-9_-]{16}$/);
});

test('CORS rejects unknown origins and allows configured origins', async () => {
  const { createApi } = await load();
  const app = createApi(env);
  const denied = await app.request('http://localhost/api/v1/health', { headers: { Origin: 'https://evil.example' } });
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).error.code, 'forbidden');
  const allowed = await app.request('http://localhost/api/v1/health', { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get('Access-Control-Allow-Origin'), 'http://localhost:5173');
});

test('unknown routes return a stable error envelope', async () => {
  const { createApi } = await load();
  const response = await createApi(env).request('http://localhost/api/v1/missing');
  assert.equal(response.status, 404);
  assert.deepEqual((await response.json()).error, { code: 'not_found', message: 'Route not found.' });
});

test('structured logs redact credential-shaped fields', async () => {
  const { createLogger } = await import('../../apps/api/src/logging.ts');
  const lines = [];
  createLogger(line => lines.push(line))('auth.test', { authorization: 'Bearer secret', nested: { password: 'pw', safe: 'value' } });
  const entry = JSON.parse(lines[0]);
  assert.equal(entry.authorization, '[REDACTED]');
  assert.equal(entry.nested.password, '[REDACTED]');
  assert.equal(entry.nested.safe, 'value');
});
