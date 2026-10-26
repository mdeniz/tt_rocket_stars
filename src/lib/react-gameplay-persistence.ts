export interface MissionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void | boolean;
  removeItem(key: string): void | boolean;
}

export interface MissionPersistenceAdapter {
  read(): Record<string, unknown>;
  commit(payload: unknown): boolean;
  rollback(): boolean;
  readHistory(): readonly Record<string, unknown>[];
  readInventory(): Record<string, unknown> | null;
  commitProgress(progress: MissionProgressPayload): boolean;
}

export interface MissionProgressPayload {
  readonly facts: Record<string, unknown>;
  readonly history: readonly Record<string, unknown>[];
  readonly inventory: Record<string, unknown>;
}

function isPayload(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isHistory(value: unknown): value is readonly Record<string, unknown>[] {
  return Array.isArray(value) && value.every(isPayload);
}

function isInventory(value: unknown): value is Record<string, unknown> {
  return isPayload(value)
    && typeof value.coins === 'number'
    && Number.isFinite(value.coins)
    && value.coins >= 0;
}

function encode(payload: Record<string, unknown>): string | null {
  try { return JSON.stringify(payload); } catch { return null; }
}

function memoryStorage(): MissionStorage {
  const values = new Map<string, string>();
  return {
    getItem: name => values.get(name) ?? null,
    setItem: (name, value) => { values.set(name, value); },
    removeItem: name => { values.delete(name); },
  };
}

export function createMissionPersistence(storage: MissionStorage | undefined, key: string): MissionPersistenceAdapter {
  const backing = storage || memoryStorage();
  const historyKey = 'cosmotablas-history-v1';
  const inventoryKey = 'tt-rocket-garage-v1';
  let previousRaw: string | null = null;
  let hasSnapshot = false;
  const read = () => {
    try {
      const raw = backing.getItem(key);
      if (!raw) return {};
      const parsed: unknown = JSON.parse(raw);
      return isPayload(parsed) ? parsed : {};
    } catch {
      return {};
    }
  };
  return {
    read,
    commit(payload) {
      if (!isPayload(payload)) return false;
      const encoded = encode(payload);
      if (!encoded) return false;
      try {
        previousRaw = backing.getItem(key);
        hasSnapshot = true;
        const result = backing.setItem(key, encoded);
        return result !== false;
      } catch {
        return false;
      }
    },
    rollback() {
      if (!hasSnapshot) return false;
      try {
        if (previousRaw === null) backing.removeItem(key);
        else backing.setItem(key, previousRaw);
        hasSnapshot = false;
        return true;
      } catch {
        return false;
      }
    },
    readHistory() {
      try {
        const raw = backing.getItem(historyKey);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return isHistory(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
    readInventory() {
      try {
        const raw = backing.getItem(inventoryKey);
        if (!raw) return { coins: 0 };
        const parsed: unknown = JSON.parse(raw);
        return isInventory(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    commitProgress(progress) {
      if (!isPayload(progress) || !isPayload(progress.facts) || !isHistory(progress.history) || !isInventory(progress.inventory)) return false;
      const values = new Map<string, string>([
        [key, JSON.stringify(progress.facts)],
        [historyKey, JSON.stringify(progress.history)],
        [inventoryKey, JSON.stringify(progress.inventory)],
      ]);
      const previous = new Map<string, string | null>();
      try {
        values.forEach((value, name) => previous.set(name, backing.getItem(name)));
        values.forEach((value, name) => {
          const result = backing.setItem(name, value);
          if (result === false) throw new Error('Mission progress storage write rejected.');
        });
        const profiles = (globalThis as typeof globalThis & { TTProfiles?: { sync?: () => void } }).TTProfiles;
        profiles?.sync?.();
        return true;
      } catch {
        previous.forEach((value, name) => {
          try {
            if (value === null) backing.removeItem(name);
            else backing.setItem(name, value);
          } catch {
            // Preserve the best available snapshot when storage is unavailable.
          }
        });
        return false;
      }
    },
  };
}
