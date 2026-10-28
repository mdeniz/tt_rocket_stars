const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const index = fs.readFileSync('index.html', 'utf8');
const navigation = fs.readFileSync('public/legacy/scripts/26.js', 'utf8');
const cloud = fs.readFileSync('public/legacy/scripts/32.js', 'utf8');
const pagesWorkflow = fs.readFileSync('.github/workflows/pages.yml', 'utf8');
const smtpSetup = fs.readFileSync('docs/supabase-brevo-setup.md', 'utf8');
const vite = fs.readFileSync('vite.config.mjs', 'utf8');

test('settings panels expose stable identities including cloud access', () => {
  assert.match(navigation, /cloud:[\s\S]*audio:[\s\S]*profile:[\s\S]*language:[\s\S]*theme:[\s\S]*backups:[\s\S]*reset:/);
  assert.match(index, /id=["']ttAudioSettings["']/);
});

test('settings navigation maps labels by stable panel identity', () => {
  assert.match(navigation, /data-settings-panel/);
  assert.match(navigation, /Cloud access/);
  assert.doesNotMatch(navigation, /labels\[i\]/);
});

test('cloud access controls include sync and deletion affordances', () => {
  assert.match(cloud, /ttCloudSyncNow/);
  assert.match(cloud, /ttCloudRestore/);
  assert.match(cloud, /ttCloudList/);
  assert.match(cloud, /listPilots/);
  assert.match(cloud, /restoreCloud/);
  assert.match(cloud, /ttCloudDelete/);
  assert.match(cloud, /ui\.084/);
});

test('cloud synchronization is injected before the legacy runtime and used by it', () => {
  const vite = fs.readFileSync('vite.config.mjs', 'utf8');
  assert.ok(index.indexOf('TT_PERSISTENCE_RUNTIME') < index.indexOf('TT_CLOUD_SYNC_RUNTIME'));
  assert.match(index, /TT_CLOUD_SYNC_RUNTIME/);
  assert.match(vite, /window\.TTCloudSync=\{createCloudSync/);
  assert.match(cloud, /window\.TTCloudSync\?\.createCloudSync/);
  assert.match(cloud, /cloudAdapter\?\.queueUpload/);
  assert.match(cloud, /const result = await cloudAdapter\.download\(\)/);
});

test('cloud access consumes token-hash callbacks from the static app URL', () => {
  assert.match(cloud, /token_hash/);
  assert.match(cloud, /api\('\/verify'\)/);
  assert.match(cloud, /redirect_to/);
  assert.match(cloud, /window\.history\.replaceState/);
});

test('cloud callback URLs always preserve the active application entrypoint', () => {
  assert.match(cloud, /new URL\(location\.pathname, location\.origin\)\.toString\(\)/);
  assert.doesNotMatch(cloud, /config\.siteUrl \|\| `\$\{location\.origin\}\$\{location\.pathname\}`/);
});

test('development builds expose cloud access while Pages restores the stable release', () => {
  assert.match(vite, /VITE_ENABLE_CLOUD_ACCESS !== 'false'/);
  assert.match(pagesWorkflow, /Restore stable release entrypoint/);
});

test('Supabase email templates use explicit supported callback types', () => {
  assert.match(smtpSetup, /type=recovery/);
  assert.match(smtpSetup, /type=invite/);
  assert.doesNotMatch(smtpSetup, /href="[^"]*type=\{\{ \.EmailType \}\}/);
});

test('cloud access uses password sign-in and keeps invitation links for setup', () => {
  assert.match(cloud, /api\('\/token'\)\}\?grant_type=password/);
  assert.match(cloud, /api\('\/user'\)/);
  assert.match(cloud, /type === 'invite' \|\| type === 'recovery'/);
  assert.doesNotMatch(cloud, /api\('\/otp'\)/);
});

test('authenticated users can change their password without changing local storage', () => {
  assert.match(cloud, /ttAuthChangePasswordForm/);
  assert.match(cloud, /passwordChanged/);
  assert.match(cloud, /method: 'PUT'/);
  assert.match(cloud, /changeForm\.classList\.toggle\('hidden', !user \|\| setupMode\)/);
});

test('password forms expose an explicit invited-account identity', () => {
  assert.match(cloud, /emailInput\.name = 'username'/);
  assert.match(cloud, /emailInput\.autocomplete = 'username'/);
  assert.match(cloud, /ttAuthSetupEmail/);
  assert.match(cloud, /ttAuthChangeEmail/);
  assert.match(cloud, /setupEmailInput\.autocomplete = 'username'/);
  assert.match(cloud, /changeEmailInput\.autocomplete = 'username'/);
  assert.match(cloud, /setupEmailInput\.value = email/);
  assert.match(cloud, /changeEmailInput\.value = email/);
});

test('token-hash callback bypasses the game history binding', () => {
  assert.doesNotMatch(cloud, /(?<!window\.)\bhistory\.replaceState/);
});
