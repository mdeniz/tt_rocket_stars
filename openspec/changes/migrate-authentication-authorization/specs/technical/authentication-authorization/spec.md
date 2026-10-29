# Authentication and authorization

## Requirements

### Requirement: invitation-only authentication
The API SHALL expose Better Auth behind `/api/v1/auth/*`, disable public signup, and allow local test users only through an invitation fixture outside production.

#### Scenario: invited user signs in
- **WHEN** a local invitation creates an email/password user and the user signs in
- **THEN** the API returns a session cookie and `/api/v1/me` returns the session-derived identity

### Requirement: session lifecycle and recovery
The API SHALL support password recovery initiation, logout, session revocation, and rate limiting without requiring real email delivery.

#### Scenario: revoked session is rejected
- **WHEN** a session is revoked
- **THEN** subsequent protected requests return 401

### Requirement: account-scoped authorization
Protected services SHALL derive Account identity from the authenticated session and repositories SHALL reject resources owned by another Account.

#### Scenario: cross-account pilot access is isolated
- **WHEN** an authenticated user requests another Account's pilot
- **THEN** the API returns 404 without disclosing ownership

### Requirement: Supabase transition
The migration SHALL document that Supabase password hashes and active sessions are not transparently migrated, and SHALL require invitation, re-authentication, and explicit account linking.

#### Scenario: existing user transition
- **WHEN** an existing Supabase user is migrated
- **THEN** the user receives an invitation, establishes a new password, and confirms linking after re-authentication
