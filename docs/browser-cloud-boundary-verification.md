# Browser Cloud Boundary Verification

## Scope

This record covers the `migrate-legacy-browser-cloud-boundary` OpenSpec change
after PR #188 was integrated as commit `a40be4b`.

## Automated running-application evidence

The credential-free cloud fixture was exercised against the running Vite
application at `http://127.0.0.1:4173/` with the Chromium Playwright project.
The command completed with 11 passing tests:

```text
npx playwright test tests/e2e/cloud-sync.spec.cjs --project=chromium
11 passed (33.4s)
```

The observed scenarios were:

- invited account setup and password login/recovery feedback;
- safe handling of rejected and expired credentials;
- password change and logout;
- authenticated local-first upload;
- cloud deletion without removing local progress;
- cloud-only pilot discovery and restore;
- stale-write recovery and bounded retry behavior;
- local-only startup with no authentication or REST requests.

The fixture assertions observed the expected authenticated REST/Auth request
paths for the provider contract and verified that the local-only scenario made
no cloud requests. The tests use an in-memory provider fixture and do not use
production credentials or email delivery.

## Browser matrix evidence

PR #188 CI run [40404704821](https://github.com/mdeniz/tt_rocket_stars/actions/runs/40404704821)
passed all configured checks:

- Chromium: passed in 1m29s.
- Firefox: passed in 2m24s.
- Desktop WebKit: passed in 4m33s.
- Mobile WebKit: passed in 5m28s.
- Repository checks: passed.

Playwright WebKit is not evidence of real iPhone Safari behavior.

## DevTools and production-provider limitation

Chrome DevTools MCP was not connected in this environment, so no DevTools
console or network recording is claimed. Real iPhone/iPad Safari was also not
used. The available running-application evidence is therefore the Playwright
Chromium fixture run above, supplemented by the full CI browser matrix.

The current deployment has no trusted backend or Edge Function transport. The
publishable Supabase adapter remains behind the typed browser boundary as a
reversible compatibility implementation. The `legacyCloudDirectFallback` flag
is disabled by default in both stable and development builds.

## Audit result

The implementation and artifact checks are integrated and green. The final
trusted-transport decision and real-device verification remain follow-up work;
the related issues must remain in verification rather than being marked done
until those dependencies are resolved or explicitly accepted as a documented
compatibility exception.
