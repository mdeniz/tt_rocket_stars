const applicationTables = new Set(['accounts', 'pilots', 'progress_snapshots', 'sync_operations', 'crews', 'crew_memberships', 'pilot_access', 'user', 'account', 'session', 'verification', 'migration_imports']);

function validatePrivilegeRows(rows) {
  for (const row of rows) {
    if (row.grantee !== 'tt_app') continue;
    if (!applicationTables.has(row.table_name)) throw new Error(`Application role has an unexpected table grant: ${row.table_name}`);
    if (!['SELECT', 'INSERT', 'UPDATE', 'DELETE'].includes(row.privilege_type)) throw new Error(`Application role has an unexpected privilege: ${row.privilege_type}`);
  }
  return true;
}

if (require.main === module) console.log('Local database privilege contract loaded; run the integration harness for live grant verification.');
module.exports = { applicationTables, validatePrivilegeRows };
