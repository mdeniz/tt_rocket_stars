import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import en from './locales/en.json';
import es from './locales/es.json';
import type { CoreScreenId } from './lib/shell-adapters';

type Locale = typeof en;

function currentLocale(): Locale {
  return document.documentElement.lang === 'es' ? es : en;
}

const coreScreenOrder: readonly CoreScreenId[] = ['dashboard', 'home', 'insights', 'garage', 'awards'];
const coreScreenCopy: Record<CoreScreenId, [string, string, string]> = {
  dashboard: ['🛰️', 'Mission Control', 'Centro de mando'],
  home: ['🚀', 'New Mission', 'Nueva misión'],
  insights: ['📊', 'Progress', 'Progreso'],
  garage: ['🛠️', 'Rocket Garage', 'Garaje espacial'],
  awards: ['🏆', 'Achievements', 'Logros'],
};

const coreCompositionTargets = [
  { screen: 'dashboard' as const, selector: '#dashboard', action: 'insights' as const, actionKey: 'ui.core.openProgress' },
  { screen: 'insights' as const, selector: '#insights', action: 'dashboard' as const, actionKey: 'ui.core.openDashboard' },
] as const;

function coreScreensFeatureEnabled(): boolean {
  const buildEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  return buildEnv?.VITE_REACT_CORE_SCREENS === 'true'
    || window.__TTFeatureFlags?.reactCoreScreens === true;
}

function localizedCoreLabel(locale: Locale, screen: CoreScreenId): string {
  const key = `ui.core.${screen}`;
  return (locale as Record<string, string>)[key] || coreScreenCopy[screen][1];
}

const missionTables = Array.from({ length: 12 }, (_, index) => index + 1);
const missionOperations = [
  ['mul', '✖', 'ui.mission.multiply'],
  ['div', '➗', 'ui.mission.divide'],
  ['mix', '🔀', 'ui.mission.mixed'],
] as const;
const missionModes = [
  ['practice', '🌱', 'ui.mission.practice'],
  ['exam', '🏆', 'ui.mission.exam'],
  ['speed', '⏱', 'ui.mission.speed'],
  ['timed', '🚀', 'ui.mission.timed'],
] as const;
const missionDurations = [5, 10, 15] as const;

function ReactMissionSetup({ locale }: { locale: Locale }) {
  const copy = locale as Record<string, string>;
  const [tables, setTables] = useState<Set<number>>(() => new Set([1, 2, 5, 10]));
  const [operation, setOperation] = useState<'mul' | 'div' | 'mix'>('mul');
  const [mode, setMode] = useState<'practice' | 'exam' | 'speed' | 'timed'>('practice');
  const [duration, setDuration] = useState<5 | 10 | 15>(5);
  const isSpanish = document.documentElement.lang === 'es';
  const adapter = window.TTCoreScreensAdapter;

  return (
    <section className="card ttReactMissionSetup" aria-labelledby="ttReactMissionTitle">
      <h2 id="ttReactMissionTitle">{copy['ui.mission.setup']}</h2>
      <p>{copy['ui.mission.tables']}</p>
      <div className="ttMissionQuickActions" aria-label={copy['ui.mission.tablePresets']}>
        {(['all', 'easy'] as const).map(preset => (
          <button className="btn alt" type="button" key={preset} onClick={() => {
            if (!adapter?.pickMissionTables(preset)) return;
            setTables(preset === 'all' ? new Set(missionTables) : new Set([1, 2, 5, 10]));
          }}>{copy[`ui.mission.${preset}`]}</button>
        ))}
      </div>
      <div className="ttMissionTableGrid" role="group" aria-label={copy['ui.mission.tables']}>
        {missionTables.map(table => (
          <button
            type="button"
            className={`planet ${tables.has(table) ? 'on' : ''}`}
            aria-pressed={tables.has(table)}
            key={table}
            onClick={() => {
              if (!adapter?.toggleMissionTable(table)) return;
              setTables(previous => {
                const next = new Set(previous);
                if (next.has(table)) next.delete(table); else next.add(table);
                return next;
              });
            }}
          >{isSpanish ? 'Tabla' : 'Table'} {table}</button>
        ))}
      </div>
      <h3>{copy['ui.mission.operation']}</h3>
      <div className="opts" role="group" aria-label={copy['ui.mission.operation']}>
        {missionOperations.map(([value, emoji, key]) => (
          <button className={`opt ${operation === value ? 'on' : ''}`} type="button" key={value} onClick={() => {
            if (adapter?.selectMissionOperation(value)) setOperation(value);
          }}>{emoji} {copy[key]}</button>
        ))}
      </div>
      <h3>{copy['ui.mission.mode']}</h3>
      <div className="opts" role="group" aria-label={copy['ui.mission.mode']}>
        {missionModes.map(([value, emoji, key]) => (
          <button className={`opt ${mode === value ? 'on' : ''}`} type="button" key={value} onClick={() => {
            if (adapter?.selectMissionMode(value)) setMode(value);
          }}>{emoji} {copy[key]}</button>
        ))}
      </div>
      {mode === 'timed' && (
        <div className="ttMissionDurations" role="group" aria-label={copy['ui.mission.duration']}>
          {missionDurations.map(minutes => (
            <button className={`opt ${duration === minutes ? 'on' : ''}`} type="button" key={minutes} onClick={() => {
              if (adapter?.setMissionDuration(minutes)) setDuration(minutes);
            }}>{minutes} {copy['ui.mission.minutes']}</button>
          ))}
        </div>
      )}
      <button className="btn ttReactMissionStart" type="button" onClick={() => adapter?.startMission()}>
        {copy['ui.mission.start']}
      </button>
    </section>
  );
}

