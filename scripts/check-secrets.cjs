const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const allowlist = JSON.parse(readFileSync(join(root, '.security/secret-scan-allowlist.json'), 'utf8'));
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:ghp|github_pat|xox[baprs])-[-_A-Za-z0-9]{20,}/,
  /(?:sk_live|AKIA)[A-Z0-9_-]{12,}/,
  /(?:SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL|BETTER_AUTH_SECRET)\s*[:=]\s*['"]?(?!\$\{|process\.env)[^\s'"`]{12,}/i,
];

function scanTrackedFiles() {
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: root }).toString().split('\0').filter(Boolean);
  const findings = [];
  for (const file of files) {
    if (allowlist.files.includes(file)) continue;
    const source = readFileSync(join(root, file), 'utf8');
    for (const pattern of patterns) {
      if (pattern.test(source)) findings.push({ file, pattern: pattern.source });
    }
  }
  return findings;
}

if (require.main === module) {
  const findings = scanTrackedFiles();
  if (findings.length) {
    console.error(`Secret scan failed with ${findings.length} finding(s); values are intentionally omitted.`);
    for (const finding of findings) console.error(`- ${finding.file}: ${finding.pattern}`);
    process.exit(1);
  }
  console.log('Secret scan passed; no high-confidence credentials found in tracked files.');
}

module.exports = { scanTrackedFiles, patterns };
