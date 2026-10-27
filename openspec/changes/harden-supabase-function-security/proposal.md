# Proposal

## Why

The hosted Supabase project has security-advisor findings that are not fully represented by the repository migration history, including a publicly executable `SECURITY DEFINER` event-trigger function, a mutable trigger-function search path, and disabled leaked-password protection. These discrepancies must be reconciled before the cloud boundary and typed data-access issues can be considered complete.

## What Changes

- Inventory and classify provider-managed and repository-managed database functions, event triggers, grants, and search paths.
- Remove public Data API execution from the RLS auto-enable event-trigger function while preserving its intended event-trigger behavior, or document an approved provider-managed exception.
- Harden trigger functions with explicit safe search paths and minimize callable grants for RLS helper functions.
- Enable and document leaked-password protection in Supabase Auth.
- Assess advisor-reported foreign-key indexes and either add reviewed indexes or document evidence-based deferral.
- Add migration, schema-contract, advisor, and hosted read-only verification coverage without changing browser credentials or local progress contracts.

## Capabilities

### New Capabilities

- `technical/supabase-security`: Defines the security contract for hosted Supabase functions, event triggers, grants, search paths, Auth password protection, and advisor-backed schema verification.

### Modified Capabilities

None.

## Impact

- Affects `supabase/migrations/`, migration manifests, schema/security tests, Supabase Auth project configuration, and operational documentation.
- May affect RLS helper invocation and event-trigger execution, but must not weaken account ownership, offline-first gameplay, or browser credential boundaries.
- No ORM dependency, browser bundle change, localStorage/sessionStorage change, or destructive production data operation is included.
