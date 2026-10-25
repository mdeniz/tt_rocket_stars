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
