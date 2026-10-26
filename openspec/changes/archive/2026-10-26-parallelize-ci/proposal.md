# Proposal

## Why

The CI workflow currently provisions all browsers in one runner and executes the desktop and mobile suites sequentially. A slow WebKit dependency installation or browser test delays every other check and can consume the complete job timeout even when Chromium and Firefox are healthy.

## What Changes

- Split browser validation into independent Chromium, Firefox, WebKit desktop, and WebKit mobile jobs.
- Keep repository checks in a dedicated job that runs once per workflow.
- Scope Playwright browser installation and cache keys to each matrix project.
- Preserve the existing test coverage, retry policy, artifacts, Node.js version, and WebKit system-library requirements.
- Add explicit workflow documentation for parallel jobs and failure isolation.

## Capabilities

### New Capabilities

None. This is a CI orchestration and performance change with no product-runtime behavior change.

### Modified Capabilities

None.

## Impact

- Affected file: `.github/workflows/ci.yml`.
- GitHub-hosted standard Ubuntu runners execute browser projects concurrently.
- `npm ci` and the required browser cache are performed per job; public-repository runner usage remains free.
- Test reports must use unique artifact names so parallel jobs do not overwrite each other.
