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
