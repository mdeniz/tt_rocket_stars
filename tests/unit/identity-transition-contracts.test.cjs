const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { assertIdentityTransitionContract } = require('../../scripts/check-identity-transition.cjs');

const readinessDocument = readFileSync(join(__dirname, '../../docs/identity-transition-readiness.md'), 'utf8');

test('identity transition contract includes non-portable credentials and staged approvals', () => {
  assert.equal(assertIdentityTransitionContract(), true);
});

test('identity transition contract rejects privileged credentials and hash copying', () => {
  assert.throws(() => assertIdentityTransitionContract('password hashes are portable'), /missing|copy/i);
  assert.throws(() => assertIdentityTransitionContract(`${readinessDocument}\nSUPABASE_SERVICE_ROLE`), /privileged credentials/i);
});
