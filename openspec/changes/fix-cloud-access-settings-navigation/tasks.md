# Tasks

## 1. React Settings Navigation

- [ ] 1.1 Add a conditional Cloud access entry to the React Settings labels and target map, and verify the flag-off navigation still exposes only local categories.
- [ ] 1.2 Activate the existing Cloud access panel through the typed Settings navigation and verify only that panel is active in the enabled path.

## 2. Browser and Contract Verification

- [ ] 2.1 Update the cloud E2E fixture to open Cloud access through its Settings tab and verify the signed-out state performs no authenticated cloud request.
- [ ] 2.2 Verify English and Spanish Cloud access labels, local category isolation, and the default hidden state with the relevant unit/E2E tests.
- [ ] 2.3 Run `npm run check`, the relevant browser suites, `npm run build`, strict OpenSpec validation, and Chrome DevTools against the deployed development artifact; record URL, actions, visible results, console output, and network evidence.

## Workflow follow-up

- Archive this change after implementation, review, CI, and empirical verification are complete.
- Update issue #200 with the implementation and verification evidence before applying `status:done`.
