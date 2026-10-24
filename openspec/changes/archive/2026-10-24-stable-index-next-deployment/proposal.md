# Separate Stable and Development Deployment Entrypoints

## Why

The current build replaces the public `index.html` with a redirect to `index_next.html`. This makes the public GitHub Pages URL show the development build instead of the latest released application.

## What Changes

- Keep the current build in `index_next.html`.
- Keep `index.html` as a self-contained fallback for local builds.
- During GitHub Pages deployment, restore the latest GitHub Release asset as `index.html`.
- Keep `index_next.html` as the current development build for internal verification.

## Out of Scope

- Changing the release versioning policy or release asset format.
- Adding authentication, access control, or a second application backend.
