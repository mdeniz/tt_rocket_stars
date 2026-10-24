const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const shell = fs.readFileSync(path.join(root, 'src/shell.tsx'), 'utf8');
const english = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/en.json'), 'utf8'));
const spanish = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/es.json'), 'utf8'));

test('React core composition uses stable legacy hosts and reversible portals', () => {
  assert.match(shell, /createPortal\(/);
  assert.match(shell, /data-react-core-host/);
  assert.match(shell, /selector: '#dashboard'/);
  assert.match(shell, /selector: '#insights'/);
  assert.match(shell, /element\.remove\(\)/);
  assert.match(shell, /window\.TTCoreScreensAdapter\?\.show\(action\)/);
});

test('React core composition labels are complete in English and Spanish', () => {
  for (const key of [
    'ui.core.dashboard',
    'ui.core.insights',
    'ui.core.openProgress',
    'ui.core.openDashboard',
  ]) {
    assert.equal(typeof english[key], 'string', `English locale is missing ${key}`);
    assert.equal(typeof spanish[key], 'string', `Spanish locale is missing ${key}`);
    assert.notEqual(english[key], '');
    assert.notEqual(spanish[key], '');
  }
});

test('React mission setup renders all supported configuration controls', () => {
  assert.match(shell, /ReactMissionSetup/);
  assert.match(shell, /toggleMissionTable/);
  assert.match(shell, /selectMissionOperation/);
  assert.match(shell, /selectMissionMode/);
  assert.match(shell, /setMissionDuration/);
  assert.match(shell, /startMission/);
  for (const key of ['ui.mission.setup', 'ui.mission.practice', 'ui.mission.exam', 'ui.mission.speed', 'ui.mission.timed']) {
    assert.equal(typeof english[key], 'string', `English locale is missing ${key}`);
    assert.equal(typeof spanish[key], 'string', `Spanish locale is missing ${key}`);
  }
});

test('React garage controls delegate inventory actions through the adapter', () => {
  assert.match(shell, /ReactGaragePanel/);
  assert.match(shell, /setGarageCategory/);
  assert.match(shell, /previewGaragePart/);
  assert.match(shell, /activateGaragePart/);
  assert.match(shell, /refresh\('garage'\)/);
  assert.match(fs.readFileSync(path.join(root, 'public/legacy/scripts/03.js'), 'utf8'), /data-garage-part-id/);
  for (const key of [
    'ui.garage.controls',
    'ui.garage.description',
    'ui.garage.refresh',
    'ui.garage.preview',
    'ui.garage.equip',
  ]) {
    assert.equal(typeof english[key], 'string', `English locale is missing ${key}`);
    assert.equal(typeof spanish[key], 'string', `Spanish locale is missing ${key}`);
  }
});
