const OPERATIONS = new Set(['upload', 'download', 'listPilots', 'restorePilot', 'deleteCloudData']);
const MAX_BODY_BYTES = 256 * 1024;
const MAX_LOCAL_ID_LENGTH = 120;

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function assertLanguage(value) {
  if (value !== 'en' && value !== 'es') fail('invalid_payload', 'language must be en or es');
}

function assertPilotSnapshot(value) {
  if (!isRecord(value)) fail('invalid_payload', 'pilot must be an object');
  if (typeof value.localId !== 'string' || value.localId.trim() === '' || value.localId.length > MAX_LOCAL_ID_LENGTH) {
    fail('invalid_payload', 'pilot.localId is invalid');
  }
  if (typeof value.name !== 'string' || value.name.trim() === '' || value.name.length > 80) {
    fail('invalid_payload', 'pilot.name is invalid');
  }
  assertLanguage(value.language);
  if (!isRecord(value.payload)) fail('invalid_payload', 'pilot.payload must be an object');
  if (typeof value.updatedAt !== 'string' || Number.isNaN(Date.parse(value.updatedAt))) {
    fail('invalid_payload', 'pilot.updatedAt is invalid');
  }
  return {
    localId: value.localId.trim(),
    name: value.name.trim(),
    avatar: value.avatar == null ? null : String(value.avatar),
    language: value.language,
    payload: value.payload,
    updatedAt: value.updatedAt,
  };
}

export function parseRequestBody(body, byteLength = JSON.stringify(body ?? {}).length) {
  if (byteLength > MAX_BODY_BYTES) fail('payload_too_large', 'request body is too large');
  if (!isRecord(body) || typeof body.operation !== 'string' || !OPERATIONS.has(body.operation)) {
    fail('invalid_operation', 'operation is not allowed');
  }
  if (body.operation === 'upload') {
    return { operation: body.operation, pilot: assertPilotSnapshot(body.pilot), expectedVersion: normalizeVersion(body.expectedVersion) };
  }
  if (body.operation === 'download' || body.operation === 'restorePilot') {
    return { operation: body.operation, localId: normalizeLocalId(body.localId) };
  }
  return { operation: body.operation };
}

function normalizeLocalId(value) {
  if (typeof value !== 'string' || value.trim() === '' || value.length > MAX_LOCAL_ID_LENGTH) {
    fail('invalid_payload', 'localId is invalid');
  }
  return value.trim();
}

function normalizeVersion(value) {
  if (value === undefined || value === null) return 0;
  if (!Number.isSafeInteger(value) || value < 0) fail('invalid_payload', 'expectedVersion is invalid');
  return value;
}

export function parseBearerToken(header) {
  const match = typeof header === 'string' ? header.match(/^Bearer\s+([^\s]+)$/i) : null;
  if (!match) fail('unauthorized', 'authenticated user required');
  return match[1];
}

export function allowedOrigin(origin, configuredOrigins = '') {
  if (!origin) return '';
  const allowed = String(configuredOrigins).split(',').map(value => value.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

export function errorResponse(error) {
  const code = ['invalid_operation', 'invalid_payload', 'payload_too_large', 'unauthorized'].includes(error?.code)
    ? error.code
    : String(error?.code || '') === '40001' || String(error?.message || '').toLowerCase().includes('snapshot version conflict')
      ? 'conflict'
      : 'cloud_unavailable';
  const status = code === 'unauthorized' ? 401 : code === 'invalid_operation' || code === 'invalid_payload' || code === 'payload_too_large' ? 400 : code === 'conflict' ? 409 : 502;
  return { status, body: { error: code, message: code === 'unauthorized' ? 'Authentication required.' : code === 'conflict' ? 'The cloud snapshot has changed.' : 'Cloud operation failed.' } };
}

export { MAX_BODY_BYTES, OPERATIONS };
