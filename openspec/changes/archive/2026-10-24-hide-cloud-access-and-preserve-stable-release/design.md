# Design

## Context

The ordered legacy scripts currently discover every Settings panel from the DOM and Vite emits a self-contained `dist/index.html`. GitHub Pages publishes the complete `dist` directory at the site root.

## Goals / Non-Goals

**Goals:**

- Fail closed by default for the unfinished Cloud access UI.
- Preserve cloud implementation and testability behind an explicit development flag.
- Make `index_next.html` the only self-contained generated application artifact.
- Keep root navigation working through a small relative redirect.

**Non-Goals:**

- Do not remove Supabase code, authentication, synchronization, or storage keys.
- Do not change account authorization, RLS, or cloud data contracts.
- Do not add remote resources or make offline gameplay depend on the flag.

## Decisions

- Use `VITE_ENABLE_CLOUD_ACCESS=true` as an explicit build-time opt-in, defaulting to false. This keeps production and local default builds safe while allowing cloud E2E fixtures to set a test-only runtime override before scripts execute.
- Let the settings script omit the Cloud tab and hide the panel when the flag is false. This preserves the existing DOM contract for enabled development builds and prevents the authentication script from initializing in the default build.
- Rename the generated self-contained file to `index_next.html` after Vite has performed all HTML transformations. Write `index.html` as a minimal relative redirect so GitHub Pages retains a working root entry without duplicating the large application file.
- Update release and distribution checks to address `index_next.html` explicitly. Keep Pages publishing the whole `dist` directory so both entries are available.

## Risks / Trade-offs

- [Risk] A direct user bookmark to the old root entry performs one additional navigation → Mitigation: use both a meta refresh and a script fallback with a relative URL.
- [Risk] Cloud access may appear unavailable during development when the flag is omitted → Mitigation: document the opt-in and set it in the cloud E2E fixture.
- [Risk] A future build could accidentally re-enable Cloud access → Mitigation: default false and add an E2E assertion for the default hidden state.

## Migration Plan

1. Enable the flag only in controlled local cloud tests and builds that need the unfinished UI.
2. Build and validate `dist/index_next.html`; verify the root redirect separately.
3. Deploy Pages with both files and publish GitHub Releases using the next artifact.
4. Roll back by reverting the build-output and UI flag commit; no data migration is required.
