# Proposal

## Why

Rocket Crews need a durable account-to-pilot access model before private groups, school-managed pilots, and family linking can be implemented. The existing cloud schema stores only account-owned pilots and progress snapshots, so adding crew membership without an explicit ownership and authorization contract would risk cross-account access and ambiguous write permissions.

## What Changes

- Define the Account, Pilot, PilotAccess, Crew, and CrewMembership relationships for private learning groups.
- Preserve one global pilot identity and progress record when a pilot is visible in more than one crew.
- Separate crew membership from permission to read or modify an individual pilot.
- Define school-only and family-linked pilot states without requiring a child email address.
- Add database-enforced ownership, membership, and pilot-access boundaries with cross-account regression coverage.
- Document the data contract, access matrix, retention/deletion expectations, and migration compatibility with invited accounts and cloud synchronization.

## Capabilities

### New Capabilities

- `crew-access`: Account, pilot, crew, membership, and explicitly authorized pilot access behavior for private learning groups.

### Modified Capabilities

- None.

## Impact

- Adds Supabase migrations for crew entities, pilot access grants, constraints, indexes, and RLS policies.
- Extends schema documentation and security-focused unit/integration checks without changing local-first gameplay or existing pilot storage keys.
- Depends on the invited-account identity and cloud-progress contract delivered by issue #27.
- Does not add public discovery, child email accounts, peer metrics, family-link workflows, or teacher dashboards; those remain later issues #56–#60.
