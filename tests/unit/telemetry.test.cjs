const test = require('node:test');
const assert = require('node:assert/strict');

const telemetry = import('../../src/lib/telemetry.js');

test('does not collect without explicit consent', async () => {
  const { createTelemetryService } = await telemetry;
  const service = createTelemetryService();
  assert.equal(service.hasConsent(), false);
  assert.equal(service.record('app_open', { surface: 'game' }), false);
  assert.deepEqual(service.getQueuedEvents(), []);
});

test('records only allowlisted aggregate fields after consent', async () => {
  const { createTelemetryService } = await telemetry;
  let timestamp = 100;
  const service = createTelemetryService({ consent: true, now: () => timestamp });
  assert.equal(service.record('mission_completed', { table: 7, attempted: 10, correct: 8 }), true);
  assert.deepEqual(service.getQueuedEvents(), [{
    name: 'mission_completed',
    fields: { table: 7, attempted: 10, correct: 8 },
    recordedAt: 100,
  }]);
  timestamp = 200;
  assert.equal(service.record('app_open', { surface: 'game', email: 'child@example.com' }), false);
  assert.equal(service.record('unknown_event'), false);
  assert.equal(service.getQueuedEvents().length, 1);
});

test('rejects invalid aggregate values and sensitive identifiers', async () => {
  const { createTelemetryService } = await telemetry;
  const service = createTelemetryService({ consent: true });
  assert.equal(service.record('mission_completed', { table: 13, attempted: 1, correct: 1 }), false);
  assert.equal(service.record('mission_completed', { table: 1, attempted: 1, correct: 2, pilotId: 'secret' }), false);
  assert.equal(service.record('app_open', { surface: 'other' }), false);
  assert.deepEqual(service.getQueuedEvents(), []);
});

test('bounds the queue and clears it on opt-out or deletion', async () => {
  const { createTelemetryService } = await telemetry;
  const service = createTelemetryService({ consent: true, maxQueueSize: 2 });
  service.record('app_open', { surface: 'game' });
  service.record('app_open', { surface: 'settings' });
  service.record('app_open', { surface: 'profiles' });
  assert.deepEqual(service.getQueuedEvents().map(event => event.fields.surface), ['settings', 'profiles']);
  service.setConsent(false);
  assert.deepEqual(service.getQueuedEvents(), []);
  service.setConsent(true);
  service.record('app_open', { surface: 'game' });
  service.clear();
  assert.deepEqual(service.getQueuedEvents(), []);
});

test('does not call a sink by default and isolates sink failures', async () => {
  const { createTelemetryService } = await telemetry;
  const offline = createTelemetryService({ consent: true });
  offline.record('app_open', { surface: 'game' });
  assert.deepEqual(await offline.flush(), { sent: 0, remaining: 1 });

  let calls = 0;
  const failing = createTelemetryService({ consent: true, sink: async () => {
    calls += 1;
    throw new Error('provider unavailable');
  } });
  failing.record('app_open', { surface: 'game' });
  assert.deepEqual(await failing.flush(), { sent: 0, remaining: 1 });
  assert.equal(calls, 1);
});

test('flushes a copied batch and removes it only after sink success', async () => {
  const { createTelemetryService } = await telemetry;
  let received;
  const service = createTelemetryService({ consent: true, sink: async batch => {
    received = batch;
  } });
  service.record('app_open', { surface: 'game' });
  assert.deepEqual(await service.flush(), { sent: 1, remaining: 0 });
  assert.equal(received.length, 1);
  received[0].fields.surface = 'settings';
  assert.deepEqual(service.getQueuedEvents(), []);
});
