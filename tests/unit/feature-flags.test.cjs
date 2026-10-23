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
  assert.throws(() => createFeatureFlagService({ definitions: { targeted: { defaultEnabled: false, targeting: { allowlist: ['pilot-name'] } } } }), TypeError);
  assert.throws(() => createFeatureFlagService({ definitions: { targeted: { defaultEnabled: false, targeting: { rolloutPercentage: 101 } } } }), TypeError);
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

test('targets allowlisted accounts by UUID without accepting pilot names', async () => {
  const { createFeatureFlagService } = await featureFlags;
  const service = createFeatureFlagService({ definitions: {
    targeted: {
      defaultEnabled: false,
      targeting: { allowlist: ['00000000-0000-4000-8000-000000000001'] },
    },
  } });
  assert.equal(service.evaluate('targeted', { accountId: '00000000-0000-4000-8000-000000000001' }), true);
  assert.equal(service.evaluate('targeted', { accountId: '00000000-0000-4000-8000-000000000002' }), false);
  assert.equal(service.evaluate('targeted', { accountId: 'Pilot One' }), false);
  assert.equal(service.evaluate('targeted'), false);
});

test('assigns percentage rollouts deterministically per flag and account', async () => {
  const { createFeatureFlagService } = await featureFlags;
  const definitions = {
    rollout: { defaultEnabled: false, targeting: { rolloutPercentage: 100 } },
    disabled: { defaultEnabled: true, targeting: { rolloutPercentage: 0 } },
  };
  const first = createFeatureFlagService({ definitions });
  const second = createFeatureFlagService({ definitions });
  const accountId = '00000000-0000-4000-8000-000000000001';
  assert.equal(first.evaluate('rollout', { accountId }), true);
  assert.equal(first.evaluate('disabled', { accountId }), false);
  assert.equal(first.evaluate('rollout', { accountId }), second.evaluate('rollout', { accountId }));
  assert.equal(first.evaluate('rollout'), false);
});
