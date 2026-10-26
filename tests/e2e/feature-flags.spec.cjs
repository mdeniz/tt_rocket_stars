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

test('React core navigation is opt-in and owns dashboard and progress metrics', async ({ page }) => {
  await page.addInitScript(() => {
    window.__TTFeatureFlags = { reactCoreScreens: true };
    localStorage.setItem('cosmotablas-v2', JSON.stringify({ '2-1-mul': { right: 100, wrong: 0 } }));
    localStorage.setItem('cosmotablas-history-v1', JSON.stringify([{ correct: 20, wrong: 0 }]));
  });
  await page.goto('/');
  await page.locator('#reactLaunchSplash').click();
  await expect(page.locator('#dashboard')).toBeVisible();
  const skip = page.locator('#ttTourSkip');
  await skip.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await expect(page.locator('.ttReactCoreNav')).toBeVisible();
  await expect(page.locator('[data-react-core-host="dashboard"]')).toHaveCount(1);
  await expect(page.locator('[data-react-core-host="dashboard"]')).toContainText('Mission Control');
  await expect(page.locator('.ttReactDashboardPanel')).toContainText('100');
  expect(await page.locator('#dashboard > .dashhero').evaluate(element => element.style.display)).toBe('none');
  await page.locator('.ttReactCoreNav button').nth(2).click();
  await expect(page.locator('#insights')).toBeVisible();
  await expect(page.locator('[data-react-core-host="insights"]')).toHaveCount(1);
  await expect(page.locator('[data-react-core-host="insights"]')).toContainText('Progress');
  await expect(page.locator('.ttReactProgressPanel')).toContainText('Table 2');
  expect(await page.locator('#insights > .dashpanel').first().evaluate(element => element.style.display)).toBe('none');

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

test('React persistence boundary owns backup controls when the flag is enabled', async ({ page }) => {
  page.on('dialog', dialog => dialog.dismiss());
  await page.addInitScript(() => {
    window.__TTFeatureFlags = { reactCoreScreens: true };
  });
  await page.goto('/');
  const result = await page.evaluate(() => ({
    hasPilotBoundary: Boolean(window.TTPersistenceBoundary?.pilots),
    hasBackupBoundary: Boolean(window.TTPersistenceBoundary?.backups),
    aliasesSame: window.TTPersistenceBoundary?.pilots === window.TTPilotAdapter,
  }));
  const backupCreated = await page.evaluate(() => {
    window.createManualBackup = null;
    return window.TTPersistenceBoundary?.backups.createManualBackup() ?? false;
  });
  expect(result).toEqual({
    hasPilotBoundary: true,
    hasBackupBoundary: true,
    aliasesSame: true,
  });
  expect(backupCreated).toBe(true);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('tt-rocket-backups-v1') || '[]').length)).toBe(1);
});

test('flagged backup settings preserve English and Spanish confirmations', async ({ page }) => {
  await page.addInitScript(() => {
    window.__TTFeatureFlags = { reactCoreScreens: true };
  });
  await page.goto('/');
  await page.locator('#reactLaunchSplash').click();
  await expect(page.locator('#dashboard')).toBeVisible();
  const skip = page.locator('#ttTourSkip');
  await skip.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.locator('#menuBtn').click();
  await page.evaluate(() => window.navigate('settings'));
  await expect(page.locator('#settings')).toBeVisible();
  await page.locator('#settings .ttSettingsBottomNav .ttSettingsTab').filter({ hasText: 'Backups' }).click();

  let englishMessage;
  page.once('dialog', async dialog => {
    englishMessage = dialog.message();
    await dialog.dismiss();
  });
  await page.getByRole('button', { name: 'Save backup' }).click();
  expect(englishMessage).toBe('Backup saved on this device.');

  await page.evaluate(() => window.setLanguage('es'));
  await expect(page.getByRole('button', { name: 'Guardar copia' })).toBeVisible();
  let spanishMessage;
  page.once('dialog', async dialog => {
    spanishMessage = dialog.message();
    await dialog.dismiss();
  });
  await page.getByRole('button', { name: 'Guardar copia' }).click();
  expect(spanishMessage).toBe('Copia guardada en este dispositivo.');
});

