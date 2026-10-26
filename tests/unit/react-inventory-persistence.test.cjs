const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const childProcess = require('node:child_process');

const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-react-inventory-'));
fs.writeFileSync(path.join(outputDirectory, 'package.json'), '{"type":"commonjs"}');
childProcess.execFileSync('npx', [
  'tsc', '--ignoreConfig', 'src/lib/react-inventory-persistence.ts',
  '--module', 'commonjs', '--target', 'es2022', '--outDir', outputDirectory,
], { cwd: process.cwd(), stdio: 'pipe' });
const { createReactInventoryPersistence } = require(path.join(outputDirectory, 'react-inventory-persistence.js'));

function setup(garage = { coins: 120, owned: ['body_red'], equipped: { body: 'body_red' }, rewardedAchievements: [], rewardedMissions: [], family: 'compact', fleet: [], designs: {}, futureField: { keep: true } }) {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, String(value)); },
    removeItem: key => values.delete(key),
  };
  const profiles = [{ id: 'pilot-a', name: 'Pilot A', language: 'en', createdAt: 1, payload: {} }];
  storage.setItem('tt-rocket-profiles-v1', JSON.stringify(profiles));
  storage.setItem('tt-rocket-active-profile-v1', 'pilot-a');
  storage.setItem('tt-rocket-garage-v1', JSON.stringify(garage));
  const bridgeCalls = [];
  global.window = {
    TTLocalStore: storage,
    TTPersistenceContracts: {
      createPilotPersistence: (backing, keys) => ({
        readJson: (key, fallback) => {
          try { return JSON.parse(backing.getItem(key) ?? JSON.stringify(fallback)); } catch { return fallback; }
        },
        writeJson: (key, value) => { backing.setItem(key, JSON.stringify(value)); return true; },
        capture: () => Object.fromEntries(keys.map(key => [key, backing.getItem(key)])),
      }),
      validateProfiles: value => Array.isArray(value) && value.every(profile => profile && typeof profile.id === 'string' && profile.payload && typeof profile.payload === 'object')
        ? { ok: true, value }
        : { ok: false },
    },
    TTRocketInventoryBridge: {
      catalog: () => [
        { id: 'body_red', cat: 'body', price: 0 },
        { id: 'body_blue', cat: 'body', price: 100 },
        { id: 'support_0', cat: 'support', price: 80 },
      ],
      refresh: () => bridgeCalls.push('refresh'),
      setCategory: value => bridgeCalls.push(`category:${value}`),
      previewPart: value => bridgeCalls.push(`preview:${value}`),
    },
  };
  return { storage, bridgeCalls };
}

test('owns local inventory actions and preserves compatible fields', () => {
  const { storage, bridgeCalls } = setup();
  const adapter = createReactInventoryPersistence();
  assert.equal(adapter.setCategory('body'), true);
  assert.equal(adapter.previewPart('body_blue'), true);
  assert.equal(adapter.activatePart('body_blue'), true);
  const state = JSON.parse(storage.getItem('tt-rocket-garage-v1'));
  assert.equal(state.coins, 20);
  assert.deepEqual(state.equipped.body, 'body_blue');
  assert.deepEqual(state.futureField, { keep: true });
  assert.deepEqual(bridgeCalls, ['category:body', 'preview:body_blue', 'refresh']);
  const profile = JSON.parse(storage.getItem('tt-rocket-profiles-v1'))[0];
  assert.equal(JSON.parse(profile.payload['tt-rocket-garage-v1']).equipped.body, 'body_blue');
});

test('rejects malformed, unknown, unaffordable, and full support actions without mutation', () => {
  const { storage } = setup();
  const adapter = createReactInventoryPersistence();
  const before = storage.getItem('tt-rocket-garage-v1');
  assert.equal(adapter.activatePart('unknown'), false);
  assert.equal(adapter.activatePart('support_0'), true);
  const afterPurchase = storage.getItem('tt-rocket-garage-v1');
  assert.notEqual(afterPurchase, before);
  assert.equal(adapter.activatePart('support_0'), true);
  assert.equal(adapter.activatePart('body_blue'), false);
  const afterValid = storage.getItem('tt-rocket-garage-v1');
  storage.setItem('tt-rocket-garage-v1', '{invalid');
  assert.equal(adapter.activatePart('body_red'), false);
  assert.equal(storage.getItem('tt-rocket-garage-v1'), '{invalid');
  storage.setItem('tt-rocket-garage-v1', afterValid);
  assert.equal(adapter.activatePart('body_red'), true);
});

test('fails closed when the active garage write is unavailable', () => {
  const { storage } = setup();
  const before = storage.getItem('tt-rocket-garage-v1');
  const originalSetItem = storage.setItem;
  storage.setItem = (key, value) => {
    if (key === 'tt-rocket-garage-v1') throw new Error('storage unavailable');
    return originalSetItem(key, value);
  };
  const adapter = createReactInventoryPersistence();
  assert.equal(adapter.activatePart('body_blue'), false);
  assert.equal(storage.getItem('tt-rocket-garage-v1'), before);
});
