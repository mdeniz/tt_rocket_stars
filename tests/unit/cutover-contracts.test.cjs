const test = require('node:test');
const assert = require('node:assert/strict');
const { assertCutoverContracts } = require('../../scripts/check-cutover.cjs');

const validFixture = {
  stableSource: '<script src="./legacy/scripts/02.js"></script><script src="./legacy/scripts/03.js"></script>',
  pagesWorkflow: "name: Pages\nVITE_REACT_CORE_SCREENS: 'true'\n- name: Restore stable release entrypoint",
  pagesWorkflow: "name: Pages\nVITE_REACT_CORE_SCREENS: 'true'\n- name: Restore stable release entrypoint\ngh release download dist/index.html",
  releaseWorkflow: 'cp dist/index_next.html gh release create gh workflow run pages.yml',
  viteConfig: "reactCoreScreensEnabled; renameSync(htmlPath, path.resolve(outDir, 'index_next.html')); copyFileSync(path.resolve(outDir, 'index_next.html'), htmlPath);",
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

test('rejects a fixture without explicit promotion and rollback contracts', () => {
  assert.throws(
    () => assertCutoverContracts({ ...validFixture, releaseWorkflow: '' }),
    /promote the verified development artifact explicitly/,
  );
  assert.throws(
    () => assertCutoverContracts({ ...validFixture, pagesWorkflow: 'VITE_REACT_CORE_SCREENS: \'true\'' }),
    /published stable artifact|restore the previous stable artifact/,
  );
});
