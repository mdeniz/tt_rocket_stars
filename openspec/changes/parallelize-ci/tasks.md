# Tasks

## 1. Workflow implementation

- [x] 1.1 Add a dedicated repository-check job that runs `npm ci`, `npm run check`, and the existing Node.js/cache configuration once; verify the job completes independently of browser jobs.
- [x] 1.2 Add a browser-project matrix for Chromium, Firefox, WebKit desktop, and WebKit mobile with project-specific browser installation and cache keys; verify each matrix entry starts independently.
- [x] 1.3 Preserve WebKit system dependency installation only for WebKit matrix entries and keep mobile WebKit at one worker; verify the workflow still uses the supported Ubuntu runner and 25-minute timeout.
- [x] 1.4 Upload uniquely named per-project Playwright reports with `if: always()`; verify a failure in one browser does not overwrite or suppress another report.

## 2. Verification

- [x] 2.1 Validate workflow syntax and run the local repository checks; verify `npm run check` passes.
- [x] 2.2 Run the complete CI workflow and verify Chromium, Firefox, WebKit desktop, and WebKit mobile all report independently, with no loss of test coverage. Verified in GitHub Actions run `40376063192` on 2026-10-26: repository checks passed, and Chromium, Firefox, WebKit desktop, and WebKit mobile each completed as an independent successful job with 51 passed tests.
- [x] 2.3 Compare completed workflow durations and document the observed wall-clock improvement or any external runner-queue limitation. Run `40376063192` completed the four browser jobs concurrently; durations were Chromium 2m09s, Firefox 1m53s, WebKit desktop 3m18s, and WebKit mobile 4m48s. The workflow wall-clock time was therefore bounded by the slowest browser job (4m48s), instead of serially adding the four browser durations (12m08s), before accounting for runner scheduling overhead.

## Workflow follow-up

- Archive this tooling-only OpenSpec change after the PR is merged and the parallel CI behavior is verified.
