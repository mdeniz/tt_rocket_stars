# TT Rocket Stars 🚀

Offline-first educational multiplication and division game (tables 1–12) with space missions, planets, rewards, rockets, and pilot profiles. No ads or accounts.

**Semantic version:** `0.1.1`. Historical prototype **v190** is the starting point, not a SemVer version.

## Development

Requires Node.js 22:

```bash
npm install
npm run dev
npm run check
npx playwright install
npm run test:e2e
npm run build
npm run preview
```

## Creating a release

After documenting changes under `Unreleased` in `CHANGELOG.md`, generate the distributable HTML with one of these commands:

```bash
npm run release -- patch
npm run release -- minor
npm run release -- major
# or an explicit version greater than the current one:
npm run release -- 0.2.0
```

The command validates the SemVer, runs `npm run check`, updates `package.json`, `package-lock.json`, `README.md`, and `CHANGELOG.md`, and generates `releases/tt-rocket-stars-vX.Y.Z.html`. It does not create commits, Git tags, or publications.

After committing those changes, push the corresponding tag to publish the same HTML as a GitHub Release:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

The workflow requires the tag to match `package.json` exactly and requires a matching entry in `CHANGELOG.md`.

The mobile application is published at [GitHub Pages](https://mdeniz.github.io/tt_rocket_stars/). Every push to `main` rebuilds and deploys the self-contained HTML through the Pages workflow.

Vite serves the application at http://localhost:5173. `npm run build` generates a self-contained distribution at `dist/index.html`: CSS, JavaScript, and visual resources are embedded, so it can be copied or opened without adjacent files. Do not open the development `index.html` directly: Vite injects translations during development and build. The repository includes `package-lock.json`, and CI uses `npm ci` for reproducible installations.

Cloud synchronization setup is documented in [`docs/supabase-brevo-setup.md`](docs/supabase-brevo-setup.md). It is optional: local gameplay and backups remain available without a Supabase project or an authenticated account.

## Structure

```text
index.html                   Vite HTML entry point
vite.config.mjs              Vite configuration and translations
src/styles/legacy.css        Legacy CSS, original order
public/legacy/scripts/       32 ordered classic scripts
src/locales/{es,en}.json     Declarative translations
src/data/                    Domain data (migration pending)
src/assets/                  SVG, audio, and images (migration pending)
scripts/                     Validation and i18n tools
tests/unit/                  Unit tests
tests/e2e/                   Playwright Chromium/Firefox/WebKit tests
.github/workflows/ci.yml     CI
AGENTS.md                    Agent instructions
CHANGELOG.md                 SemVer and changes
openspec/                    Product and technical specifications
```

v190 was a single HTML file. Styles and scripts have been extracted while preserving order and semantics. Logic, data, inline SVG, and dynamic text must be modularized progressively without duplicating sources of truth.

## Quality and browsers

`npm run check` validates the syntax of the 32 scripts, translations, and build. `npm run test:e2e` checks startup and navigation in Chromium, Firefox, WebKit, and mobile WebKit. Linux WebKit does not replace real iPhone Safari testing. Validate the first tap, audio, fullscreen, restricted storage, and orientation on iOS.

## Versioning

Use MAJOR.MINOR.PATCH. PATCH means compatible fixes; MINOR means features and documented changes during 0.x; MAJOR means a stable contract or incompatible changes after 1.0. Update `package.json`, the lockfile, and `CHANGELOG.md`, run the tests, and create a `vX.Y.Z` tag. Do not continue numbering HTML files as v191 or v192.

## Privacy and data

Progress is stored locally per pilot, with no cross-device synchronization. Clearing browser data may delete it; use backups.

## License

No open-source license is defined. All rights reserved.
