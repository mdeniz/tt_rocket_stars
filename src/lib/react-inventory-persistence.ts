export interface InventoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void | boolean;
  removeItem?(key: string): void | boolean;
}

export interface InventoryPart {
  id: string;
  cat: string;
  price: number;
  compat?: readonly string[];
}

export interface InventoryState {
  coins: number;
  owned: string[];
  equipped: Record<string, string>;
  rewardedAchievements: number[];
  rewardedMissions: string[];
  family: string;
  fleet: string[];
  designs: Record<string, Record<string, string>>;
  [key: string]: unknown;
}

export interface InventoryCompatibilityBridge {
  catalog(): readonly InventoryPart[];
  refresh(): void;
  setCategory(category: string): void;
  previewPart(partId: string): void;
}

export interface InventoryPersistenceContracts {
  createPilotPersistence(storage: InventoryStorage, keys: string[]): {
    readJson(key: string, fallback: unknown): unknown;
    writeJson(key: string, value: unknown): boolean;
    capture(): Record<string, string | null>;
  };
  validateProfiles(value: unknown): { ok: boolean; value?: Array<Record<string, unknown>> };
}

export interface ReactInventoryPersistenceAdapter {
  refresh(): boolean;
  setCategory(category: string): boolean;
  previewPart(partId: string): boolean;
  activatePart(partId: string): boolean;
  readState(): InventoryState | null;
}

const PROFILES_KEY = 'tt-rocket-profiles-v1';
const ACTIVE_KEY = 'tt-rocket-active-profile-v1';
const GARAGE_KEY = 'tt-rocket-garage-v1';
const PAYLOAD_KEYS = [
  'cosmotablas-v2',
  'cosmotablas-history-v1',
  GARAGE_KEY,
  'tt-rocket-backups-v1',
];

const DEFAULT_STATE: InventoryState = {
  coins: 0,
  owned: ['body_red', 'nose_classic', 'wings_classic', 'flame_orange', 'window_round', 'extra_none'],
  equipped: {
    body: 'body_red',
    nose: 'nose_classic',
    wings: 'wings_classic',
    flame: 'flame_orange',
    window: 'window_round',
    extra: 'extra_none',
  },
  rewardedAchievements: [],
  rewardedMissions: [],
  family: 'compact',
  fleet: [],
  designs: {},
};

function getStorage(): InventoryStorage | undefined {
  return (window as Window & { TTLocalStore?: InventoryStorage }).TTLocalStore;
}

function getContracts(): InventoryPersistenceContracts | null {
  return (window as Window & { TTPersistenceContracts?: InventoryPersistenceContracts }).TTPersistenceContracts || null;
}

function getBridge(): InventoryCompatibilityBridge | null {
  return (window as Window & { TTRocketInventoryBridge?: InventoryCompatibilityBridge }).TTRocketInventoryBridge || null;
}

function getPersistence() {
  const storage = getStorage();
  const contracts = getContracts();
  return storage && contracts ? { storage, contracts, persistence: contracts.createPilotPersistence(storage, PAYLOAD_KEYS) } : null;
}

function cloneDefaultState(): InventoryState {
  return JSON.parse(JSON.stringify(DEFAULT_STATE)) as InventoryState;
}

function validStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string' && item.length > 0) && new Set(value).size === value.length;
}

function validateState(value: unknown): InventoryState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.coins !== 'number' || !Number.isFinite(candidate.coins) || candidate.coins < 0) return null;
  if (!validStringList(candidate.owned) || !candidate.equipped || typeof candidate.equipped !== 'object') return null;
  if (!validStringList(candidate.rewardedMissions) || !validStringList(candidate.fleet)) return null;
  if (!Array.isArray(candidate.rewardedAchievements) || !candidate.rewardedAchievements.every(item => Number.isInteger(item) && item >= 0)) return null;
  if (typeof candidate.family !== 'string' || !candidate.family) return null;
  const equipped = candidate.equipped as Record<string, unknown>;
  if (!Object.values(equipped).every(item => typeof item === 'string' && item.length > 0)) return null;
  if (!candidate.designs || typeof candidate.designs !== 'object' || Array.isArray(candidate.designs)) return null;
  return {
    ...candidate,
    coins: candidate.coins,
    owned: [...candidate.owned],
    equipped: { ...equipped } as Record<string, string>,
    rewardedAchievements: [...candidate.rewardedAchievements] as number[],
    rewardedMissions: [...candidate.rewardedMissions],
    family: candidate.family,
    fleet: [...candidate.fleet],
    designs: { ...(candidate.designs as Record<string, Record<string, string>>) },
  } as InventoryState;
}

