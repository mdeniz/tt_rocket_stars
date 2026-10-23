const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

/** @typedef {{ allowlist?: string[], rolloutPercentage?: number }} FeatureFlagTargeting */
/** @typedef {{ defaultEnabled: boolean, experimental?: boolean, targeting?: FeatureFlagTargeting }} FeatureFlagDefinition */
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isAccountId(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function normalizeTargeting(targeting, name) {
  if (targeting === undefined) return undefined;
  if (!isRecord(targeting)) throw new TypeError(`Invalid targeting for feature flag: ${name}.`);

  const allowlist = targeting.allowlist === undefined ? [] : targeting.allowlist;
  if (!Array.isArray(allowlist) || allowlist.some(accountId => !isAccountId(accountId))) {
    throw new TypeError(`Invalid account allowlist for feature flag: ${name}.`);
  }
  const rolloutPercentage = targeting.rolloutPercentage;
  if (rolloutPercentage !== undefined
    && (!Number.isFinite(rolloutPercentage) || rolloutPercentage < 0 || rolloutPercentage > 100)) {
    throw new TypeError(`Invalid rollout percentage for feature flag: ${name}.`);
  }
  if (allowlist.length === 0 && rolloutPercentage === undefined) {
    throw new TypeError(`Feature flag targeting must define an allowlist or rollout: ${name}.`);
  }
  return Object.freeze({
    ...(allowlist.length ? { allowlist: Object.freeze([...new Set(allowlist.map(accountId => accountId.toLowerCase()))]) } : {}),
    ...(rolloutPercentage === undefined ? {} : { rolloutPercentage }),
  });
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
    const targeting = normalizeTargeting(definition.targeting, name);
    validated[name] = Object.freeze({
      defaultEnabled: definition.defaultEnabled,
      ...(definition.experimental === undefined ? {} : { experimental: definition.experimental }),
      ...(targeting ? { targeting } : {}),
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

function bucketFor(flagName, accountId) {
  let hash = 2166136261;
  for (const character of `${flagName}:${accountId}`) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296 * 100;
}

function targetingDecision(name, targeting, accountId) {
  if (!targeting) return true;
  if (!isAccountId(accountId)) return null;
  const normalizedAccountId = accountId.toLowerCase();
  if (targeting.allowlist?.includes(normalizedAccountId)) return true;
  return targeting.rolloutPercentage !== undefined
    && bucketFor(name, normalizedAccountId) < targeting.rolloutPercentage;
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

  function evaluate(name, context = {}) {
    const definition = validatedDefinitions[name];
    if (!definition) return false;
    const targeted = Boolean(definition.targeting);
    const targeting = targetingDecision(name, definition.targeting, context?.accountId);
    if (targeted && targeting === null) return definition.defaultEnabled;
    if (targeted && !targeting) return false;
    if (payload && isFresh(payload, now, ttlMs) && Object.hasOwn(payload.values, name)) {
      return payload.values[name];
    }
    if (targeted) return true;
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
