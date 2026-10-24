const { test, expect } = require('@playwright/test');

test('evaluates targeted flags with offline-safe deterministic behavior', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { createFeatureFlagService } = await import('/src/lib/feature-flags.js');
    const accountId = '00000000-0000-4000-8000-000000000001';
    const service = createFeatureFlagService({
      definitions: {
        preview: {
          defaultEnabled: false,
          targeting: {
            allowlist: [accountId],
            rolloutPercentage: 25,
          },
        },
        rollout: { defaultEnabled: false, targeting: { rolloutPercentage: 100 } },
      },
    });
    return {
      allowlisted: service.evaluate('preview', { accountId }),
      displayNameRejected: service.evaluate('preview', { accountId: 'Pilot One' }),
      missingIdentityUsesDefault: service.evaluate('preview'),
      deterministic: service.evaluate('rollout', { accountId })
        === service.evaluate('rollout', { accountId }),
      unknownFailsClosed: service.evaluate('unknown', { accountId }),
    };
  });

  expect(result).toEqual({
    allowlisted: true,
    displayNameRejected: false,
    missingIdentityUsesDefault: false,
    deterministic: true,
    unknownFailsClosed: false,
  });
});

test('rejects invalid targeting configuration in the browser', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { createFeatureFlagService } = await import('/src/lib/feature-flags.js');
    const failures = [];
    for (const targeting of [
      { allowlist: ['not-an-account'] },
      { rolloutPercentage: -1 },
      { rolloutPercentage: 101 },
      {},
    ]) {
      try {
        createFeatureFlagService({ definitions: { preview: { defaultEnabled: false, targeting } } });
      } catch (error) {
        failures.push(error instanceof TypeError);
      }
    }
    return failures;
  });

  expect(result).toEqual([true, true, true, true]);
});

test('React core navigation is opt-in and delegates to legacy screens', async ({ page }) => {
  await page.addInitScript(() => {
    window.__TTFeatureFlags = { reactCoreScreens: true };
  });
  await page.goto('/');
  await page.locator('#reactLaunchSplash').click();
  await expect(page.locator('#dashboard')).toBeVisible();
  const skip = page.locator('#ttTourSkip');
  await skip.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await expect(page.locator('.ttReactCoreNav')).toBeVisible();
  await expect(page.locator('[data-react-core-host="dashboard"]')).toBeVisible();
  await expect(page.locator('[data-react-core-host="dashboard"]')).toContainText('Mission Control');
  await page.locator('[data-react-core-host="dashboard"] button').click();
  await expect(page.locator('#insights')).toBeVisible();
  await expect(page.locator('[data-react-core-host="insights"]')).toContainText('Progress');

  for (const [screen, selector] of [['home', '#home'], ['insights', '#insights'], ['garage', '#garage'], ['awards', '#awards']]) {
    await page.locator('.ttReactCoreNav button').nth(['dashboard', 'home', 'insights', 'garage', 'awards'].indexOf(screen)).click();
    await expect(page.locator(selector)).toBeVisible();
  }
  await expect(page.locator('.ttReactCoreNav')).toHaveCount(1);
});

test('React core navigation stays usable offline and preserves pilot-local identity', async ({ page, context }) => {
  await page.addInitScript(() => {
    window.__TTFeatureFlags = { reactCoreScreens: true };
  });
  await page.goto('/');
  await page.locator('#reactLaunchSplash').click();
  await expect(page.locator('#dashboard')).toBeVisible();
  const skip = page.locator('#ttTourSkip');
  await skip.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await skip.isVisible().catch(() => false)) await skip.click();

  const originalPilot = await page.evaluate(() => window.TTProfiles.active().id);
  await page.locator('.ttReactCoreNav button').nth(2).click();
  await expect(page.locator('#insights')).toBeVisible();

  await context.setOffline(true);
  await page.locator('.ttReactCoreNav button').nth(0).press('Enter');
  await expect(page.locator('#dashboard')).toBeVisible();
  await page.locator('.ttReactCoreNav button').nth(2).click();
  await expect(page.locator('#insights')).toBeVisible();

  const secondPilot = await page.evaluate(() => window.TTPilotAdapter.createPilot('Offline Pilot'));
  expect(secondPilot).toBeTruthy();
  expect(await page.evaluate(() => window.TTProfiles.active().name)).toBe('Offline Pilot');
  expect(await page.evaluate(id => window.TTPilotAdapter.choosePilot(id), originalPilot)).toBe(true);
  expect(await page.evaluate(() => window.TTProfiles.active().id)).toBe(originalPilot);
  expect(await page.evaluate(() => localStorage.getItem('tt-rocket-profiles-v1'))).not.toBeNull();
});

