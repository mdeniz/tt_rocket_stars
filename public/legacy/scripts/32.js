/* Optional invite-only Supabase magic-link authentication and local-first cloud controls. */
(function () {
  const config = window.__TT_SUPABASE_CONFIG__ || {};
  const sessionKey = 'tt-rocket-stars-auth-session';
  const syncKey = 'tt-rocket-stars-last-sync';
  const form = document.getElementById('ttAuthForm');
  const emailInput = document.getElementById('ttAuthEmail');
  const status = document.getElementById('ttAuthStatus');
  const signOut = document.getElementById('ttAuthSignOut');
  const panel = document.getElementById('ttAuthPanel');
  if (!form || !emailInput || !status || !signOut || !panel) return;

  const language = () => {
    try { return window.TTLocalStore.getItem('cosmotablas-language') === 'es' ? 'es' : 'en'; } catch (_) { return 'en'; }
  };
  const messages = {
    en: {
      missing: 'Cloud access is unavailable. You can keep playing offline.', invalidEmail: 'Enter an invited email address.',
      sent: 'Check your email for a sign-in link. If this address is invited, the link will arrive shortly.', signedIn: 'You are signed in.',
      signedOut: 'You have been signed out. Your local pilots and progress are unchanged.', denied: 'This email cannot request access. Ask an administrator for an invitation.',
      expired: 'The link has expired or is invalid. Request a new one.', rateLimit: 'Too many requests. Please wait a moment and try again.',
      generic: 'Cloud access is unavailable. You can keep playing offline.', as: 'Signed in', privacy: 'Cloud access is optional. Your local progress stays on this device, and cloud data belongs to your invited account.', syncIdle: 'Cloud sync is ready.',
      syncPending: 'Synchronizing your active pilot…', syncSuccess: 'Cloud sync completed.', syncError: 'Sync failed. Your local progress is safe; try again.',
      deleteConfirm: 'Delete all cloud progress for this account? Local pilots and progress will remain on this device.',
      deleted: 'Cloud data deleted. Local progress remains available.', deleteError: 'Cloud deletion failed. Your local progress is unchanged.'
    },
    es: {
      missing: 'El acceso en la nube no está disponible. Puedes seguir jugando sin conexión.', invalidEmail: 'Introduce una dirección de email invitada.',
      sent: 'Revisa tu email para encontrar el enlace de acceso. Si la dirección está invitada, llegará en breve.', signedIn: 'Has iniciado sesión.',
      signedOut: 'Has cerrado sesión. Tus pilotos y progresos locales no han cambiado.', denied: 'Este email no puede solicitar acceso. Pide una invitación a un administrador.',
      expired: 'El enlace ha caducado o no es válido. Solicita uno nuevo.', rateLimit: 'Demasiadas solicitudes. Espera un momento y vuelve a intentarlo.',
      generic: 'El acceso en la nube no está disponible. Puedes seguir jugando sin conexión.', as: 'Sesión iniciada', privacy: 'El acceso a la nube es opcional. Tu progreso local permanece en este dispositivo y los datos de la nube pertenecen a tu cuenta invitada.', syncIdle: 'La sincronización está lista.',
      syncPending: 'Sincronizando tu piloto activo…', syncSuccess: 'Sincronización completada.', syncError: 'La sincronización ha fallado. Tu progreso local está a salvo; inténtalo de nuevo.',
      deleteConfirm: '¿Borrar todo el progreso en la nube de esta cuenta? Los pilotos y progresos locales permanecerán en este dispositivo.',
      deleted: 'Datos de la nube borrados. El progreso local sigue disponible.', deleteError: 'No se han podido borrar los datos de la nube. Tu progreso local no ha cambiado.'
    }
  };
  const text = key => messages[language()][key];
  const api = path => `${String(config.url).replace(/\/$/, '')}/auth/v1${path}`;
  const rest = path => `${String(config.url).replace(/\/$/, '')}/rest/v1${path}`;
  const headers = token => ({ apikey: config.anonKey, Authorization: `Bearer ${token || config.anonKey}`, 'Content-Type': 'application/json' });
  const readSession = () => { try { return JSON.parse(window.TTLocalStore.getItem(sessionKey) || 'null'); } catch (_) { return null; } };
  const saveSession = session => { try { window.TTLocalStore.setItem(sessionKey, JSON.stringify(session)); } catch (_) {} };
  const clearSession = () => { try { window.TTLocalStore.removeItem(sessionKey); } catch (_) {} };
  const setStatus = (key, kind) => { status.textContent = text(key); status.dataset.state = kind || ''; };
  const parseError = async response => { try { return await response.json(); } catch (_) { return {}; } };
  const classifyError = error => {
    const message = `${error?.error_description || ''} ${error?.msg || ''} ${error?.message || ''}`.toLowerCase();
    if (message.includes('rate') || message.includes('too many')) return 'rateLimit';
    if (message.includes('expired') || message.includes('invalid')) return 'expired';
    if (message.includes('signups') || message.includes('not found') || message.includes('user')) return 'denied';
    return 'generic';
  };
  const localPilot = () => window.TTProfiles?.active?.();
  const controls = document.createElement('div');
  controls.className = 'ttCloudControls';
  controls.innerHTML = '<p class="ttPrivacyNote" data-i18n="ui.087">Cloud access is optional. Your local progress stays on this device, and cloud data belongs to your invited account.</p><p id="ttCloudStatus" class="ttCloudStatus" role="status" aria-live="polite" data-i18n="ui.084">Cloud sync is ready.</p><div class="ttCloudActions"><button id="ttCloudSyncNow" class="btn alt" type="button" data-i18n="ui.085">Sync now</button><button id="ttCloudRestore" class="btn alt" type="button">Restore from cloud</button><button id="ttCloudDelete" class="btn alt dangerBtn" type="button" data-i18n="ui.086">Delete cloud data</button></div>';
  panel.appendChild(controls);
  const cloudStatus = document.getElementById('ttCloudStatus');
  const syncNow = document.getElementById('ttCloudSyncNow');
  const restoreCloud = document.getElementById('ttCloudRestore');
  const deleteCloud = document.getElementById('ttCloudDelete');
  const privacyNote = controls.querySelector('.ttPrivacyNote');
  const updateCloudLabels = () => {
    privacyNote.textContent = text('privacy');
    syncNow.textContent = language() === 'es' ? 'Sincronizar ahora' : 'Sync now';
    restoreCloud.textContent = language() === 'es' ? 'Recuperar de la nube' : 'Restore from cloud';
    deleteCloud.textContent = language() === 'es' ? 'Borrar datos de la nube' : 'Delete cloud data';
    if (cloudStatus.dataset.message) cloudStatus.textContent = text(cloudStatus.dataset.message);
  };
  const setCloudStatus = (key, kind) => { cloudStatus.textContent = text(key);cloudStatus.dataset.message = key;cloudStatus.dataset.state = kind || ''; };
  const updateCloudControls = session => {
    const authenticated = Boolean(session?.access_token && session?.user);
    controls.classList.toggle('isAuthenticated', authenticated);
    syncNow.disabled = !authenticated; restoreCloud.disabled = !authenticated; deleteCloud.disabled = !authenticated;
    if (!authenticated) setCloudStatus(config.url && config.anonKey ? 'missing' : 'missing', 'info');
  };
  const consumeRedirectSession = () => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));const accessToken = hash.get('access_token');const refreshToken = hash.get('refresh_token');
    if (!accessToken || !refreshToken) return null;
    const session = { access_token: accessToken, refresh_token: refreshToken, expires_at: Math.floor(Date.now() / 1000) + Number(hash.get('expires_in') || 3600), user: null };
    window.history.replaceState(null, document.title, `${location.pathname}${location.search}`);return session;
  };
  const consumeTokenHashSession = async () => {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    if (!tokenHash) return null;
    const type = params.get('type') || 'email';
    try {
      const redirectTo = String(config.siteUrl || `${location.origin}${location.pathname}`).trim();
      const verificationUrl = `${api('/verify')}?${new URLSearchParams({ redirect_to: redirectTo })}`;
      const response = await fetch(verificationUrl, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ token_hash: tokenHash, type })
      });
      if (!response.ok) throw await parseError(response);
      const session = await response.json();
      params.delete('token_hash');
      params.delete('type');
      const query = params.toString();
      window.history.replaceState(null, document.title, `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
      return session;
    } catch (error) {
      params.delete('token_hash');
      params.delete('type');
      const query = params.toString();
      window.history.replaceState(null, document.title, `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
      throw error;
    }
  };
  const updateSessionUi = session => {
    const user = session?.user;form.classList.toggle('hidden', Boolean(user));signOut.classList.toggle('hidden', !user);
    if (user) { status.textContent = `${text('as')}. ${text('signedIn')}`;status.dataset.state = 'success';setCloudStatus('syncIdle', 'info'); }
    updateCloudControls(session);
  };
  async function syncCloud() {
    const session = readSession();const pilot = localPilot();
    if (!session?.access_token || !session.user || !pilot) { setCloudStatus('missing', 'info');return; }
    syncNow.disabled = true;setCloudStatus('syncPending', 'pending');
    try {
      const pilotResponse = await fetch(`${rest('/pilots')}?on_conflict=user_id,local_id`, { method: 'POST', headers: {...headers(session.access_token), Prefer: 'resolution=merge-duplicates,return=representation'}, body: JSON.stringify({ user_id: session.user.id, local_id: pilot.id, name: pilot.name, avatar: pilot.avatar || null, language: pilot.language === 'en' ? 'en' : 'es', payload: pilot.payload || {} }) });
      if (!pilotResponse.ok) throw await parseError(pilotResponse);const rows = await pilotResponse.json();const cloudPilot = rows[0];
      const snapshotResponse = await fetch(`${rest('/progress_snapshots')}?on_conflict=pilot_id`, { method: 'POST', headers: {...headers(session.access_token), Prefer: 'resolution=merge-duplicates,return=minimal'}, body: JSON.stringify({ user_id: session.user.id, pilot_id: cloudPilot.id, version: 1, payload: pilot.payload || {} }) });
      if (!snapshotResponse.ok) throw await parseError(snapshotResponse);
      try { window.TTLocalStore.setItem(syncKey, new Date().toISOString()); } catch (_) {}setCloudStatus('syncSuccess', 'success');
    } catch (_) { setCloudStatus('syncError', 'error'); }
    syncNow.disabled = false;
  }
  async function deleteCloudData() {
    const session = readSession();if (!session?.access_token || !session.user)return;
    if (!window.confirm(text('deleteConfirm')))return;
    deleteCloud.disabled = true;
    try { const response = await fetch(`${rest('/rpc/delete_my_cloud_data')}`, { method: 'POST', headers: headers(session.access_token), body: '{}' });if (!response.ok) throw new Error('delete failed');setCloudStatus('deleted', 'success'); }
    catch (_) { setCloudStatus('deleteError', 'error'); }
    finally { deleteCloud.disabled = false; }
  }
  async function restoreCloudData() {
    const session = readSession(); const pilot = localPilot();
    if (!session?.access_token || !session.user || !pilot) { setCloudStatus('missing', 'info'); return; }
    restoreCloud.disabled = true; setCloudStatus('syncPending', 'pending');
    try {
      const pilotQuery = `${rest('/pilots')}?select=id,name,avatar,language,payload&user_id=eq.${encodeURIComponent(session.user.id)}&local_id=eq.${encodeURIComponent(pilot.id)}&limit=1`;
      const pilotResponse = await fetch(pilotQuery, { headers: headers(session.access_token) });
      if (!pilotResponse.ok) throw await parseError(pilotResponse);
      const cloudPilots = await pilotResponse.json(); const cloudPilot = cloudPilots[0];
      if (!cloudPilot) { setCloudStatus('missing', 'info'); return; }
      const snapshotResponse = await fetch(`${rest('/progress_snapshots')}?select=payload,version,updated_at&pilot_id=eq.${encodeURIComponent(cloudPilot.id)}&limit=1`, { headers: headers(session.access_token) });
      if (!snapshotResponse.ok) throw await parseError(snapshotResponse);
      const snapshots = await snapshotResponse.json(); const remotePayload = snapshots[0]?.payload || cloudPilot.payload || {};
      if (!window.confirm(language() === 'es' ? '¿Recuperar el progreso de la nube? Se guardará una copia local antes de sustituir el progreso actual.' : 'Restore cloud progress? A local backup will be saved before replacing the current progress.')) return;
      if (typeof window.saveBackup === 'function' && !window.saveBackup('Before cloud restore')) throw new Error('backup failed');
      ['cosmotablas-v2', 'cosmotablas-history-v1', 'tt-rocket-garage-v1'].forEach(key => {
        const value = remotePayload[key];
        if (typeof value === 'string') window.TTLocalStore.setItem(key, value); else window.TTLocalStore.removeItem(key);
      });
      window.TTProfiles?.sync?.(); location.reload();
    } catch (_) { setCloudStatus('syncError', 'error'); }
    finally { restoreCloud.disabled = false; }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();const email = emailInput.value.trim();if (!email || !emailInput.validity.valid) { setStatus('invalidEmail', 'error');return; }
    const button = form.querySelector('button[type="submit"]');button.disabled = true;setStatus('sent', 'pending');
    try { const redirectTo = String(config.siteUrl || `${location.origin}${location.pathname}`).trim(); const response = await fetch(api('/otp'), { method: 'POST', headers: headers(), body: JSON.stringify({ email, create_user: false, redirect_to: redirectTo }) });if (!response.ok) throw await parseError(response);setStatus('sent', 'success');emailInput.value = ''; }
    catch (error) { setStatus(classifyError(error), 'error'); } finally { button.disabled = false; }
  });
  signOut.addEventListener('click', async () => { const session = readSession();clearSession();updateSessionUi(null);if (session?.access_token) { try { await fetch(api('/logout'), { method: 'POST', headers: headers(session.access_token) }); } catch (_) {} }setStatus('signedOut', 'success'); });
  syncNow.addEventListener('click', syncCloud);restoreCloud.addEventListener('click', restoreCloudData);deleteCloud.addEventListener('click', deleteCloudData);
  async function restoreSession() {
    if (!config.url || !config.anonKey) { form.classList.add('hidden');setStatus('missing', 'info');updateCloudControls(null);return; }
    let session;
    try {
      session = await consumeTokenHashSession();
    } catch (error) {
      setStatus(classifyError(error), 'error');
      updateCloudControls(null);
      return;
    }
    session = session || consumeRedirectSession() || readSession();if (!session?.access_token)return;
    try { const response = await fetch(api('/user'), { headers: headers(session.access_token) });if (!response.ok) throw new Error('invalid session');session.user = await response.json();saveSession(session);updateSessionUi(session); }
    catch (_) { clearSession();setStatus('expired', 'error');updateCloudControls(null); }
  }
  window.TTAuth = { getSession: readSession, signOut: () => signOut.click(), syncNow: syncCloud };
  new MutationObserver(updateCloudLabels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  updateCloudLabels();updateCloudControls(readSession());restoreSession();
}());
