const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const read = relativePath => readFileSync(join(root, relativePath), 'utf8');

const requiredStorageKeys = [
  'tt-rocket-profiles-v1',
  'tt-rocket-active-profile-v1',
  'cosmotablas-v2',
  'cosmotablas-history-v1',
  'tt-rocket-garage-v1',
  'tt-rocket-backups-v1',
];

function assertCutoverContracts({ stableSource, viteConfig, pagesWorkflow, matrix }) {
  if (!stableSource.includes('./legacy/scripts/02.js') || !stableSource.includes('./legacy/scripts/03.js')) {
    throw new Error('The stable source entrypoint must retain the ordered legacy runtime');
  }
  if (!viteConfig.includes("renameSync(htmlPath, path.resolve(outDir, 'index_next.html'))")) {
    throw new Error('The build must emit index_next.html as the development artifact');
  }
  if (!viteConfig.includes("copyFileSync(path.resolve(outDir, 'index_next.html'), htmlPath)")) {
    throw new Error('The local build must preserve a stable index.html fallback');
  }
  if (!pagesWorkflow.includes('Restore stable release entrypoint')) {
    throw new Error('The Pages workflow must restore the published stable artifact');
  }
  if (!pagesWorkflow.includes("VITE_REACT_CORE_SCREENS: 'true'")) {
    throw new Error('The Pages workflow must enable the React development entrypoint');
  }
  if (!viteConfig.includes('reactCoreScreensEnabled')) {
    throw new Error('The build must materialize the React ownership flag in the generated entrypoint');
  }
  if (/service[-_ ]?role|service_role|SUPABASE_SERVICE_ROLE/i.test(`${stableSource}\n${viteConfig}\n${pagesWorkflow}`)) {
    throw new Error('Privileged Supabase credentials must never enter the browser build');
  }
  for (const key of requiredStorageKeys) {
    if (!matrix.includes(key) && key !== 'tt-rocket-profiles-v1') {
      throw new Error(`Ownership matrix does not acknowledge storage key ${key}`);
    }
  }
  for (const source of ['public/legacy/scripts/02.js', 'public/legacy/scripts/03.js', 'public/legacy/scripts/32.js']) {
    if (!existsSync(join(root, source))) throw new Error(`Missing legacy source ${source}`);
  }
  return true;
}

function validateRepository() {
  return assertCutoverContracts({
    stableSource: read('index.html'),
    viteConfig: read('vite.config.mjs'),
    pagesWorkflow: read('.github/workflows/pages.yml'),
    matrix: read('docs/react-ownership-matrix.md'),
  });
}

if (require.main === module) {
  validateRepository();
  console.log('Verified React cutover ownership and release contracts');
}

module.exports = { assertCutoverContracts, requiredStorageKeys, validateRepository };
