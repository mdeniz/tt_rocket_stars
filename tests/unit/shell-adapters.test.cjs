const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const adapter = fs.readFileSync('src/lib/shell-adapters.ts', 'utf8');
const splash = fs.readFileSync('public/legacy/scripts/06.js', 'utf8');

test('fullscreen adapter fails closed when the browser API is unavailable', () => {
  assert.match(adapter, /typeof requestFullscreen !== 'function'/);
  assert.match(adapter, /catch \{\n    return Promise\.resolve\(false\)/);
});

test('legacy splash delegates fullscreen to the typed adapter when available', () => {
  assert.match(splash, /window\.TTFullscreenAdapter\?\.requestFullscreen/);
  assert.match(splash, /document\.documentElement\.requestFullscreen/);
});

test('pilot adapter delegates selection and creation to the legacy persistence boundary', () => {
  assert.match(adapter, /createPilotAdapter/);
  assert.match(adapter, /store\?\.read\(\)\.some\(profile => profile\.id === id\)/);
  assert.match(adapter, /store\.choose\(id\)/);
  assert.match(adapter, /store\.create\(name\)/);
  assert.match(adapter, /installPilotAdapter/);
});

test('core screen adapter keeps navigation and refresh behind stable legacy contracts', () => {
  assert.match(adapter, /CoreScreenId = 'dashboard' \| 'home' \| 'insights' \| 'garage' \| 'awards'/);
  assert.match(adapter, /createCoreScreensAdapter/);
  assert.match(adapter, /navigate = \(window as Window/);
  assert.match(adapter, /renderDashboard/);
  assert.match(adapter, /renderGarage/);
  assert.match(adapter, /installCoreScreensAdapter/);
});

test('core screen actions delegate through fail-closed legacy boundaries', () => {
  assert.match(adapter, /selectMissionOperation: operation => callLegacyAction\('choose', 'op', operation\)/);
  assert.match(adapter, /selectMissionMode: mode => callLegacyAction\('choose', 'mode', mode\)/);
  assert.match(adapter, /setMissionDuration: minutes => callLegacyAction\('chooseDuration', minutes\)/);
  assert.match(adapter, /startMission: \(\) => callLegacyAction\('start'\)/);
  assert.match(adapter, /selectRocketFamily: family => callLegacyStringAction\('selectFamily', family\)/);
  assert.match(adapter, /setGarageCategory: category => callLegacyStringAction\('setGarageCat', category\)/);
  assert.match(adapter, /previewGaragePart: partId => callLegacyStringAction\('previewPart', partId\)/);
  assert.match(adapter, /activateGaragePart: partId => callLegacyStringAction\('garageAction', partId\)/);
  assert.match(adapter, /refreshAchievements: \(\) => callLegacyAction\('renderAwards'\)/);
  assert.match(adapter, /if \(typeof action !== 'function'\) return false/);
  assert.match(adapter, /catch \{\n    return false;\n  \}/);
});
