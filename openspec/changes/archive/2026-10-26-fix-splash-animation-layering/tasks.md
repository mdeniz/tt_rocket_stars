# Tasks

## 1. Regression coverage

- [x] 1.1 Add a splash layering E2E assertion that verifies the legacy animated launch scene is visible and the React placeholder overlay is not visible before entry; verify it fails against the current implementation.

## 2. Runtime fix

- [x] 2.1 Keep the legacy launch scene visible when present and render the React splash only as an explicit fallback; verify the focused splash test passes and the existing splash entry tests remain green.

## 3. Verification and evidence

- [x] 3.1 Run the proportional unit, build, and browser checks, then verify the running development `index_next.html` path with browser evidence and record the results in the PR/issue; verify no startup console errors or unexpected network requests are introduced.
