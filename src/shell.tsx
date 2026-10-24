import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import en from './locales/en.json';
import es from './locales/es.json';

type Locale = typeof en;

function currentLocale(): Locale {
  return document.documentElement.lang === 'es' ? es : en;
}

/**
 * React owns the visible splash while the legacy runtime remains behind an
 * explicit entry adapter. This keeps the first migration reversible without
 * moving the gameplay DOM or changing persistence contracts.
 */
export function ReactShell() {
  const legacySplash = document.getElementById('launchSplash');
  const [visible] = useState(() => Boolean(legacySplash && !legacySplash.classList.contains('hidden')));
  const [entered, setEntered] = useState(false);
  const [pilotSelectorOpen, setPilotSelectorOpen] = useState(false);
  const [pilotName, setPilotName] = useState('');
  const [pilotError, setPilotError] = useState('');
  const [pilots, setPilots] = useState(() => window.TTPilotAdapter?.readPilots() || []);
  const [settingsNavHost, setSettingsNavHost] = useState<HTMLElement | null>(null);
  const [settingsPanel, setSettingsPanel] = useState('audio');
  const entering = useRef(false);

  useEffect(() => {
    if (!visible || !legacySplash) return;
    legacySplash.classList.add('hidden');
  }, [legacySplash, visible]);

  useEffect(() => {
    const open = () => {
      window.TTProfiles?.sync();
      setPilots(window.TTPilotAdapter?.readPilots() || []);
      setPilotError('');
      setPilotSelectorOpen(true);
    };
    window.TTOpenPilotSelector = open;
    const interceptLegacyPilotEntry = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.drawerProfileSwitch')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      document.getElementById('sideDrawer')?.classList.remove('open');
      document.getElementById('drawerOverlay')?.classList.add('hidden');
      open();
    };
    document.addEventListener('click', interceptLegacyPilotEntry, true);
    return () => {
      if (window.TTOpenPilotSelector === open) delete window.TTOpenPilotSelector;
      document.removeEventListener('click', interceptLegacyPilotEntry, true);
    };
  }, []);

  useEffect(() => {
    const findHost = () => {
      const host = document.querySelector<HTMLElement>('#settings .ttSettingsBottomNav');
      if (host) {
        if (!host.dataset.reactOwned) {
          host.replaceChildren();
          host.dataset.reactOwned = 'true';
        }
        setSettingsNavHost(host);
        const active = document.querySelector<HTMLElement>('#settings [data-settings-panel].ttSettingsActive');
        if (active?.dataset.settingsPanel) setSettingsPanel(active.dataset.settingsPanel);
      }
      return Boolean(host);
    };
    if (findHost()) return;
    const timer = window.setTimeout(findHost, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const copy = currentLocale();
  const enterGame = () => {
    if (entering.current) return;
    entering.current = true;
    if (window.TTEnterGame) window.TTEnterGame();
    else legacySplash?.click();
    document.getElementById('menuBtn')?.focus({ preventScroll: true });
    // Keep the React event target mounted and hide it after the gesture. The
    // legacy adapter also observes this same gesture, so unmounting here can
    // race with its DOM updates in WebKit and Firefox.
    window.setTimeout(() => setEntered(true), 0);
  };

  const settingsLabels: Record<string, [string, string, string]> = {
    audio: ['🎵', 'Sound', 'Sonido'],
    profile: ['👩‍🚀', 'Pilot', 'Piloto'],
    language: ['🌐', 'Language', 'Idioma'],
    theme: ['🎨', 'Theme', 'Tema'],
    backups: ['💾', 'Backups', 'Copias'],
    reset: ['🗑️', 'Reset', 'Borrar'],
  };
  const settingsPanelSelectors: Record<string, string> = {
    audio: '#ttAudioSettings',
    profile: 'article:has(#settingsPilotName)',
    language: '.settingsLanguages',
    theme: '#themeChoices',
    backups: '#backupList',
    reset: '.settingsDanger',
  };
  const settingsNavigation = settingsNavHost && createPortal(
    Object.entries(settingsLabels).map(([key, [emoji, english, spanish]]) => {
      const anchor = document.querySelector<HTMLElement>(`#settings ${settingsPanelSelectors[key]}`);
      const panel = anchor?.closest<HTMLElement>('[data-settings-panel]') || anchor;
      const targetId = panel?.id || `ttSettingsPanel-${key}`;
      return (
        <button className={`ttSettingsTab${settingsPanel === key ? ' active' : ''}`} type="button" key={key} onClick={() => {
          setSettingsPanel(key);
          window.TTSettingsAdapter?.showSettingsPanel(key);
        }} data-target={targetId}>
          <span aria-hidden="true">{emoji}</span>
          <small data-en={english} data-es={spanish}>{document.documentElement.lang === 'es' ? spanish : english}</small>
        </button>
      );
    }),
    settingsNavHost,
  );

  return (
    <>
    {settingsNavigation}
    <section
      id="reactLaunchSplash"
      className={`ttReactLaunchSplash${entered ? ' hidden' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={copy['ui.096']}
      onPointerDown={event => {
        if (event.button === 0) enterGame();
      }}
      onClick={enterGame}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          enterGame();
        }
      }}
    >
      <div className="ttReactSplashCard">
        <div className="ttReactSplashRocket" aria-hidden="true">🚀</div>
        <div className="splashTitle">TT <span>Rocket Stars</span></div>
        <div className="splashLead">{copy['ui.090']}</div>
        <div className="splashFacts">
          <span>{copy['ui.091']}</span>
          <span>{copy['ui.092']}</span>
          <span>{copy['ui.093']}</span>
        </div>
        <div className="splashStart">{copy['ui.094']}</div>
        <div className="splashHint">{copy['ui.095']}</div>
      </div>
    </section>
    {pilotSelectorOpen && (
      <section className="ttReactPilotSelector" role="dialog" aria-modal="true" aria-labelledby="ttReactPilotTitle">
        <div className="ttReactPilotCard">
          <button className="ttReactPilotClose" type="button" aria-label={copy['ui.097']} onClick={() => setPilotSelectorOpen(false)}>×</button>
          <div className="eyebrow">{copy['ui.098']}</div>
          <h1 id="ttReactPilotTitle">🚀 {copy['ui.099']}</h1>
          <p>{copy['ui.100']}</p>
          <div className="ttReactPilotGrid">
            {pilots.map(pilot => (
              <button className="ttReactPilotTile" type="button" key={pilot.id} onClick={() => {
                if (window.TTPilotAdapter?.choosePilot(pilot.id)) setPilotSelectorOpen(false);
              }}>
                <span aria-hidden="true">{pilot.avatar || '🚀'}</span>
                <strong>{pilot.name}</strong>
              </button>
            ))}
          </div>
          <form onSubmit={event => {
            event.preventDefault();
            const id = window.TTPilotAdapter?.createPilot(pilotName.trim());
            if (id) {
              setPilots(window.TTPilotAdapter?.readPilots() || []);
              setPilotName('');
              setPilotSelectorOpen(false);
            } else setPilotError(copy['ui.101']);
          }}>
            <label htmlFor="ttReactPilotName">{copy['ui.102']}</label>
            <div className="ttReactPilotCreate">
              <input id="ttReactPilotName" value={pilotName} onChange={event => setPilotName(event.target.value)} maxLength={24} />
              <button className="btn" type="submit">{copy['ui.103']}</button>
            </div>
            {pilotError && <p className="ttReactPilotError" role="alert">{pilotError}</p>}
          </form>
        </div>
      </section>
    )}
    </>
  );
}
