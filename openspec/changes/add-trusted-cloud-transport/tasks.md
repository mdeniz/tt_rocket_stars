# Tasks

## 1. Transport contract and trusted function

- [x] 1.1 Define the domain operation request, response, error, authentication, and CORS contracts for the Edge Function and verify malformed operations, oversized payloads, missing tokens, and invalid tokens are rejected by unit tests.
- [x] 1.2 Implement the Supabase Edge Function with allowlisted upload, download, list, restore, and deletion operations and verify it uses the authenticated account context rather than client-supplied ownership identifiers.
- [x] 1.3 Connect the function to the existing typed repository and RLS/security-definer contracts without renaming tables, payload fields, local storage keys, or backup envelopes; verify schema and repository tests remain green.
- [ ] 1.4 Document local serving, Supabase deployment, required function secrets, CORS origins, migration order, secret rotation, and rollback in technical English; verify every command is reproducible without committing secrets.

## 2. Browser transport and reversible rollout

- [x] 2.1 Add public function URL validation and a typed browser adapter that sends only the user's access token and domain payloads; verify the browser source contains no service-role key, database password, SQL, table names, or RPC names for the trusted path.
- [x] 2.2 Add a feature flag with a disabled-by-default fallback to the existing compatibility adapter and verify signed-out, unconfigured, offline, timeout, malformed-response, and rollback flows preserve local gameplay and backups.
- [x] 2.3 Run the shared cloud contract tests against the trusted adapter and compatibility adapter, covering upload, download, discovery, conflict, retry, deletion, malformed data, and per-account isolation; verify no local state is replaced on failure.
- [x] 2.4 Run the generated-artifact checks and `npm run check`; verify both stable `index.html` and development `index_next.html` remain self-contained and no privileged credential is present.
- [x] 2.5 Cancel active trusted requests, queued uploads, and retry attempts when the authenticated session is signed out or replaced; verify cancelled work cannot publish stale failures or synchronization metadata.
- [x] 2.6 Suppress repeated automatic synchronization after a bounded failure and resume it only after a manual request or new local save; verify the retry loop cannot keep the hosted UI in a perpetual synchronizing state.
- [x] 2.7 Include authenticated user lookup in the trusted Edge Function timeout and propagate the abort signal to the Auth request; verify an Auth provider stall returns the same bounded timeout contract.

## 3. Hosted Supabase verification

- [x] 3.1 Configure the Edge Function, public URL, secrets, CORS, Auth redirects, and migrations in the Supabase project outside the repository; verify the values are documented without recording secrets.
- [ ] 3.2 Verify two invited accounts against the hosted function: owned reads/writes succeed, cross-account access is denied, stale writes return conflicts, retries are bounded, and deletion removes only the requesting account's cloud data.
- [ ] 3.3 Verify the hosted GitHub Pages flow with Chrome DevTools evidence, including authenticated synchronization, signed-out no-request behavior, offline continuation, console/network output, and absence of administrative credentials.
- [x] 3.4 Update #184 and #170 with CI links, hosted evidence, security findings, rollback readiness, and the remaining adapter-removal gate; keep both issues open until every acceptance criterion is complete.

## Workflow follow-up

- Apply the change in a separate implementation PR after this planning change is reviewed.
- Do not enable the trusted transport in stable production or remove the compatibility adapter until hosted verification and the release rollback gate pass.
- Archive this change only after implementation, review, CI, hosted verification, and issue evidence are complete.
