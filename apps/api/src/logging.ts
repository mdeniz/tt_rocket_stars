const SECRET_KEY = /(authorization|cookie|password|secret|token|key)/i;

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
