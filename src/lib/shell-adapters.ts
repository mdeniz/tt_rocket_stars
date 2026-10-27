import type { ShellPilotSummary } from './shell-contracts';
import { createMissionPersistence, type MissionPersistenceAdapter } from './react-gameplay-persistence';
import { createReactPilotPersistence } from './react-pilot-persistence';
import { createReactInventoryPersistence, type InventoryCompatibilityBridge, type ReactInventoryPersistenceAdapter } from './react-inventory-persistence';
import { createReactBackupPersistence, type ReactBackupPersistenceAdapter } from './react-backup-persistence';
import { createReactCloudSyncBoundary, type ReactCloudSyncBoundary, type LegacyCloudSyncAdapter } from './react-cloud-sync';

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

interface LegacyLocalStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void | boolean;
  removeItem(key: string): void | boolean;
}

interface LegacySettingsStore {
  showSettingsPanel(panel: string): void;
}

interface LegacyBackupControls {
  createManualBackup?: () => unknown;
  exportBackup?: () => unknown;
  resetWithBackup?: () => unknown;
  restoreBackup?: (id: string) => unknown;
  importBackup?: (event: Event) => unknown;
}

declare global {
  interface Window {
    TTFullscreenAdapter?: FullscreenAdapter;
    TTProfiles?: LegacyPilotStore;
    TTLocalStore?: LegacyLocalStore;
    TTAudio?: { sfx?: (name: string) => void };
    TTPilotAdapter?: PilotAdapter;
    TTPersistenceBoundary?: PersistenceBoundary;
    TTCloudSyncAdapter?: LegacyCloudSyncAdapter;
    TTBackupControls?: BackupControlsAdapter;
    TTSettingsAdapter?: LegacySettingsStore;
    TTCoreScreensAdapter?: CoreScreensAdapter;
    TTGameplayAdapter?: GameplayAdapter;
    TTInventoryAdapter?: InventoryAdapter;
    TTAchievementAdapter?: AchievementAdapter;
    TTRocketInventoryBridge?: InventoryCompatibilityBridge;
    __TT_FEATURES__?: { cloudAccess?: boolean };
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
  toggleMissionTable(table: number): boolean;
  pickMissionTables(preset: 'all' | 'easy'): boolean;
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

export interface GameplayAdapter {
  toggleMissionTable(table: number): boolean;
  pickMissionTables(preset: 'all' | 'easy'): boolean;
  selectMissionOperation(operation: 'mul' | 'div' | 'mix'): boolean;
  selectMissionMode(mode: 'practice' | 'speed' | 'timed' | 'exam'): boolean;
  setMissionDuration(minutes: 5 | 10 | 15): boolean;
  startMission(): boolean;
}

export interface InventoryAdapter {
  refresh(): void;
  setCategory(category: string): boolean;
  previewPart(partId: string): boolean;
  activatePart(partId: string): boolean;
}

export interface AchievementAdapter {
  refresh(): boolean;
}

export interface PilotAdapter {
  readPilots(): ShellPilotSummary[];
  choosePilot(id: string): boolean;
  createPilot(name: string): string | null;
  renamePilot?: (id: string, name: string) => boolean;
  deletePilot?: (id: string) => boolean;
}

export interface BackupControlsAdapter {
  ownsBackups(): boolean;
  createManualBackup(): boolean;
  exportBackup(): boolean;
  resetWithBackup(): boolean;
  restoreBackup(id: string): boolean;
  importBackup(event: Event): void;
}

export interface PersistenceBoundary {
  pilots: PilotAdapter;
  cloud: ReactCloudSyncBoundary;
  backups: BackupControlsAdapter;
  mission: MissionPersistenceAdapter;
  inventory: InventoryAdapter;
  achievements: AchievementAdapter;
}

function reactCoreScreensEnabled(): boolean {
  // A runtime value is an explicit rollback/enable decision. Fall back to the
  // build-time Pages default only when no runtime decision was supplied.
  if (typeof window.__TTFeatureFlags?.reactCoreScreens === 'boolean') {
    return window.__TTFeatureFlags.reactCoreScreens;
  }
  return (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_REACT_CORE_SCREENS === 'true';
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

function callLegacyControl(name: keyof LegacyBackupControls, ...args: unknown[]): boolean {
  const control = (window as unknown as Record<string, unknown>)[name];
  if (typeof control !== 'function') return false;
  try {
    (control as (...values: unknown[]) => unknown)(...args);
    return true;
  } catch {
    return false;
  }
}

export function createBackupControlsAdapter(): BackupControlsAdapter {
  return {
    ownsBackups: () => false,
    createManualBackup: () => callLegacyControl('createManualBackup'),
    exportBackup: () => callLegacyControl('exportBackup'),
    resetWithBackup: () => callLegacyControl('resetWithBackup'),
    restoreBackup: id => callLegacyControl('restoreBackup', id),
    importBackup: event => { callLegacyControl('importBackup', event); },
  };
}

export function createReactBackupControls(adapter: ReactBackupPersistenceAdapter = createReactBackupPersistence()): BackupControlsAdapter {
  return {
    ownsBackups: () => true,
    createManualBackup: () => adapter.createManualBackup(),
    exportBackup: () => adapter.exportBackup(),
    resetWithBackup: () => adapter.resetWithBackup(),
    restoreBackup: id => adapter.restoreBackup(id),
    importBackup: event => { adapter.importBackup(event); },
  };
}

/**
 * Installs the single typed persistence boundary consumed by React-owned code.
 * The legacy aliases remain available for rollback and existing inline handlers.
 */
export function installPersistenceBoundary(): void {
  const pilots = reactCoreScreensEnabled() ? createReactPilotPersistence() : createPilotAdapter();
  const backups = reactCoreScreensEnabled()
    ? createReactBackupControls(createReactBackupPersistence())
    : createBackupControlsAdapter();
  const mission = createMissionPersistence(window.TTLocalStore, 'cosmotablas-v2');
  const core = window.TTCoreScreensAdapter || createCoreScreensAdapter();
  const inventory = reactCoreScreensEnabled()
    ? createReactInventoryAdapter(createReactInventoryPersistence())
    : createInventoryAdapter(core);
  const achievements = createAchievementAdapter(core);
  const cloud = createReactCloudSyncBoundary(() => window.TTCloudSyncAdapter);
  window.TTPilotAdapter = pilots;
  window.TTBackupControls = backups;
  window.TTInventoryAdapter = inventory;
  window.TTAchievementAdapter = achievements;
  window.TTPersistenceBoundary = {
    pilots,
    cloud,
    backups,
    mission,
    inventory,
    achievements,
  };
}

function createReactInventoryAdapter(adapter: ReactInventoryPersistenceAdapter): InventoryAdapter {
  return {
    refresh: () => { adapter.refresh(); },
    setCategory: category => adapter.setCategory(category),
    previewPart: partId => adapter.previewPart(partId),
    activatePart: partId => adapter.activatePart(partId),
  };
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
        toggleMissionTable: table => Number.isInteger(table) && table >= 1 && table <= 12
          ? callLegacyAction('toggle', table)
          : false,
        pickMissionTables: preset => preset === 'all' || preset === 'easy'
          ? callLegacyAction('pick', preset)
          : false,
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

export function createGameplayAdapter(core: CoreScreensAdapter = createCoreScreensAdapter()): GameplayAdapter {
  return {
    toggleMissionTable: table => core.toggleMissionTable(table),
    pickMissionTables: preset => core.pickMissionTables(preset),
    selectMissionOperation: operation => core.selectMissionOperation(operation),
    selectMissionMode: mode => core.selectMissionMode(mode),
    setMissionDuration: minutes => core.setMissionDuration(minutes),
    startMission: () => core.startMission(),
  };
}

export function installGameplayAdapter(): void {
  window.TTGameplayAdapter = createGameplayAdapter(window.TTCoreScreensAdapter || createCoreScreensAdapter());
}

export function createInventoryAdapter(core: CoreScreensAdapter = createCoreScreensAdapter()): InventoryAdapter {
  return {
    refresh: () => core.refresh('garage'),
    setCategory: category => core.setGarageCategory(category),
    previewPart: partId => core.previewGaragePart(partId),
    activatePart: partId => core.activateGaragePart(partId),
  };
}

export function installInventoryAdapter(): void {
  window.TTInventoryAdapter = createInventoryAdapter(window.TTCoreScreensAdapter || createCoreScreensAdapter());
}

export function createAchievementAdapter(core: CoreScreensAdapter = createCoreScreensAdapter()): AchievementAdapter {
  return { refresh: () => core.refreshAchievements() };
}

export function installAchievementAdapter(): void {
  window.TTAchievementAdapter = createAchievementAdapter(window.TTCoreScreensAdapter || createCoreScreensAdapter());
}
