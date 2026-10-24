import type { ShellPilotSummary } from './shell-contracts';

export interface FullscreenAdapter {
  requestFullscreen(): Promise<boolean>;
}

interface LegacyPilotProfile {
  id: string;
  name: string;
  language: 'en' | 'es';
  avatar?: string | null;
}

interface LegacyPilotStore {
  sync(): void;
  read(): LegacyPilotProfile[];
  active(): LegacyPilotProfile | undefined;
  choose(id: string): void;
  create(name: string): string;
}

interface LegacySettingsStore {
  showSettingsPanel(panel: string): void;
}

declare global {
  interface Window {
    TTFullscreenAdapter?: FullscreenAdapter;
    TTProfiles?: LegacyPilotStore;
    TTPilotAdapter?: PilotAdapter;
    TTSettingsAdapter?: LegacySettingsStore;
    TTCoreScreensAdapter?: CoreScreensAdapter;
    __TTFeatureFlags?: { reactCoreScreens?: boolean };
    TTEnterGame?: () => void;
    TTOpenPilotSelector?: () => void;
  }
}

export type CoreScreenId = 'dashboard' | 'home' | 'insights' | 'garage' | 'awards';

export interface CoreScreensAdapter {
  show(screen: CoreScreenId): boolean;
  active(): CoreScreenId | null;
  refresh(screen?: CoreScreenId): void;
  selectMissionOperation(operation: 'mul' | 'div' | 'mix'): boolean;
  selectMissionMode(mode: 'practice' | 'speed' | 'timed' | 'exam'): boolean;
  setMissionDuration(minutes: 5 | 10 | 15): boolean;
  startMission(): boolean;
  selectRocketFamily(family: string): boolean;
  setGarageCategory(category: string): boolean;
  previewGaragePart(partId: string): boolean;
  activateGaragePart(partId: string): boolean;
  refreshAchievements(): boolean;
}

export interface PilotAdapter {
  readPilots(): ShellPilotSummary[];
  choosePilot(id: string): boolean;
  createPilot(name: string): string | null;
}

/**
 * Requests fullscreen without making splash entry depend on browser support.
 * The browser call remains synchronous up to the returned promise so a user
 * gesture can authorize it on touch devices.
 */
export function requestFullscreenSafely(): Promise<boolean> {
  const requestFullscreen = document.documentElement?.requestFullscreen;
  if (typeof requestFullscreen !== 'function') return Promise.resolve(false);
  try {
    return Promise.resolve(requestFullscreen.call(document.documentElement))
      .then(() => true)
      .catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}

export function installFullscreenAdapter(): void {
  window.TTFullscreenAdapter = { requestFullscreen: requestFullscreenSafely };
}

export function createPilotAdapter(store: LegacyPilotStore | undefined = window.TTProfiles): PilotAdapter {
  return {
    readPilots: () => (store?.read() || []).map(profile => ({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar || null,
      language: profile.language,
    })),
    choosePilot: id => {
      if (!store?.read().some(profile => profile.id === id)) return false;
      store.choose(id);
      return true;
    },
    createPilot: name => {
      if (!store) return null;
      const error = store.create(name);
      return error ? null : store.active()?.id || null;
    },
  };
}

export function installPilotAdapter(): void {
  window.TTPilotAdapter = createPilotAdapter();
}

export function createSettingsAdapter(store: LegacySettingsStore | undefined = window.TTSettingsAdapter): LegacySettingsStore {
  return {
    showSettingsPanel: panel => store?.showSettingsPanel(panel),
  };
}

export function installSettingsAdapter(): void {
  window.TTSettingsAdapter = createSettingsAdapter();
}

const CORE_SCREEN_IDS: readonly CoreScreenId[] = ['dashboard', 'home', 'insights', 'garage', 'awards'];

function isCoreScreenId(value: string): value is CoreScreenId {
  return CORE_SCREEN_IDS.includes(value as CoreScreenId);
}

type LegacyAction = (...args: unknown[]) => unknown;

function callLegacyAction(name: string, ...args: unknown[]): boolean {
  const action = (window as unknown as Record<string, unknown>)[name];
  if (typeof action !== 'function') return false;
  try {
    (action as LegacyAction)(...args);
    return true;
  } catch {
    return false;
  }
}

function callLegacyStringAction(name: string, value: string): boolean {
  return value.trim() ? callLegacyAction(name, value) : false;
}

export function createCoreScreensAdapter(): CoreScreensAdapter {
  const active = () => {
    const screen = Array.from(document.querySelectorAll<HTMLElement>('.appscreen'))
      .find(element => !element.classList.contains('hidden'))?.id;
    return screen && isCoreScreenId(screen) ? screen : null;
  };
  return {
    show: screen => {
      if (!isCoreScreenId(screen)) return false;
      const navigate = (window as Window & { navigate?: (target: string) => void }).navigate;
      if (typeof navigate !== 'function') return false;
      navigate(screen);
      return true;
    },
    active,
    refresh: screen => {
      const target = screen || active();
      if (!target) return;
      const refreshers: Record<CoreScreenId, string | undefined> = {
        dashboard: 'renderDashboard',
        home: 'renderPlanets',
        insights: 'renderStats',
        garage: 'renderGarage',
        awards: 'renderAwards',
      };
      const name = refreshers[target];
      const fn = name && (window as unknown as Record<string, unknown>)[name];
      if (typeof fn === 'function') (fn as () => void)();
    },
    selectMissionOperation: operation => callLegacyAction('choose', 'op', operation),
    selectMissionMode: mode => callLegacyAction('choose', 'mode', mode),
    setMissionDuration: minutes => callLegacyAction('chooseDuration', minutes),
    startMission: () => callLegacyAction('start'),
    selectRocketFamily: family => callLegacyStringAction('selectFamily', family),
    setGarageCategory: category => callLegacyStringAction('setGarageCat', category),
    previewGaragePart: partId => callLegacyStringAction('previewPart', partId),
    activateGaragePart: partId => callLegacyStringAction('garageAction', partId),
    refreshAchievements: () => callLegacyAction('renderAwards'),
  };
}

export function installCoreScreensAdapter(): void {
  window.TTCoreScreensAdapter = createCoreScreensAdapter();
}
