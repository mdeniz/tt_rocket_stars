const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const childProcess = require('node:child_process');

const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-react-gameplay-'));
fs.writeFileSync(path.join(outputDirectory, 'package.json'), '{"type":"commonjs"}');
childProcess.execFileSync('npx', ['tsc', '--ignoreConfig', 'src/domain/game-rules.ts', 'src/domain/progression.ts', 'src/lib/react-gameplay.ts', '--module', 'commonjs', '--target', 'es2022', '--outDir', outputDirectory], { cwd: process.cwd(), stdio: 'pipe' });
const gameplay = require(path.join(outputDirectory, 'lib', 'react-gameplay.js'));

test('starts a deterministic mission with validated configuration', () => {
  const state = gameplay.startMission({ tables: [2], operation: 'mul', mode: 'practice' }, 1000, () => 0);
  assert.equal(state.status, 'active');
  assert.equal(state.question.a, 2);
  assert.equal(state.question.b, 1);
  assert.equal(state.question.result, 2);
  assert.equal(state.startedAt, 1000);
  assert.equal(state.correct, 0);
  assert.equal(state.wrong, 0);
  assert.throws(() => gameplay.startMission({ tables: [], operation: 'mul', mode: 'practice' }, 1000), RangeError);
});

test('submitting an answer records feedback and advances the question', () => {
  const state = gameplay.startMission({ tables: [2], operation: 'mul', mode: 'practice' }, 1000, () => 0);
  const correct = gameplay.submitAnswer(state, 2, 1100);
  assert.equal(correct.feedback, 'correct');
  assert.equal(correct.correct, 1);
  assert.equal(correct.wrong, 0);
  assert.equal(correct.questionIndex, 1);
  const wrong = gameplay.submitAnswer(correct, 999, 1200);
  assert.equal(wrong.feedback, 'incorrect');
  assert.equal(wrong.correct, 1);
  assert.equal(wrong.wrong, 1);
  assert.equal(wrong.questionIndex, 2);
});

test('timed missions expire without accepting further answers', () => {
  const state = gameplay.startMission({ tables: [2], operation: 'mul', mode: 'timed', durationMinutes: 1 }, 1000, () => 0);
  const expired = gameplay.advanceTimer(state, 61_001);
  assert.equal(expired.status, 'complete');
  assert.equal(expired.remainingSeconds, 0);
  assert.equal(gameplay.submitAnswer(expired, 2, 61_002), expired);
});

test('uses the shared rule contracts for division and mixed mission pools', () => {
  const division = gameplay.startMission({ tables: [12], operation: 'div', mode: 'exam' }, 1000, () => 0);
  assert.equal(division.question.op, 'div');
  assert.equal(division.question.a, 12);
  assert.equal(division.question.b, 1);
  assert.equal(division.question.result, 1);
  const mixed = gameplay.startMission({ tables: [1, 12], operation: 'mix', mode: 'speed' }, 1000, () => 0);
  assert.equal(mixed.questions.length, 48);
  assert.deepEqual(new Set(mixed.questions.map(question => question.op)), new Set(['mul', 'div']));
});

test('supports exam completion and speed timeout semantics', () => {
  const exam = gameplay.startMission({ tables: [2], operation: 'mul', mode: 'exam' }, 1000, () => 0);
  assert.equal(exam.questions.length, 20);
  let completed = exam;
  for (let index = 0; index < 20; index += 1) completed = gameplay.submitAnswer(completed, completed.question.result, 1000 + index);
  assert.equal(completed.status, 'complete');
  assert.equal(completed.reward.bonus, 20);

  const speed = gameplay.startMission({ tables: [2], operation: 'mul', mode: 'speed' }, 1000, () => 0);
  assert.equal(speed.remainingSeconds, 60);
  const expired = gameplay.advanceTimer(speed, 61_001);
  assert.equal(expired.status, 'complete');
  assert.equal(expired.remainingSeconds, 0);
});

test('preserves the speed timeout reward after a valid answer streak', () => {
  let speed = gameplay.startMission({ tables: [2], operation: 'mul', mode: 'speed' }, 1000, () => 0);
  for (let index = 0; index < 5; index += 1) speed = gameplay.submitAnswer(speed, speed.question.result, 1000 + index);
  const expired = gameplay.advanceTimer(speed, 61_001);
  assert.equal(expired.status, 'complete');
  assert.equal(expired.reward.total, 15);
  assert.equal(expired.reward.bonus, 10);
});
