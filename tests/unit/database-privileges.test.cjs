const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePrivilegeRows } = require('../../scripts/check-local-database-privileges.cjs');

test('application role grants are limited to application tables and DML', () => {
  assert.equal(validatePrivilegeRows([
    { grantee: 'tt_app', table_name: 'accounts', privilege_type: 'SELECT' },
    { grantee: 'tt_app', table_name: 'pilots', privilege_type: 'UPDATE' },
    { grantee: 'tt_migrator', table_name: 'account', privilege_type: 'TRUNCATE' },
  ]), true);
  assert.throws(() => validatePrivilegeRows([{ grantee: 'tt_app', table_name: 'user_secrets', privilege_type: 'SELECT' }]), /unexpected table grant/);
  assert.throws(() => validatePrivilegeRows([{ grantee: 'tt_app', table_name: 'pilots', privilege_type: 'TRUNCATE' }]), /unexpected privilege/);
});
