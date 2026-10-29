const test = require('node:test');
const assert = require('node:assert/strict');
const { createInMemoryRateLimiter } = require('../../apps/api/src/rate-limit.ts');

test('local rate limiter is deterministic and returns a retry interval', () => {
  let now = 1000;
  const limiter = createInMemoryRateLimiter({ max: 2, windowMs: 1000, now: () => now });
  assert.equal(limiter.check('synthetic-account').allowed, true);
  assert.equal(limiter.check('synthetic-account').allowed, true);
  const blocked = limiter.check('synthetic-account');
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 1);
  now = 2000;
  assert.equal(limiter.check('synthetic-account').allowed, true);
  assert.equal(limiter.check('other-account').allowed, true);
});

test('pilot repository enforces identity ownership at the repository boundary', async () => {
  const { createInMemoryPilotRepository } = await import('../../apps/api/src/authorization.ts');
  const repository = createInMemoryPilotRepository([{ id: 'pilot-a', accountId: 'account-a', name: 'A' }]);
  assert.ok(await repository.findOwnedPilot({ userId: 'user-a', accountId: 'account-a', email: 'a@example.test' }, 'pilot-a'));
  assert.equal(await repository.findOwnedPilot({ userId: 'user-b', accountId: 'account-b', email: 'b@example.test' }, 'pilot-a'), null);
});
