const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const childProcess = require('node:child_process');

const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-react-achievements-'));
fs.writeFileSync(path.join(outputDirectory, 'package.json'), '{"type":"commonjs"}');
childProcess.execFileSync('npx', [
  'tsc', '--ignoreConfig', 'src/lib/react-achievements.ts',
  '--module', 'commonjs', '--target', 'es2022', '--outDir', outputDirectory,
], { cwd: process.cwd(), stdio: 'pipe' });
const { evaluateAchievements } = require(path.join(outputDirectory, 'react-achievements.js'));

function factInput({ right = 0, wrong = 0 } = {}) {
  return { right, wrong };
}

test('evaluates base achievements from pilot-local facts and mission history', () => {
  const achievements = evaluateAchievements({
    facts: { '2-1-mul': factInput({ right: 100 }) },
    history: [{ mode: 'practice', correct: 20, wrong: 0 }],
  });
  assert.equal(achievements.find(item => item.id === 'first-launch').locked, false);
  assert.equal(achievements.find(item => item.id === 'hundred-correct').locked, false);
  assert.equal(achievements.find(item => item.id === 'star-accuracy').locked, false);
  assert.equal(achievements.find(item => item.id === 'perfect-mission').locked, false);
  assert.equal(achievements.find(item => item.id === 'explorer').locked, true);
});

test('preserves mastery thresholds and progress for multiplication groups', () => {
  const facts = {};
  for (const table of [1, 2, 5, 10]) {
    for (let n = 1; n <= 12; n += 1) facts[`${table}-${n}-mul`] = factInput({ right: 2 });
  }
  const achievements = evaluateAchievements({ facts });
  const easyTables = achievements.find(item => item.id === 'easy-tables');
  assert.equal(easyTables.locked, false);
  assert.deepEqual(easyTables.progress, { done: 48, total: 48 });
  assert.equal(achievements.find(item => item.id === 'first-planet').locked, false);
  assert.equal(achievements.find(item => item.id === 'multiplication-master').locked, true);
});

test('evaluates constrained exam achievements', () => {
  const achievements = evaluateAchievements({ history: [
    { mode: 'exam', op: 'both', correct: 17, wrong: 3 },
    { mode: 'exam', op: 'mul', correct: 18, wrong: 2, tables: [7, 9] },
  ] });
  assert.equal(achievements.find(item => item.id === 'mixed-mission').locked, false);
  assert.equal(achievements.find(item => item.id === 'hard-mode-precision').locked, false);
});

test('fails closed for malformed local payloads', () => {
  const achievements = evaluateAchievements({ facts: 'invalid', history: { invalid: true } });
  assert.equal(achievements.length, 23);
  assert.ok(achievements.every(item => item.locked));
});
