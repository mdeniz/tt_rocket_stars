const SECRET_KEY = /(authorization|cookie|password|secret|token|key)/i;
const PRIVATE_KEY = /(authorization|answer|body|child|cookie|email|password|payload|pilot|secret|token|key)/i;

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, SECRET_KEY.test(key) ? '[REDACTED]' : redact(entry)]));
}

export function createLogger(write: (line: string) => void = line => console.log(line)) {
  return (event: string, fields: Record<string, unknown> = {}): void => {
    const safeFields = redact(fields) as Record<string, unknown>;
    write(JSON.stringify({ event, ...safeFields, timestamp: new Date().toISOString() }));
  };
}

export interface ErrorEventInput {
  requestId: string;
  status: number;
  code: string;
}

export function createErrorEvent(input: ErrorEventInput): Record<string, unknown> {
  return {
    event: 'api.error',
    requestId: input.requestId.slice(0, 128),
    status: input.status,
    code: input.code.slice(0, 64),
    timestamp: new Date().toISOString(),
  };
}

export function safeErrorFields(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).filter(([key]) => !PRIVATE_KEY.test(key)).map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 256) : value]));
}
