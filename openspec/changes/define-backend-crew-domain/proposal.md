# Proposal

## Why

Issue #256 is an epic for moving Rocket Crews onto the new identity and domain
model. The account, pilot, membership, and pilot-access foundation already
exists in #55, while #56-#60 provide the implementation slices. The epic needs
one auditable boundary and dependency map so those slices do not reintroduce
cross-tenant access, duplicate pilot progress, or a mandatory network path.

## What Changes

- Record the Account, Pilot, Crew, CrewMembership, PilotAccess, school-only,
  and family-linked boundaries.
- Define a service/repository authorization matrix and cross-account test
  obligations.
- Sequence the existing #56-#60 work and document migration and hosted
  verification gates.

This change does not implement crew runtime APIs, alter production providers,
or change the offline-first frontend.

## Capabilities

### New Capabilities

- `technical/backend-crew-domain`: defines the local-first crew-domain
  boundaries and implementation sequence.

### Modified Capabilities

None. The durable `crew-access` capability from #55 remains the source of
truth for the database access contract.

## Impact

Documentation and OpenSpec only. Follow-up issues own runtime changes and
their corresponding local and hosted verification.
