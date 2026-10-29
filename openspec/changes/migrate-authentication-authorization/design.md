# Design

Better Auth is constructed by an API-owned factory. Tests use its memory adapter; the local Worker uses the Drizzle PostgreSQL adapter. Hono mounts the handler at `/api/v1/auth/*`, and protected routes derive `AuthIdentity` from the session cookie.

An authenticated user maps to an Account boundary. Pilots are owned by an Account, while Crew ownership and membership remain domain relationships. Repositories accept the authenticated identity and perform ownership predicates; client-supplied account or user IDs are never authorization inputs. Missing or foreign resources return the same not-found response.

Signup is disabled. A local-only invitation fixture creates verified test users without delivery. Password reset requests are handled by Better Auth and capture the generated URL locally. Rate limits use in-memory storage for local tests; hosted deployments must use a shared durable store and trusted proxy configuration.

Supabase passwords are not assumed portable. Existing users must be invited into the new system, re-authenticate with a new password, and explicitly link identities after verification. Existing Supabase sessions are invalidated by the cutover and are never copied. Frontend adoption remains behind a future migration flag.
