# Tasks

## 1. Contract and service

- [x] 1.1 Add the feature-flag definition and payload contract with JSDoc types and verify invalid definitions are rejected by unit tests.
- [x] 1.2 Implement offline default evaluation and unknown-flag fail-closed behavior, verified by unit tests.
- [x] 1.3 Implement payload normalization and bounded cache handling with injectable clock/storage, verified by unit tests.

## 2. Integration safety

- [x] 2.1 Document provider-independent usage and verify the service has no network, authentication, or gameplay imports.
- [x] 2.2 Run `npm run check`, `npm run test`, and `npm run build`, then verify existing smoke and persistence flows remain unchanged.

## Workflow follow-up

- Archive the completed OpenSpec change after review and CI pass.
