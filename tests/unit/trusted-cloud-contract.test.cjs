const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const contract = import('../../supabase/functions/_shared/cloud-contract.js');

test('accepts only allowlisted domain operations', async () => {
  const { parseRequestBody } = await contract;
  const request = parseRequestBody({
    operation: 'upload',
    expectedVersion: 0,
    pilot: {
      localId: 'pilot-1',
      name: 'Ada',
      language: 'en',
      payload: { progress: 1 },
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  });
  assert.equal(request.operation, 'upload');
  assert.equal(request.pilot.localId, 'pilot-1');
  assert.throws(() => parseRequestBody({ operation: 'from', table: 'pilots' }), /operation is not allowed/);
});

test('rejects malformed and oversized requests', async () => {
  const { parseRequestBody, MAX_BODY_BYTES } = await contract;
  assert.throws(() => parseRequestBody({ operation: 'upload', pilot: {} }), /pilot\.localId is invalid/);
  assert.throws(() => parseRequestBody({ operation: 'download', localId: '' }), /localId is invalid/);
  assert.throws(() => parseRequestBody({ operation: 'listPilots' }, MAX_BODY_BYTES + 1), /request body is too large/);
});

test('requires a bearer token and allowlists configured origins', async () => {
  const { parseBearerToken, allowedOrigin } = await contract;
  assert.equal(parseBearerToken('Bearer user-token'), 'user-token');
  assert.throws(() => parseBearerToken('Basic secret'), /authenticated user required/);
  assert.equal(allowedOrigin('https://mdeniz.github.io', 'http://localhost:5173,https://mdeniz.github.io'), 'https://mdeniz.github.io');
  assert.equal(allowedOrigin('https://evil.example', 'https://mdeniz.github.io'), null);
});

test('trusted function source does not contain administrative credentials or arbitrary query input', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../supabase/functions/trusted-cloud/index.ts'), 'utf8');
  assert.doesNotMatch(source, /service[_-]?role|SUPABASE_SERVICE_ROLE_KEY|database[_-]?password/i);
  assert.doesNotMatch(source, /body\.table|body\.query|body\.sql/);
  assert.match(source, /parseBearerToken/);
  assert.match(source, /user\.id/);
});

test('maps conflicts and authentication failures to bounded responses', async () => {
  const { errorResponse } = await contract;
  assert.deepEqual(errorResponse({ code: '40001' }).status, 409);
  assert.deepEqual(errorResponse({ code: 'unauthorized' }).body, { error: 'unauthorized', message: 'Authentication required.' });
});
