import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import en from './locales/en.json';
import es from './locales/es.json';
import type { CoreScreenId } from './lib/shell-adapters';
import { advanceTimer, startMission as createReactMission, submitAnswer, type ReactMissionState } from './lib/react-gameplay';
import { missionCompletionReward, persistMissionCompletion } from './lib/react-mission-progress';
import { evaluateAchievements, type ReactAchievementRecord } from './lib/react-achievements';
import { evaluateDashboard, type ReactDashboardModel } from './lib/react-dashboard';

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
  if (typeof window.__TTFeatureFlags?.reactCoreScreens === 'boolean') {
    return window.__TTFeatureFlags.reactCoreScreens;
  }
  return buildEnv?.VITE_REACT_CORE_SCREENS === 'true';
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

function persistReactAnswer(previous: ReactMissionState, answer: number): void {
  const question = previous.question;
  const mission = window.TTPersistenceBoundary?.mission;
  if (!question || !mission) return;
  const payload = mission.read();
  const key = `${question.a}-${question.b}-${question.op}`;
  const current = payload[key];
  const stats = current && typeof current === 'object' && !Array.isArray(current) ? current as Record<string, unknown> : {};
  mission.commit({
    ...payload,
    [key]: {
      ...stats,
      right: Number(stats.right || 0) + (question.result === answer ? 1 : 0),
      wrong: Number(stats.wrong || 0) + (question.result === answer ? 0 : 1),
    },
  });
}

function ReactMissionPlayer({ locale, state, onChange, onExit }: {
  locale: Locale;
  state: ReactMissionState;
  onChange: (state: ReactMissionState) => void;
  onExit: () => void;
}) {
  const copy = locale as Record<string, string>;
  const [answer, setAnswer] = useState('');
  const updateMission = (next: ReactMissionState) => {
    if (next.status === 'complete' && state.status !== 'complete') {
      const mission = window.TTPersistenceBoundary?.mission;
      if (mission) {
        const reward = missionCompletionReward(mission, next);
        if (persistMissionCompletion(mission, next)) {
          window.TTPersistenceBoundary?.inventory.refresh();
          onChange(reward ? { ...next, reward } : next);
          return;
        }
      }
    }
    onChange(next);
  };
  useEffect(() => {
    if (state.status !== 'active' || !['timed', 'speed'].includes(state.config.mode)) return;
    const timer = window.setInterval(() => updateMission(advanceTimer(state)), 250);
    return () => window.clearInterval(timer);
  }, [state]);
  const submit = () => {
    if (state.status !== 'active' || !state.question || !answer.trim()) return;
    const isCorrect = state.question.result === Number(answer);
    window.TTAudio?.sfx?.(isCorrect ? 'correct' : 'wrong');
    persistReactAnswer(state, Number(answer));
    updateMission(submitAnswer(state, Number(answer)));
    setAnswer('');
  };
  if (state.status === 'complete') {
    return <section className="card ttReactMissionPlayer" aria-live="polite">
      <h2>{copy['ui.reactMission.complete']}</h2>
      <p>{copy['ui.reactMission.reward']}: ⭐ {state.reward?.total || 0}</p>
      <button className="btn" type="button" onClick={onExit}>{copy['ui.reactMission.back']}</button>
    </section>;
  }
  return <section className="card ttReactMissionPlayer" aria-labelledby="ttReactMissionQuestion">
    <div className="ttReactMissionStatus">
      <span>{copy['ui.reactMission.score']}: {state.correct}</span>
      {state.remainingSeconds !== null && <span aria-label={copy['ui.reactMission.timer']}>⏱ {Math.floor(state.remainingSeconds / 60)}:{String(state.remainingSeconds % 60).padStart(2, '0')}</span>}
    </div>
    <h2 id="ttReactMissionQuestion" className="math"><em>{state.question?.a}</em> {state.question?.op === 'div' ? '÷' : '×'} <em>{state.question?.b}</em></h2>
    <label htmlFor="ttReactMissionAnswer">{copy['ui.reactMission.answer']}</label>
    <input id="ttReactMissionAnswer" className="answer" inputMode="numeric" value={answer} onChange={event => setAnswer(event.target.value.replace(/\D/g, ''))} onKeyDown={event => { if (event.key === 'Enter') submit(); }} />
    <button className="btn" type="button" onClick={submit}>{copy['ui.reactMission.submit']}</button>
    <p className={`feedback ${state.feedback === 'correct' ? 'good' : state.feedback === 'incorrect' ? 'bad' : ''}`} aria-live="polite">
      {state.feedback === 'correct' ? copy['ui.reactMission.correct'] : state.feedback === 'incorrect' ? copy['ui.reactMission.incorrect'] : ''}
    </p>
    <button className="btn alt" type="button" onClick={onExit}>{copy['ui.reactMission.back']}</button>
  </section>;
}

