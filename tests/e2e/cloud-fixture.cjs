const { expect } = require('@playwright/test');

const publicConfig = {
  url: 'http://supabase.test',
  anonKey: 'public-anon-key',
  siteUrl: 'http://127.0.0.1:4173/',
};

function jsonResponse(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function pilotFromSnapshot(snapshot) {
  return {
    id: `remote-${snapshot.localId}`,
    user_id: 'user-1',
    local_id: snapshot.localId,
    name: snapshot.name,
    avatar: snapshot.avatar,
    language: snapshot.language,
    payload: snapshot.payload,
    updated_at: snapshot.updatedAt,
  };
}

async function installCloudFixture(page, options = {}) {
  const state = {
    authRequests: [],
    cloudRequests: [],
    deleteCount: 0,
    failPilotUploads: Number(options.failPilotUploads || 0),
    conflictOnce: Boolean(options.conflictOnce),
    recoveryError: options.recoveryError || null,
    verifyError: options.verifyError || null,
    session: options.session === false ? null : null,
    pilots: new Map(),
    snapshots: new Map(),
  };

  const remotePilot = options.remotePilot || {
    localId: 'cloud-pilot',
    name: 'Cloud Pilot',
    avatar: '🪐',
    language: 'en',
    payload: { 'cosmotablas-v2': '{"score":99}' },
    updatedAt: '2026-10-23T00:00:00.000Z',
    version: 3,
  };
  const initialStorage = options.initialStorage || {
    'tt-rocket-profiles-v1': JSON.stringify([{
      id: 'local-pilot',
      name: 'Local Pilot',
      language: 'en',
      createdAt: 1,
      payload: {
        'cosmotablas-v2': '{}',
        'cosmotablas-history-v1': '[]',
        'tt-rocket-garage-v1': '{}',
      },
    }]),
    'tt-rocket-active-profile-v1': 'local-pilot',
    'cosmotablas-language': 'en',
    'cosmotablas-v2': '{}',
    'cosmotablas-history-v1': '[]',
    'tt-rocket-garage-v1': '{}',
  };
  if (options.language) {
    initialStorage['cosmotablas-language'] = options.language;
    const profiles = JSON.parse(initialStorage['tt-rocket-profiles-v1']);
    profiles.forEach(profile => { profile.language = options.language; });
    initialStorage['tt-rocket-profiles-v1'] = JSON.stringify(profiles);
  }
  state.pilots.set(remotePilot.localId, pilotFromSnapshot(remotePilot));
  state.snapshots.set(remotePilot.localId, {
    pilot_id: `remote-${remotePilot.localId}`,
    version: remotePilot.version,
    payload: remotePilot,
    updated_at: remotePilot.updatedAt,
  });

  await page.addInitScript(({ config, initialStorage }) => {
    window.__TT_FEATURES__ = { cloudAccess: true, legacyCloudDirectFallback: true };
    window.__TT_SUPABASE_CONFIG__ = config;
    for (const [key, value] of Object.entries(initialStorage || {})) window.localStorage.setItem(key, value);
  }, {
    config: publicConfig,
    initialStorage,
  });

  await page.route('http://supabase.test/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const body = request.postDataJSON?.() || {};
    if (path.startsWith('/auth/v1/')) state.authRequests.push({ method, path });
    else state.cloudRequests.push({ method, path, url: request.url() });

    if (path === '/auth/v1/token') {
      if (body.password === 'wrong-password') return jsonResponse(route, { error_description: 'Invalid login credentials' }, 400);
      state.session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        user: { id: 'user-1', email: body.email || 'pilot@example.com' },
      };
      return jsonResponse(route, state.session);
    }
    if (path === '/auth/v1/verify') {
      if (state.verifyError) return jsonResponse(route, state.verifyError.body, state.verifyError.status || 400);
      state.session = {
        access_token: 'invite-access-token',
        refresh_token: 'invite-refresh-token',
        user: { id: 'user-1', email: 'pilot@example.com' },
      };
      return jsonResponse(route, state.session);
    }
    if (path === '/auth/v1/user' && method === 'GET') {
      return state.session ? jsonResponse(route, state.session.user) : jsonResponse(route, { message: 'No session' }, 401);
    }
    if (path === '/auth/v1/user' && method === 'PUT') return jsonResponse(route, state.session?.user || { id: 'user-1' });
    if (path === '/auth/v1/recover') {
      if (state.recoveryError) return jsonResponse(route, state.recoveryError.body, state.recoveryError.status || 400);
      return jsonResponse(route, {});
    }
    if (path === '/auth/v1/logout') {
      state.session = null;
      return jsonResponse(route, {});
    }

    if (path === '/rest/v1/rpc/upsert_my_progress_snapshot') {
      const pilotId = String(body.p_pilot_id || '').replace('remote-', '');
      const current = state.snapshots.get(pilotId);
      if (state.conflictOnce && current && Number(body.p_expected_version || 0) < Number(current.version || 0)) {
        state.conflictOnce = false;
        return jsonResponse(route, { code: '40001', message: 'snapshot version conflict' }, 409);
      }
      const nextVersion = Number(body.p_expected_version || 0) + 1;
      state.snapshots.set(pilotId, { pilot_id: `remote-${pilotId}`, version: nextVersion, payload: body.p_payload, updated_at: body.p_payload.updatedAt });
      return jsonResponse(route, { version: nextVersion, updated_at: body.p_payload.updatedAt });
    }
    if (path === '/rest/v1/rpc/delete_my_cloud_data') {
      state.deleteCount += 1;
      state.pilots.clear();
      state.snapshots.clear();
      return jsonResponse(route, {});
    }
    if (path === '/rest/v1/pilots' && method === 'POST') {
      if (state.failPilotUploads > 0) {
        state.failPilotUploads -= 1;
        return jsonResponse(route, { message: 'temporary outage' }, 503);
      }
      const pilot = body;
      state.pilots.set(pilot.local_id, { id: `remote-${pilot.local_id}`, ...pilot });
      return jsonResponse(route, [{ id: `remote-${pilot.local_id}` }]);
    }
    if (path === '/rest/v1/pilots' && method === 'GET') {
      let rows = [...state.pilots.values()];
      const userId = url.searchParams.get('user_id');
      const localId = url.searchParams.get('local_id');
      if (userId) rows = rows.filter(row => decodeURIComponent(userId.replace(/^eq\./, '')) === row.user_id);
      if (localId) rows = rows.filter(row => decodeURIComponent(localId.replace(/^eq\./, '')) === row.local_id);
      if (url.searchParams.has('limit')) rows = rows.slice(0, Number(url.searchParams.get('limit')));
      return jsonResponse(route, rows);
    }
    if (path === '/rest/v1/progress_snapshots' && method === 'GET') {
      const requestedPilot = url.searchParams.get('pilot_id')?.replace(/^eq\./, '');
      const rows = [...state.snapshots.values()];
      const matching = requestedPilot ? rows.filter(row => row.pilot_id === requestedPilot) : rows;
      return jsonResponse(route, (matching.length ? matching : rows).slice(0, 1));
    }
    return jsonResponse(route, { message: `Unhandled fake Supabase request: ${method} ${path}` }, 500);
  });

  return {
    state,
    async openCloudSettings() {
      await page.goto('/');
      await page.locator('#launchSplash').click();
      await expect(page.locator('#launchSplash')).toBeHidden();
      await page.locator('#ttTourShade').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      const skip = page.locator('#ttTourSkip');
      if (await skip.isVisible().catch(() => false)) await skip.click();
      await page.locator('#menuBtn').click();
      await page.locator('#sideDrawer [data-section="settings"]').click();
      const cloudTab = page.locator('#settings .ttSettingsBottomNav .ttSettingsTab[data-target="ttAuthPanel"]');
      await expect(cloudTab).toHaveCount(1);
      await cloudTab.click();
      await expect(cloudTab).toHaveClass(/active/);
      await expect(page.locator('#ttAuthPanel')).toHaveClass(/ttSettingsActive/);
      await expect(page.locator('#ttCloudSyncNow')).toBeVisible();
    },
  };
}

module.exports = { installCloudFixture, publicConfig };
