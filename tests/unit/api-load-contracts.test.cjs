const test = require('node:test');
const assert = require('node:assert/strict');

test('representative local API quota budget is bounded and deterministic', async () => {
  const { createInMemoryRateLimiter } = await import('../../apps/api/src/rate-limit.ts');
  let now = 0;
  const limiter = createInMemoryRateLimiter({ max: 100, windowMs: 60_000, now: () => now });
  let rejected = 0;
  for (let request = 0; request < 105; request += 1) if (!limiter.check('synthetic-load').allowed) rejected += 1;
  assert.equal(rejected, 5);
  now = 60_000;
  assert.equal(limiter.check('synthetic-load').allowed, true);
});
