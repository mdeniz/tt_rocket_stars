const test = require('node:test');
const assert = require('node:assert/strict');
const { findRetirementViolations, parseInventory, validateRepository } = require('../../scripts/check-legacy-retirement.cjs');

test('legacy retirement inventory is valid and has no active removals', () => {
  const inventory = validateRepository();
  assert.equal(inventory.rows.length, 11);
  assert.equal(inventory.rows.filter(row => row.decision === 'remove').length, 0);
});

test('retirement guard detects a removed global still referenced by a source file', () => {
  const inventory = parseInventory('```json\n' + JSON.stringify({
    rows: [{
      id: 'fixture',
      typedOwner: 'typed fixture owner',
      fallbackOwner: 'legacy fixture owner',
      decision: 'remove',
      legacySources: ['legacyGlobal'],
      removalGate: 'fixture gate',
    }],
  }) + '\n```');
  const violations = findRetirementViolations(inventory, { 'fixture.js': 'function legacyGlobal() {}' });
  assert.deepEqual(violations, [{ row: 'fixture', source: 'legacyGlobal', file: 'fixture.js' }]);
});

test('retirement guard accepts a removed source with no remaining references', () => {
  const inventory = parseInventory('```json\n' + JSON.stringify({
    rows: [{
      id: 'fixture',
      typedOwner: 'typed fixture owner',
      fallbackOwner: 'legacy fixture owner',
      decision: 'remove',
      legacySources: ['legacyGlobal'],
      removalGate: 'fixture gate',
    }],
  }) + '\n```');
  assert.deepEqual(findRetirementViolations(inventory, { 'fixture.js': 'function replacement() {}' }), []);
});
