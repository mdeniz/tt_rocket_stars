const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const index = fs.readFileSync('index.html', 'utf8');
const navigation = fs.readFileSync('public/legacy/scripts/26.js', 'utf8');
const cloud = fs.readFileSync('public/legacy/scripts/32.js', 'utf8');

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
  assert.match(cloud, /ttCloudDelete/);
  assert.match(cloud, /ui\.084/);
});

test('cloud synchronization is injected before the legacy runtime and used by it', () => {
  const vite = fs.readFileSync('vite.config.mjs', 'utf8');
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

test('token-hash callback bypasses the game history binding', () => {
  assert.doesNotMatch(cloud, /(?<!window\.)\bhistory\.replaceState/);
});
