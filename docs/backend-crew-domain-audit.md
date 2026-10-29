# Backend crew domain audit

This document records the implementation boundary for issue #256. It is an
epic audit and decomposition, not an implementation of the follow-up crew
features. Runtime work remains in the existing reviewable issues #56-#60.

## Current foundation

- #55 is complete and defines the durable crew-access model in
  `openspec/specs/crew-access/spec.md`.
- The local Drizzle schema already has `accounts`, `pilots`, `crews`,
  `crew_memberships`, and `pilot_access`, with composite ownership keys and
  foreign-key deletion behavior.
- Better Auth `user`/`session` identity is separate from the application
  `accounts` ownership boundary. A request identity is resolved from the
  server session; request-body user or account identifiers are never an
  authorization input.
- Existing local pilots and progress remain usable without a network request.
  Cloud synchronization is an opt-in backend concern and must not replace
  browser-local gameplay or backup behavior.

## Identity and ownership boundaries

| Principal or relation | Owns or authorizes | Must not imply |
| --- | --- | --- |
| Better Auth `User` | Authentication identity and sessions | Application data access without an account mapping |
| `Account` | Cloud-owned pilots, snapshots, sync operations, and crews | Access to another account's rows |
| `Pilot` | One stable progress identity owned by one account | A child email, a crew, or every member of a crew |
| `Crew` | Private group container owned by an account | Access to pilots without membership and an explicit grant |
| `CrewMembership` | Account membership and role (`owner`, `admin`, `member`) | Access to every pilot in the crew |
| `PilotAccess` | A revocable, pilot-specific account grant | Membership, ownership, or unrelated pilot access |
| School-only state | Scoped managed-pilot use without a family account | Family access or a child identity/email |
| Family-linked state | Explicitly authorized guardian access to a managed pilot | Public discovery, profile sharing, or duplicate progress |

The owning account remains the stable owner of a pilot even when the pilot is
associated with multiple crews. Removing a membership or grant never deletes
the pilot's global progress. Family linking must create an explicit relation;
it must not copy or merge progress records implicitly.

## Authorization matrix

| Operation | Anonymous | Account owner | Crew owner/admin | Crew member | Pilot grant | Enforcement boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Read/update own pilot and progress | Deny | Allow | Deny unless separately granted | Deny unless separately granted | Allow only for declared scope | Pilot/progress repository predicates |
| Create crew | Deny | Allow | N/A | N/A | N/A | Crew service derives owner from identity |
| Read crew metadata | Deny | Allow for owned/member crews | Allow | Allow | N/A | Membership query scoped by identity |
| Invite/remove membership | Deny | Allow for owned crew | Allow according to role policy | Deny | N/A | Membership service and transaction |
| Grant/revoke pilot access | Deny | Allow for owned pilot/crew policy | Allow according to role policy | Deny | N/A | Pilot-access service checks both relations |
| Create managed school-only pilot | Deny | Allow through crew policy | Allow according to #57 | Deny | N/A | Managed-pilot service, no child email |
| Link/unlink family account | Deny | Allow only through consent policy | Allow only through #58 policy | Deny | N/A | Family-link service and audit trail |
| Read aggregate metrics | Deny | Own scope | Scoped crew scope | No private details | No expansion | Aggregation service with privacy threshold |

Every service/repository method takes a server-resolved identity and derives
the account and relation predicates. A client-supplied `userId`, `accountId`,
`crewId`, or `pilotId` can select a resource but cannot establish permission.
The API must return the same non-disclosing forbidden/not-found behavior for
cross-account probes.

## Dependency-ordered implementation slices

The existing issues are intentionally reused rather than duplicated:

1. #55 (done): schema and access contract. It is the prerequisite for all
   slices below.
2. #56: private crew creation, invitations, role checks, expiry, and
   revocation. Tests must cover owner/admin/member authorization and removal
   without pilot deletion.
3. #57: teacher-managed school-only pilots. Tests must cover pseudonymous
   identity, scoped device access, logout, cross-pilot isolation, local
   gameplay, and no child email requirement.
4. #58: consented family linking/unlinking. Tests must cover consent,
   idempotency/no duplicate progress, school-only continuity, safe unlink, and
   auditability. It depends on #56 and #57.
5. #59: teacher dashboard aggregates. Tests must cover crew scope, privacy
   thresholds, no private payload leakage, retention, accessibility, and
   bilingual UI. It depends on the access rules and managed-pilot semantics.
6. #60: peer achievements/challenges. Tests must cover per-group visibility,
   no public profiles/chat/sensitive details, isolated challenge progress, and
   offline gameplay. It depends on crew access and privacy-safe aggregates.

Each slice must add service/repository integration tests for anonymous,
authenticated, revoked, forbidden, and cross-account cases. Hosted RLS,
provider-backed consent/minor safeguards, and production rate-limit stores are
separate verification gates and cannot be inferred from local PostgreSQL.

## Migration and rollout constraints

- Existing Supabase crew placeholders must be mapped to stable application
  accounts and pilots before any migration write. A migration must be
  idempotent, preserve local pilot IDs/progress, and produce an audit report for
  unresolved ownership.
- Supabase sessions are not migrated. Better Auth re-authentication and the
  invitation transition described in `docs/backend-authentication.md` remain
  the account-linking boundary.
- The frontend stays behind the existing safe migration flag. No crew feature
  may make network access mandatory for gameplay, backups, or local profiles.
- No production Supabase/Neon/DNS/secret/traffic change is part of #256.

## Verification status

Local schema and contract inspection is complete. The historical #55 record
contains hosted Supabase RLS evidence, but this audit does not repeat or extend
that hosted check. Current Better Auth/Drizzle crew behavior, real provider
delivery, minor-safeguarding controls, and hosted rate limiting remain
unverified until their follow-up slices and approval-gated environments exist.
