const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');

const root = join(__dirname, '..');
const inventoryPath = 'docs/react-ownership-matrix.md';
const searchableRoots = ['index.html', 'vite.config.mjs', 'public', 'src', 'tests', 'scripts', '.github'];
const allowedDecisions = new Set(['retain', 'remove', 'never-remove']);

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function parseInventory(markdown) {
  const match = markdown.match(/```json\n([\s\S]*?)\n```/);
  if (!match) throw new Error('Ownership matrix is missing its machine-readable JSON inventory');
  const inventory = JSON.parse(match[1]);
  if (!Array.isArray(inventory.rows) || inventory.rows.length === 0) {
    throw new Error('Ownership inventory must contain at least one row');
  }
  for (const row of inventory.rows) {
    if (!row.id || !row.typedOwner || !row.fallbackOwner || !allowedDecisions.has(row.decision)) {
      throw new Error(`Invalid ownership inventory row: ${JSON.stringify(row)}`);
    }
    if (!Array.isArray(row.legacySources) || !row.legacySources.length || !row.removalGate) {
      throw new Error(`Ownership row ${row.id} must define legacy sources and a removal gate`);
    }
  }
  return inventory;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectFiles(relativePath) {
  const absolutePath = join(root, relativePath);
  const stats = statSync(absolutePath);
  if (stats.isFile()) return [relativePath];
  return readdirSync(absolutePath, { withFileTypes: true }).flatMap(entry => {
    const child = join(relativePath, entry.name);
    return entry.isDirectory() ? collectFiles(child) : [child];
  });
}

function defaultReferences() {
  return searchableRoots.flatMap(collectFiles)
    .filter(file => !file.includes('node_modules') && !file.includes('dist/'))
    .filter(file => !file.endsWith(inventoryPath) && !file.endsWith('check-legacy-retirement.cjs'))
    .reduce((references, file) => {
      references[file] = read(file);
      return references;
    }, {});
}

function findRetirementViolations(inventory, references) {
  const violations = [];
  for (const row of inventory.rows.filter(item => item.decision === 'remove')) {
    for (const [file, content] of Object.entries(references)) {
      for (const source of row.legacySources) {
        const token = source.includes('/') ? source : `\\b${escapeRegExp(source)}\\b`;
        const pattern = source.includes('/') ? source : new RegExp(token);
        if (pattern.test(content)) violations.push({ row: row.id, source, file });
      }
    }
  }
  return violations;
}

function validateRepository({ matrix = read(inventoryPath), references = defaultReferences() } = {}) {
  const inventory = parseInventory(matrix);
  const violations = findRetirementViolations(inventory, references);
  if (violations.length) {
    throw new Error(`Retired legacy sources remain referenced:\n${violations.map(item => `- ${item.row}: ${item.source} in ${item.file}`).join('\n')}`);
  }
  return inventory;
}

if (require.main === module) {
  const inventory = validateRepository();
  console.log(`Verified ${inventory.rows.length} legacy ownership retirement rows`);
}

module.exports = { findRetirementViolations, parseInventory, validateRepository };
