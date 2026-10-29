const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const document = readFileSync(join(__dirname, '..', 'docs/identity-transition-readiness.md'), 'utf8');

const requiredTerms = [
  'password hashes are not assumed portable',
  'sessions MUST NOT be migrated',
  'invitation',
  're-authentication',
  'explicit linking',
  'VITE_BETTER_AUTH_ENABLED',
  'read-only fallback',
  'Local synthetic',
  'Hosted staging (approval required)',
  'Canary (approval required)',
  'Cutover (separate written approval)',
  'rollback',
  'package checksum',
  'session invalidation',
];

function assertIdentityTransitionContract(source = document) {
  for (const term of requiredTerms) {
    if (!source.toLowerCase().includes(term.toLowerCase())) throw new Error(`Identity transition contract is missing: ${term}`);
  }
  if (/SUPABASE_SERVICE_ROLE|service_role|password hash.*copy|copy.*password hash/i.test(source)) {
    throw new Error('Identity transition contract must not copy privileged credentials or password hashes.');
  }
  return true;
}

if (require.main === module) {
  assertIdentityTransitionContract();
  console.log('Verified identity transition and staged cutover contract');
}

module.exports = { assertIdentityTransitionContract, requiredTerms };
