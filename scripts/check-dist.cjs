const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join } = require('node:path');

const dist = join(__dirname, '..', 'dist');
const files = readdirSync(dist);
if (files.length !== 1 || files[0] !== 'index.html') {
  throw Error(`Expected dist to contain only index.html, got: ${files.join(', ') || '(empty)'}`);
}

const output = join(dist, 'index.html');
if (!statSync(output).isFile()) throw Error('dist/index.html is not a file');

const html = readFileSync(output, 'utf8');
if (/<script\b[^>]*\bsrc=/i.test(html)) throw Error('Release HTML has an external script');
if (/<link\b[^>]*\brel=["']stylesheet["']/i.test(html)) {
  throw Error('Release HTML has an external stylesheet');
}

console.log('Verified self-contained release: dist/index.html');
