const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const backupScript = fs.readFileSync('public/legacy/scripts/05.js', 'utf8');

test('legacy backup handlers delegate to the typed boundary when it owns backups', () => {
  assert.match(backupScript, /window\.TTBackupControls\?\.ownsBackups\(\)/);
  assert.match(backupScript, /window\.TTBackupControls\.createManualBackup\(\)/);
  assert.match(backupScript, /window\.TTBackupControls\.exportBackup\(\)/);
  assert.match(backupScript, /window\.TTBackupControls\.resetWithBackup\(\)/);
  assert.match(backupScript, /window\.TTBackupControls\.restoreBackup\(id\)/);
  assert.match(backupScript, /window\.TTBackupControls\.importBackup\(e\)/);
});
