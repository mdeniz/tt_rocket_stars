const { spawnSync } = require('node:child_process');

const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['audit', '--audit-level=high', '--omit=optional'], { stdio: 'inherit' });
if (result.error) {
  console.error('Dependency audit could not run; registry access or npm is unavailable.');
  process.exit(2);
}
process.exit(result.status ?? 2);
