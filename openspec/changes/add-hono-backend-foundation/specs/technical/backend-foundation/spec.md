# Spec Delta

## Purpose

Provides a small, versioned, locally runnable backend boundary that can host account, pilot, and synchronization services while preserving offline gameplay and preventing operational secrets from reaching clients.

## ADDED Requirements

### Requirement: Versioned API health contract

The backend SHALL expose versioned health and readiness endpoints that return JSON and SHALL not require authentication or a database connection for liveness.

#### Scenario: Liveness succeeds locally

- **WHEN** a client sends `GET /api/v1/health`
- **THEN** the backend returns HTTP 200 with `{ "ok": true, "service": "tt-rocket-stars-api" }` and a request ID

#### Scenario: Readiness reports configuration failure

- **WHEN** required runtime configuration is absent or invalid
- **THEN** `GET /api/v1/ready` returns a non-2xx JSON response without exposing secret values

### Requirement: Safe request boundary

The backend SHALL validate its runtime environment, enforce an explicit CORS origin allowlist, attach a request ID to every response, and return stable typed error envelopes without stack traces or credentials.

#### Scenario: Disallowed browser origin is rejected

- **WHEN** a request includes an origin not present in the configured allowlist
- **THEN** the backend rejects the request with a typed error and does not emit an allow-origin header

#### Scenario: Request ID is propagated

- **WHEN** a request includes a valid `X-Request-ID`
- **THEN** the response preserves that ID; otherwise the backend generates a non-empty ID and returns it

#### Scenario: Unknown route is typed

- **WHEN** a client requests an unsupported route
- **THEN** the backend returns HTTP 404 with a stable `not_found` error code and no stack trace

### Requirement: Local-first development boundary

The backend SHALL run locally without Neon, Cloudflare, email, Supabase, or other hosted credentials, and its documented startup path SHALL keep provider-specific deployment configuration separate from local defaults.

#### Scenario: Credential-free local startup

- **WHEN** a developer starts the documented local API command with only local defaults
- **THEN** the API starts and health checks are executable without contacting a hosted provider

