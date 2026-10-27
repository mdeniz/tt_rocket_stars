# Tasks

## 1. Authentication status and translation source

- [x] 1.1 Remove the visible translation-anchor dependency while preserving
  localized English and Spanish credential errors.
- [x] 1.2 Clear stale credential errors when session restoration and successful
  sign-in update the authenticated status.
- [x] 1.3 Add unit/source contracts for the non-visible translation source and
  status lifecycle.

## 2. Verification and delivery

- [x] 2.1 Add credential-flow browser coverage for rejected-then-successful
  sign-in and restored authenticated sessions.
- [ ] 2.2 Run focused tests, `npm run check`, and the applicable browser matrix.
- [ ] 2.3 Verify the hosted `index_next.html` behavior with Chrome DevTools,
  recording URL, actions, observed status, console output, and network evidence.
- [ ] 2.4 Update issue #221 with implementation and verification evidence; keep
  it in verification until CI and empirical checks pass.
