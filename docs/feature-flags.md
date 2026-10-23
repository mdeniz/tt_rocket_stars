# Feature flags

`src/lib/feature-flags.js` provides an offline-first, provider-independent feature-flag evaluator. It is intentionally not registered in the game runtime yet; product-facing consumers belong to a later issue with an explicit rollout decision.

Create the service with an object of definitions:

```js
const flags = createFeatureFlagService({
  definitions: {
    example: { defaultEnabled: false, experimental: true },
  },
});
```

`evaluate(name)` returns the configured default for a known flag and `false` for an unknown flag. `setPayload({ values, fetchedAt })` accepts only boolean values for known flags. The optional cache adapter and clock are injected so storage restrictions and expiry can be tested without browser APIs.

Definitions may optionally restrict a flag to authenticated account UUIDs without coupling this module to an authentication provider:

```js
const flags = createFeatureFlagService({
  definitions: {
    preview: {
      defaultEnabled: false,
      targeting: {
        allowlist: ['00000000-0000-4000-8000-000000000001'],
        rolloutPercentage: 25,
      },
    },
  },
});

flags.evaluate('preview', { accountId: authenticatedUser.id });
```

The account identifier must be a UUID. Allowlists take precedence over percentage rollout; the rollout bucket is deterministic for the flag name and account UUID. Missing or invalid identity falls back to `defaultEnabled`. The caller must obtain the identity from an authenticated session and must never use a pilot display name. This service does not enforce backend authorization; Supabase RLS remains the security boundary.

Cached payloads are bounded by the service TTL. Expired experimental flags fail closed; stable flags return their safe defaults. Cache read/write failures are ignored so startup and gameplay remain independent of storage availability. A future provider adapter must fetch data outside this module and pass a validated payload to `setPayload`; this module must not acquire authentication or network imports.

## Operations contract

- **Ownership:** each flag has one technical owner responsible for its definition,
  rollout decision, test evidence, and removal date. The owner records the flag
  purpose and the linked issue before enabling a non-default value.
- **Naming:** use stable, kebab-case names that describe a capability, such as
  `account-targeted-preview`. Do not encode account IDs, pilot names, secrets,
  environments, or dates in a flag name.
- **Environments:** development and CI may use deterministic fixture accounts.
  Production targeting requires an explicit allowlist or percentage, a reviewed
  rollback value, and a verification result on desktop and mobile WebKit. The
  application remains safe when no provider payload is configured.
- **Rollback:** restore the safe local default or remove the provider payload.
  Rollback must not require a migration, account deletion, or a network request
  during startup. Treat a provider or authentication failure as the offline path.
- **Cleanup:** remove a flag definition, its tests, and its documentation after
  the experiment is complete. Never repurpose a flag name for a different
  behavior, because deterministic assignments must remain interpretable.
- **Provider and free tier:** provider selection is an operations concern and
  must not be coupled to this evaluator. Prefer a free-tier provider only when
  its limits, retention, availability, and export/deletion behavior are recorded
  in the issue. No service-role key or administrative credential may reach the
  browser.
- **Authorization boundary:** feature flags are release controls, not access
  control. Supabase RLS and server-side authorization remain mandatory for
  protected data, regardless of targeting results.

Test accounts must use synthetic UUIDs and never real user email addresses. The
browser-level contract tests verify that the evaluator works across desktop and
mobile browser projects without enabling a production flag or making a provider
request.
