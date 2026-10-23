const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const childProcess = require('node:child_process');

const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-domain-rules-'));
fs.writeFileSync(path.join(outputDirectory, 'package.json'), '{"type":"commonjs"}');
childProcess.execFileSync('npx', ['tsc', '--ignoreConfig', 'src/domain/game-rules.ts', 'src/domain/progression.ts', '--module', 'commonjs', '--target', 'es2022', '--outDir', outputDirectory], { cwd: process.cwd(), stdio: 'pipe' });
const rules = require(path.join(outputDirectory, 'game-rules.js'));
const progression = require(path.join(outputDirectory, 'progression.js'));

test('question generation covers bounded multiplication and division facts', () => {
  assert.deepEqual(rules.createQuestion(12, 12, 'mul'), { a: 12, b: 12, op: 'mul', result: 144 });
  assert.deepEqual(rules.createQuestion(12, 12, 'div'), { a: 12, b: 12, op: 'div', result: 12 });
  assert.equal(rules.createQuestionPool([1, 12], 'mix').length, 48);
  assert.throws(() => rules.createQuestion(0, 1, 'mul'), RangeError);
  assert.throws(() => rules.createQuestion(1, 13, 'mul'), RangeError);
});

test('answer checking is exact and rejects non-integers', () => {
  const question = rules.createQuestion(7, 8, 'mul');
  assert.equal(rules.checkAnswer(question, 56), true);
  assert.equal(rules.checkAnswer(question, 55), false);
  assert.equal(rules.checkAnswer(question, '56'), false);
});

test('mastery preserves the legacy two-right and 80-percent threshold', () => {
  assert.equal(progression.isFactMastered({ right: 2, wrong: 0 }), true);
  assert.equal(progression.isFactMastered({ right: 2, wrong: 1 }), false);
  const stats = {};
  for (let multiplier = 1; multiplier <= 12; multiplier += 1) stats[progression.factKey(3, multiplier, 'mul')] = { right: 2 };
  assert.equal(progression.tableMastered(stats, 3, 'mul'), true);
  assert.equal(progression.achievedTables(stats, 'mul'), 1);
});

test('mission rewards match the legacy completion gates', () => {
  assert.deepEqual(progression.calculateMissionReward({ correct: 18, wrong: 2, mode: 'exam', completed: true, achievementBonus: 4 }), { total: 42, base: 18, bonus: 20, achievementBonus: 4 });
  assert.equal(progression.calculateMissionReward({ correct: 4, wrong: 0, mode: 'speed', completed: true }).total, 4);
  assert.equal(progression.calculateMissionReward({ correct: 10, wrong: 0, mode: 'timed', durationMinutes: 5, completed: false }).bonus, 0);
});
