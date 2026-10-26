const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const runtime = fs.readFileSync('src/lib/persistence-runtime.js', 'utf8');
const keys = ['cosmotablas-v2', 'cosmotablas-history-v1', 'tt-rocket-garage-v1'];

function loadContracts() {
  const context = { window: {} };
  Function('window', runtime)(context.window);
  return context.window.TTPersistenceContracts;
}

test('validates legacy pilots without dropping unknown payload fields', () => {
  const { validatePilot } = loadContracts();
  const result = validatePilot({ id: 'pilot-1', name: 'Ada', language: 'en', createdAt: 1, payload: { legacy: true, future: { value: 2 } } });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.payload, { legacy: true, future: { value: 2 } });
});

test('rejects malformed profiles without throwing', () => {
  const { validateProfiles } = loadContracts();
  assert.equal(validateProfiles([{ id: 'duplicate', name: 'A', language: 'en', createdAt: 1, payload: {} }, { id: 'duplicate', name: 'B', language: 'en', createdAt: 2, payload: {} }]).ok, false);
});

test('validates existing backup envelopes and JSON payloads', () => {
  const { validateBackup } = loadContracts();
  const result = validateBackup({ format: 'tt-rocket-stars-backup', version: 1, createdAt: new Date().toISOString(), payload: { 'cosmotablas-v2': '{}', 'cosmotablas-history-v1': '[]', 'tt-rocket-garage-v1': '{}' } }, keys);
  assert.equal(result.ok, true);
});

test('preserves memory fallback when storage throws', () => {
  const { createSafeStorage } = loadContracts();
  const store = createSafeStorage({ getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } });
  assert.equal(store.setItem('key', 'value'), false);
  assert.equal(store.getItem('key'), 'value');
});

test('uses memory storage when no native storage is available', () => {
  const { createSafeStorage } = loadContracts();
  const store = createSafeStorage();
  assert.equal(store.setItem('key', 'value'), true);
  assert.equal(store.getItem('key'), 'value');
  assert.equal(store.removeItem('key'), true);
  assert.equal(store.getItem('key'), null);
});

test('captures and applies the unchanged legacy storage keys', () => {
  const { createPilotPersistence } = loadContracts();
  const values = new Map([['one', '1'], ['two', null]]);
  const native = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const adapter = createPilotPersistence(native, ['one', 'two']);
  assert.deepEqual(adapter.capture(), { one: '1', two: null });
  adapter.apply({ one: 'updated', two: null });
  assert.equal(native.getItem('one'), 'updated');
  assert.equal(native.getItem('two'), null);
});

test('preserves opaque inventory and achievement payload fields', () => {
  const { validatePilotDomainPayload } = loadContracts();
  const result = validatePilotDomainPayload({ coins: 12, legacyPart: { id: 'wing-a' }, futureField: ['kept'] });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { coins: 12, legacyPart: { id: 'wing-a' }, futureField: ['kept'] });
});

test('fails closed for invalid domain payloads without writing them', () => {
  const { createDomainPersistence } = loadContracts();
  const values = new Map([['inventory', JSON.stringify({ coins: 7 })]]);
  const native = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  const adapter = createDomainPersistence(native, 'inventory');
  assert.deepEqual(adapter.read({ coins: 0 }), { coins: 7 });
  assert.equal(adapter.write(['not', 'an', 'object']), false);
  assert.equal(values.get('inventory'), JSON.stringify({ coins: 7 }));
  assert.deepEqual(adapter.read({ coins: 0 }), { coins: 7 });
});

test('uses the fallback when a domain payload is malformed', () => {
  const { createDomainPersistence } = loadContracts();
  const native = { getItem: () => '{invalid', setItem() {}, removeItem() {} };
  const adapter = createDomainPersistence(native, 'achievements');
  assert.deepEqual(adapter.read({ completed: [] }), { completed: [] });
});

test('creates compatible backups and retains unknown envelope fields', () => {
  const { createBackupPersistence } = loadContracts();
  const values = new Map([
    ['cosmotablas-v2', '{}'],
    ['cosmotablas-history-v1', '[]'],
    ['tt-rocket-garage-v1', '{"coins":12}'],
  ]);
  const native = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); return true; },
    removeItem: key => { values.delete(key); return true; },
  };
  const adapter = createBackupPersistence(native, {
    now: () => '2026-01-01T00:00:00.000Z',
    id: () => 'backup-1',
  });
  const item = adapter.create('Manual');
  assert.equal(item.ok, true);
  assert.equal(item.value.id, 'backup-1');
  assert.equal(item.value.payload['tt-rocket-garage-v1'], '{"coins":12}');
  const withUnknown = { ...item.value, futureField: { keep: true } };
  assert.equal(adapter.saveList([withUnknown]).ok, true);
  assert.deepEqual(adapter.list()[0].futureField, { keep: true });
});

test('rejects invalid backups without replacing local state', () => {
  const { createBackupPersistence } = loadContracts();
  const values = new Map([
    ['cosmotablas-v2', '{"current":true}'],
    ['cosmotablas-history-v1', '[]'],
    ['tt-rocket-garage-v1', '{}'],
  ]);
  const native = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); return true; },
    removeItem: key => { values.delete(key); return true; },
  };
  const adapter = createBackupPersistence(native);
  const result = adapter.restore({ format: 'wrong', version: 1, payload: {} });
  assert.equal(result.ok, false);
  assert.equal(values.get('cosmotablas-v2'), '{"current":true}');
});

test('requires a recovery backup before replacing local state', () => {
  const { createBackupPersistence } = loadContracts();
  const values = new Map([
    ['cosmotablas-v2', '{"current":true}'],
    ['cosmotablas-history-v1', '[]'],
    ['tt-rocket-garage-v1', '{}'],
  ]);
  const native = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); return true; },
    removeItem: key => { values.delete(key); return true; },
  };
  const adapter = createBackupPersistence(native, { id: () => 'recovery-1' });
  const target = { format: 'tt-rocket-stars-backup', version: 1, createdAt: '2026-01-01T00:00:00.000Z', payload: {
    'cosmotablas-v2': '{"restored":true}',
    'cosmotablas-history-v1': '[]',
    'tt-rocket-garage-v1': '{}',
  } };
  assert.equal(adapter.replace(target, 'Before restore').ok, true);
  assert.equal(values.get('cosmotablas-v2'), '{"restored":true}');
  assert.equal(adapter.list()[0].label, 'Before restore');
});
