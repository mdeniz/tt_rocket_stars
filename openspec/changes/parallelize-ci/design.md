# Design

## Context

The CI workflow uses Node.js 22 and Playwright on `ubuntu-24.04`. `npm run check` already includes unit tests and a build. The browser configuration exposes `chromium`, `firefox`, and `webkit`, while `webkit-mobile` is enabled through `PLAYWRIGHT_MOBILE=1`. WebKit system libraries are the slowest and least predictable setup step.

## Goals / Non-Goals

**Goals:**

- Reduce wall-clock time by running independent browser projects concurrently.
- Ensure a WebKit setup failure does not prevent Chromium or Firefox from producing useful results.
- Avoid installing unrelated browser binaries in each job.
- Keep a single repository-check job and preserve all existing coverage.

**Non-Goals:**

- Reducing the number of browser projects or tests.
- Running tests concurrently inside one browser context.
- Changing application code, Playwright assertions, retries, or test data contracts.

## Decisions

- Use a GitHub Actions matrix with one entry per Playwright project. This gives independent runners and clear per-browser status checks.
- Run `npm run check` in a separate `repository-checks` job. Browser jobs depend only on checkout and installation, not on this job, so browser feedback can start immediately.
- Install only the matrix browser with `npx playwright install <browser>`. Run `npx playwright install-deps webkit` only for WebKit entries.
- Use cache keys that include the matrix project and lockfile hash. This prevents a browser cache miss from invalidating unrelated browser jobs.
- Keep desktop browser jobs at two Playwright workers and mobile WebKit at one worker because the mobile suite is more resource-sensitive.
- Upload reports with the project name in the artifact name and use `if: always()` so one failed matrix entry does not hide another report.

## Risks / Trade-offs

- [Risk] Four jobs repeat checkout, `npm ci`, and runner startup. → [Mitigation] npm and Playwright caches are retained; parallel execution reduces wall-clock time and public standard runners are free.
- [Risk] A shared cache key could serve incomplete browser content after cancellation. → [Mitigation] Use project-specific cache keys and let Playwright validate/install the selected browser.
- [Risk] More concurrent jobs can make GitHub queue jobs during service load. → [Mitigation] Keep the matrix limited to the four required projects and retain the 25-minute per-job timeout.

## Migration Plan

1. Replace the monolithic browser job with the repository-check job and browser matrix.
2. Validate YAML, run the repository checks locally, and observe all four CI matrix entries.
3. If a matrix job is incompatible with the runner, revert the workflow commit; application code and test behavior are unchanged.
