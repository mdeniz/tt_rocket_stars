# Proposal

## Why

Issue #253 is a migration epic for reliable progress synchronization. The
browser contract and much of the local recovery behavior already exist, but
the remaining server-side atomic transaction, durable idempotency replay, and
fault-injection evidence need an explicit boundary before implementation.

## What Changes

- Record the atomic upload, optimistic concurrency, idempotency, typed-error,
  retry, recovery, and isolation contract.
- Map completed sync work to the remaining dependency-ordered implementation
  slices.
- Make hosted validation and no-production-dual-write constraints explicit.

This change is an audit/decomposition step. It does not alter runtime sync,
local storage, production providers, or traffic.

## Capabilities

### New Capabilities

- `technical/backend-sync-integrity`: local-first server synchronization
  integrity and follow-up implementation boundaries.

### Modified Capabilities

None. Existing `cloud-progress-sync` and `cloud-operation-reliability` remain
the durable client contract.

## Impact

Documentation and OpenSpec only. Follow-up slices own the atomic API,
PostgreSQL integration tests, client mapping, and hosted evidence.
