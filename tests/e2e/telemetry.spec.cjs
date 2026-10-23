const { test, expect } = require('@playwright/test');

test('keeps telemetry opt-in and offline-safe in the browser', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { createTelemetryService } = await import('/src/lib/telemetry.js');
    let requests = 0;
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      requests += 1;
      return originalFetch(...args);
    };
    const service = createTelemetryService();
    const disabled = service.record('app_open', { surface: 'game' });
    service.setConsent(true);
    const accepted = service.record('mission_completed', { table: 4, attempted: 5, correct: 5 });
    const rejected = service.record('app_open', { surface: 'game', pilotName: 'Pilot One' });
    const queued = service.getQueuedEvents();
    service.setConsent(false);
    window.fetch = originalFetch;
    return { disabled, accepted, rejected, queued, requests, cleared: service.getQueuedEvents() };
  });

  expect(result.disabled).toBe(false);
  expect(result.accepted).toBe(true);
  expect(result.rejected).toBe(false);
  expect(result.queued).toHaveLength(1);
  expect(result.queued[0].fields).toEqual({ table: 4, attempted: 5, correct: 5 });
  expect(result.requests).toBe(0);
  expect(result.cleared).toEqual([]);
});

test('exposes a consent-disabled runtime adapter without collecting startup data', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => ({
    available: Boolean(window.TTTelemetry),
    consent: window.TTTelemetry?.hasConsent(),
    queued: window.TTTelemetry?.getQueuedEvents(),
  }));
  expect(result).toEqual({ available: true, consent: false, queued: [] });
});
