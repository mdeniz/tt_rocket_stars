const { test, expect } = require('@playwright/test');

async function enterGame(page) {
  await page.goto('/');
  await page.locator('#launchSplash').click();
  await expect(page.locator('#dashboard')).toBeVisible();
  await dismissTour(page);
}

async function dismissTour(page) {
  const skip = page.locator('#ttTourSkip');
  await skip.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

test('pilot adapter exposes local profiles without cloud configuration', async ({ page }) => {
  await enterGame(page);
  await expect.poll(() => page.evaluate(() => typeof window.TTPilotAdapter?.readPilots)).toBe('function');
  await expect.poll(() => page.evaluate(() => window.__TT_SUPABASE_CONFIG__?.url || '')).toBe('');
  expect(await page.evaluate(() => window.TTPilotAdapter.readPilots())).toHaveLength(1);
});

test('pilot creation and switching preserve separate local profile identities', async ({ page }) => {
  await enterGame(page);
  await page.locator('#headerPilot').click();
  await expect(page.locator('#profileGate')).toBeVisible();

  await page.locator('#profileName').fill('Second Pilot');
  await page.locator('#profileCreateForm button').click();
  await expect(page.locator('#headerPilotName')).toHaveText('Second Pilot');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('tt-rocket-profiles-v1')).length)).toBe(2);

  await dismissTour(page);
  await page.locator('#headerPilot').click();
  await page.locator('#profileList .profileSelect').filter({ hasText: 'Pilot 1' }).click();
  await expect(page.locator('#headerPilotName')).toHaveText('Pilot 1');
  await expect.poll(() => page.evaluate(() => {
    const active = localStorage.getItem('tt-rocket-active-profile-v1');
    return JSON.parse(localStorage.getItem('tt-rocket-profiles-v1')).find(profile => profile.id === active)?.name;
  })).toBe('Pilot 1');
});
