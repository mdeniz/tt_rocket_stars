const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const childProcess = require('node:child_process');

const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-react-persistence-'));
fs.writeFileSync(path.join(outputDirectory, 'package.json'), '{"type":"commonjs"}');
childProcess.execFileSync('npx', ['tsc', '--ignoreConfig', 'src/lib/react-gameplay-persistence.ts', '--module', 'commonjs', '--target', 'es2022', '--outDir', outputDirectory], { cwd: process.cwd(), stdio: 'pipe' });
const persistence = require(path.join(outputDirectory, 'react-gameplay-persistence.js'));

function storage() {
  const values = new Map();
  return {
    values,
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => { values.set(key, String(value)); },
    removeItem: key => { values.delete(key); },
  };
}

test('commits valid mission payloads and restores the previous raw value', () => {
  const store = storage();
  store.setItem('cosmotablas-v2-pilot-a', JSON.stringify({ score: 2, legacy: true }));
  const adapter = persistence.createMissionPersistence(store, 'cosmotablas-v2-pilot-a');
  assert.equal(adapter.commit({ score: 3, mission: { questionIndex: 1 } }), true);
  assert.deepEqual(adapter.read(), { score: 3, mission: { questionIndex: 1 } });
  assert.equal(adapter.rollback(), true);
  assert.deepEqual(adapter.read(), { score: 2, legacy: true });
});

test('rejects invalid payloads without mutating storage', () => {
  const store = storage();
  store.setItem('pilot-a', JSON.stringify({ score: 2 }));
  const adapter = persistence.createMissionPersistence(store, 'pilot-a');
  assert.equal(adapter.commit(null), false);
  assert.deepEqual(adapter.read(), { score: 2 });
});

test('keeps mission persistence isolated by pilot key', () => {
  const store = storage();
  const first = persistence.createMissionPersistence(store, 'pilot-a');
  const second = persistence.createMissionPersistence(store, 'pilot-b');
  assert.equal(first.commit({ score: 10 }), true);
  assert.equal(second.commit({ score: 20 }), true);
  assert.deepEqual(first.read(), { score: 10 });
  assert.deepEqual(second.read(), { score: 20 });
});

test('commits facts, mission history, and inventory as one compatible progress snapshot', () => {
  const store = storage();
  store.setItem('cosmotablas-v2', JSON.stringify({ '2-1-mul': { right: 1, wrong: 0 } }));
  store.setItem('cosmotablas-history-v1', JSON.stringify([{ mode: 'practice', correct: 1 }]));
  store.setItem('tt-rocket-garage-v1', JSON.stringify({ coins: 4, futureField: { keep: true } }));
  const adapter = persistence.createMissionPersistence(store, 'cosmotablas-v2');

  assert.equal(adapter.commitProgress({
    facts: { '2-1-mul': { right: 2, wrong: 0 } },
    history: [{ mode: 'practice', correct: 2 }],
    inventory: { coins: 9, futureField: { keep: true } },
  }), true);
  assert.deepEqual(JSON.parse(store.getItem('cosmotablas-v2')), { '2-1-mul': { right: 2, wrong: 0 } });
  assert.deepEqual(JSON.parse(store.getItem('cosmotablas-history-v1')), [{ mode: 'practice', correct: 2 }]);
  assert.deepEqual(JSON.parse(store.getItem('tt-rocket-garage-v1')), { coins: 9, futureField: { keep: true } });
});

test('rolls back every mission progress key when a later write fails', () => {
  const store = storage();
  store.setItem('cosmotablas-v2', JSON.stringify({ before: true }));
  store.setItem('cosmotablas-history-v1', JSON.stringify([{ before: true }]));
  store.setItem('tt-rocket-garage-v1', JSON.stringify({ coins: 3 }));
  const originalSetItem = store.setItem;
  store.setItem = (key, value) => {
    if (key === 'tt-rocket-garage-v1') throw new Error('quota');
    originalSetItem(key, value);
  };
  const adapter = persistence.createMissionPersistence(store, 'cosmotablas-v2');

  assert.equal(adapter.commitProgress({ facts: { after: true }, history: [{ after: true }], inventory: { coins: 99 } }), false);
  assert.deepEqual(JSON.parse(store.getItem('cosmotablas-v2')), { before: true });
  assert.deepEqual(JSON.parse(store.getItem('cosmotablas-history-v1')), [{ before: true }]);
  assert.deepEqual(JSON.parse(store.getItem('tt-rocket-garage-v1')), { coins: 3 });
});

for (const failedKey of ['cosmotablas-v2', 'cosmotablas-history-v1', 'tt-rocket-garage-v1']) {
  test(`rolls back the complete snapshot when ${failedKey} rejects its write`, () => {
    const store = storage();
    const before = {
      'cosmotablas-v2': JSON.stringify({ before: 'facts' }),
      'cosmotablas-history-v1': JSON.stringify([{ before: 'history' }]),
      'tt-rocket-garage-v1': JSON.stringify({ coins: 3, before: 'inventory' }),
    };
    for (const [key, value] of Object.entries(before)) store.setItem(key, value);
    const originalSetItem = store.setItem;
    store.setItem = (key, value) => {
      if (key === failedKey) throw new Error('quota');
      originalSetItem(key, value);
    };
    const adapter = persistence.createMissionPersistence(store, 'cosmotablas-v2');

    assert.equal(adapter.commitProgress({
      facts: { after: 'facts' },
      history: [{ after: 'history' }],
      inventory: { coins: 99, after: 'inventory' },
    }), false);
    for (const [key, value] of Object.entries(before)) assert.equal(store.getItem(key), value);
  });
}

test('fails closed when a mission progress payload cannot be serialized', () => {
  const store = storage();
  const adapter = persistence.createMissionPersistence(store, 'cosmotablas-v2');
  const circularFacts = {};
  circularFacts.self = circularFacts;

  assert.doesNotThrow(() => assert.equal(adapter.commitProgress({
    facts: circularFacts,
    history: [],
    inventory: { coins: 0 },
  }), false));
  assert.equal(store.getItem('cosmotablas-v2'), null);
});

test('rejects malformed mission progress without changing compatible payloads', () => {
  const store = storage();
  store.setItem('cosmotablas-v2', JSON.stringify({ before: true }));
  const adapter = persistence.createMissionPersistence(store, 'cosmotablas-v2');

  assert.equal(adapter.commitProgress({ facts: [], history: [], inventory: { coins: -1 } }), false);
  assert.deepEqual(adapter.read(), { before: true });
  assert.equal(store.getItem('cosmotablas-history-v1'), null);
});
