const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const bootstrap = fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8');

test('React bootstrap has a visible shell mount point', () => {
  assert.match(index, /<span id="reactAuthTranslationAnchor" class="sr-only" data-i18n="ui\.089"/);
  assert.match(index, /<div id="react-root" aria-label="TT Rocket Stars React shell"><\/div>/);
  assert.match(index, /<script type="module" src="\.\/src\/main\.tsx"><\/script>/);
  assert.match(bootstrap, /export const REACT_ROOT_ID = 'react-root'/);
  assert.match(bootstrap, /createRoot\(element\)\.render\(content\)/);
  assert.match(bootstrap, /bootstrapReactShell\(\)/);
});

test('legacy entry scripts remain ordered independently of React', () => {
  const scripts = [...index.matchAll(/<script src="\.\/legacy\/scripts\/(\d+\.js)"><\/script>/g)]
    .map(match => Number.parseInt(match[1], 10));
  assert.deepEqual(scripts, [...scripts].sort((a, b) => a - b));
  assert.ok(scripts.length >= 18);
  assert.ok(index.indexOf('src/main.tsx') < index.indexOf('./legacy/scripts/00.js'));
});
