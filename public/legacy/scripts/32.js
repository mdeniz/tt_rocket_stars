/* Optional invite-only Supabase magic-link authentication. Local gameplay never depends on this module. */
(function () {
  const config = window.__TT_SUPABASE_CONFIG__ || {};
  const sessionKey = 'tt-rocket-stars-auth-session';
  const form = document.getElementById('ttAuthForm');
  const emailInput = document.getElementById('ttAuthEmail');
  const status = document.getElementById('ttAuthStatus');
  const signOut = document.getElementById('ttAuthSignOut');
  if (!form || !emailInput || !status || !signOut) return;

  const language = () => {
    try { return window.TTLocalStore.getItem('cosmotablas-language') === 'es' ? 'es' : 'en'; } catch (_) { return 'en'; }
  };
  const messages = {
    en: {
      missing: 'Cloud access is unavailable. You can keep playing offline.',
      invalidEmail: 'Enter an invited email address.',
      sent: 'Check your email for a sign-in link. If this address is invited, the link will arrive shortly.',
      signedIn: 'You are signed in.',
      signedOut: 'You have been signed out. Your local pilots and progress are unchanged.',
      denied: 'This email cannot request access. Ask an administrator for an invitation.',
      expired: 'The link has expired or is invalid. Request a new one.',
      rateLimit: 'Too many requests. Please wait a moment and try again.',
      generic: 'Cloud access is unavailable. You can keep playing offline.',
      as: 'Signed in as',
    },
    es: {
      missing: 'El acceso en la nube no está disponible. Puedes seguir jugando sin conexión.',
      invalidEmail: 'Introduce una dirección de email invitada.',
      sent: 'Revisa tu email para encontrar el enlace de acceso. Si la dirección está invitada, llegará en breve.',
      signedIn: 'Has iniciado sesión.',
      signedOut: 'Has cerrado sesión. Tus pilotos y progresos locales no han cambiado.',
      denied: 'Este email no puede solicitar acceso. Pide una invitación a un administrador.',
      expired: 'El enlace ha caducado o no es válido. Solicita uno nuevo.',
      rateLimit: 'Demasiadas solicitudes. Espera un momento y vuelve a intentarlo.',
      generic: 'El acceso en la nube no está disponible. Puedes seguir jugando sin conexión.',
      as: 'Sesión iniciada como',
    },
  };
  const text = key => messages[language()][key];
  const api = path => `${String(config.url).replace(/\/$/, '')}/auth/v1${path}`;
  const headers = token => ({
    apikey: config.anonKey,
    Authorization: `Bearer ${token || config.anonKey}`,
    'Content-Type': 'application/json',
  });
  const setStatus = (key, kind) => {
    status.textContent = text(key);
    status.dataset.state = kind || '';
  };
  const readSession = () => {
    try { return JSON.parse(window.TTLocalStore.getItem(sessionKey) || 'null'); } catch (_) { return null; }
  };
  const saveSession = session => {
    try { window.TTLocalStore.setItem(sessionKey, JSON.stringify(session)); } catch (_) { /* memory fallback still permits the session */ }
  };
  const clearSession = () => { try { window.TTLocalStore.removeItem(sessionKey); } catch (_) {} };
  const parseError = async response => {
    try { return await response.json(); } catch (_) { return {}; }
  };
  const classifyError = error => {
    const message = `${error?.error_description || ''} ${error?.msg || ''} ${error?.message || ''}`.toLowerCase();
    if (message.includes('rate') || message.includes('too many')) return 'rateLimit';
    if (message.includes('expired') || message.includes('invalid')) return 'expired';
    if (message.includes('signups') || message.includes('not found') || message.includes('user')) return 'denied';
    return 'generic';
  };
  const updateSessionUi = session => {
    const user = session?.user;
    form.classList.toggle('hidden', Boolean(user));
    signOut.classList.toggle('hidden', !user);
    if (user) {
      status.textContent = `${text('as')} ${user.email || ''}. ${text('signedIn')}`;
      status.dataset.state = 'success';
    }
  };
  const consumeRedirectSession = () => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');
    if (!accessToken || !refreshToken) return null;
    const session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + Number(hash.get('expires_in') || 3600),
      user: null,
    };
    history.replaceState(null, document.title, `${location.pathname}${location.search}`);
    return session;
  };
  const restoreSession = async () => {
    if (!config.url || !config.anonKey) {
      form.classList.add('hidden');
      setStatus('missing', 'info');
      return;
    }
    let session = consumeRedirectSession() || readSession();
    if (!session?.access_token) return;
    try {
      const response = await fetch(api('/user'), { headers: headers(session.access_token) });
      if (!response.ok) throw new Error('invalid session');
      session.user = await response.json();
      saveSession(session);
      updateSessionUi(session);
    } catch (_) {
      clearSession();
      setStatus('expired', 'error');
    }
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const email = emailInput.value.trim();
    if (!email || !emailInput.validity.valid) { setStatus('invalidEmail', 'error'); return; }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    setStatus('sent', 'pending');
    try {
      const response = await fetch(api('/otp'), {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ email, create_user: false, redirect_to: `${location.origin}${location.pathname}` }),
      });
      if (!response.ok) throw await parseError(response);
      setStatus('sent', 'success');
      emailInput.value = '';
    } catch (error) {
      setStatus(classifyError(error), 'error');
    } finally { button.disabled = false; }
  });
  signOut.addEventListener('click', async () => {
    const session = readSession();
    clearSession();
    updateSessionUi(null);
    if (session?.access_token) {
      try { await fetch(api('/logout'), { method: 'POST', headers: headers(session.access_token) }); } catch (_) {}
    }
    setStatus('signedOut', 'success');
  });
  window.TTAuth = { getSession: readSession, signOut: () => signOut.click() };
  restoreSession();
}());
