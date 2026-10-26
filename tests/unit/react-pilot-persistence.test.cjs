const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const childProcess = require('node:child_process');

const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-react-pilot-persistence-'));
fs.writeFileSync(path.join(outputDirectory, 'package.json'), '{"type":"commonjs"}');
childProcess.execFileSync('npx', [
  'tsc', '--ignoreConfig', 'src/lib/react-pilot-persistence.ts',
  '--module', 'commonjs', '--target', 'es2022', '--outDir', outputDirectory,
], { cwd: process.cwd(), stdio: 'pipe' });
const { createReactPilotPersistence } = require(path.join(outputDirectory, 'react-pilot-persistence.js'));

function setup() {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, String(value)); },
    removeItem: key => values.delete(key),
  };
  const keys = ['cosmotablas-v2', 'cosmotablas-history-v1', 'tt-rocket-garage-v1', 'tt-rocket-backups-v1'];
  global.window = {
    TTLocalStore: storage,
    TTPersistenceContracts: {
      createPilotPersistence: (backing, payloadKeys) => ({
        readJson: (key, fallback) => {
          try { return JSON.parse(backing.getItem(key) ?? JSON.stringify(fallback)); } catch { return fallback; }
        },
        writeJson: (key, value) => { backing.setItem(key, JSON.stringify(value)); return true; },
        capture: () => Object.fromEntries(payloadKeys.map(key => [key, backing.getItem(key)])),
        apply: payload => payloadKeys.forEach(key => {
          if (typeof payload?.[key] === 'string') backing.setItem(key, payload[key]);
          else backing.removeItem(key);
        }),
      }),
      validateProfiles: value => Array.isArray(value) && value.every(profile => profile && typeof profile.id === 'string' && typeof profile.name === 'string' && (profile.language === 'en' || profile.language === 'es') && profile.payload && typeof profile.payload === 'object')
        ? { ok: true, value }
        : { ok: false },
    },
    TTSwitchProfileInPlace: () => { global.window.switches = (global.window.switches || 0) + 1; },
  };
  storage.setItem('tt-rocket-profiles-v1', JSON.stringify([
    { id: 'pilot-a', name: 'Pilot A', language: 'en', createdAt: 1, payload: { 'cosmotablas-v2': '{"a":1}' } },
    { id: 'pilot-b', name: 'Pilot B', language: 'es', createdAt: 2, payload: { 'cosmotablas-v2': '{"b":2}' } },
  ]));
  storage.setItem('tt-rocket-active-profile-v1', 'pilot-a');
  storage.setItem('cosmotablas-v2', '{"a":9}');
  storage.setItem('cosmotablas-language', 'en');
  return { storage, keys };
}

test('owns profile switching through typed local persistence without legacy profile calls', () => {
  const { storage } = setup();
  const adapter = createReactPilotPersistence();
  assert.deepEqual(adapter.readPilots().map(pilot => pilot.id), ['pilot-a', 'pilot-b']);
  assert.equal(adapter.choosePilot('pilot-b'), true);
  assert.equal(storage.getItem('tt-rocket-active-profile-v1'), 'pilot-b');
  assert.equal(storage.getItem('cosmotablas-v2'), '{"b":2}');
  assert.equal(storage.getItem('cosmotablas-language'), 'es');
  assert.equal(global.window.switches, 1);
});

test('rejects duplicate and malformed profile operations without mutating active state', () => {
  const { storage } = setup();
  const adapter = createReactPilotPersistence();
  assert.equal(adapter.createPilot('Pilot A'), null);
  assert.equal(storage.getItem('tt-rocket-active-profile-v1'), 'pilot-a');
  storage.setItem('tt-rocket-profiles-v1', '{invalid');
  assert.deepEqual(adapter.readPilots(), []);
  assert.equal(adapter.choosePilot('pilot-b'), false);
  assert.equal(storage.getItem('tt-rocket-active-profile-v1'), 'pilot-a');
});
