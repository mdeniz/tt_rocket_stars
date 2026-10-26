const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const childProcess = require('node:child_process');

const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-react-mission-progress-'));
fs.writeFileSync(path.join(outputDirectory, 'package.json'), '{"type":"commonjs"}');
childProcess.execFileSync('npx', [
  'tsc', '--ignoreConfig', 'src/domain/game-rules.ts', 'src/domain/progression.ts',
  'src/lib/react-gameplay.ts', 'src/lib/react-gameplay-persistence.ts',
  'src/lib/react-mission-progress.ts', '--module', 'commonjs', '--target', 'es2022', '--outDir', outputDirectory,
], { cwd: process.cwd(), stdio: 'pipe' });
const { startMission, submitAnswer } = require(path.join(outputDirectory, 'lib', 'react-gameplay.js'));
const { persistMissionCompletion } = require(path.join(outputDirectory, 'lib', 'react-mission-progress.js'));

test('persists a completed mission history entry and reward coins without dropping inventory fields', () => {
  const values = {
    facts: { '2-1-mul': { right: 1, wrong: 0 } },
    history: [],
    inventory: { coins: 3, futureField: { keep: true } },
  };
  const adapter = {
    read: () => values.facts,
    readHistory: () => values.history,
    readInventory: () => values.inventory,
    commitProgress: progress => {
      values.facts = progress.facts;
      values.history = progress.history;
      values.inventory = progress.inventory;
      return true;
    },
    commit: () => true,
    rollback: () => true,
  };
  let state = startMission({ tables: [2], operation: 'mul', mode: 'exam' }, 1000, () => 0);
  for (let index = 0; index < 20; index += 1) state = submitAnswer(state, state.question.result, 1000 + index);

  assert.equal(state.status, 'complete');
  assert.equal(persistMissionCompletion(adapter, state, { completedAt: 3000 }), true);
  assert.equal(values.history.length, 1);
  assert.equal(values.history[0].mode, 'exam');
  assert.equal(values.history[0].correct, 20);
  assert.equal(values.history[0].coins.total, 260);
  assert.equal(values.history[0].coins.achievementBonus, 220);
  assert.equal(values.inventory.coins, 263);
  assert.deepEqual(values.inventory.futureField, { keep: true });
});

test('fails closed for malformed inventory and does not invoke the progress commit', () => {
  const state = startMission({ tables: [2], operation: 'mul', mode: 'exam' }, 1000, () => 0);
  let completed = state;
  for (let index = 0; index < 20; index += 1) completed = submitAnswer(completed, completed.question.result, 1000 + index);
  let commits = 0;
  const adapter = {
    read: () => ({ before: true }),
    readHistory: () => [],
    readInventory: () => ({ coins: -1 }),
    commitProgress: () => { commits += 1; return true; },
    commit: () => true,
    rollback: () => true,
  };

  assert.equal(persistMissionCompletion(adapter, completed), false);
  assert.equal(commits, 0);
});

test('does not duplicate a completion when the same completed state is persisted twice', () => {
  const state = startMission({ tables: [2], operation: 'mul', mode: 'exam' }, 1000, () => 0);
  let completed = state;
  for (let index = 0; index < 20; index += 1) completed = submitAnswer(completed, completed.question.result, 1000 + index);
  const values = { facts: {}, history: [], inventory: { coins: 0 } };
  const adapter = {
    read: () => values.facts,
    readHistory: () => values.history,
    readInventory: () => values.inventory,
    commitProgress: progress => { values.facts = progress.facts; values.history = progress.history; values.inventory = progress.inventory; return true; },
    commit: () => true,
    rollback: () => true,
  };

  assert.equal(persistMissionCompletion(adapter, completed, { completedAt: 3000 }), true);
  assert.equal(persistMissionCompletion(adapter, completed, { completedAt: 3000 }), true);
  assert.equal(values.history.length, 1);
  assert.equal(values.inventory.coins, 260);
});