test('flagged backup ownership restores local state after creating a recovery backup', async ({ page }) => {
  page.on('dialog', async dialog => {
    if (dialog.type() === 'confirm') await dialog.accept();
    else await dialog.dismiss();
  });
  await page.addInitScript(() => {
    window.__TTFeatureFlags = { reactCoreScreens: true };
  });
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('cosmotablas-v2', JSON.stringify({ current: true }));
    localStorage.setItem('cosmotablas-history-v1', JSON.stringify([]));
    localStorage.setItem('tt-rocket-garage-v1', JSON.stringify({ coins: 25 }));
  });
  const backupId = await page.evaluate(() => {
    window.TTBackupControls.createManualBackup();
    return JSON.parse(localStorage.getItem('tt-rocket-backups-v1'))[0].id;
  });
  await page.evaluate(() => localStorage.setItem('cosmotablas-v2', JSON.stringify({ changed: true })));
  await Promise.all([
    page.waitForLoadState('load'),
    page.evaluate(id => window.TTBackupControls.restoreBackup(id), backupId),
  ]);
  await page.waitForTimeout(250);
  const result = await page.evaluate(() => ({
    progress: JSON.parse(localStorage.getItem('cosmotablas-v2')),
    backups: JSON.parse(localStorage.getItem('tt-rocket-backups-v1')),
  }));
  expect(result.progress).toEqual({ current: true });
  expect(result.backups.some(item => item.label === 'Before restore')).toBe(true);
});

test('flagged backup ownership supports offline export and reset', async ({ page, context }) => {
  page.on('dialog', async dialog => {
    if (dialog.type() === 'confirm') await dialog.accept();
    else await dialog.dismiss();
  });
  await page.addInitScript(() => {
    window.__TTFeatureFlags = { reactCoreScreens: true };
  });
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('cosmotablas-v2', JSON.stringify({ current: true }));
    localStorage.setItem('cosmotablas-history-v1', JSON.stringify([]));
    localStorage.setItem('tt-rocket-garage-v1', JSON.stringify({ coins: 25 }));
  });
  await context.setOffline(true);
  const download = page.waitForEvent('download');
  await page.evaluate(() => window.TTBackupControls.exportBackup());
  expect((await download).suggestedFilename()).toMatch(/^tt-rocket-stars-backup-.*\.json$/);
  await context.setOffline(false);

  const imported = JSON.stringify({
    format: 'tt-rocket-stars-backup',
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    payload: {
      'cosmotablas-v2': JSON.stringify({ imported: true }),
      'cosmotablas-history-v1': JSON.stringify([{ correct: 1 }]),
      'tt-rocket-garage-v1': JSON.stringify({ coins: 99 }),
    },
  });
  const importedReload = page.waitForEvent('framenavigated');
  await page.evaluate(json => {
    const input = document.getElementById('backupImport');
    const file = new File([json], 'backup.json', { type: 'application/json' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    Object.defineProperty(input, 'files', { configurable: true, value: transfer.files });
    window.TTBackupControls.importBackup({ target: input });
  }, imported);
  await importedReload;
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cosmotablas-v2')))).toEqual({ imported: true });

  const resetReload = page.waitForEvent('framenavigated');
  await page.evaluate(() => window.TTBackupControls.resetWithBackup());
  await resetReload;
  await page.waitForTimeout(250);
  const resetState = await page.evaluate(() => ({
    progress: localStorage.getItem('cosmotablas-v2'),
    backups: JSON.parse(localStorage.getItem('tt-rocket-backups-v1') || '[]'),
  }));
  expect(resetState.progress).toBeNull();
  expect(resetState.backups.some(item => item.label === 'Before reset')).toBe(true);
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
  await setup.getByRole('button', { name: /Launch mission|Despegar/ }).click();
  await expect(page.locator('.ttReactMissionPlayer')).toBeVisible();
  await expect(page.locator('#ttReactMissionQuestion')).not.toHaveText('');
  expect(await page.evaluate(() => typeof window.TTGameplayAdapter?.startMission)).toBe('function');
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
  } else if (mode === 'exam') {
    await setup.getByRole('button', { name: /20 challenges|20 retos/ }).click();
  }
  await setup.getByRole('button', { name: /Launch mission|Despegar/ }).click();
  await expect(page.locator('.ttReactMissionPlayer')).toBeVisible();
  return setup;
}

test('React practice flow preserves legacy answer progression, audio, and local persistence', async ({ page }) => {
  await launchReactMission(page);
  await page.evaluate(() => {
    window.__reactAudioCalls = [];
    const audio = window.TTAudio;
    if (audio) audio.sfx = name => window.__reactAudioCalls.push(name);
  });
  const initialQuestion = await page.locator('#ttReactMissionQuestion').innerText();
  const match = initialQuestion.match(/(\d+)\s*[×x]\s*(\d+)/);
  expect(match).not.toBeNull();
  const correctAnswer = String(Number(match[1]) * Number(match[2]));
  await page.locator('#ttReactMissionAnswer').fill(correctAnswer);
  await page.getByRole('button', { name: /Check answer|Comprobar respuesta/ }).click();

  await expect(page.locator('.ttReactMissionPlayer .feedback')).toContainText(/Correct|¡Correcto/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('cosmotablas-v2'))).not.toBeNull();
  await expect.poll(() => page.locator('#ttReactMissionQuestion').innerText()).not.toBe(initialQuestion, { timeout: 3000 });
  expect(await page.evaluate(() => Boolean(window.TTPersistenceBoundary?.mission))).toBe(true);
  expect(await page.evaluate(() => window.__reactAudioCalls)).toEqual(['correct']);
});

