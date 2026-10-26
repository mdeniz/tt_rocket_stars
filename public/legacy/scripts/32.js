/* Optional invite-only Supabase password authentication and local-first cloud controls. */
(function () {
  const config = window.__TT_SUPABASE_CONFIG__ || {};
  const sessionKey = 'tt-rocket-stars-auth-session';
  const syncKey = 'tt-rocket-stars-last-sync';
  let setupMode = false;
  const form = document.getElementById('ttAuthForm');
  const emailInput = document.getElementById('ttAuthEmail');
  const passwordInput = document.createElement('input');
  passwordInput.id = 'ttAuthPassword'; passwordInput.type = 'password'; passwordInput.autocomplete = 'current-password'; passwordInput.required = true; passwordInput.minLength = 8;
  const passwordLabel = document.createElement('label'); passwordLabel.htmlFor = passwordInput.id;
  const recovery = document.createElement('button'); recovery.type = 'button'; recovery.className = 'btn alt'; recovery.id = 'ttAuthRecovery';
  const setupForm = document.createElement('form'); setupForm.className = 'ttAuthForm hidden'; setupForm.id = 'ttAuthSetupForm';
  const setupLabel = document.createElement('label'); setupLabel.htmlFor = 'ttAuthSetupPassword';
  const setupPassword = document.createElement('input'); setupPassword.id = 'ttAuthSetupPassword'; setupPassword.type = 'password'; setupPassword.autocomplete = 'new-password'; setupPassword.required = true; setupPassword.minLength = 8;
  const changeForm = document.createElement('form'); changeForm.className = 'ttAuthForm hidden'; changeForm.id = 'ttAuthChangePasswordForm';
  const changeLabel = document.createElement('label'); changeLabel.htmlFor = 'ttAuthChangePassword';
  const changePassword = document.createElement('input'); changePassword.id = 'ttAuthChangePassword'; changePassword.type = 'password'; changePassword.autocomplete = 'new-password'; changePassword.required = true; changePassword.minLength = 8;
  const status = document.getElementById('ttAuthStatus');
  const signOut = document.getElementById('ttAuthSignOut');
  const panel = document.getElementById('ttAuthPanel');
  if (!form || !emailInput || !status || !signOut || !panel) return;
  if (window.__TT_FEATURES__?.cloudAccess !== true) { panel.hidden = true; return; }
  passwordLabel.textContent = 'Password';
  recovery.textContent = 'Forgot password?';
  passwordInput.placeholder = '••••••••';
  const authActions = form.querySelector('.ttAuthControls');
  if (authActions) { form.insertBefore(passwordLabel, authActions); form.insertBefore(passwordInput, authActions); const submit = document.createElement('button'); submit.className = 'btn'; submit.type = 'submit'; submit.textContent = 'Sign in'; authActions.replaceChildren(emailInput, submit, recovery); }
  setupLabel.textContent = 'Create password'; setupPassword.placeholder = '••••••••';
  setupForm.append(setupLabel, setupPassword);
  const setupActions = document.createElement('div'); setupActions.className = 'ttAuthControls';
  const setupButton = document.createElement('button'); setupButton.className = 'btn'; setupButton.type = 'submit'; setupButton.textContent = 'Set password';
  setupActions.appendChild(setupButton); setupForm.appendChild(setupActions); form.after(setupForm);
  changeLabel.textContent = 'New password'; changePassword.placeholder = '••••••••';
  const changeActions = document.createElement('div'); changeActions.className = 'ttAuthControls';
  const changeButton = document.createElement('button'); changeButton.className = 'btn alt'; changeButton.type = 'submit'; changeButton.textContent = 'Change password';
  changeActions.appendChild(changeButton); changeForm.append(changeLabel, changePassword, changeActions); setupForm.after(changeForm);

  const language = () => {
    try { return window.TTLocalStore.getItem('cosmotablas-language') === 'es' ? 'es' : 'en'; } catch (_) { return 'en'; }
  };
  const messages = {
    en: {
      missing: 'Cloud access is unavailable. You can keep playing offline.', invalidEmail: 'Enter the invited email and password.',
      sent: 'Check your email for a password recovery link.', signedIn: 'You are signed in.', passwordSet: 'Your password has been set. You are signed in.', passwordChanged: 'Your password has been changed.', passwordTooShort: 'Use a password with at least 8 characters.',
      signedOut: 'You have been signed out. Your local pilots and progress are unchanged.', denied: 'This email cannot request access. Ask an administrator for an invitation.',
      expired: 'The invitation or recovery link has expired or is invalid.', rateLimit: 'Too many requests. Please wait a moment and try again.',
      generic: 'Cloud access is unavailable. You can keep playing offline.', as: 'Signed in', privacy: 'Cloud access is optional. Your local progress stays on this device, and cloud data belongs to your invited account.', syncIdle: 'Cloud sync is ready.',
      syncPending: 'Synchronizing your active pilot…', syncSuccess: 'Cloud sync completed.', syncError: 'Sync failed. Your local progress is safe; try again.',
      deleteConfirm: 'Delete all cloud progress for this account? Local pilots and progress will remain on this device.',
      deleted: 'Cloud data deleted. Local progress remains available.', deleteError: 'Cloud deletion failed. Your local progress is unchanged.'
    },
    es: {
      missing: 'El acceso en la nube no está disponible. Puedes seguir jugando sin conexión.', invalidEmail: 'Introduce el email invitado y la contraseña.',
      sent: 'Revisa tu email para encontrar el enlace de recuperación.', signedIn: 'Has iniciado sesión.', passwordSet: 'Tu contraseña se ha establecido. Has iniciado sesión.', passwordChanged: 'Tu contraseña ha cambiado.', passwordTooShort: 'Usa una contraseña de al menos 8 caracteres.',
      signedOut: 'Has cerrado sesión. Tus pilotos y progresos locales no han cambiado.', denied: 'Este email no puede solicitar acceso. Pide una invitación a un administrador.',
      expired: 'El enlace de invitación o recuperación ha caducado o no es válido.', rateLimit: 'Demasiadas solicitudes. Espera un momento y vuelve a intentarlo.',
      generic: 'El acceso en la nube no está disponible. Puedes seguir jugando sin conexión.', as: 'Sesión iniciada', privacy: 'El acceso a la nube es opcional. Tu progreso local permanece en este dispositivo y los datos de la nube pertenecen a tu cuenta invitada.', syncIdle: 'La sincronización está lista.',
      syncPending: 'Sincronizando tu piloto activo…', syncSuccess: 'Sincronización completada.', syncError: 'La sincronización ha fallado. Tu progreso local está a salvo; inténtalo de nuevo.',
      deleteConfirm: '¿Borrar todo el progreso en la nube de esta cuenta? Los pilotos y progresos locales permanecerán en este dispositivo.',
      deleted: 'Datos de la nube borrados. El progreso local sigue disponible.', deleteError: 'No se han podido borrar los datos de la nube. Tu progreso local no ha cambiado.'
    }
  };
  const text = key => {
    const translationKey = { invalidCredentials: 'ui.089' }[key];
    if (translationKey) {
      const selector = '[data-' + 'i18n="' + translationKey + '"]';
      const element = document.querySelector(selector);
      const localized = element?.dataset?.[language()];
      if (localized) return localized;
    }
    return messages[language()][key];
  };
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
    if (message.includes('invalid login') || message.includes('invalid password') || message.includes('invalid credentials')) return 'invalidCredentials';
    if (message.includes('expired') || message.includes('invalid')) return 'expired';
    if (message.includes('signups') || message.includes('not found') || message.includes('user')) return 'denied';
    return 'generic';
  };
  const localPilot = () => window.TTProfiles?.active?.();
  const cloudClient = {
    auth: { getSession: async () => ({ data: { session: readSession() } }) },
    from(table) {
      const state = { method: 'GET', query: new URLSearchParams(), body: null, prefer: '' };
      const execute = async () => {
        const response = await fetch(`${rest(`/${table}`)}${state.query.toString() ? `?${state.query}` : ''}`, {
          method: state.method,
          headers: { ...headers(readSession()?.access_token), ...(state.prefer ? { Prefer: state.prefer } : {}) },
          body: state.body === null ? undefined : JSON.stringify(state.body),
        });
        const data = await response.json().catch(() => null);
        return response.ok ? { data: Array.isArray(data) ? data[0] : data, error: null } : { data: null, error: data || Error('Cloud request failed') };
      };
      const builder = {
        upsert(body, options = {}) { state.method = 'POST'; state.body = body; state.prefer = `resolution=merge-duplicates,return=${options.returning || 'representation'}`; if (options.onConflict) state.query.set('on_conflict', options.onConflict); return builder; },
        select(fields) { state.query.set('select', fields); return builder; },
        eq(field, value) { state.query.set(field, `eq.${encodeURIComponent(value)}`); return builder; },
        limit(value) { state.query.set('limit', String(value)); return builder; },
        single() { return execute(); },
        maybeSingle() { return execute(); },
        many() { return executeMany(); },
        then(resolve, reject) { return execute().then(resolve, reject); },
      };
      const executeMany = async () => {
        const response = await fetch(`${rest(`/${table}`)}${state.query.toString() ? `?${state.query}` : ''}`, {
          method: state.method,
          headers: { ...headers(readSession()?.access_token), ...(state.prefer ? { Prefer: state.prefer } : {}) },
          body: state.body === null ? undefined : JSON.stringify(state.body),
        });
        const data = await response.json().catch(() => null);
        return response.ok ? { data: Array.isArray(data) ? data : (data ? [data] : []), error: null } : { data: null, error: data || Error('Cloud request failed') };
      };
      return builder;
    },
    async rpc(name, args) {
      const response = await fetch(`${rest(`/rpc/${name}`)}`, { method: 'POST', headers: headers(readSession()?.access_token), body: JSON.stringify(args) });
      const data = await response.json().catch(() => null);
      return response.ok ? { data, error: null } : { data: null, error: data || Error('Cloud request failed') };
    },
  };
  const cloudAdapter = window.TTCloudSync?.createCloudSync?.({
    client: cloudClient,
    store: window.TTLocalStore,
    getLocalPilot: localPilot,
    applyRemotePilot: snapshot => {
      const payload = snapshot?.payload || snapshot;
      if (!payload || !window.TTProfiles?.active?.()) return;
      const active = window.TTProfiles.active();
      active.payload = payload;
      window.TTProfiles.sync?.();
    },
    createRecoveryBackup: reason => typeof window.saveBackup !== 'function' || window.saveBackup(reason),
    onConflict: conflict => {
      const remoteDate = conflict.remote?.updatedAt ? new Date(conflict.remote.updatedAt).toLocaleString() : 'unknown time';
      const restoreRemote = window.confirm(language() === 'es'
        ? `Hay cambios distintos en otro dispositivo (${remoteDate}). Pulsa Aceptar para recuperar la nube con una copia local de seguridad; pulsa Cancelar para conservar este dispositivo y subirlo como nueva versión.`
        : `Another device has different changes (${remoteDate}). Choose OK to restore the cloud copy after a local backup, or Cancel to keep this device and upload it as the new version.`);
      return restoreRemote ? 'remote' : 'local';
    },
    onStatus: event => {
      if (event.status === 'pending' || event.status === 'syncing') setCloudStatus('syncPending', 'pending');
      if (event.status === 'synced') setCloudStatus('syncSuccess', 'success');
      if (event.status === 'failed') setCloudStatus('syncError', 'error');
    },
  });
  window.TTCloudSyncAdapter = cloudAdapter;
  const controls = document.createElement('div');
  controls.className = 'ttCloudControls';
  controls.innerHTML = '<p class="ttPrivacyNote" data-i18n="ui.087">Cloud access is optional. Your local progress stays on this device, and cloud data belongs to your invited account.</p><p id="ttCloudStatus" class="ttCloudStatus" role="status" aria-live="polite" data-i18n="ui.084">Cloud sync is ready.</p><div class="ttCloudActions"><button id="ttCloudSyncNow" class="btn alt" type="button" data-i18n="ui.085">Sync now</button><button id="ttCloudRestore" class="btn alt" type="button">Restore from cloud</button><button id="ttCloudList" class="btn alt" type="button">Find cloud pilots</button><button id="ttCloudDelete" class="btn alt dangerBtn" type="button" data-i18n="ui.086">Delete cloud data</button></div><div id="ttCloudPilots" class="ttCloudPilots" aria-live="polite"></div>';
  panel.appendChild(controls);
  const cloudStatus = document.getElementById('ttCloudStatus');
  const syncNow = document.getElementById('ttCloudSyncNow');
  const restoreCloud = document.getElementById('ttCloudRestore');
  const listCloud = document.getElementById('ttCloudList');
  const deleteCloud = document.getElementById('ttCloudDelete');
  const cloudPilots = document.getElementById('ttCloudPilots');
  const privacyNote = controls.querySelector('.ttPrivacyNote');
  const updateCloudLabels = () => {
    privacyNote.textContent = text('privacy');
    passwordLabel.textContent = language() === 'es' ? 'Contraseña' : 'Password';
    recovery.textContent = language() === 'es' ? '¿Has olvidado la contraseña?' : 'Forgot password?';
    setupLabel.textContent = language() === 'es' ? 'Crear contraseña' : 'Create password';
    setupActions.querySelector('button').textContent = language() === 'es' ? 'Establecer contraseña' : 'Set password';
    changeLabel.textContent = language() === 'es' ? 'Nueva contraseña' : 'New password';
    changeButton.textContent = language() === 'es' ? 'Cambiar contraseña' : 'Change password';
    syncNow.textContent = language() === 'es' ? 'Sincronizar ahora' : 'Sync now';
    restoreCloud.textContent = language() === 'es' ? 'Recuperar de la nube' : 'Restore from cloud';
    listCloud.textContent = language() === 'es' ? 'Buscar pilotos en la nube' : 'Find cloud pilots';
    deleteCloud.textContent = language() === 'es' ? 'Borrar datos de la nube' : 'Delete cloud data';
    if (cloudStatus.dataset.message) cloudStatus.textContent = text(cloudStatus.dataset.message);
  };
  const setCloudStatus = (key, kind) => { cloudStatus.textContent = text(key);cloudStatus.dataset.message = key;cloudStatus.dataset.state = kind || ''; };
  const updateCloudControls = session => {
    const authenticated = Boolean(session?.access_token && session?.user);
    controls.classList.toggle('isAuthenticated', authenticated);
    syncNow.disabled = !authenticated; restoreCloud.disabled = !authenticated; deleteCloud.disabled = !authenticated;
    listCloud.disabled = !authenticated;
    if (!authenticated) setCloudStatus(config.url && config.anonKey ? 'missing' : 'missing', 'info');
  };
  const renderCloudPilots = pilots => {
    cloudPilots.replaceChildren();
    if (!pilots.length) return;
    const title = document.createElement('p'); title.className = 'ttPrivacyNote'; title.textContent = language() === 'es' ? 'Pilotos disponibles en la nube:' : 'Cloud pilots available:'; cloudPilots.appendChild(title);
    pilots.forEach(pilot => {
      const row = document.createElement('div'); row.className = 'ttCloudPilot';
      const label = document.createElement('span'); const local = window.TTProfiles?.read?.().some(profile => profile.id === pilot.localId); label.textContent = `${pilot.avatar || '🚀'} ${pilot.name}${local ? (language() === 'es' ? ' (local)' : ' (local)') : ''}`;
      const button = document.createElement('button'); button.type = 'button'; button.className = 'btn alt'; button.textContent = language() === 'es' ? 'Recuperar' : 'Restore'; button.addEventListener('click', () => restoreRemotePilot(pilot)); row.append(label, button); cloudPilots.appendChild(row);
    });
  };
  async function listCloudPilots() {
    if (!cloudAdapter) { setCloudStatus('missing', 'info'); return; }
    listCloud.disabled = true; setCloudStatus('syncPending', 'pending');
    const result = await cloudAdapter.listPilots();
    listCloud.disabled = false;
    if (result.status === 'listed') { renderCloudPilots(result.pilots); setCloudStatus('syncIdle', 'info'); }
    else if (result.status === 'failed') setCloudStatus('syncError', 'error');
  }
  async function restoreRemotePilot(pilot) {
    if (!cloudAdapter) return;
    const local = window.TTProfiles?.read?.().find(profile => profile.id === pilot.localId);
    restoreCloud.disabled = true; setCloudStatus('syncPending', 'pending');
    const result = await cloudAdapter.restorePilot(pilot.localId);
    if (result.status === 'downloaded') {
      if (local) {
        window.TTProfiles.choose(pilot.localId);
        const current = await cloudAdapter.download();
        if (current.status === 'downloaded') location.reload();
      } else if (window.TTProfiles?.restoreCloud?.(result.snapshot)) location.reload();
    } else if (result.status === 'failed') setCloudStatus('syncError', 'error');
    restoreCloud.disabled = false;
  }
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
    setupMode = type === 'invite' || type === 'recovery';
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
    const user = session?.user;form.classList.toggle('hidden', Boolean(user) || setupMode);setupForm.classList.toggle('hidden', !user || !setupMode);changeForm.classList.toggle('hidden', !user || setupMode);signOut.classList.toggle('hidden', !user);
    if (user) { status.textContent = `${text('as')}. ${text('signedIn')}`;status.dataset.state = 'success';setCloudStatus('syncIdle', 'info'); }
    updateCloudControls(session);
  };
  async function syncCloud() {
    const session = readSession(); const pilot = localPilot();
    if (!session?.access_token || !session.user) { setCloudStatus('missing', 'info'); return; }
    if (!pilot) { await listCloudPilots(); return; }
    if (!cloudAdapter) { setCloudStatus('missing', 'info'); return; }
    syncNow.disabled = true;
    try {
      const result = await cloudAdapter.upload();
      if (result.status === 'uploaded') try { window.TTLocalStore.setItem(syncKey, new Date().toISOString()); } catch (_) {}
    } finally { syncNow.disabled = false; }
  }
  let syncTimer = null;
  const scheduleSync = () => {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => { syncTimer = null; cloudAdapter?.queueUpload?.(0); }, 1200);
  };
  async function deleteCloudData() {
    const session = readSession();if (!session?.access_token || !session.user)return;
    if (!window.confirm(text('deleteConfirm')))return;
    deleteCloud.disabled = true;
    try {
      if (cloudAdapter) {
        const result = await cloudAdapter.deleteCloudData();
        if (result.status !== 'deleted') throw result.error || new Error('delete failed');
      } else if (window.__TT_FEATURES__?.legacyCloudDirectFallback === true) {
        const response = await fetch(`${rest('/rpc/delete_my_cloud_data')}`, { method: 'POST', headers: headers(session.access_token), body: '{}' });
        if (!response.ok) throw new Error('delete failed');
      } else throw new Error('cloud boundary unavailable');
      setCloudStatus('deleted', 'success');
    }
    catch (_) { setCloudStatus('deleteError', 'error'); }
    finally { deleteCloud.disabled = false; }
  }
  async function restoreCloudData() {
    const session = readSession(); const pilot = localPilot();
    if (!session?.access_token || !session.user || !pilot) { setCloudStatus('missing', 'info'); return; }
    restoreCloud.disabled = true; setCloudStatus('syncPending', 'pending');
    if (cloudAdapter) {
      const result = await cloudAdapter.download();
      restoreCloud.disabled = false;
      if (result.status === 'downloaded') location.reload();
      return;
    }
    if (window.__TT_FEATURES__?.legacyCloudDirectFallback !== true) { setCloudStatus('syncError', 'error'); restoreCloud.disabled = false; return; }
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
    event.preventDefault();
    const email = emailInput.value.trim(); const password = passwordInput.value;
    if (!email || !emailInput.validity.valid || !password || password.length < 8) { setStatus('invalidEmail', 'error'); return; }
    const button = form.querySelector('button[type="submit"]'); button.disabled = true; setStatus('signedIn', 'pending');
    try {
      const response = await fetch(`${api('/token')}?grant_type=password`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, password }) });
      if (!response.ok) throw await parseError(response);
      const session = await response.json(); session.user = session.user || await (await fetch(api('/user'), { headers: headers(session.access_token) })).json(); saveSession(session); updateSessionUi(session); setStatus('signedIn', 'success'); passwordInput.value = ''; scheduleSync();
    } catch (error) { setStatus(classifyError(error), 'error'); } finally { button.disabled = false; }
  });
  setupForm.addEventListener('submit', async event => {
    event.preventDefault(); const session = readSession(); const password = setupPassword.value;
    if (!session?.access_token || password.length < 8) { setStatus('invalidEmail', 'error'); return; }
    const button = setupForm.querySelector('button[type="submit"]'); button.disabled = true;
    try {
      const response = await fetch(api('/user'), { method: 'PUT', headers: headers(session.access_token), body: JSON.stringify({ password }) });
      if (!response.ok) throw await parseError(response); setupMode = false; setupPassword.value = ''; updateSessionUi(session); setStatus('passwordSet', 'success');
    } catch (error) { setStatus(classifyError(error), 'error'); } finally { button.disabled = false; }
  });
  changeForm.addEventListener('submit', async event => {
    event.preventDefault(); const session = readSession(); const password = changePassword.value;
    if (!session?.access_token || password.length < 8) { setStatus('passwordTooShort', 'error'); return; }
    changeButton.disabled = true;
    try {
      const response = await fetch(api('/user'), { method: 'PUT', headers: headers(session.access_token), body: JSON.stringify({ password }) });
      if (!response.ok) throw await parseError(response); changePassword.value = ''; setStatus('passwordChanged', 'success');
    } catch (error) { setStatus(classifyError(error), 'error'); } finally { changeButton.disabled = false; }
  });
  recovery.addEventListener('click', async () => {
    const email = emailInput.value.trim(); if (!email || !emailInput.validity.valid) { setStatus('invalidEmail', 'error'); return; }
    recovery.disabled = true; setStatus('sent', 'pending');
    try { const redirectTo = String(config.siteUrl || `${location.origin}${location.pathname}`).trim(); const response = await fetch(api('/recover'), { method: 'POST', headers: headers(), body: JSON.stringify({ email, redirect_to: redirectTo }) }); if (!response.ok) throw await parseError(response); setStatus('sent', 'success'); }
    catch (error) { setStatus(classifyError(error), 'error'); } finally { recovery.disabled = false; }
  });
  signOut.addEventListener('click', async () => { const session = readSession();clearSession();updateSessionUi(null);if (session?.access_token) { try { await fetch(api('/logout'), { method: 'POST', headers: headers(session.access_token) }); } catch (_) {} }setStatus('signedOut', 'success'); });
  syncNow.addEventListener('click', syncCloud);restoreCloud.addEventListener('click', restoreCloudData);listCloud.addEventListener('click', listCloudPilots);deleteCloud.addEventListener('click', deleteCloudData);
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
    try { const response = await fetch(api('/user'), { headers: headers(session.access_token) });if (!response.ok) throw new Error('invalid session');session.user = await response.json();saveSession(session);updateSessionUi(session); listCloudPilots(); }
    catch (_) { clearSession();setStatus('expired', 'error');updateCloudControls(null); }
  }
  window.addEventListener('tt-local-save', scheduleSync);
  const profileSync = window.TTProfiles?.sync;
  if (typeof profileSync === 'function') {
    window.TTProfiles.sync = function (...args) {
      const result = profileSync.apply(this, args);
      window.dispatchEvent(new Event('tt-local-save'));
      return result;
    };
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') scheduleSync(); });
  window.setInterval(() => { if (document.visibilityState === 'visible' && readSession()?.access_token) syncCloud(); }, 30000);
  window.TTAuth = { getSession: readSession, signOut: () => signOut.click(), syncNow: syncCloud, scheduleSync };
  new MutationObserver(updateCloudLabels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  updateCloudLabels();updateCloudControls(readSession());restoreSession();
}());
