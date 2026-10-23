import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function parseVersion(version) {
  const match = semver.exec(version);
  if (!match) throw Error(`Expected a SemVer version (X.Y.Z), got: ${version}`);
  return match.slice(1).map(Number);
}

function nextVersion(current, requested) {
  const [major, minor, patch] = parseVersion(current);
  if (requested === 'patch') return `${major}.${minor}.${patch + 1}`;
  if (requested === 'minor') return `${major}.${minor + 1}.0`;
  if (requested === 'major') return `${major + 1}.0.0`;

  if (!semver.test(requested)) {
    throw Error('Release version must be patch, minor, major, or a SemVer X.Y.Z version');
  }
  const next = parseVersion(requested);
  const currentNumber = major * 1_000_000_000 + minor * 1_000_000 + patch;
  const nextNumber = next[0] * 1_000_000_000 + next[1] * 1_000_000 + next[2];
  if (nextNumber <= currentNumber) throw Error('Release version must be greater than the current version');
  return requested;
}

function releaseNotes(changelog, version, date) {
  const header = '## [Unreleased]';
  const start = changelog.indexOf(header);
  if (start === -1) throw Error('CHANGELOG.md must contain an [Unreleased] section');
  const bodyStart = start + header.length;
  const nextHeader = changelog.indexOf('\n## [', bodyStart);
  const bodyEnd = nextHeader === -1 ? changelog.length : nextHeader;
  const notes = changelog.slice(bodyStart, bodyEnd).trim();
  if (!notes) throw Error('CHANGELOG.md has no unreleased changes to release');

  return `${changelog.slice(0, bodyStart)}\n\n## [${version}] - ${date}\n${notes}\n${changelog.slice(bodyEnd)}`;
}

function run(command, args, root) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function main() {
  const requested = process.argv[2];
  if (!requested) throw Error('Usage: npm run release -- <patch|minor|major|X.Y.Z>');

  const root = resolve(import.meta.dirname, '..');
  const packagePath = resolve(root, 'package.json');
  const lockPath = resolve(root, 'package-lock.json');
  const changelogPath = resolve(root, 'CHANGELOG.md');
  const readJson = file => JSON.parse(readFileSync(file, 'utf8'));
  const packageJson = readJson(packagePath);
  const next = nextVersion(packageJson.version, requested);
  const date = new Date().toISOString().slice(0, 10);
  const nextChangelog = releaseNotes(readFileSync(changelogPath, 'utf8'), next, date);
  const releaseFile = resolve(root, 'releases', `tt-rocket-stars-v${next}.html`);
  if (existsSync(releaseFile)) throw Error(`Release already exists: ${releaseFile}`);

  run('npm', ['run', 'check'], root);

  const lockfile = readJson(lockPath);
  packageJson.version = next;
  lockfile.version = next;
  lockfile.packages[''].version = next;
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
  writeFileSync(lockPath, `${JSON.stringify(lockfile, null, 2)}\n`);
  writeFileSync(changelogPath, nextChangelog);
  writeFileSync(resolve(root, 'README.md'), readFileSync(resolve(root, 'README.md'), 'utf8').replace(
    /\*\*Versión semántica:\*\* `[^`]+`/,
    `**Versión semántica:** \`${next}\``,
  ));

  mkdirSync(resolve(root, 'releases'), { recursive: true });
  copyFileSync(resolve(root, 'dist', 'index_next.html'), releaseFile);
  console.log(`Created ${releaseFile}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

export { nextVersion, releaseNotes };