test('flagged React mission completion persists history and Rocket Coins across reloads', async ({ page }) => {
  await launchReactMission(page, 'exam');
  for (let index = 0; index < 20; index += 1) {
    const question = await page.locator('#ttReactMissionQuestion').innerText();
    const match = question.match(/(\d+)\s*[×x]\s*(\d+)/);
    expect(match).not.toBeNull();
    await page.locator('#ttReactMissionAnswer').fill(String(Number(match[1]) * Number(match[2])));
    await page.getByRole('button', { name: /Check answer|Comprobar respuesta/ }).click();
    await page.waitForTimeout(75);
  }
  await expect(page.locator('.ttReactMissionPlayer')).toContainText(/Mission complete|Misión completada/);
  const saved = await page.evaluate(() => ({
    history: JSON.parse(localStorage.getItem('cosmotablas-history-v1') || '[]'),
    garage: JSON.parse(localStorage.getItem('tt-rocket-garage-v1') || '{}'),
  }));
  expect(saved.history[0]).toMatchObject({ mode: 'exam', correct: 20, wrong: 0, coins: { total: 260, achievementBonus: 220 } });
  expect(saved.garage.coins).toBe(260);

  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cosmotablas-history-v1') || '[]')[0].coins.total)).toBe(260);
});

test('React mission results retain localized labels and accessible answer controls', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cosmotablas-language', 'es'));
  await launchReactMission(page);
  await expect(page.locator('#ttReactMissionAnswer')).toHaveAccessibleName('Tu respuesta');
  await expect(page.getByRole('button', { name: 'Comprobar respuesta' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Volver a preparar la misión' })).toBeVisible();
});

test('React timed flow exposes a running timer and remains locally playable', async ({ page }) => {
  await launchReactMission(page, 'timed');
  const initialClock = await page.locator('.ttReactMissionStatus').innerText();
  expect(initialClock).toMatch(/5:0\d/);
  await expect.poll(() => page.locator('.ttReactMissionStatus').innerText(), { timeout: 3000 }).not.toBe(initialClock);
  await expect(page.locator('#ttReactMissionQuestion')).not.toHaveText('');
  await expect(page.locator('#ttReactMissionAnswer')).toBeEnabled();
});

test('React mission remains playable offline without cloud configuration', async ({ page, context }) => {
  await launchReactMission(page);
  await context.setOffline(true);
  const question = await page.locator('#ttReactMissionQuestion').innerText();
  const match = question.match(/(\d+)\s*[×x]\s*(\d+)/);
  expect(match).not.toBeNull();
  await page.locator('#ttReactMissionAnswer').fill(String(Number(match[1]) * Number(match[2])));
  await page.getByRole('button', { name: /Check answer|Comprobar respuesta/ }).click();
  await expect(page.locator('.ttReactMissionPlayer .feedback')).toContainText(/Correct|¡Correcto/);
  expect(await page.evaluate(() => Boolean(window.TTPersistenceBoundary?.mission))).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('cosmotablas-v2'))).not.toBeNull();
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
  expect(await page.evaluate(() => typeof window.TTInventoryAdapter?.activatePart)).toBe('function');
});

test('flagged React inventory owns garage mutations without legacy action calls', async ({ page, context }) => {
  await page.addInitScript(() => {
    window.__TTFeatureFlags = { reactCoreScreens: true };
    localStorage.setItem('tt-rocket-garage-v1', JSON.stringify({
      coins: 500,
      owned: ['body_red', 'nose_classic', 'wings_classic', 'flame_orange', 'window_round', 'extra_none'],
      equipped: { body: 'body_red', nose: 'nose_classic', wings: 'wings_classic', flame: 'flame_orange', window: 'window_round', extra: 'extra_none' },
      rewardedAchievements: [],
      rewardedMissions: [],
      family: 'compact',
      fleet: [],
      designs: {},
    }));
  });
  await page.goto('/');
  await page.locator('#reactLaunchSplash').click();
  const skip = page.locator('#ttTourSkip');
  await skip.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.locator('.ttReactCoreNav button').nth(3).click();
  await expect(page.locator('.ttReactGaragePanel')).toBeVisible();
  await context.setOffline(true);

  const result = await page.evaluate(() => {
    let legacyCalls = 0;
    window.TTCoreScreensAdapter.previewGaragePart = () => { legacyCalls += 1; throw new Error('legacy preview must not be called'); };
    window.TTCoreScreensAdapter.activateGaragePart = () => { legacyCalls += 1; throw new Error('legacy activation must not be called'); };
    const previewed = window.TTPersistenceBoundary.inventory.previewPart('body_blue');
    const activated = window.TTPersistenceBoundary.inventory.activatePart('body_blue');
    const state = JSON.parse(localStorage.getItem('tt-rocket-garage-v1'));
    return { previewed, activated, legacyCalls, coins: state.coins, equipped: state.equipped.body };
  });

  expect(result).toEqual({ previewed: true, activated: true, legacyCalls: 0, coins: 400, equipped: 'body_blue' });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('tt-rocket-garage-v1')).equipped.body)).toBe('body_blue');
  await context.setOffline(false);
});

