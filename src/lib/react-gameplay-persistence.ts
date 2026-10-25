export interface MissionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void | boolean;
  removeItem(key: string): void | boolean;
}

export interface MissionPersistenceAdapter {
  read(): Record<string, unknown>;
  commit(payload: unknown): boolean;
  rollback(): boolean;
}

function isPayload(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
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
  };
}
