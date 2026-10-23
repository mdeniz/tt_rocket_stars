const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const bootstrap = fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8');

test('React bootstrap has an isolated inert mount point', () => {
  assert.match(index, /<div id="react-root" hidden aria-hidden="true"><\/div>/);
  assert.match(bootstrap, /export const REACT_ROOT_ID = 'react-root'/);
  assert.match(bootstrap, /createRoot\(element\)\.render\(content\)/);
});

test('legacy entry scripts remain ordered independently of React', () => {
  const scripts = [...index.matchAll(/<script src="\.\/legacy\/scripts\/(\d+\.js)"><\/script>/g)]
    .map(match => Number.parseInt(match[1], 10));
  assert.deepEqual(scripts, [...scripts].sort((a, b) => a - b));
  assert.ok(scripts.length >= 18);
  assert.ok(!index.includes('src/main.tsx'));
});
