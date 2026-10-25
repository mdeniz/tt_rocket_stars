const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const childProcess = require('node:child_process');

const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-react-dashboard-'));
fs.writeFileSync(path.join(outputDirectory, 'package.json'), '{"type":"commonjs"}');
childProcess.execFileSync('npx', [
  'tsc', '--ignoreConfig', 'src/lib/react-dashboard.ts',
  '--module', 'commonjs', '--target', 'es2022', '--outDir', outputDirectory,
], { cwd: process.cwd(), stdio: 'pipe' });
const { evaluateDashboard } = require(path.join(outputDirectory, 'react-dashboard.js'));

test('evaluates dashboard totals, accuracy, experience, and mission count', () => {
  const model = evaluateDashboard({
    facts: { '2-1-mul': { right: 8, wrong: 2 }, '3-2-div': { right: 2, wrong: 0 } },
    history: [{ correct: 8, wrong: 2 }, { correct: 2, wrong: 0 }],
  });
  assert.deepEqual(
    { correct: model.correct, wrong: model.wrong, attempted: model.attempted, accuracy: model.accuracy, missions: model.missions },
    { correct: 10, wrong: 2, attempted: 12, accuracy: 83, missions: 2 },
  );
  assert.equal(model.experience, 100);
  assert.equal(model.level, 1);
  assert.equal(model.levelProgress, 100);
  assert.equal(model.tables[2].right, 2);
});

test('computes table progress and level transitions from correct answers', () => {
  const model = evaluateDashboard({ facts: { '1-1-mul': { right: 55, wrong: 0 } } });
  assert.equal(model.level, 2);
  assert.equal(model.levelProgress, 50);
  assert.equal(model.levelKey, 'ui.dashboard.level.explorer');
  assert.equal(model.tables[0].accuracy, 100);
  assert.equal(model.tables[0].progress, 100);
});

test('fails closed for malformed local payloads', () => {
  const model = evaluateDashboard({ facts: 'invalid', history: { invalid: true } });
  assert.equal(model.correct, 0);
  assert.equal(model.wrong, 0);
  assert.equal(model.missions, 0);
  assert.equal(model.tables.length, 12);
  assert.ok(model.tables.every(table => table.progress === 0));
});
