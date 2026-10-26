export interface PilotStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void | boolean;
  removeItem(key: string): void | boolean;
}

export interface PilotSummary {
  id: string;
  name: string;
  avatar?: string | null;
  language: 'en' | 'es';
}

interface PersistedPilot extends PilotSummary {
  createdAt: number;
  payload: Record<string, unknown>;
}

interface PersistenceContracts {
  createPilotPersistence(storage: PilotStorage | undefined, keys: string[]): {
    readJson(key: string, fallback: unknown): unknown;
    writeJson(key: string, value: unknown): boolean;
    capture(): Record<string, string | null>;
    apply(payload: Record<string, string>): void;
  };
  validateProfiles(value: unknown): { ok: boolean; value?: PersistedPilot[] };
}

export interface ReactPilotPersistenceAdapter {
  readPilots(): PilotSummary[];
  choosePilot(id: string): boolean;
  createPilot(name: string): string | null;
  renamePilot(id: string, name: string): boolean;
  deletePilot(id: string): boolean;
}

const PROFILES_KEY = 'tt-rocket-profiles-v1';
const ACTIVE_KEY = 'tt-rocket-active-profile-v1';
const PAYLOAD_KEYS = [
  'cosmotablas-v2',
  'cosmotablas-history-v1',
  'tt-rocket-garage-v1',
  'tt-rocket-backups-v1',
];

function contracts(): PersistenceContracts | null {
  return (window as Window & { TTPersistenceContracts?: PersistenceContracts }).TTPersistenceContracts || null;
}

function storage(): PilotStorage | undefined {
  return (window as Window & { TTLocalStore?: PilotStorage }).TTLocalStore;
}

function persistence() {
  const api = contracts();
  const local = storage();
  return api && local ? api.createPilotPersistence(local, PAYLOAD_KEYS) : null;
}

function readProfiles(): PersistedPilot[] {
  const api = contracts();
  const store = persistence();
  if (!api || !store) return [];
  const result = api.validateProfiles(store.readJson(PROFILES_KEY, []));
  return result.ok && result.value ? result.value : [];
}

function writeProfiles(profiles: PersistedPilot[]): boolean {
  const api = contracts();
  const store = persistence();
  if (!api || !store) return false;
  try {
    const result = api.validateProfiles(profiles);
    return result.ok && Boolean(result.value) && store.writeJson(PROFILES_KEY, result.value);
  } catch {
    return false;
  }
}

function language(): 'en' | 'es' {
  return storage()?.getItem('cosmotablas-language') === 'es' ? 'es' : 'en';
}

function syncActive(): boolean {
  const local = storage();
  const store = persistence();
  const activeId = local?.getItem(ACTIVE_KEY);
  if (!local || !store || !activeId) return true;
  const profiles = readProfiles();
  const active = profiles.find(profile => profile.id === activeId);
  if (!active) return false;
  try {
    active.payload = { ...active.payload, ...store.capture() } as Record<string, unknown>;
    active.language = language();
    return writeProfiles(profiles);
  } catch {
    return false;
  }
}

function cleanPilotName(name: string): string {
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 24);
}

function notifyLegacyView(): void {
  const switchProfile = (window as Window & { TTSwitchProfileInPlace?: () => void }).TTSwitchProfileInPlace;
  if (typeof switchProfile === 'function') switchProfile();
}

function createId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function createReactPilotPersistence(): ReactPilotPersistenceAdapter {
  return {
    readPilots: () => readProfiles().map(({ id, name, avatar, language: pilotLanguage }) => ({ id, name, avatar: avatar || null, language: pilotLanguage })),
    choosePilot: id => {
      const local = storage();
      const store = persistence();
      if (!local || !store) return false;
      if (!readProfiles().some(profile => profile.id === id)) return false;
      if (!syncActive()) return false;
      const target = readProfiles().find(profile => profile.id === id);
      if (!target) return false;
      store.apply(target.payload as Record<string, string>);
      local.setItem('cosmotablas-language', target.language);
      local.setItem(ACTIVE_KEY, target.id);
      notifyLegacyView();
      return true;
    },
    createPilot: name => {
      const clean = cleanPilotName(name);
      if (!clean) return null;
      const local = storage();
      const store = persistence();
      if (!local || !store) return null;
      const profiles = readProfiles();
      if (profiles.length >= 12 || profiles.some(profile => profile.name.toLowerCase() === clean.toLowerCase())) return null;
      if (!syncActive()) return null;
      const id = createId();
      profiles.push({ id, name: clean, language: language(), createdAt: Date.now(), payload: {} });
      if (!writeProfiles(profiles)) return null;
      store.apply({});
      local.setItem(ACTIVE_KEY, id);
      notifyLegacyView();
      return id;
    },
    renamePilot: (id, name) => {
      const clean = cleanPilotName(name);
      if (!id || !clean) return false;
      const profiles = readProfiles();
      const target = profiles.find(profile => profile.id === id);
      if (!target || profiles.some(profile => profile.id !== id && profile.name.toLowerCase() === clean.toLowerCase())) return false;
      if (!syncActive()) return false;
      const latest = readProfiles();
      const current = latest.find(profile => profile.id === id);
      if (!current || latest.some(profile => profile.id !== id && profile.name.toLowerCase() === clean.toLowerCase())) return false;
      current.name = clean;
      return writeProfiles(latest);
    },
    deletePilot: id => {
      if (!id) return false;
      const profiles = readProfiles();
      if (profiles.length <= 1 || !profiles.some(profile => profile.id === id)) return false;
      const activeId = storage()?.getItem(ACTIVE_KEY);
      if (activeId === id && !syncActive()) return false;
      const latest = readProfiles();
      const remaining = latest.filter(profile => profile.id !== id);
      if (remaining.length === latest.length) return false;
      if (activeId !== id) return writeProfiles(remaining);

      const deleted = latest.find(profile => profile.id === id);
      const next = remaining[0];
      const local = storage();
      const store = persistence();
      if (!deleted || !next || !local || !store) return false;
      const restoreDeleted = () => {
        try {
          store.apply(deleted.payload as Record<string, string>);
          local.setItem('cosmotablas-language', deleted.language);
          local.setItem(ACTIVE_KEY, deleted.id);
        } catch {
          // Best effort only: keep the operation fail-closed.
        }
      };
      try {
        store.apply(next.payload as Record<string, string>);
        local.setItem('cosmotablas-language', next.language);
        local.setItem(ACTIVE_KEY, next.id);
      } catch {
        restoreDeleted();
        return false;
      }
      if (!writeProfiles(remaining)) {
        restoreDeleted();
        return false;
      }
      notifyLegacyView();
      return true;
    },
  };
}
