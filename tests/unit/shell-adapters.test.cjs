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
