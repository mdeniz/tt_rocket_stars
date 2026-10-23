const { test, expect } = require('@playwright/test');
const { installCloudFixture } = require('./cloud-fixture.cjs');

test('invited users can request password recovery with English feedback', async ({ page }) => {
  const fixture = await installCloudFixture(page);
  await fixture.openCloudSettings();
  await page.locator('#ttAuthEmail').fill('pilot@example.com');
  await page.locator('#ttAuthRecovery').click();
  await expect(page.locator('#ttAuthStatus')).toContainText('Check your email for a password recovery link.');
  expect(fixture.state.authRequests.some(request => request.path === '/auth/v1/recover')).toBe(true);
});

test('invited users can request password recovery with Spanish feedback', async ({ page }) => {
  const fixture = await installCloudFixture(page, { language: 'es' });
  await fixture.openCloudSettings();
  await page.locator('#ttAuthEmail').fill('piloto@example.com');
  await page.locator('#ttAuthRecovery').click();
  await expect(page.locator('#ttAuthStatus')).toContainText('Revisa tu email para encontrar el enlace de recuperación.');
  expect(fixture.state.authRequests.some(request => request.path === '/auth/v1/recover')).toBe(true);
});

test('invited account setup can return to password login without blocking local play', async ({ page }) => {
  const fixture = await installCloudFixture(page);
  await page.goto('/?token_hash=invite-token&type=invite');
  await page.locator('#launchSplash').click();
  await expect(page.locator('#launchSplash')).toBeHidden();
  await page.locator('#ttTourShade').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  const skip = page.locator('#ttTourSkip');
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.locator('#menuBtn').click();
  await page.locator('#sideDrawer [data-section="settings"]').click();
  await expect(page.locator('#ttAuthSetupForm')).toBeVisible();
  await page.locator('#ttAuthSetupPassword').fill('correct horse battery');
  await page.locator('#ttAuthSetupForm button[type="submit"]').click();
  await expect(page.locator('#ttAuthStatus')).toContainText('password has been set');
  expect(fixture.state.authRequests.some(request => request.path === '/auth/v1/verify')).toBe(true);
});

test('authenticated local changes upload and cloud deletion keeps local progress', async ({ page }) => {
  const fixture = await installCloudFixture(page);
  await fixture.openCloudSettings();
  await page.locator('#ttAuthEmail').fill('pilot@example.com');
  await page.locator('#ttAuthPassword').fill('correct horse battery');
  await page.locator('#ttAuthForm button[type="submit"]').click();
  await expect(page.locator('#ttAuthStatus')).toContainText('signed in');
  await expect.poll(() => fixture.state.pilots.has('local-pilot')).toBe(true);

  await page.evaluate(() => { window.confirm = () => true; });
  await expect(page.locator('#ttCloudDelete')).toBeEnabled({ timeout: 10000 });
  await page.locator('#ttCloudDelete').click();
  await expect.poll(() => fixture.state.deleteCount).toBe(1);
  await expect(page.locator('#ttCloudStatus')).toContainText('Cloud data deleted');
  expect(await page.evaluate(() => localStorage.getItem('tt-rocket-profiles-v1'))).not.toBeNull();
});

test('cloud-only pilots can be discovered and restored without production credentials', async ({ page }) => {
  test.setTimeout(60000);
  const fixture = await installCloudFixture(page);
  await fixture.openCloudSettings();
  await page.locator('#ttAuthEmail').fill('pilot@example.com');
  await page.locator('#ttAuthPassword').fill('correct horse battery');
  await page.locator('#ttAuthForm button[type="submit"]').click();
  await expect(page.locator('#ttAuthStatus')).toContainText('signed in');
  await page.locator('#ttCloudList').click();
  await expect(page.locator('#ttCloudPilots')).toContainText('Cloud Pilot');
  await page.evaluate(() => {
    const restore = window.TTProfiles.restoreCloud;
    window.TTProfiles.restoreCloud = pilot => {
      const result = restore(pilot);
      localStorage.setItem('tt-test-profiles-before-reload', localStorage.getItem('tt-rocket-profiles-v1') || '');
      return result;
    };
  });
  await page.locator('#ttCloudPilots .ttCloudPilot').filter({ hasText: 'Cloud Pilot' }).getByRole('button', { name: 'Restore' }).click();
  await page.waitForTimeout(1000);
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('tt-test-profiles-before-reload') || ''), { timeout: 15000 }).toContain('cloud-pilot');
});

test('stale writes create a recovery path and transient provider failures are retried', async ({ page }) => {
  test.setTimeout(60000);
  const fixture = await installCloudFixture(page, { failPilotUploads: 1 });
  await fixture.openCloudSettings();
  await page.locator('#ttAuthEmail').fill('pilot@example.com');
  await page.locator('#ttAuthPassword').fill('correct horse battery');
  await page.locator('#ttAuthForm button[type="submit"]').click();
  await expect(page.locator('#ttAuthStatus')).toContainText('signed in');
  await expect.poll(() => fixture.state.pilots.has('local-pilot')).toBe(true);

  fixture.state.conflictOnce = true;
  const localSnapshot = fixture.state.snapshots.get('local-pilot');
  fixture.state.snapshots.set('local-pilot', { ...localSnapshot, version: 3 });
  await page.once('dialog', dialog => dialog.accept());
  await page.locator('#ttCloudSyncNow').click();
  await expect(page.locator('#ttCloudStatus')).toContainText('Cloud sync completed', { timeout: 15000 });
  await expect.poll(() => fixture.state.cloudRequests.filter(request => request.path === '/rest/v1/pilots').length).toBeGreaterThan(1);
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('tt-rocket-backups-v1') || '[]').length)).toBeGreaterThan(0);
});

test('local-only startup does not require a cloud request', async ({ page }) => {
  const requests = [];
  await page.route('**/auth/v1/**', route => { requests.push(route.request().url()); return route.abort(); });
  await page.route('**/rest/v1/**', route => { requests.push(route.request().url()); return route.abort(); });
  await page.addInitScript(() => {
    localStorage.setItem('tt-rocket-profiles-v1', JSON.stringify([{ id: 'local-pilot', name: 'Local Pilot', language: 'en', createdAt: 1, payload: { 'cosmotablas-v2': '{}', 'cosmotablas-history-v1': '[]', 'tt-rocket-garage-v1': '{}' } }]));
    localStorage.setItem('tt-rocket-active-profile-v1', 'local-pilot');
  });
  await page.goto('/');
  await page.locator('#launchSplash').click();
  await expect(page.locator('#dashboard')).toBeVisible();
  await page.locator('#ttTourShade').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  const skip = page.locator('#ttTourSkip');
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.locator('#menuBtn').click();
  await page.locator('#sideDrawer [data-section="settings"]').click();
  await expect(page.locator('#ttAuthPanel')).toBeHidden();
  await expect(page.locator('#settings .ttSettingsTab').filter({ hasText: 'Cloud access' })).toHaveCount(0);
  expect(requests).toEqual([]);
});