test('React achievements render from pilot-local storage in both locales and offline', async ({ page }) => {
  await page.addInitScript(() => {
    window.__TTFeatureFlags = { reactCoreScreens: true };
    localStorage.setItem('cosmotablas-language', 'en');
    localStorage.setItem('cosmotablas-v2', JSON.stringify({ '2-1-mul': { right: 100, wrong: 0 } }));
    localStorage.setItem('cosmotablas-history-v1', JSON.stringify([{ mode: 'practice', correct: 20, wrong: 0 }]));
  });
  await page.goto('/');
  await page.locator('#reactLaunchSplash').click();
  const skip = page.locator('#ttTourSkip');
  await skip.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.locator('.ttReactCoreNav button').nth(4).click();
  const panel = page.locator('.ttReactAchievementsPanel');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Achievement progress');
  await expect(panel.locator('.ttReactAchievement')).not.toHaveCount(0);
  await expect(panel).toContainText('One hundred correct');
  await page.evaluate(() => { document.querySelector('#awardGrid').innerHTML = ''; });
  await page.context().setOffline(true);
  await panel.getByRole('button', { name: 'Refresh achievements' }).click();
  await expect(panel).toContainText('One hundred correct');
  await page.context().setOffline(false);

  await page.evaluate(() => localStorage.setItem('cosmotablas-language', 'es'));
  await page.reload();
  await page.locator('#reactLaunchSplash').click();
  const spanishSkip = page.locator('#ttTourSkip');
  await spanishSkip.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await spanishSkip.isVisible().catch(() => false)) await spanishSkip.click();
  await page.locator('.ttReactCoreNav button').nth(4).click();
  await expect(page.locator('.ttReactAchievementsPanel')).toContainText('Progreso de logros');
  await expect(page.locator('.ttReactAchievementsPanel .ttReactAchievement')).not.toHaveCount(0);
});

test('React-owned controls retain keyboard, locale, and reduced-motion accessibility contracts', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    window.__TTFeatureFlags = { reactCoreScreens: true };
    localStorage.setItem('cosmotablas-language', 'es');
  });
  await page.goto('/');
  await page.locator('#reactLaunchSplash').click();
  const skip = page.locator('#ttTourSkip');
  await skip.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await skip.isVisible().catch(() => false)) await skip.click();

  const missionNav = page.locator('.ttReactCoreNav button').nth(1);
  await missionNav.focus();
  await missionNav.press('Enter');
  const setup = page.locator('.ttReactMissionSetup');
  await expect(setup).toBeVisible();
  await expect(setup).toContainText('Prepara tu misión');
  const table = setup.getByRole('button', { name: 'Tabla 3' });
  await table.focus();
  await table.press('Enter');
  await expect(table).toHaveAttribute('aria-pressed', 'true');
  await expect(page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).resolves.toBe(true);
});

test('disabling the React core flag rolls back to legacy garage and achievements ownership', async ({ page }) => {
  await page.goto('/');
  await page.locator('#reactLaunchSplash').click();
  await expect(page.locator('.ttReactCoreNav')).toHaveCount(0);
  await expect(page.locator('.ttReactGaragePanel')).toHaveCount(0);
  await expect(page.locator('.ttReactAchievementsPanel')).toHaveCount(0);
  await expect(page.locator('#dashboard')).toBeVisible();
  const tour = page.locator('#ttTourShade.ttTourVisible');
  await tour.waitFor({ state: 'visible', timeout: 5000 }).then(() =>
    tour.locator('#ttTourSkip').click({ force: true }),
  ).catch(() => {});

  await page.locator('#menuBtn').click();
  await page.locator('.drawerItem[data-section="garage"]').click();
  await expect(page.locator('#garage')).toBeVisible();
  await expect(page.locator('#garageItems .garageItem')).not.toHaveCount(0);
  await page.locator('#menuBtn').click();
  await page.locator('.drawerItem[data-section="awards"]').click();
  await expect(page.locator('#awards')).toBeVisible();
  await expect(page.locator('#awardGrid .awardcard')).not.toHaveCount(0);
});
