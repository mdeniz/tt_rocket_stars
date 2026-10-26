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

## Chrome DevTools evidence

Chrome DevTools MCP was connected for a signed-out verification session at:

```text
https://mdeniz.github.io/tt_rocket_stars/index_next.html?verify=167
```

The following actions and observations were recorded:

1. Loaded `index_next.html` and confirmed the development artifact rendered the
   `Progress` screen without a blank screen or application exception.
2. Opened the game menu and selected `Settings`; the Settings screen rendered
   successfully.
3. Confirmed `Cloud access` is an independent panel below the settings
   categories, with password sign-in and cloud controls visible but disabled
   while signed out.
4. Selected `Sound`; the `Sound & music` panel rendered the sound toggle,
   volume sliders, soundtrack selector, and test-sound controls rather than a
   different settings panel.
5. Read the console and network panels after navigation. There were no
   application errors. The only console entry was Chrome's accessibility warning
   that password forms may include a username field. Network activity contained
   the page document and embedded `data:` image resources; no Supabase Auth,
   REST, or other cloud request was made while signed out.

Real iPhone/iPad Safari was not used. Playwright WebKit remains a compatibility
signal and is not evidence of real iOS Safari behavior.

## Production-provider limitation

The current deployment has no trusted backend or Edge Function transport. The
publishable Supabase adapter remains behind the typed browser boundary as a
reversible compatibility implementation. The `legacyCloudDirectFallback` flag
is disabled by default in both stable and development builds.

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
