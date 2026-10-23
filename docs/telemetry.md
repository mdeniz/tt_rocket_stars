# Telemetry boundary

TT Rocket Stars remains playable without an account, network, or telemetry provider. The telemetry module is an opt-in, provider-independent boundary for aggregate product learning. Runtime hooks are dormant until explicit consent is granted and never make a provider request by default.

## Privacy contract

- Collection is disabled until the caller explicitly grants consent.
- Only the allowlisted event names and bounded aggregate fields in `src/lib/telemetry.js` are accepted.
- Pilot names, email addresses, child identifiers, account identifiers, answers, free text, and replay data are prohibited.
- Events are kept in a bounded in-memory queue. They are not written to existing local-storage keys.
- With no injected sink, recording and flushing never make network requests.
- Opting out or requesting deletion clears queued telemetry without touching pilots, progress, backups, or other game data.
- A future provider adapter must be injected explicitly, receive only sanitized batches, and isolate delivery failures from gameplay.
- Mission events contain only mode, operation, bounded counts, and coarse performance/time buckets. Runtime errors contain enum codes and sources only; messages, stacks, URLs, and exception objects are never collected.
- Sampling and a 24-hour in-memory retention window bound the volume before any future sink receives data.

## Integration boundary

Future instrumentation may call `createTelemetryService()` after a product and privacy review. Provider configuration, quotas, retention region, EU data handling, lawful basis, aggregation, account linkage, and consent UI are deployment gates. A provider must be explicitly injected and must not add service-role credentials or make gameplay depend on delivery.

Run the focused checks with:

```bash
node --test tests/unit/telemetry.test.cjs
npx playwright test tests/e2e/telemetry.spec.cjs
```
