const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const repositoryRoot = join(__dirname, '..', '..');

test('build entrypoints do not expose inline JavaScript after a script boundary', () => {
  execFileSync('npm', ['run', 'build'], { cwd: repositoryRoot, stdio: 'ignore' });

  for (const filename of ['index.html', 'index_next.html']) {
    const html = readFileSync(join(repositoryRoot, 'dist', filename), 'utf8');
    assert.doesNotMatch(
      html,
      /<\/script>(?!\s*<)/,
      `${filename} contains JavaScript text outside an inline script element`,
    );
  }
});
