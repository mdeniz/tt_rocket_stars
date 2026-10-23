const DEFAULT_MAX_QUEUE_SIZE = 100;

const EVENT_DEFINITIONS = Object.freeze({
  app_open: Object.freeze({
    surface: Object.freeze(['game', 'settings', 'profiles']),
  }),
  session_started: Object.freeze({
    surface: Object.freeze(['game', 'settings', 'profiles']),
  }),
  mission_completed: Object.freeze({
    table: Object.freeze({ type: 'integer', min: 1, max: 12 }),
    attempted: Object.freeze({ type: 'integer', min: 1, max: 100 }),
    correct: Object.freeze({ type: 'integer', min: 0, max: 100 }),
  }),
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeFields(eventName, fields) {
  if (!isPlainObject(fields)) return null;
  const definition = EVENT_DEFINITIONS[eventName];
  if (!definition || Object.keys(fields).some(key => !Object.hasOwn(definition, key))) {
    return null;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(fields)) {
    const rule = definition[key];
    if (Array.isArray(rule)) {
      if (typeof value !== 'string' || !rule.includes(value)) return null;
      sanitized[key] = value;
      continue;
    }
    if (rule.type === 'integer' && (!Number.isInteger(value) || value < rule.min || value > rule.max)) {
      return null;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

export function createTelemetryService({
  consent = false,
  maxQueueSize = DEFAULT_MAX_QUEUE_SIZE,
  sink = null,
  now = () => Date.now(),
} = {}) {
  if (!Number.isInteger(maxQueueSize) || maxQueueSize < 1) {
    throw new TypeError('maxQueueSize must be a positive integer');
  }
  if (sink !== null && typeof sink !== 'function') {
    throw new TypeError('sink must be a function or null');
  }
  if (typeof now !== 'function') throw new TypeError('now must be a function');

  let hasConsent = consent === true;
  const queue = [];

  return {
    hasConsent: () => hasConsent,

    setConsent(value) {
      hasConsent = value === true;
      if (!hasConsent) queue.length = 0;
      return hasConsent;
    },

    record(eventName, fields = {}) {
      if (!hasConsent || !Object.hasOwn(EVENT_DEFINITIONS, eventName)) return false;
      const sanitizedFields = sanitizeFields(eventName, fields);
      if (sanitizedFields === null) return false;
      queue.push(Object.freeze({
        name: eventName,
        fields: Object.freeze(sanitizedFields),
        recordedAt: now(),
      }));
      while (queue.length > maxQueueSize) queue.shift();
      return true;
    },

    getQueuedEvents() {
      return clone(queue);
    },

    clear() {
      queue.length = 0;
    },

    async flush() {
      if (!hasConsent || queue.length === 0 || sink === null) {
        return { sent: 0, remaining: queue.length };
      }
      const batch = clone(queue);
      try {
        const result = await sink(batch);
        if (result === false) return { sent: 0, remaining: queue.length };
        queue.splice(0, batch.length);
        return { sent: batch.length, remaining: queue.length };
      } catch {
        return { sent: 0, remaining: queue.length };
      }
    },
  };
}

export { DEFAULT_MAX_QUEUE_SIZE, EVENT_DEFINITIONS };
