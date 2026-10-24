const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const adapter = fs.readFileSync('src/lib/shell-adapters.ts', 'utf8');
const navigation = fs.readFileSync('public/legacy/scripts/26.js', 'utf8');

test('settings adapter delegates only to an initialized legacy category boundary', () => {
  assert.match(adapter, /createSettingsAdapter/);
  assert.match(adapter, /store\?\.showSettingsPanel\(panel\)/);
  assert.match(adapter, /installSettingsAdapter/);
  assert.match(navigation, /window\.TTSettingsAdapter=\{showSettingsPanel:panel=>activate/);
});
