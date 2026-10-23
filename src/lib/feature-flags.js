const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

/** @typedef {{ defaultEnabled: boolean, experimental?: boolean }} FeatureFlagDefinition */
/** @typedef {Record<string, FeatureFlagDefinition>} FeatureFlagDefinitions */
/** @typedef {{ values: Record<string, boolean>, fetchedAt: number }} FeatureFlagPayload */
/** @typedef {{ read?: () => unknown, write?: (payload: FeatureFlagPayload) => void }} FeatureFlagCache */

const EMPTY_CACHE = Object.freeze({
  read: () => null,
  write: () => {},
});

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateDefinitions(definitions) {
  if (!isRecord(definitions)) {
    throw new TypeError('Feature flag definitions must be an object.');
  }

  const validated = {};
  for (const [name, definition] of Object.entries(definitions)) {
    if (!name || !isRecord(definition) || typeof definition.defaultEnabled !== 'boolean') {
      throw new TypeError(`Invalid feature flag definition: ${name || '<empty>'}.`);
    }
    if (definition.experimental !== undefined && typeof definition.experimental !== 'boolean') {
      throw new TypeError(`Invalid experimental marker for feature flag: ${name}.`);
    }
    validated[name] = Object.freeze({
      defaultEnabled: definition.defaultEnabled,
      ...(definition.experimental === undefined ? {} : { experimental: definition.experimental }),
    });
  }
  return Object.freeze(validated);
}

function normalizePayload(payload, definitions) {
  if (!isRecord(payload) || !isRecord(payload.values) || !Number.isFinite(payload.fetchedAt)) {
    return null;
  }

  const values = {};
  for (const [name, value] of Object.entries(payload.values)) {
    if (Object.hasOwn(definitions, name) && typeof value === 'boolean') {
      values[name] = value;
    }
  }
  return { values: Object.freeze(values), fetchedAt: payload.fetchedAt };
}

function isFresh(payload, now, ttlMs) {
  return payload !== null && now() - payload.fetchedAt < ttlMs;
}

/**
 * Creates a local-only feature-flag evaluator.
 *
 * The service deliberately has no network or provider dependency. A later
 * adapter can fetch a payload and pass it to `setPayload`.
 *
 * @param {{ definitions: FeatureFlagDefinitions, cache?: FeatureFlagCache, now?: () => number, ttlMs?: number }} options
 */
export function createFeatureFlagService({
  definitions,
  cache = EMPTY_CACHE,
  now = Date.now,
  ttlMs = DEFAULT_CACHE_TTL_MS,
}) {
  const validatedDefinitions = validateDefinitions(definitions);
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new TypeError('Feature flag cache TTL must be a positive finite number.');
  }

  let payload = null;
  try {
    payload = normalizePayload(cache.read?.(), validatedDefinitions);
    if (!isFresh(payload, now, ttlMs)) payload = null;
  } catch {
    payload = null;
  }

  function evaluate(name) {
    const definition = validatedDefinitions[name];
    if (!definition) return false;
    if (payload && isFresh(payload, now, ttlMs) && Object.hasOwn(payload.values, name)) {
      return payload.values[name];
    }
    return payload && !isFresh(payload, now, ttlMs) && definition.experimental
      ? false
      : definition.defaultEnabled;
  }

  function setPayload(nextPayload) {
    const normalized = normalizePayload(nextPayload, validatedDefinitions);
    if (!normalized || !isFresh(normalized, now, ttlMs)) return false;
    payload = normalized;
    try {
      cache.write?.(normalized);
    } catch {
      // Storage is an optimization; evaluation must remain available offline.
    }
    return true;
  }

  return Object.freeze({
    evaluate,
    setPayload,
  });
}

export { DEFAULT_CACHE_TTL_MS };
