#!/usr/bin/env node

const { createHash } = require('node:crypto');
const { existsSync, readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const root = join(__dirname, '..');
const migrationsDir = join(root, 'supabase', 'migrations');
const manifestPath = join(migrationsDir, 'manifest.json');
const migrationPattern = /^(\d{14})_([a-z0-9][a-z0-9_-]*)\.sql$/;

function digest(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function readManifest() {
  if (!existsSync(manifestPath)) throw new Error('Migration manifest is missing.');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(manifest.migrations) || manifest.version !== 1) {
    throw new Error('Migration manifest must have version 1 and a migrations array.');
  }
  return manifest;
}

function collectMigrations() {
  const actual = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .map(file => {
      const match = migrationPattern.exec(file);
      if (!match) throw new Error(`Invalid migration filename: ${file}`);
      return { file, timestamp: match[1], sha256: digest(join(migrationsDir, file)) };
    });
  const timestamps = new Set();
  for (const migration of actual) {
    if (timestamps.has(migration.timestamp)) throw new Error(`Duplicate migration timestamp: ${migration.timestamp}`);
    timestamps.add(migration.timestamp);
  }
  return actual;
}

function validateManifest(actual, manifest) {
  if (JSON.stringify(actual) !== JSON.stringify(manifest.migrations)) {
    throw new Error('Migration manifest does not match the checked-in SQL files. Regenerate it after review.');
  }
}

function checkMigrations() {
  const actual = collectMigrations();
  const manifest = readManifest();
  validateManifest(actual, manifest);
  console.log(`Verified ${actual.length} ordered migrations against manifest`);
}

if (require.main === module && process.argv.includes('--apply-clean')) {
  if (!existsSync(join(root, 'supabase', 'config.toml'))) {
    console.error('A local Supabase project is not configured; clean reset is unavailable.');
    process.exit(2);
  }
  const result = spawnSync('supabase', ['db', 'reset', '--local'], { cwd: root, stdio: 'inherit' });
  process.exit(result.status ?? 1);
}

if (require.main === module) {
  try {
    checkMigrations();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { checkMigrations, collectMigrations, validateManifest };
