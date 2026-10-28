# Cloud Operation Verification

Verification record for the `serialize-cloud-operations` OpenSpec change.

## Local checks

- `npm run check`: passed. This ran the repository checks, 194 unit tests, the Vite production build, and the self-contained distribution check.
- `openspec validate serialize-cloud-operations --strict --no-interactive`: passed.
- `git diff --check`: passed.
- `npx playwright test tests/e2e/cloud-sync.spec.cjs --project=chromium`: passed, 15 tests.
- `npx playwright test tests/e2e/cloud-sync.spec.cjs --project=webkit`: unavailable; the repository Playwright configuration currently defines only the `chromium` project. This is not treated as real Safari evidence.

## Browser smoke check

The local Vite application was started at `http://127.0.0.1:5173/` and exercised with the available `agent-browser` fallback:

1. Loaded the application and confirmed the splash screen exposed `Start TT Rocket Stars`.
2. Started the application and dismissed the onboarding overlay.
3. Opened the main menu and navigated to Settings.
4. Confirmed the Cloud access section rendered with its controls disabled while Supabase was not configured locally.
5. Inspected the tracked browser requests; no failing XHR or fetch requests were recorded.

Chrome DevTools MCP verification was unavailable: `mcp__chrome_devtools__list_pages` returned `Transport closed`. This is recorded as unavailable rather than as a passing DevTools check.

## Hosted verification status

Hosted verification remains pending. The queue change has not been deployed, and the secure cloud-deletion migration has not yet been applied to the hosted Supabase project. The related issue must remain in `status:verification` until both changes are deployed and the two-account concurrency and pool checks are repeated.

A read-only Supabase unified-log query for 2026-10-28 found 0 `PGRST003`
entries in `postgrest_logs`. This is a health observation only; it does not
prove the new queue behavior because the queue has not been deployed.

## Hosted deletion migration verification

After applying migration `20261028164815_secure_cloud_deletion_rpc` through
Supabase MCP, the hosted development artifact was exercised with two isolated
browser sessions:

- The first invited account authenticated, listed its cloud pilots, and still
  saw its own pilots after the second account's deletion.
- The second invited account authenticated, listed its account-scoped pilots,
  confirmed the destructive prompt, and received `Cloud data deleted. Local
  progress remains available.`
- A subsequent list for the second account returned no cloud-pilot section,
  while the first account's list remained available.
- The migration history contains `20261028164815_secure_cloud_deletion_rpc`.
- Catalog inspection confirmed `SECURITY DEFINER`, no `public` or `anon`
  execution privilege, and `authenticated` execution privilege.
- A post-test read-only log query found 0 `PGRST003` entries for the day.

The Chrome DevTools MCP was unavailable during this run, so this evidence was
collected with the `agent-browser` fallback and does not claim DevTools network
or console evidence. The hosted queue/concurrency requirement remains open
until the browser queue is deployed and the overlap check is repeated.
