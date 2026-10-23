# Proposal: Extract typed game rules

## Why

The legacy mission script currently owns mathematical rules, rewards, and achievement thresholds in a browser-bound global scope. Pure contracts make those rules testable before future UI migration.

## What Changes

- Add framework-agnostic TypeScript modules for questions, answer checking, mastery, and mission rewards.
- Add deterministic tests that protect the current mathematical and reward invariants.
- Keep the legacy runtime authoritative until a later adapter proves behavior parity.
