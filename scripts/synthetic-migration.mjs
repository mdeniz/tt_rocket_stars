#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import postgres from 'postgres';
import { exportSyntheticBundle, importMigrationPackage } from '../apps/api/src/migration/synthetic.ts';

const args = new Map(process.argv.slice(2).map((value, index, values) => value.startsWith('--') ? [value, values[index + 1] ?? true] : [value, true]));
const command = process.argv[2];
const inputPath = args.get('--input');
const outputPath = args.get('--output');
if (!command || !inputPath) throw new Error('Usage: synthetic-migration.mjs export|import --input file [--output file] [--dry-run]');
const input = JSON.parse(await readFile(String(inputPath), 'utf8'));
if (command === 'export') {
  const result = await exportSyntheticBundle(input);
  const output = `${JSON.stringify(result, null, 2)}\n`;
  if (outputPath) await writeFile(String(outputPath), output, 'utf8'); else process.stdout.write(output);
} else if (command === 'import') {
  const sql = postgres(process.env.DATABASE_URL ?? 'postgres://tt_app:tt_app_local_only@localhost:54329/tt_rocket_stars', { prepare: false });
  try { console.log(JSON.stringify(await importMigrationPackage(sql, input, { dryRun: args.has('--dry-run') }))); }
  finally { await sql.end({ timeout: 5 }); }
} else throw new Error(`Unknown command: ${command}`);