test('React mission setup delegates supported configuration to gameplay', async ({ page }) => {
  await page.addInitScript(() => {
    window.__TTFeatureFlags = { reactCoreScreens: true };
  });
  await page.goto('/');
  await page.locator('#reactLaunchSplash').click();
  const skip = page.locator('#ttTourSkip');
  await skip.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await skip.isVisible().catch(() => false)) await skip.click();

  await page.locator('.ttReactCoreNav button').nth(1).click();
  const setup = page.locator('.ttReactMissionSetup');
  await expect(setup).toBeVisible();
  await setup.getByRole('button', { name: 'Table 3' }).click();
  await expect(setup.getByRole('button', { name: 'Table 3' })).toHaveAttribute('aria-pressed', 'true');
  await setup.getByRole('button', { name: /Divide/ }).click();
  await setup.getByRole('button', { name: /Long mission/ }).click();
  await setup.getByRole('button', { name: '15 minutes' }).click();
  await expect(setup.getByRole('button', { name: '15 minutes' })).toHaveClass(/on/);
  await setup.getByRole('button', { name: /Launch mission/ }).click();
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('#question')).not.toHaveText('');
});

async function launchReactMission(page, mode = 'practice') {
  await page.addInitScript(() => {
    window.__TTFeatureFlags = { reactCoreScreens: true };
  });
  await page.goto('/');
  await page.locator('#reactLaunchSplash').click();
  const skip = page.locator('#ttTourSkip');
  await skip.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.locator('.ttReactCoreNav button').nth(1).click();
  const setup = page.locator('.ttReactMissionSetup');
  await expect(setup).toBeVisible();
  if (mode === 'timed') {
    await setup.getByRole('button', { name: /Long mission/ }).click();
    await setup.getByRole('button', { name: '5 minutes', exact: true }).click();
  }
  await setup.getByRole('button', { name: /Launch mission/ }).click();
  await expect(page.locator('#play')).toBeVisible();
  return setup;
}

test('React practice flow preserves legacy answer progression, audio, and local persistence', async ({ page }) => {
  await launchReactMission(page);
  const initialQuestion = await page.locator('#question').innerText();
  const match = initialQuestion.match(/(\d+)\s*[×x]\s*(\d+)/);
  expect(match).not.toBeNull();
  const correctAnswer = String(Number(match[1]) * Number(match[2]));

  for (const digit of correctAnswer) await page.getByRole('button', { name: digit, exact: true }).click();
  await page.getByRole('button', { name: /Check|Comprobar/ }).click();

  await expect(page.locator('#answer')).toBeDisabled();
  await expect(page.locator('#score')).toContainText('10');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('cosmotablas-v2'))).not.toBeNull();
  await expect.poll(() => page.locator('#question').innerText()).not.toBe(initialQuestion, { timeout: 3000 });
  await expect(page.locator('#answer')).toBeEnabled();
  expect(await page.evaluate(() => typeof window.TTAudio?.sfx)).toBe('function');
});

test('React timed flow exposes a running legacy timer and remains locally playable', async ({ page }) => {
  await launchReactMission(page, 'timed');
  const initialClock = await page.locator('#clock').innerText();
  expect(initialClock).toMatch(/5:0\d/);
  await expect.poll(() => page.locator('#clock').innerText(), { timeout: 3000 }).not.toBe(initialClock);
  await expect(page.locator('#question')).not.toHaveText('');
  await expect(page.locator('#answer')).toBeEnabled();
  expect(await page.evaluate(() => typeof window.TTAudio?.sfx)).toBe('function');
});

test('React garage controls delegate preview and equip actions to pilot-local storage', async ({ page }) => {
  await page.addInitScript(() => {
    window.__TTFeatureFlags = { reactCoreScreens: true };
  });
  await page.goto('/');
  await page.locator('#reactLaunchSplash').click();
  const skip = page.locator('#ttTourSkip');
  await skip.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await skip.isVisible().catch(() => false)) await skip.click();

  await page.locator('.ttReactCoreNav button').nth(3).click();
  const panel = page.locator('.ttReactGaragePanel');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('button', { name: /Body|Cuerpo/ })).toBeVisible();
  const firstItem = panel.locator('.ttReactGarageItem').first();
  await expect(firstItem).toBeVisible();
  await firstItem.getByRole('button', { name: 'Preview' }).click();
  await expect(page.locator('#garageItems .garageItem.previewing')).toHaveCount(1);
  await firstItem.getByRole('button', { name: /Equip|Equipped|Equipado/ }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('tt-rocket-garage-v1'))).not.toBeNull();
});
