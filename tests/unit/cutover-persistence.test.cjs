const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const childProcess = require('node:child_process');

const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-cutover-persistence-'));
fs.writeFileSync(path.join(outputDirectory, 'package.json'), '{"type":"commonjs"}');
childProcess.execFileSync('npx', [
  'tsc', '--ignoreConfig', 'src/lib/react-gameplay-persistence.ts',
  '--module', 'commonjs', '--target', 'es2022', '--outDir', outputDirectory,
], { cwd: process.cwd(), stdio: 'pipe' });
const { createMissionPersistence } = require(path.join(outputDirectory, 'react-gameplay-persistence.js'));

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => { values.set(key, String(value)); },
    removeItem: key => { values.delete(key); },
    values,
  };
}

test('cutover rejects malformed progress without replacing the last valid snapshot', () => {
  const store = storage({ 'cosmotablas-v2': JSON.stringify({ preserved: true }) });
  const adapter = createMissionPersistence(store, 'cosmotablas-v2');

  assert.equal(adapter.commitProgress({ facts: [], history: [], inventory: { coins: -1 } }), false);
  assert.equal(store.getItem('cosmotablas-v2'), JSON.stringify({ preserved: true }));
});

test('cutover restores every local key when a later snapshot write fails', () => {
  const before = {
    'cosmotablas-v2': JSON.stringify({ facts: 'before' }),
    'cosmotablas-history-v1': JSON.stringify([{ history: 'before' }]),
    'tt-rocket-garage-v1': JSON.stringify({ coins: 3 }),
  };
  const store = storage(before);
  const originalSetItem = store.setItem;
  store.setItem = (key, value) => {
    if (key === 'tt-rocket-garage-v1') throw new Error('quota');
    originalSetItem(key, value);
  };
  const adapter = createMissionPersistence(store, 'cosmotablas-v2');

  assert.equal(adapter.commitProgress({
    facts: { facts: 'after' },
    history: [{ history: 'after' }],
    inventory: { coins: 99 },
  }), false);
  for (const [key, value] of Object.entries(before)) assert.equal(store.getItem(key), value);
});
