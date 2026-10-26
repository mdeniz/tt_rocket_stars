const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join } = require('node:path');
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const dist = join(__dirname, '..', 'dist');
const files = readdirSync(dist);
if (files.length !== 2 || !files.includes('index.html') || !files.includes('index_next.html')) {
  throw Error(`Expected dist to contain index.html and index_next.html, got: ${files.join(', ') || '(empty)'}`);
}

for (const filename of ['index.html', 'index_next.html']) {
  const output = join(dist, filename);
  if (!statSync(output).isFile()) throw Error(`dist/${filename} is not a file`);
  const html = readFileSync(output, 'utf8');
  if (!html.includes(`window.__TT_APP_VERSION__=${JSON.stringify(packageJson.version)}`)) {
    throw Error(`dist/${filename} does not contain package version ${packageJson.version}`);
  }
  if (/<script\b[^>]*\bsrc=/i.test(html)) throw Error(`dist/${filename} has an external script`);
  if (/<\/script>(?!\s*<)/i.test(html)) {
    throw Error(`dist/${filename} contains an unescaped inline script boundary`);
  }
  if (/<link\b[^>]*\brel=["']stylesheet["']/i.test(html)) {
    throw Error(`dist/${filename} has an external stylesheet`);
  }
}

console.log('Verified stable and development self-contained releases');
