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
