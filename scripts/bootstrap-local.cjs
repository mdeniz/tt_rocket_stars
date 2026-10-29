const { spawnSync } = require('node:child_process');

for (const key of ['DATABASE_URL', 'DATABASE_MIGRATION_URL', 'DATABASE_ADMIN_URL']) {
  const value = process.env[key];
  if (value && !/^postgres(?:ql)?:\/\/(?:[^@/]+@)?(?:localhost|127\.0\.0\.1)(?::\d+)?\//.test(value)) {
    console.error(`Refusing local bootstrap with non-local ${key}.`);
    process.exit(1);
  }
}

const result = spawnSync(process.execPath, ['scripts/run-local-database-tests.cjs'], { stdio: 'inherit', env: process.env });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log('Local bootstrap passed: PostgreSQL ready, migrations applied, privileges configured, and integration tests passed.');
