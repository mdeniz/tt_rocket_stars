#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const changesRoot = path.join(root, 'openspec', 'changes');
const errors = [];

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function validateChange(changePath, changeName) {
  const configPath = path.join(changePath, '.openspec.yaml');
  if (!fs.existsSync(configPath)) {
    errors.push(`${changeName}: missing .openspec.yaml`);
    return;
  }

  const config = readText(configPath);
  const skipSpecs = /^skip_specs:\s*true\s*$/m.test(config);
  for (const artifact of ['proposal.md', 'design.md', 'tasks.md']) {
    if (!fs.existsSync(path.join(changePath, artifact))) {
      errors.push(`${changeName}: missing ${artifact}`);
    }
  }

  if (!skipSpecs) {
    const specsPath = path.join(changePath, 'specs');
    if (!fs.existsSync(specsPath)) {
      errors.push(`${changeName}: missing specs directory`);
    }
  }
}

if (fs.existsSync(changesRoot)) {
  for (const entry of fs.readdirSync(changesRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== 'archive') {
      validateChange(path.join(changesRoot, entry.name), entry.name);
    }
  }
}

if (errors.length > 0) {
  console.error('Documentation/OpenSpec validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Documentation/OpenSpec validation passed.');
