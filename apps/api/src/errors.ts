import type { Context } from 'hono';

export type ApiErrorCode = 'bad_request' | 'not_found' | 'forbidden' | 'unauthorized' | 'rate_limited' | 'configuration_error' | 'internal_error';

export class ApiError extends Error {
  readonly status: 400 | 401 | 403 | 404 | 429 | 500;
  readonly code: ApiErrorCode;

  constructor(status: ApiError['status'], code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function errorResponse(context: Context, error: unknown, requestId: string): Response {
  const apiError = error instanceof ApiError ? error : new ApiError(500, 'internal_error', 'An unexpected error occurred.');
  return context.json({ ok: false, error: { code: apiError.code, message: apiError instanceof ApiError ? apiError.message : 'An unexpected error occurred.' }, requestId }, apiError.status);
}
