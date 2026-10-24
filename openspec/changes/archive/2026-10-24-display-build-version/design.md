# Design

## Canonical source

Vite reads the version from the repository root `package.json` during HTML transformation and emits it as a small runtime constant. The About markup consumes that constant, so development, self-contained builds, and GitHub Pages distributions use the same source.

## Rendering and localization

The version value is numeric SemVer text and is inserted into a dedicated element. The surrounding label uses the existing `data-i18n` translation mechanism with new English and Spanish keys. No user data or remote request is involved.

## Verification

Unit or build-contract coverage must prove that the generated HTML contains the package version. A browser test must open About in both supported languages and verify the version text. The empirical verification workflow must exercise the same scenario with Chrome DevTools when available.
