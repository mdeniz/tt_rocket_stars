const test = require('node:test');
const assert = require('node:assert/strict');
const { validateEnvironment } = require('../../scripts/check-environment-contract.cjs');

test('local environment contract exposes only non-secret defaults', () => {
  assert.deepEqual(validateEnvironment({}), { environment: 'development', required: [], defaults: ['API_ENV', 'API_CORS_ORIGINS', 'AUTH_BASE_URL', 'AUTH_LOCAL_INVITATION_CODE'] });
});

test('staging and production fail closed without a strong auth secret', () => {
  assert.throws(() => validateEnvironment({ API_ENV: 'staging' }), /AUTH_SECRET/);
  assert.throws(() => validateEnvironment({ API_ENV: 'production', AUTH_SECRET: 'short' }), /AUTH_SECRET/);
  assert.equal(validateEnvironment({ API_ENV: 'production', AUTH_SECRET: 'x'.repeat(32) }).environment, 'production');
});

test('environment origins reject malformed values', () => {
  assert.throws(() => validateEnvironment({ API_CORS_ORIGINS: 'javascript:alert(1)' }), /HTTP origins/);
});
