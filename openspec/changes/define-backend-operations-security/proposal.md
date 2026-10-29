# Proposal

## Why

Issue #255 is a migration epic covering operations, security, and developer
experience. The repository has a strong local backend foundation, but its
operational controls are distributed across code and documents. The project
needs an auditable local contract and small follow-up slices before any hosted
deployment or production change is considered.

## What Changes

- Record the current CI, local infrastructure, logging, privacy, authorization,
  migration, backup, and verification controls.
- Define provider-neutral operational contracts for correlation, redaction,
  rate limiting, dependency scanning, database privileges, incident response,
  local load tests, and deployment configuration.
- Track hosted dashboards, provider secrets, email, quotas, recovery, and traffic
  validation as explicit approval-gated work rather than local assumptions.
- Create reviewable follow-up issues without changing the offline-first frontend
  or exposing credentials.

## Capabilities

### New Capabilities

- `technical/backend-operations-security`: Defines local-first operational,
  privacy, and security readiness requirements for the backend migration.

### Modified Capabilities

None.

## Impact

This change adds operational documentation and an OpenSpec contract. It does not
modify production infrastructure, frontend storage, traffic, provider secrets,
or hosted accounts. Follow-up implementation issues may add backend-only tests
and configuration while preserving the current feature flag and local fallback.
