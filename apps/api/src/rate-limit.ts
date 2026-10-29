export interface RateLimitDecision { readonly allowed: boolean; readonly retryAfterSeconds: number }

export interface RequestRateLimiter {
  check(key: string, now?: number): RateLimitDecision;
}

export interface RateLimitOptions { readonly windowMs?: number; readonly max?: number; readonly now?: () => number }

export function createInMemoryRateLimiter(options: RateLimitOptions = {}): RequestRateLimiter {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 120;
  const now = options.now ?? (() => Date.now());
  const buckets = new Map<string, { startedAt: number; count: number }>();
  return {
    check(key, current = now()) {
      const existing = buckets.get(key);
      if (!existing || current - existing.startedAt >= windowMs) {
        buckets.set(key, { startedAt: current, count: 1 });
        return { allowed: true, retryAfterSeconds: 0 };
      }
      existing.count += 1;
      if (existing.count <= max) return { allowed: true, retryAfterSeconds: 0 };
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.startedAt + windowMs - current) / 1000)) };
    },
  };
}
