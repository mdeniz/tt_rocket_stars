const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const bootstrap = fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8');
const authRuntime = fs.readFileSync(path.join(root, 'public/legacy/scripts/32.js'), 'utf8');

test('React bootstrap has a visible shell mount point and non-rendered auth translation source', () => {
  assert.match(index, /<script id="reactAuthTranslationSource" type="application\/json" data-i18n="ui\.089"><\/script>/);
  assert.doesNotMatch(index, /reactAuthTranslationAnchor/);
  assert.match(index, /<div id="react-root" aria-label="TT Rocket Stars React shell"><\/div>/);
  assert.match(index, /<script type="module" src="\.\/src\/main\.tsx"><\/script>/);
  assert.match(bootstrap, /export const REACT_ROOT_ID = 'react-root'/);
  assert.match(bootstrap, /createRoot\(element\)\.render\(content\)/);
  assert.match(bootstrap, /bootstrapReactShell\(\)/);
});

test('authentication status uses the non-rendered translation source and clears on session restore', () => {
  assert.match(authRuntime, /data-' \+ 'i18n/);
  assert.match(authRuntime, /const setStatus = \(key, kind\)/);
  assert.match(authRuntime, /if \(user\) \{ setStatus\('signedIn', 'success'\)/);
  assert.doesNotMatch(authRuntime, /reactAuthTranslationAnchor/);
});

test('legacy entry scripts remain ordered independently of React', () => {
  const scripts = [...index.matchAll(/<script src="\.\/legacy\/scripts\/(\d+\.js)"><\/script>/g)]
    .map(match => Number.parseInt(match[1], 10));
  assert.deepEqual(scripts, [...scripts].sort((a, b) => a - b));
  assert.ok(scripts.length >= 18);
  assert.ok(index.indexOf('src/main.tsx') < index.indexOf('./legacy/scripts/00.js'));
});
