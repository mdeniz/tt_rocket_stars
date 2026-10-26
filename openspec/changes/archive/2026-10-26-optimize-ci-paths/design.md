# Design: Scope-Aware CI

## Classification

The `changes` job computes the changed-file list from the event's commit range. Pull requests use the base SHA and head SHA; pushes use the event's before and after SHAs; manual runs conservatively request the full suite. Empty or unavailable ranges also request the full suite.

Documentation-only paths include OpenSpec artifacts, Markdown documentation, and repository metadata that cannot affect the built application. All other paths, including source, legacy scripts, styles, assets, tests, package manifests, lockfiles, Vite/Playwright configuration, and GitHub Actions files, request the full suite.

## Execution

The repository-check job always reports its existing check name. For documentation-only changes it runs whitespace validation and the repository's lightweight OpenSpec validation command without installing application dependencies. For full-suite changes it retains `npm ci` and `npm run check`.

The browser matrix depends on the classifier and runs only for full-suite changes. Skipped browser jobs remain visible as intentionally skipped checks; any mixed or executable change runs every browser project.

## Safety

The classifier defaults to the full suite for unknown paths, missing event metadata, empty diffs, workflow changes, and manual dispatches. This prevents false negatives at the cost of occasionally running extra CI.