function ReactMissionSetup({ locale }: { locale: Locale }) {
  const copy = locale as Record<string, string>;
  const [tables, setTables] = useState<Set<number>>(() => new Set([1, 2, 5, 10]));
  const [operation, setOperation] = useState<'mul' | 'div' | 'mix'>('mul');
  const [mode, setMode] = useState<'practice' | 'exam' | 'speed' | 'timed'>('practice');
  const [duration, setDuration] = useState<5 | 10 | 15>(5);
  const [mission, setMission] = useState<ReactMissionState | null>(null);
  const isSpanish = document.documentElement.lang === 'es';
  const adapter = window.TTGameplayAdapter || window.TTCoreScreensAdapter;

  if (mission) return <ReactMissionPlayer locale={locale} state={mission} onChange={next => setMission(next)} onExit={() => setMission(null)} />;

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
      <button className="btn ttReactMissionStart" type="button" onClick={() => setMission(createReactMission({ tables: [...tables], operation, mode, durationMinutes: mode === 'timed' ? duration : undefined }))}>
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

type ReactGarageItem = {
  id: string;
  name: string;
  detail: string;
  actionLabel: string;
  actionDisabled: boolean;
  previewing: boolean;
};

const garageCategories = [
  ['body', 'ui.garage.body'],
  ['nose', 'ui.garage.nose'],
  ['wings', 'ui.garage.wings'],
  ['flame', 'ui.garage.flame'],
  ['window', 'ui.garage.window'],
  ['extra', 'ui.garage.extra'],
  ['support', 'ui.garage.support'],
] as const;

function readReactGarageItems(): ReactGarageItem[] {
  return Array.from(document.querySelectorAll<HTMLElement>('#garageItems .garageItem'))
    .map(item => {
      const action = item.querySelector<HTMLButtonElement>('.ttGarageEquipBtn');
      const preview = item.querySelector<HTMLButtonElement>('.previewBtn');
      return {
        id: item.dataset.garagePartId || '',
        name: item.querySelector('strong')?.textContent || '',
        detail: item.querySelector('small')?.textContent || '',
        actionLabel: action?.getAttribute('aria-label') || '',
        actionDisabled: Boolean(action?.disabled),
        previewing: preview?.getAttribute('aria-pressed') === 'true',
      };
    })
    .filter(item => item.id);
}

function ReactGaragePanel({ locale }: { locale: Locale }) {
  const copy = locale as Record<string, string>;
  const [items, setItems] = useState<ReactGarageItem[]>(readReactGarageItems);
  const sync = () => setItems(readReactGarageItems());

  useEffect(() => {
    const garageItems = document.getElementById('garageItems');
    if (!garageItems) return;
    sync();
    const initialSync = window.setTimeout(sync, 0);
    const observer = new MutationObserver(sync);
    observer.observe(garageItems, { childList: true, subtree: true, attributes: true });
    return () => {
      window.clearTimeout(initialSync);
      observer.disconnect();
    };
  }, []);

  const delegate = (action: () => boolean) => {
    if (action()) window.setTimeout(sync, 0);
  };

  return (
    <section className="card ttReactGaragePanel" aria-labelledby="ttReactGarageTitle">
      <div className="ttReactGarageHeading">
        <div>
          <h2 id="ttReactGarageTitle">{copy['ui.garage.controls']}</h2>
          <p>{copy['ui.garage.description']}</p>
        </div>
        <button type="button" className="btn alt" onClick={() => {
          if (window.TTPersistenceBoundary?.inventory) window.TTPersistenceBoundary.inventory.refresh();
          else if (window.TTInventoryAdapter) window.TTInventoryAdapter.refresh();
          else window.TTCoreScreensAdapter?.refresh('garage');
          sync();
        }}>{copy['ui.garage.refresh']}</button>
      </div>
      <div className="ttReactGarageCategories" role="group" aria-label={copy['ui.garage.category']}>
        {garageCategories.map(([category, key]) => (
          <button type="button" className="garageTab" key={category} onClick={() => {
            delegate(() => window.TTPersistenceBoundary?.inventory.setCategory(category) || window.TTInventoryAdapter?.setCategory(category) || window.TTCoreScreensAdapter?.setGarageCategory(category) || false);
          }}>{copy[key]}</button>
        ))}
      </div>
      <div className="ttReactGarageItems" aria-live="polite">
        {items.slice(0, 12).map(item => (
          <article className="ttReactGarageItem" key={item.id}>
            <strong>{item.name}</strong>
            <small>{item.detail}</small>
            <div className="ttReactGarageActions">
              <button type="button" className="btn alt" aria-pressed={item.previewing} onClick={() => {
                delegate(() => window.TTPersistenceBoundary?.inventory.previewPart(item.id) || window.TTInventoryAdapter?.previewPart(item.id) || window.TTCoreScreensAdapter?.previewGaragePart(item.id) || false);
              }}>{copy['ui.garage.preview']}</button>
              <button type="button" className="btn" disabled={item.actionDisabled} onClick={() => {
                delegate(() => window.TTPersistenceBoundary?.inventory.activatePart(item.id) || window.TTInventoryAdapter?.activatePart(item.id) || window.TTCoreScreensAdapter?.activateGaragePart(item.id) || false);
              }}>{item.actionLabel || copy['ui.garage.equip']}</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReactGaragePanelHost({ enabled, locale }: { enabled: boolean; locale: Locale }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const garage = document.getElementById('garage');
    if (!garage) return;
    const element = document.createElement('div');
    element.dataset.reactGaragePanel = 'true';
    garage.prepend(element);
    setHost(element);
    return () => {
      element.remove();
      setHost(null);
    };
  }, [enabled]);
  return host ? createPortal(<ReactGaragePanel locale={locale} />, host) : null;
}

function readReactAchievements(): ReactAchievementRecord[] {
  let history: unknown;
  try {
    const raw = window.TTLocalStore?.getItem('cosmotablas-history-v1');
    history = raw ? JSON.parse(raw) : [];
  } catch {
    history = [];
  }
  return evaluateAchievements({
    facts: window.TTPersistenceBoundary?.mission.read(),
    history,
  });
}

function ReactAchievementsPanel({ locale }: { locale: Locale }) {
  const copy = locale as Record<string, string>;
  const [achievements, setAchievements] = useState<ReactAchievementRecord[]>(readReactAchievements);
  const sync = () => setAchievements(readReactAchievements());

  useEffect(() => {
    sync();
  }, [locale]);

  return (
    <section className="card ttReactAchievementsPanel" aria-labelledby="ttReactAchievementsTitle">
      <div className="ttReactAchievementsHeading">
        <div>
          <h2 id="ttReactAchievementsTitle">{copy['ui.achievements.controls']}</h2>
          <p>{copy['ui.achievements.description']}</p>
        </div>
        <button type="button" className="btn alt" onClick={sync}>{copy['ui.achievements.refresh']}</button>
      </div>
      <div className="ttReactAchievementsList" aria-live="polite">
        {achievements.map(achievement => (
          <article className={`ttReactAchievement ${achievement.locked ? 'locked' : ''}`} key={achievement.id}>
            <span aria-hidden="true">{achievement.locked ? '🔒' : achievement.icon}</span>
            <div>
              <strong>{copy[achievement.titleKey] || achievement.id}</strong>
              <p>{copy[achievement.descriptionKey] || ''}</p>
              {achievement.progress && <small>{achievement.progress.done} / {achievement.progress.total}</small>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReactAchievementsPanelHost({ enabled, locale }: { enabled: boolean; locale: Locale }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const awards = document.getElementById('awards');
    if (!awards) return;
    const element = document.createElement('div');
    element.dataset.reactAchievementsPanel = 'true';
    awards.prepend(element);
    setHost(element);
    return () => {
      element.remove();
      setHost(null);
    };
  }, [enabled]);
  return host ? createPortal(<ReactAchievementsPanel locale={locale} />, host) : null;
}

function readReactDashboard(): ReactDashboardModel {
  let history: unknown;
  try {
    const raw = window.TTLocalStore?.getItem('cosmotablas-history-v1');
    history = raw ? JSON.parse(raw) : [];
  } catch {
    history = [];
  }
  return evaluateDashboard({
    facts: window.TTPersistenceBoundary?.mission.read(),
    history,
  });
}

function ReactDashboardPanel({ locale }: { locale: Locale }) {
  const copy = locale as Record<string, string>;
  const [model, setModel] = useState<ReactDashboardModel>(readReactDashboard);
  const sync = () => setModel(readReactDashboard());
  return (
    <section className="card ttReactDashboardPanel" aria-labelledby="ttReactDashboardTitle">
      <div className="ttReactDashboardHeading">
        <div>
          <h2 id="ttReactDashboardTitle">{copy['ui.dashboard.controls']}</h2>
          <p>{copy['ui.dashboard.description']}</p>
        </div>
        <button type="button" className="btn alt" onClick={sync}>{copy['ui.achievements.refresh']}</button>
      </div>
      <div className="kpis ttReactDashboardMetrics" aria-live="polite">
        <div className="kpi"><span>🚀</span><strong>{model.missions}</strong><small>{copy['ui.dashboard.missions']}</small></div>
        <div className="kpi"><span>✅</span><strong>{model.correct}</strong><small>{copy['ui.dashboard.correct']}</small></div>
        <div className="kpi"><span>🎯</span><strong>{model.accuracy}%</strong><small>{copy['ui.dashboard.accuracy']}</small></div>
        <div className="kpi"><span>⭐</span><strong>{model.experience}</strong><small>{copy['ui.dashboard.experience']}</small></div>
      </div>
      <div className="ttReactDashboardLevel">
        <strong>{copy['ui.dashboard.level']} {model.level} · {copy[model.levelKey]}</strong>
        <span>{model.levelProgress} / 500 XP</span>
        <div className="xpTrack" aria-label={`${model.levelProgress} / 500 XP`}><div style={{ width: `${Math.min(100, Math.round((model.levelProgress / 500) * 100))}%` }} /></div>
      </div>
    </section>
  );
}

function ReactProgressPanel({ locale }: { locale: Locale }) {
  const copy = locale as Record<string, string>;
  const [model, setModel] = useState<ReactDashboardModel>(readReactDashboard);
  const sync = () => setModel(readReactDashboard());
  return (
    <section className="card ttReactProgressPanel" aria-labelledby="ttReactProgressTitle">
      <div className="ttReactDashboardHeading">
        <div>
          <h2 id="ttReactProgressTitle">{copy['ui.progress.controls']}</h2>
          <p>{copy['ui.progress.description']}</p>
        </div>
        <button type="button" className="btn alt" onClick={sync}>{copy['ui.achievements.refresh']}</button>
      </div>
      <div className="ttReactProgressList" aria-live="polite">
        {model.tables.map(table => (
          <article className="ttReactProgressItem" key={table.table}>
            <div><strong>{copy['ui.progress.table']} {table.table}</strong><span>{table.right} {copy['ui.progress.answers']} · {table.accuracy}% {copy['ui.progress.accuracy']}</span></div>
            <div className="ttReactProgressTrack" aria-label={`${table.progress}% ${copy['ui.progress.mastery']}`}><i style={{ width: `${table.progress}%` }} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReactDashboardPanelHost({ enabled, locale }: { enabled: boolean; locale: Locale }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const dashboard = document.getElementById('dashboard');
    if (!dashboard) return;
    const element = document.createElement('div');
    element.dataset.reactDashboardPanel = 'true';
    dashboard.classList.add('ttReactDashboardEnabled');
    const legacyChildren = Array.from(dashboard.children).filter(child => child !== element);
    const legacyDisplays = legacyChildren.map(child => ({ child, display: child instanceof HTMLElement ? child.style.display : '' }));
    legacyDisplays.forEach(({ child }) => {
      child.setAttribute('data-react-dashboard-legacy-hidden', 'true');
      if (child instanceof HTMLElement) child.style.display = 'none';
    });
    dashboard.prepend(element);
    setHost(element);
    return () => {
      element.remove();
      legacyDisplays.forEach(({ child, display }) => {
        child.removeAttribute('data-react-dashboard-legacy-hidden');
        if (child instanceof HTMLElement) child.style.display = display;
      });
      dashboard.classList.remove('ttReactDashboardEnabled');
      setHost(null);
    };
  }, [enabled]);
  return host ? createPortal(<ReactDashboardPanel locale={locale} />, host) : null;
}

function ReactProgressPanelHost({ enabled, locale }: { enabled: boolean; locale: Locale }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const insights = document.getElementById('insights');
    if (!insights) return;
    const element = document.createElement('div');
    element.dataset.reactProgressPanel = 'true';
    insights.classList.add('ttReactProgressEnabled');
    const legacyChildren = Array.from(insights.children).filter(child => child !== element);
    const legacyDisplays = legacyChildren.map(child => ({ child, display: child instanceof HTMLElement ? child.style.display : '' }));
    legacyDisplays.forEach(({ child }) => {
      child.setAttribute('data-react-progress-legacy-hidden', 'true');
      if (child instanceof HTMLElement) child.style.display = 'none';
    });
    insights.prepend(element);
    setHost(element);
    return () => {
      element.remove();
      legacyDisplays.forEach(({ child, display }) => {
        child.removeAttribute('data-react-progress-legacy-hidden');
        if (child instanceof HTMLElement) child.style.display = display;
      });
      insights.classList.remove('ttReactProgressEnabled');
      setHost(null);
    };
  }, [enabled]);
  return host ? createPortal(<ReactProgressPanel locale={locale} />, host) : null;
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
    <ReactDashboardPanelHost enabled={enabled} locale={currentLocale()} />
    <ReactProgressPanelHost enabled={enabled} locale={currentLocale()} />
    <ReactMissionSetupHost enabled={enabled} locale={currentLocale()} />
    <ReactGaragePanelHost enabled={enabled} locale={currentLocale()} />
    <ReactAchievementsPanelHost enabled={enabled} locale={currentLocale()} />
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
  const [legacySplashAvailable] = useState(() => Boolean(legacySplash));
  const [entered, setEntered] = useState(false);
  const [pilotSelectorOpen, setPilotSelectorOpen] = useState(false);
  const [pilotName, setPilotName] = useState('');
  const [pilotError, setPilotError] = useState('');
  const pilotAdapter = window.TTPersistenceBoundary?.pilots || window.TTPilotAdapter;
  const [pilots, setPilots] = useState(() => pilotAdapter?.readPilots() || []);
  const [settingsNavHost, setSettingsNavHost] = useState<HTMLElement | null>(null);
  const [settingsPanel, setSettingsPanel] = useState('audio');
  const entering = useRef(false);

  useEffect(() => {
    const open = () => {
      setPilots(window.TTPersistenceBoundary?.pilots.readPilots() || window.TTPilotAdapter?.readPilots() || []);
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

  const copy = currentLocale();
  const enterGame = () => {
    if (entering.current) return;
    entering.current = true;
    if (window.TTEnterGame) window.TTEnterGame();
    else if (legacySplash) legacySplash.click();
    else (window as Window & { navigate?: (screen: string) => void }).navigate?.('dashboard');
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
    {!legacySplashAvailable && !entered && <section
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
    </section>}
    {pilotSelectorOpen && (
      <section className="ttReactPilotSelector" role="dialog" aria-modal="true" aria-labelledby="ttReactPilotTitle">
        <div className="ttReactPilotCard">
          <button className="ttReactPilotClose" type="button" aria-label={copy['ui.097']} onClick={() => setPilotSelectorOpen(false)}>×</button>
          <div className="eyebrow">{copy['ui.098']}</div>
          <h1 id="ttReactPilotTitle">🚀 {copy['ui.099']}</h1>
          <p>{copy['ui.100']}</p>
          <div className="ttReactPilotGrid">
            {pilots.map(pilot => (
              <div className="ttReactPilotTile" key={pilot.id}>
                <button type="button" onClick={() => {
                  if ((window.TTPersistenceBoundary?.pilots || window.TTPilotAdapter)?.choosePilot(pilot.id)) setPilotSelectorOpen(false);
                }}>
                  <span aria-hidden="true">{pilot.avatar || '🚀'}</span>
                  <strong>{pilot.name}</strong>
                </button>
                {pilotAdapter?.renamePilot && <button className="btn alt" type="button" onClick={() => {
                  const proposed = window.prompt(copy['ui.106'], pilot.name);
                  if (proposed === null) return;
                  if (pilotAdapter.renamePilot?.(pilot.id, proposed)) {
                    setPilots(pilotAdapter.readPilots());
                    setPilotError('');
                  } else setPilotError(copy['ui.101']);
                }}>{copy['ui.104']}</button>}
                {pilotAdapter?.deletePilot && <button className="btn alt" type="button" onClick={() => {
                  if (!window.confirm(copy['ui.107'])) return;
                  if (pilotAdapter.deletePilot?.(pilot.id)) {
                    setPilots(pilotAdapter.readPilots());
                    setPilotError('');
                  } else setPilotError(copy['ui.108']);
                }}>{copy['ui.105']}</button>}
              </div>
            ))}
          </div>
          <form onSubmit={event => {
            event.preventDefault();
            const id = (window.TTPersistenceBoundary?.pilots || window.TTPilotAdapter)?.createPilot(pilotName.trim());
            if (id) {
              setPilots(window.TTPersistenceBoundary?.pilots.readPilots() || window.TTPilotAdapter?.readPilots() || []);
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
