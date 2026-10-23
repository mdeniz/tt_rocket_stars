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

Cached payloads are bounded by the service TTL. Expired experimental flags fail closed; stable flags return their safe defaults. Cache read/write failures are ignored so startup and gameplay remain independent of storage availability. A future provider adapter must fetch data outside this module and pass a validated payload to `setPayload`; this module must not acquire authentication or network imports.
