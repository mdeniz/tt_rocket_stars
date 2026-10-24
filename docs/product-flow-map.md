# Product flow verification map

This map connects the product baseline requirements to the current executable
checks and identifies coverage that still requires manual or device validation.

| Product area | Current evidence | Remaining gap |
| --- | --- | --- |
| Multiplication and division practice | `tests/unit/domain-rules.test.cjs` validates bounded facts and exact answers; `tests/e2e/feature-flags.spec.cjs` exercises the React-launched practice flow. | Expand browser assertions for visible division and multiplication prompts when the gameplay surface is migrated. |
| Pilot separation and creation | `tests/unit/persistence-contracts.test.cjs` validates profile contracts; `tests/e2e/pilot-profile.spec.cjs` covers profile creation, switching, and local identity. | Verify restricted-storage behavior on a real device. |
| Mission progress and rewards | `tests/unit/domain-rules.test.cjs` validates mastery and rewards; `tests/e2e/feature-flags.spec.cjs` covers mission setup, answer progression, timed flow, and local persistence. | Keep legacy gameplay authoritative until the remaining React migration is complete. |
| Language, sound, and settings | Translation contract tests and smoke/feature-flag E2E cover locale changes, navigation, and audio delegation. | Validate autoplay and persistent sound behavior on iOS Safari. |
| Backup and restore | `docs/persistence-contracts.md` defines the versioned envelope and migration boundary; `tests/unit/persistence-contracts.test.cjs` covers valid and invalid payloads. | Add a full browser backup-import/export flow when the settings surface exposes it in the configured E2E fixture. |
| Mobile interaction and motion | `tests/e2e/smoke.spec.cjs` covers touch-oriented startup and fullscreen fallbacks; CI runs desktop and mobile WebKit. | WebKit remains a compatibility signal; real iOS Safari is required for storage, audio, fullscreen, orientation, and reduced-motion confirmation. |

The map intentionally records gaps instead of treating legacy ownership or
Linux WebKit as proof of complete product parity.
