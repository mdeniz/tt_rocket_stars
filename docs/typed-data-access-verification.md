# Typed Data Access Verification

## Automated evidence

The typed data-access foundation was verified from a clean Vite development server with the following commands:

| Check | Result |
| --- | --- |
| `openspec validate introduce-typed-data-access-migrations --strict` | Passed |
| `npm run check` | Passed: legacy, cutover, retirement, migration, typecheck, 154 unit tests, and build |
| `PLAYWRIGHT_FULL=1 VITE_REACT_CORE_SCREENS=true npx playwright test --project=chromium` | Passed: 53/53 |
| `PLAYWRIGHT_FULL=1 PLAYWRIGHT_MOBILE=1 VITE_REACT_CORE_SCREENS=true npx playwright test --project=webkit-mobile` | Passed: 53/53 |
| `git diff --check` | Passed |
| `npm run check:migrations` | Passed: four ordered migrations match the manifest |
| `node --test tests/unit/migrations.test.cjs` | Passed: 2/2 |
| `node --experimental-strip-types --test tests/unit/typed-data-access.test.cjs` | Passed: 4/4 |

The browser suites exercised local-only startup, offline gameplay, pilot-local persistence, backup and restore behavior, cloud-safe failures, authenticated cloud fixtures, optimistic conflicts, translations, and mobile WebKit layout behavior.

## Artifact and environment findings

- On 2026-10-26, `dist/index.html` and `dist/index_next.html` were scanned for
  `service_role`, `supabase_service_role`, and `sb_secret`; no administrative
  credential markers were found. The artifacts contain only the configured
  publishable browser configuration contract.
- The generated browser artifacts still contain provider-specific Supabase calls
  from the existing compatibility path (`/auth/v1`, `/rest/v1`, `on_conflict`,
  and `delete_my_cloud_data`). This is an identified compatibility boundary, not
  a credential leak. The trusted typed repository remains server-side and
  provider-neutral; removing these browser calls belongs to follow-up issue #184
  after a trusted transport is deployed and verified.
- `dist/index.html` and `dist/index_next.html` were generated and scanned from
  the same source revision; their SHA-256 was
  `1c8fc75c67a4ab40a1aadcb3abb6d859daba85421c3102f2b1b25d70d8fe4440` for this
  local verification build.
- `npm run db:migrations:reset` was attempted and correctly reported that no local Supabase project is configured. A hosted Supabase reset was not attempted because it would be destructive.
- Chrome DevTools MCP evidence for the running development application is
  recorded in `docs/browser-cloud-boundary-verification.md` and
  `docs/react-cutover-chrome-devtools-verification.md`. Playwright verification
  remains separate from real iOS Safari validation.

## Manual verification follow-up

Before closing the issue, review this evidence against the issue acceptance criteria, obtain CI results for the pull request, and decide whether the remaining legacy browser-provider boundary is in scope for this change or should be tracked as a separate migration.

## Final audit

Reviewed on 2026-10-27 against issue #170, the OpenSpec requirements, the merged CI
matrix, repository security checks, and the documented rollback procedure.

| Audit area | Result | Evidence or decision |
| --- | --- | --- |
| Data-access inventory and provider decision | Complete | `typed-data-access-inventory.md` and `typed-data-access-decision.md` identify every current path and select Drizzle for isolated trusted-runtime evaluation. |
| Typed domain boundary | Complete for the current slice | Typed repositories bind operations to the authenticated user and are excluded from the Vite client; the browser remains on the reversible compatibility adapter during rollout. |
| Migration reproducibility and security | Complete | Ordered SQL migrations and `manifest.json` are validated by CI; RLS, grants, security-definer functions, payload fields, and drift checks remain explicit. |
| Browser and artifact security | Passed | Unit, build, artifact scans, and browser suites found no service-role credential exposure. Provider-specific browser calls are the documented compatibility exception tracked by #184. |
| Rollback readiness | Ready | No production data migration or runtime cutover occurred. SQL remains authoritative, the compatibility adapter remains available, and recovery/forward-fix guidance is documented in `migrations.md`. |
| Remaining dependency | Explicitly retained | Do not remove the browser compatibility path until #184 has a trusted transport and its browser scenarios are verified. This is a deliberate follow-up, not an undocumented acceptance failure. |

Conclusion: the typed data-access and migration foundation is complete for its staged
boundary, but issue #170 remains in `status:verification` until the project explicitly
accepts the #184 compatibility exception or completes that follow-up migration.