function ReactMissionSetupHost({ enabled, locale }: { enabled: boolean; locale: Locale }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const home = document.getElementById('home');
    if (!home) return;
    const element = document.createElement('div');
    element.dataset.reactMissionSetup = 'true';
    home.prepend(element);
    home.classList.add('ttReactMissionSetupEnabled');
    setHost(element);
    return () => {
      element.remove();
      home.classList.remove('ttReactMissionSetupEnabled');
      setHost(null);
    };
  }, [enabled]);
  return host ? createPortal(<ReactMissionSetup locale={locale} />, host) : null;
}

function CoreScreenComposition({
  screen,
  action,
  actionKey,
  locale,
}: {
  screen: CoreScreenId;
  action: CoreScreenId;
  actionKey: string;
  locale: Locale;
}) {
  const copy = locale as Record<string, string>;
  const label = localizedCoreLabel(locale, screen);
  const actionLabel = copy[actionKey] || localizedCoreLabel(locale, action);
  return (
    <div className="ttReactCoreComposition" data-react-core-host={screen}>
      <span className="ttReactCoreCompositionLabel">{label}</span>
      <button
        type="button"
        className="ttReactCoreCompositionAction"
        aria-label={actionLabel}
        onClick={event => {
          event.stopPropagation();
          window.TTCoreScreensAdapter?.show(action);
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function ReactCoreScreens() {
  const [enabled] = useState(coreScreensFeatureEnabled);
  const [active, setActive] = useState<CoreScreenId | null>(null);
  const [compositionHosts, setCompositionHosts] = useState<Array<{
    screen: CoreScreenId;
    action: CoreScreenId;
    actionKey: string;
    element: HTMLElement;
  }>>([]);

  useEffect(() => {
    if (!enabled) return;
    document.body.classList.add('ttReactCoreScreensEnabled');
    const sync = () => setActive(window.TTCoreScreensAdapter?.active() || null);
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    return () => {
      observer.disconnect();
      document.body.classList.remove('ttReactCoreScreensEnabled');
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const hosts = coreCompositionTargets.flatMap(target => {
      const parent = document.querySelector<HTMLElement>(target.selector);
      if (!parent) return [];
      const element = document.createElement('div');
      element.dataset.reactCoreComposition = target.screen;
      parent.append(element);
      return [{ ...target, element }];
    });
    setCompositionHosts(hosts);
    return () => {
      hosts.forEach(({ element }) => element.remove());
      setCompositionHosts([]);
    };
  }, [enabled]);

  if (!enabled) return null;
  const locale = currentLocale();
  const localizedCoreCopy = locale as Record<string, string>;
  const isSpanish = document.documentElement.lang === 'es';
  return (
    <>
    <ReactMissionSetupHost enabled={enabled} locale={currentLocale()} />
    {compositionHosts.map(({ screen, action, actionKey, element }) => createPortal(
      <CoreScreenComposition screen={screen} action={action} actionKey={actionKey} locale={locale} />,
      element,
      `react-core-composition-${screen}`,
    ))}
    <nav className="ttReactCoreNav" aria-label={isSpanish ? 'Pantallas principales' : 'Core screens'}>
      {coreScreenOrder.map(screen => {
        const [emoji, english, spanish] = coreScreenCopy[screen];
        return (
          <button
            type="button"
            key={screen}
            className={active === screen ? 'active' : ''}
            aria-current={active === screen ? 'page' : undefined}
            onClick={() => {
              if (window.TTCoreScreensAdapter?.show(screen)) setActive(screen);
            }}
          >
            <span aria-hidden="true">{emoji}</span>
            <small>{localizedCoreLabel(locale, screen) || (isSpanish ? spanish : english)}</small>
          </button>
        );
      })}
      <span className="sr-only" aria-live="polite">
        {active ? (isSpanish ? `Pantalla: ${localizedCoreCopy[`ui.core.${active}`] || coreScreenCopy[active][2]}` : `Screen: ${localizedCoreCopy[`ui.core.${active}`] || coreScreenCopy[active][1]}`) : ''}
      </span>
    </nav>
    </>
  );
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
    <ReactCoreScreens />
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
