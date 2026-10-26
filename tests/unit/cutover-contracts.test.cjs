const test = require('node:test');
const assert = require('node:assert/strict');
const { assertCutoverContracts } = require('../../scripts/check-cutover.cjs');

const validFixture = {
  stableSource: '<script src="./legacy/scripts/02.js"></script><script src="./legacy/scripts/03.js"></script>',
  viteConfig: "renameSync(htmlPath, path.resolve(outDir, 'index_next.html')); copyFileSync(path.resolve(outDir, 'index_next.html'), htmlPath);",
  pagesWorkflow: 'name: Pages\n- name: Restore stable release entrypoint',
  matrix: [
    'tt-rocket-profiles-v1', 'tt-rocket-active-profile-v1', 'cosmotablas-v2', 'cosmotablas-history-v1',
    'tt-rocket-garage-v1', 'tt-rocket-backups-v1',
  ].join('\n'),
};

test('accepts the stable/development ownership boundary', () => {
  assert.equal(assertCutoverContracts(validFixture), true);
});

test('rejects a fixture that exposes privileged credentials', () => {
  assert.throws(
    () => assertCutoverContracts({ ...validFixture, viteConfig: `${validFixture.viteConfig} SUPABASE_SERVICE_ROLE_KEY` }),
    /Privileged Supabase credentials/,
  );
});

test('rejects a fixture that loses the stable entrypoint', () => {
  assert.throws(
    () => assertCutoverContracts({ ...validFixture, stableSource: '<script src="./legacy/scripts/02.js"></script>' }),
    /ordered legacy runtime/,
  );
});
