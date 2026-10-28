# technical/typed-data-access Specification

## Purpose
Provide a typed, server-side data-access boundary and reproducible migration workflow
for cloud data without coupling browser gameplay to Supabase-specific queries or
administrative credentials.

## Requirements

### Requirement: Domain data access is typed and provider-isolated

The trusted backend or Edge Function boundary MUST expose typed operations for pilots,
crews, memberships, pilot access grants, and versioned progress snapshots. Browser UI
and gameplay code MUST depend only on domain contracts and MUST NOT construct provider-
specific queries or receive service-role credentials.

#### Scenario: Read an owned pilot

- **WHEN** an authenticated request asks for one of the account's pilots
- **THEN** the domain boundary validates the request and returns the typed pilot result
- **AND** the provider adapter applies the authenticated ownership constraint
- **AND** an identifier belonging to another account returns no unauthorized data

#### Scenario: Read a granted pilot

- **WHEN** an authenticated crew member requests a pilot through an active explicit grant
- **THEN** the domain boundary returns only the grant-authorized fields and access level
- **AND** crew membership alone does not grant pilot access

### Requirement: Snapshot writes preserve authorization and concurrency

The data-access boundary MUST preserve authenticated ownership, explicit pilot access,
optimistic version checks, and the existing conflict semantics for progress snapshots.

#### Scenario: Write the expected snapshot version

- **WHEN** an authenticated client writes a snapshot with the current expected version
- **THEN** the operation validates the payload and advances the version atomically
- **AND** the result contains the new version and update timestamp

#### Scenario: Write a stale snapshot version

- **WHEN** a snapshot write uses a stale expected version
- **THEN** the operation rejects the write as a conflict
- **AND** the existing remote snapshot remains unchanged

### Requirement: Migrations have one reproducible application source

Schema changes MUST have deterministic ordering, a single checked-in migration source,
and validation that can run against a clean PostgreSQL-compatible database in local
development and CI before application to Supabase.

#### Scenario: Validate a clean migration history

- **WHEN** CI validates the migration workflow from an empty database
- **THEN** every migration applies in order without manual edits
- **AND** the resulting schema satisfies the typed data-access contract and RLS tests

#### Scenario: Detect schema drift

- **WHEN** the migration validator compares the checked-in history with the target
  schema or generated metadata
- **THEN** unexpected drift fails the check with an actionable diagnostic
- **AND** no production migration is attempted automatically

### Requirement: Migration operations have documented recovery boundaries

The project MUST document how to create, validate, apply, and recover from a failed
migration, including which operations are transactional, which require forward fixes,
and how to protect or restore cloud data before production changes.

#### Scenario: Migration application fails

- **WHEN** a local, CI, or hosted migration fails
- **THEN** the workflow reports the migration identifier and failure boundary
- **AND** it does not silently mark the migration as applied
- **AND** the documented recovery procedure identifies rollback or forward-fix steps

### Requirement: Existing compatibility contracts remain unchanged

Introducing the typed data-access boundary MUST NOT rename or delete existing
localStorage/sessionStorage keys, backup fields, pilot identifiers, cloud payload fields,
RLS ownership rules, or offline gameplay behavior.

#### Scenario: Cloud is unavailable

- **WHEN** the provider or trusted backend is unavailable or unconfigured
- **THEN** local gameplay and local persistence remain usable without a network request
- **AND** no local progress is deleted or replaced

#### Scenario: Browser bundle is inspected

- **WHEN** the production bundle is inspected for credentials
- **THEN** it contains only publishable client configuration
- **AND** it contains no service-role or administrative secret
