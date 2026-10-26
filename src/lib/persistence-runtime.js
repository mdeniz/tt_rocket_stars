/* Runtime-safe persistence contracts shared by legacy and future UI code. */
(function () {
  const clone = value => {
    if (value === null || value === undefined) return value;
    try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
  };
  const object = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
  const failure = error => ({ ok: false, error });
  const success = value => ({ ok: true, value });
  const language = value => value === 'en' ? 'en' : value === 'es' ? 'es' : null;

  function validatePilot(value) {
    if (!object(value) || typeof value.id !== 'string' || !value.id.trim()) return failure('Pilot id is required.');
    if (typeof value.name !== 'string' || !value.name.trim()) return failure('Pilot name is required.');
    const pilotLanguage = language(value.language);
    if (!pilotLanguage || !Number.isFinite(Number(value.createdAt)) || !object(value.payload)) return failure('Pilot shape is invalid.');
    return success({ ...clone(value), id: value.id.trim(), name: value.name.trim().slice(0, 80), language: pilotLanguage, createdAt: Number(value.createdAt), payload: clone(value.payload) });
  }

  function validateProfiles(value) {
    if (!Array.isArray(value)) return failure('Profile collection must be an array.');
    const profiles = [];
    const ids = new Set();
    for (const item of value) {
      const result = validatePilot(item);
      if (!result.ok || ids.has(result.value.id)) return failure('Profile collection contains an invalid or duplicate pilot.');
      ids.add(result.value.id); profiles.push(result.value);
    }
    return success(profiles);
  }

  function validateBackup(value, keys) {
    if (!object(value) || value.format !== 'tt-rocket-stars-backup' || value.version !== 1 || typeof value.createdAt !== 'string' || !object(value.payload)) return failure('Backup envelope is invalid.');
    const requiredKeys = Array.isArray(keys) ? keys : [];
    for (const key of requiredKeys) {
      const item = value.payload[key];
      if (!(item === null || typeof item === 'string')) return failure(`Backup key is invalid: ${key}`);
      if (item !== null) { try { JSON.parse(item); } catch (_) { return failure(`Backup JSON is invalid: ${key}`); } }
    }
    return success({ ...clone(value), payload: { ...value.payload } });
  }

  function validateCloudSnapshot(value) {
    if (!object(value) || typeof value.localId !== 'string' || !value.localId.trim() || typeof value.name !== 'string' || !object(value.payload) || typeof value.updatedAt !== 'string') return failure('Cloud snapshot is invalid.');
    const snapshotLanguage = language(value.language);
    if (!snapshotLanguage) return failure('Cloud snapshot language is invalid.');
    const version = value.version === undefined ? undefined : Number(value.version);
    if (version !== undefined && (!Number.isInteger(version) || version < 0)) return failure('Cloud snapshot version is invalid.');
    return success({ ...clone(value), localId: value.localId.trim(), name: value.name.trim().slice(0, 80), language: snapshotLanguage, payload: clone(value.payload), ...(version === undefined ? {} : { version }) });
  }

  function validatePilotDomainPayload(value) {
    if (!object(value)) return failure('Pilot domain payload must be an object.');
    return success(clone(value));
  }

  function createSafeStorage(storage) {
    const memory = Object.create(null);
    return {
      getItem(key) { try { return storage?.getItem(key) ?? (Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null); } catch (_) { return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null; } },
      setItem(key, value) { try { if (storage?.setItem) storage.setItem(key, value); else memory[String(key)] = String(value); return true; } catch (_) { memory[String(key)] = String(value); return false; } },
      removeItem(key) { try { if (storage?.removeItem) storage.removeItem(key); delete memory[key]; return true; } catch (_) { delete memory[key]; return false; } },
    };
  }

  function createPilotPersistence(storage, keys) {
    const safe = createSafeStorage(storage);
    const payloadKeys = Array.isArray(keys) ? keys.slice() : [];
    return {
      get(key) { return safe.getItem(key); },
      set(key, value) { return safe.setItem(key, value); },
      remove(key) { return safe.removeItem(key); },
      readJson(key, fallback) {
        try { const value = safe.getItem(key); return value === null ? fallback : JSON.parse(value); } catch (_) { return fallback; }
      },
      writeJson(key, value) {
        try { return safe.setItem(key, JSON.stringify(value)); } catch (_) { return false; }
      },
      capture() { return Object.fromEntries(payloadKeys.map(key => [key, safe.getItem(key)])); },
      apply(payload) { payloadKeys.forEach(key => { const value = payload?.[key]; if (typeof value === 'string') safe.setItem(key, value); else safe.removeItem(key); }); },
    };
  }

  function createDomainPersistence(storage, key) {
    const safe = createSafeStorage(storage);
    const validKey = typeof key === 'string' && key.trim() ? key : null;
    return {
      read(fallback = {}) {
        if (!validKey) return clone(fallback);
        try {
          const value = safe.getItem(validKey);
          if (value === null) return clone(fallback);
          const parsed = JSON.parse(value);
          const result = validatePilotDomainPayload(parsed);
          return result.ok ? result.value : clone(fallback);
        } catch (_) {
          return clone(fallback);
        }
      },
      write(payload) {
        if (!validKey) return false;
        const result = validatePilotDomainPayload(payload);
        if (!result.ok) return false;
        try { return safe.setItem(validKey, JSON.stringify(result.value)); } catch (_) { return false; }
      },
    };
  }

  function createBackupPersistence(storage, options = {}) {
    const safe = createSafeStorage(storage);
    const backupKey = 'tt-rocket-backups-v1';
    const payloadKeys = Array.isArray(options.keys) && options.keys.length
      ? options.keys.slice()
      : ['cosmotablas-v2', 'cosmotablas-history-v1', 'tt-rocket-garage-v1'];
    const now = typeof options.now === 'function' ? options.now : () => new Date().toISOString();
    const id = typeof options.id === 'function'
      ? options.id
      : () => Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const failure = error => ({ ok: false, error });
    const success = value => ({ ok: true, value });
    const readList = () => {
      try {
        const value = safe.getItem(backupKey);
        if (value === null) return [];
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    };
    const capture = () => Object.fromEntries(payloadKeys.map(key => [key, safe.getItem(key)]));
    const writeList = value => {
      if (!Array.isArray(value)) return failure('Backup list must be an array.');
      const written = safe.setItem(backupKey, JSON.stringify(value));
      return written === false ? failure('Backup list could not be saved.') : success(value);
    };
    const apply = payload => {
      const previous = capture();
      try {
        for (const key of payloadKeys) {
          const value = payload[key];
          const written = value === null ? safe.removeItem(key) : safe.setItem(key, value);
          if (written === false) throw Error('Backup payload could not be applied.');
        }
        return success(true);
      } catch (error) {
        for (const key of payloadKeys) {
          if (previous[key] === null) safe.removeItem(key);
          else safe.setItem(key, previous[key]);
        }
        return failure(error.message || 'Backup payload could not be applied.');
      }
    };
    return {
      list: () => clone(readList()),
      snapshot: () => ({ format: 'tt-rocket-stars-backup', version: 1, createdAt: now(), payload: capture() }),
      create(label) {
        const item = { ...this.snapshot(), label, id: id() };
        const list = [item, ...readList()].slice(0, 5);
        const result = writeList(list);
        return result.ok ? success(item) : result;
      },
      saveList(value) {
        return writeList(clone(value));
      },
      restore(value) {
        const result = validateBackup(value, payloadKeys);
        if (!result.ok) return result;
        const applied = apply(result.value.payload);
        return applied.ok ? result : failure(applied.error);
      },
      replace(value, recoveryLabel) {
        const valid = validateBackup(value, payloadKeys);
        if (!valid.ok) return valid;
        const recovery = this.create(recoveryLabel);
        if (!recovery.ok) return recovery;
        return this.restore(valid.value);
      },
    };
  }

  window.TTPersistenceContracts = {
    clone,
    validatePilot,
    validateProfiles,
    validateBackup,
    validateCloudSnapshot,
    validatePilotDomainPayload,
    createSafeStorage,
    createPilotPersistence,
    createDomainPersistence,
    createBackupPersistence,
  };
}());
