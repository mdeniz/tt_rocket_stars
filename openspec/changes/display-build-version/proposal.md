# Display the Current Build Version

## Why

Users and maintainers need to identify the exact application build running in a browser, including an offline self-contained release. The About screen currently has no version information, which makes release verification and support difficult.

## What Changes

- Inject the canonical `package.json` version during Vite HTML transformation.
- Display the injected version on the About screen with localized labels in English and Spanish.
- Verify the version in unit, build, and browser tests without adding network or persistence dependencies.

## Out of Scope

- Commit hashes, release channels, update checks, or remote version lookups.
- Changes to local pilot data, gameplay, authentication, or release numbering policy.
