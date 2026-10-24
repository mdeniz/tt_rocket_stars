const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const index = fs.readFileSync('index.html', 'utf8');
const runtime = fs.readFileSync('public/legacy/scripts/01.js', 'utf8');
const splash = fs.readFileSync('public/legacy/scripts/06.js', 'utf8');
const recovery = fs.readFileSync('public/legacy/scripts/31.js', 'utf8');

test('provides an inline favicon without a network dependency', () => {
  assert.match(index, /rel="icon" href="data:image\/svg\+xml/);
  assert.doesNotMatch(index, /href="\.?\/?favicon\.ico"/);
});

test('moves focus before hiding aria-hidden regions', () => {
  assert.match(runtime, /region\.contains\(active\).*target\.focus/);
  assert.match(runtime, /hideRegion\(drawer,menu\)/);
  assert.match(splash, /hideRegion\(splash,document\.getElementById\('menuBtn'\)\)/);
  assert.match(recovery, /hideRegion\(splash,document\.getElementById\('menuBtn'\)\)/);
});
