const assert = require('node:assert/strict');
const test = require('node:test');

test('progress upload parser accepts version one and rejects unsafe shapes', async () => {
  const { parseProgressUpload } = await import('../../apps/api/src/sync.ts');
  assert.deepEqual(parseProgressUpload({ version: 1, operationId: 'op-1', pilotId: 'pilot-1', expectedVersion: 0, payload: { coins: 4 } }), {
    version: 1, operationId: 'op-1', pilotId: 'pilot-1', expectedVersion: 0, payload: { coins: 4 },
  });
  assert.throws(() => parseProgressUpload({ version: 2, operationId: 'op-1', pilotId: 'pilot-1', expectedVersion: 0, payload: {} }), /version/i);
  assert.throws(() => parseProgressUpload({ version: 1, operationId: 'op-1', pilotId: 'pilot-1', expectedVersion: -1, payload: {} }), /version/i);
  assert.throws(() => parseProgressUpload({ version: 1, operationId: 'op-1', pilotId: 'pilot-1', expectedVersion: 0, payload: [] }), /object/i);
});
