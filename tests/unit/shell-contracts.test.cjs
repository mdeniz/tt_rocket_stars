const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('shell contracts define the migrated route boundary', () => {
  const source = fs.readFileSync('src/lib/shell-contracts.ts', 'utf8');
  assert.match(source, /export type ShellRoute/);
  assert.match(source, /export interface ShellAdapters/);
  assert.match(source, /requestFullscreen\(\): Promise<boolean>/);
  assert.match(source, /choosePilot\(id: string\): boolean/);
});
