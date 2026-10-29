const test = require('node:test');
const assert = require('node:assert/strict');
const { createErrorEvent, safeErrorFields } = require('../../apps/api/src/logging.ts');
const { assertObservabilityContract } = require('../../scripts/check-observability.cjs');

test('structured error events contain only bounded correlation fields', () => {
  const event = createErrorEvent({ requestId: 'a'.repeat(200), status: 500, code: 'internal_error' });
  assert.deepEqual(Object.keys(event).sort(), ['code', 'event', 'requestId', 'status', 'timestamp']);
  assert.equal(event.requestId.length, 128);
});

test('structured fields exclude gameplay and identity payloads', () => {
  assert.deepEqual(safeErrorFields({ requestId: 'r', password: 'secret', pilotId: 'child-1', payload: { answer: 12 }, status: 500 }), { requestId: 'r', status: 500 });
});

test('incident response contract is explicit and provider-neutral', () => assert.equal(assertObservabilityContract(), true));
