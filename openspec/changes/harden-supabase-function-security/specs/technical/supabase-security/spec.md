# Spec Delta

## Purpose

The Supabase security capability keeps hosted database functions, event triggers,
role grants, authentication protections, and migration evidence aligned with the
repository's account-isolation and least-privilege contracts.

## ADDED Requirements

### Requirement: Provider functions have explicit execution boundaries

Every provider-managed or repository-managed function used by the application MUST have an explicit security mode, fixed search path where applicable, and role grant set represented by reviewed migration or documented provider configuration.

#### Scenario: Public event-trigger helper is not a Data API endpoint

- **WHEN** an unauthenticated or authenticated client invokes the RLS auto-enable helper through the Data API
- **THEN** the invocation is rejected
- **AND** the configured DDL event trigger continues to apply its intended RLS behavior

#### Scenario: Trigger function has a fixed search path

- **WHEN** a trigger executes the timestamp-maintenance function
- **THEN** object resolution uses an explicit trusted search path
- **AND** the function does not depend on the caller's mutable search path

#### Scenario: RLS helper grants remain least privilege

- **WHEN** an authenticated request evaluates crew membership or administration policies
- **THEN** the required helper can execute only for the intended authenticated policy path
- **AND** anonymous callers cannot execute the helper or infer protected crew data

### Requirement: Auth rejects known compromised passwords

Supabase Auth MUST enable leaked-password protection for invited-account password creation, recovery, and change flows, and the setting MUST be recorded in operational configuration documentation.

#### Scenario: Compromised password is rejected

- **WHEN** an invited user attempts to set or change a password found in the configured compromised-password corpus
- **THEN** Auth rejects the password without creating or invalidating a valid session unexpectedly
- **AND** local gameplay and local progress remain available

### Requirement: Security configuration is reproducible and auditable

The repository MUST provide deterministic migration and verification evidence for function grants, RLS boundaries, Auth security settings, and advisor findings without exposing administrative credentials or mutating user progress.

#### Scenario: Clean migration verification

- **WHEN** migration validation runs from a clean checkout
- **THEN** migration ordering and checksums match the committed manifest
- **AND** security contract tests pass without requiring a service-role credential in the browser

#### Scenario: Advisor findings are resolved or explicitly deferred

- **WHEN** the configured Supabase security and performance advisors are reviewed
- **THEN** each relevant finding is fixed by reviewed schema/configuration or documented with evidence and an owner
- **AND** unrelated product work is not marked complete while a security finding remains unexplained
