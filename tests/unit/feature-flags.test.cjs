const test = require('node:test');
const assert = require('node:assert/strict');

const featureFlags = import('../../src/lib/feature-flags.js');

const definitions = {
  stable: { defaultEnabled: true },
  experiment: { defaultEnabled: false, experimental: true },
};

test('rejects malformed definitions and TTL values', async () => {
  const { createFeatureFlagService } = await featureFlags;
  assert.throws(() => createFeatureFlagService({ definitions: { stable: {} } }), TypeError);
  assert.throws(() => createFeatureFlagService({ definitions, ttlMs: 0 }), TypeError);
});

test('evaluates defaults and fails closed for unknown flags', async () => {
  const { createFeatureFlagService } = await featureFlags;
  const service = createFeatureFlagService({ definitions });
  assert.equal(service.evaluate('stable'), true);
  assert.equal(service.evaluate('experiment'), false);
  assert.equal(service.evaluate('unknown'), false);
});

test('accepts known boolean overrides and ignores malformed entries', async () => {
  const { createFeatureFlagService } = await featureFlags;
  let stored;
  const service = createFeatureFlagService({
    definitions,
    now: () => 1_000,
    cache: { write: payload => { stored = payload; } },
  });

  assert.equal(service.setPayload({
    fetchedAt: 1_000,
    values: { stable: false, experiment: true, unknown: true, malformed: 'yes' },
  }), true);
  assert.equal(service.evaluate('stable'), false);
  assert.equal(service.evaluate('experiment'), true);
  assert.deepEqual(stored.values, { stable: false, experiment: true });
  assert.equal(service.setPayload({ fetchedAt: 1_000, values: null }), false);
});

test('uses fresh cached values and falls back safely after expiry', async () => {
  const { createFeatureFlagService } = await featureFlags;
  let currentTime = 1_000;
  const service = createFeatureFlagService({
    definitions,
    now: () => currentTime,
    ttlMs: 100,
    cache: { read: () => ({ fetchedAt: 950, values: { stable: false, experiment: true } }) },
  });
  assert.equal(service.evaluate('stable'), false);
  assert.equal(service.evaluate('experiment'), true);
  currentTime = 1_050;
  assert.equal(service.evaluate('stable'), true);
  assert.equal(service.evaluate('experiment'), false);
});

test('continues evaluating when storage adapters throw', async () => {
  const { createFeatureFlagService } = await featureFlags;
  const service = createFeatureFlagService({
    definitions,
    cache: {
      read: () => { throw new Error('storage unavailable'); },
      write: () => { throw new Error('storage unavailable'); },
    },
  });
  assert.equal(service.evaluate('stable'), true);
  assert.equal(service.setPayload({ fetchedAt: Date.now(), values: { stable: false } }), true);
  assert.equal(service.evaluate('stable'), false);
});