function readGarage(persistence: ReturnType<typeof getPersistence>): InventoryState | null {
  if (!persistence) return null;
  const raw = persistence.storage.getItem(GARAGE_KEY);
  if (raw === null) return cloneDefaultState();
  try {
    return validateState(JSON.parse(raw));
  } catch {
    return null;
  }
}

function syncActiveProfile(persistence: NonNullable<ReturnType<typeof getPersistence>>): boolean {
  const activeId = persistence.storage.getItem(ACTIVE_KEY);
  if (!activeId) return true;
  const profilesResult = persistence.contracts.validateProfiles(
    persistence.persistence.readJson(PROFILES_KEY, []),
  );
  if (!profilesResult.ok || !profilesResult.value) return false;
  const active = profilesResult.value.find(profile => profile.id === activeId);
  if (!active) return false;
  active.payload = persistence.persistence.capture();
  return persistence.persistence.writeJson(PROFILES_KEY, profilesResult.value);
}

function writeGarage(persistence: NonNullable<ReturnType<typeof getPersistence>>, state: InventoryState, previousRaw: string | null): boolean {
  try {
    const result = persistence.storage.setItem(GARAGE_KEY, JSON.stringify(state));
    if (result === false) throw new Error('storage write rejected');
    if (!syncActiveProfile(persistence)) throw new Error('active profile write rejected');
    return true;
  } catch {
    try {
      if (previousRaw === null) persistence.storage.removeItem?.(GARAGE_KEY);
      else persistence.storage.setItem(GARAGE_KEY, previousRaw);
    } catch {
      // Storage remains unavailable; never replace valid state with a fallback.
    }
    return false;
  }
}

function findPart(partId: string): InventoryPart | null {
  const part = getBridge()?.catalog().find(candidate => candidate.id === partId);
  return part && typeof part.cat === 'string' && Number.isFinite(part.price) && part.price >= 0 ? part : null;
}

export function createReactInventoryPersistence(): ReactInventoryPersistenceAdapter {
  const notify = () => getBridge()?.refresh();
  return {
    refresh: () => {
      const state = readGarage(getPersistence());
      if (!state) return false;
      notify();
      return true;
    },
    setCategory: category => {
      if (!category || !getBridge()?.catalog().some(part => part.cat === category)) return false;
      getBridge()?.setCategory(category);
      return true;
    },
    previewPart: partId => {
      if (!findPart(partId)) return false;
      getBridge()?.previewPart(partId);
      return true;
    },
    activatePart: partId => {
      const persistence = getPersistence();
      const part = findPart(partId);
      const state = readGarage(persistence);
      if (!persistence || !part || !state) return false;
      if (!state.owned.includes(part.id) && state.coins < part.price) return false;
      const next = { ...state, owned: [...state.owned], equipped: { ...state.equipped }, fleet: [...state.fleet] };
      if (next.owned.includes(part.id)) {
        if (part.cat === 'support') {
          if (next.fleet.includes(part.id)) next.fleet = next.fleet.filter(id => id !== part.id);
          else if (next.fleet.length < 3) next.fleet.push(part.id);
          else return false;
        } else {
          next.equipped[part.cat] = part.id;
        }
      } else {
        next.coins -= part.price;
        next.owned.push(part.id);
        if (part.cat === 'support') next.fleet = next.fleet.length < 3 ? [...next.fleet, part.id] : next.fleet;
        else next.equipped[part.cat] = part.id;
      }
      const previousRaw = persistence.storage.getItem(GARAGE_KEY);
      if (!writeGarage(persistence, next, previousRaw)) return false;
      notify();
      return true;
    },
    readState: () => readGarage(getPersistence()),
  };
}
