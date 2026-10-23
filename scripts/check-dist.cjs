const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join } = require('node:path');

const dist = join(__dirname, '..', 'dist');
const files = readdirSync(dist);
if (files.length !== 2 || !files.includes('index.html') || !files.includes('index_next.html')) {
  throw Error(`Expected dist to contain index.html and index_next.html, got: ${files.join(', ') || '(empty)'}`);
}

const output = join(dist, 'index_next.html');
if (!statSync(output).isFile()) throw Error('dist/index_next.html is not a file');

const html = readFileSync(output, 'utf8');
if (/<script\b[^>]*\bsrc=/i.test(html)) throw Error('Release HTML has an external script');
if (/<link\b[^>]*\brel=["']stylesheet["']/i.test(html)) {
  throw Error('Release HTML has an external stylesheet');
}

const root = readFileSync(join(dist, 'index.html'), 'utf8');
if (!root.includes('./index_next.html')) throw Error('dist/index.html does not redirect to index_next.html');

console.log('Verified self-contained release: dist/index_next.html');
