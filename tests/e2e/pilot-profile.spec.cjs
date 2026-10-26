const { test, expect } = require('@playwright/test');

async function enterGame(page) {
  await page.goto('/');
  await page.locator('#reactLaunchSplash').click();
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

test('React pilot selector preserves the legacy profile contract', async ({ page }) => {
  await enterGame(page);
  await page.locator('#menuBtn').click();
  await page.locator('.drawerProfileSwitch').click();
  await expect(page.locator('.ttReactPilotSelector')).toBeVisible();
  await expect(page.locator('.ttReactPilotTile')).toContainText('Pilot 1');

  await page.locator('#ttReactPilotName').fill('React Pilot');
  await page.locator('.ttReactPilotCreate button').click();
  await expect(page.locator('.ttReactPilotSelector')).toBeHidden();
  await expect(page.locator('#headerPilotName')).toHaveText('React Pilot');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('tt-rocket-profiles-v1')).length)).toBe(2);
});

test('flagged React pilot persistence does not depend on legacy profile mutators', async ({ page }) => {
  await page.addInitScript(() => {
    window.__TTFeatureFlags = { reactCoreScreens: true };
  });
  await enterGame(page);

  const result = await page.evaluate(() => {
    const originalId = window.TTPersistenceBoundary.pilots.readPilots()[0].id;
    window.TTProfiles.create = () => { throw new Error('legacy create must not be called'); };
    window.TTProfiles.choose = () => { throw new Error('legacy choose must not be called'); };
    const createdId = window.TTPersistenceBoundary.pilots.createPilot('Typed Pilot');
    const createdProfile = JSON.parse(localStorage.getItem('tt-rocket-profiles-v1')).find(profile => profile.id === createdId);
    const switched = window.TTPersistenceBoundary.pilots.choosePilot(originalId);
    return {
      createdId,
      createdName: createdProfile?.name,
      activeId: localStorage.getItem('tt-rocket-active-profile-v1'),
      switched,
    };
  });

  expect(result.createdId).toBeTruthy();
  expect(result.createdName).toBe('Typed Pilot');
  expect(result.switched).toBe(true);
  expect(result.activeId).not.toBe(result.createdId);
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
