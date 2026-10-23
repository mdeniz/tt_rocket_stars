# Tasks

## 1. Provider and configuration boundary

- [x] 1.1 Add public Supabase URL and anonymous-key placeholders to the environment configuration, document local and GitHub Pages redirect URLs, and verify that no service-role credential is present with repository secret scanning.
- [ ] 1.2 Select an SMTP provider that preserves Supabase Auth URLs, configure its verified sender outside the repository, document delivery limits, and verify invitation and password-recovery emails reach an external test address without link rewriting.
- [ ] 1.3 Disable public Supabase signups, document the trusted invitation process, and verify that an uninvited address cannot create an account while an invited address can receive a link.
- [ ] 1.4 Add a developer setup document for Supabase and the selected SMTP provider, including secret ownership, sender verification, invitation management, and rollback steps, and verify every documented dashboard value has a corresponding application setting.

## 2. Optional authentication

- [ ] 2.1 Add the browser Supabase client with safe configuration validation and verify the app remains playable when configuration is absent.
- [ ] 2.2 Add invite-only invitation acceptance, initial password setup, email-and-password sign-in, session restoration, password recovery, sign-out, expiration handling, and HTTPS redirects, and verify invited and uninvited flows on the GitHub Pages deployment and a local Vite origin.
- [ ] 2.3 Add Spanish and English authentication and synchronization messages and verify translation validation reports no missing keys.

## 3. Cloud data model and authorization

- [ ] 3.1 Add versioned migrations for account-owned pilots, per-pilot snapshots, and synchronization metadata, and verify the schema matches the cloud-progress-sync spec.
- [x] 3.2 Add Row Level Security policies for authenticated ownership and verify that authenticated and unauthenticated cross-account read, insert, update, and delete attempts are rejected or allowed as specified. Repository tests cover the SQL contract; provider-backed cross-account execution remains a deployment check.
- [x] 3.3 Add account-level cloud deletion and verify it removes only the requesting account's cloud data while leaving local state and backups unchanged. The authenticated function and local preservation contract are covered; live provider execution remains pending.

## 4. Local-first synchronization

- [ ] 4.1 Add a synchronization adapter that serializes the existing per-pilot payload without renaming or deleting local storage keys, and verify compatible round-trip import and export tests pass.
- [ ] 4.2 Synchronize local snapshots after authentication and on safe local saves with retryable failure handling, and verify offline gameplay and local progress remain available when the service is unavailable.
- [x] 4.3 Add optimistic version checks for stale writes, create a recovery backup before replacement, and verify the conflict flow offers local and remote choices without silent data loss.
- [ ] 4.4 Restore a pilot on a second device after authentication and verify pilot separation, language, progress, missions, garage state, and achievements remain consistent.

## 5. User controls and integration verification

- [ ] 5.1 Add account status, sign-in, sign-out, sync status, manual synchronization, and cloud deletion controls, and verify the controls are usable without an account and on mobile Safari.
- [x] 5.2 Add unit and integration coverage for session handling, serialization, retries, stale versions, conflict recovery, and per-account isolation, and verify CI runs without production credentials or real email delivery.
- [ ] 5.3 Add E2E coverage for an authenticated return flow and two-device synchronization using isolated test fixtures, and verify WebKit coverage is treated as a signal rather than an iOS Safari guarantee.
- [ ] 5.4 Update README, privacy guidance, and OpenSpec references with local-versus-cloud behavior and free-tier failure modes, and verify the documented commands and URLs are valid.

## Workflow follow-up

- Archive the change after the implementation and review requirements are complete.
- Verify the archived capabilities are present under `openspec/specs/` and that the offline-web-app delta has been reconciled with the new cloud-progress-sync capability.
