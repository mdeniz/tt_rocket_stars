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
        apply: payload => {
          if (global.window.applyFailure) throw new Error('profile apply unavailable');
          payloadKeys.forEach(key => {
          if (typeof payload?.[key] === 'string') backing.setItem(key, payload[key]);
          else backing.removeItem(key);
          });
        },
      }),
      validateProfiles: value => Array.isArray(value) && value.every(profile => profile && typeof profile.id === 'string' && typeof profile.name === 'string' && (profile.language === 'en' || profile.language === 'es') && profile.payload && typeof profile.payload === 'object')
        ? { ok: true, value }
        : { ok: false },
    },
    TTSwitchProfileInPlace: () => { global.window.switches = (global.window.switches || 0) + 1; },
  };
  storage.setItem('tt-rocket-profiles-v1', JSON.stringify([
    { id: 'pilot-a', name: 'Pilot A', language: 'en', createdAt: 1, payload: { 'cosmotablas-v2': '{"a":1}', opaque: { preserved: true } } },
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

test('renames a pilot without changing its identity or opaque payload fields', () => {
  const { storage } = setup();
  const adapter = createReactPilotPersistence();
  assert.equal(adapter.renamePilot('pilot-a', 'Renamed Pilot'), true);
  const profiles = JSON.parse(storage.getItem('tt-rocket-profiles-v1'));
  assert.deepEqual(profiles[0], {
    id: 'pilot-a',
    name: 'Renamed Pilot',
    language: 'en',
    createdAt: 1,
    payload: {
      'cosmotablas-v2': '{"a":9}',
      'cosmotablas-history-v1': null,
      'tt-rocket-garage-v1': null,
      'tt-rocket-backups-v1': null,
      opaque: { preserved: true },
    },
  });
  assert.equal(storage.getItem('tt-rocket-active-profile-v1'), 'pilot-a');
});

test('deletes a non-final pilot and preserves the active pilot payload', () => {
  const { storage } = setup();
  const adapter = createReactPilotPersistence();
  assert.equal(adapter.deletePilot('pilot-b'), true);
  assert.deepEqual(adapter.readPilots().map(pilot => pilot.id), ['pilot-a']);
  assert.equal(storage.getItem('tt-rocket-active-profile-v1'), 'pilot-a');
  assert.equal(storage.getItem('cosmotablas-v2'), '{"a":9}');
});

test('rejects deleting the final pilot and duplicate or malformed renames without mutation', () => {
  const { storage } = setup();
  const adapter = createReactPilotPersistence();
  assert.equal(adapter.renamePilot('pilot-a', 'Pilot B'), false);
  assert.equal(adapter.renamePilot('missing', 'Valid Name'), false);
  assert.equal(adapter.deletePilot('pilot-b'), true);
  assert.equal(adapter.deletePilot('pilot-a'), false);
  assert.deepEqual(adapter.readPilots().map(pilot => pilot.id), ['pilot-a']);
  assert.equal(storage.getItem('tt-rocket-active-profile-v1'), 'pilot-a');
});

test('keeps the profile collection unchanged when a lifecycle write fails', () => {
  const { storage } = setup();
  const original = storage.setItem;
  storage.setItem = (key, value) => {
    if (key === 'tt-rocket-profiles-v1') throw new Error('storage unavailable');
    original(key, value);
  };
  const before = storage.getItem('tt-rocket-profiles-v1');
  const adapter = createReactPilotPersistence();
  assert.equal(adapter.renamePilot('pilot-a', 'Renamed Pilot'), false);
  assert.equal(storage.getItem('tt-rocket-profiles-v1'), before);
  assert.equal(storage.getItem('tt-rocket-active-profile-v1'), 'pilot-a');
});

test('does not delete the active pilot when applying the replacement profile fails', () => {
  const { storage } = setup();
  global.window.applyFailure = true;
  const adapter = createReactPilotPersistence();
  assert.equal(adapter.deletePilot('pilot-a'), false);
  assert.deepEqual(adapter.readPilots().map(pilot => pilot.id), ['pilot-a', 'pilot-b']);
  assert.equal(storage.getItem('tt-rocket-active-profile-v1'), 'pilot-a');
});
