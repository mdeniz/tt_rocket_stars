# Fix Vite release output finalization

## Why

The release plugin must preserve a stable `index.html` while exposing the
current build as `index_next.html`. Finalizing that split before Vite writes the
HTML makes builds fail intermittently or under newer Vite lifecycle ordering.

## What changes

- Finalize the stable and development entrypoints after Vite writes the bundle.
- Keep both entrypoints self-contained and preserve the existing stable-copy
  contract.

## Non-goals

- This change does not alter deployment destinations, release versions, or
  runtime authentication behavior.

