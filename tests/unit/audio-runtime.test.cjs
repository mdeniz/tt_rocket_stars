const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const audioRuntime = fs.readFileSync('public/legacy/scripts/16.js', 'utf8');

test('disabled audio does not initialize an AudioContext during startup', () => {
  const start = audioRuntime.indexOf('function startAudio()');
  const ensureCall = audioRuntime.indexOf('if(!ensure())return false;', start);

  assert.notEqual(start, -1, 'startAudio must remain part of the legacy audio contract');
  assert.notEqual(ensureCall, -1, 'startAudio must keep its initialization guard');
  assert.match(
    audioRuntime.slice(start, ensureCall),
    /if\(!cfg\.enabled\)return false;/,
    'disabled audio must return before constructing an AudioContext',
  );
});
