# Design

## Approach

Use a data-URI SVG favicon in the HTML entrypoint so the self-contained build has no relative favicon request. Keep the icon small and avoid adding a new runtime asset.

Add one legacy accessibility adapter before the ordered runtime scripts. Its `hideRegion` helper checks whether the active element is inside the region, focuses the supplied visible fallback control with `preventScroll`, and only then applies the hidden state and `aria-hidden` attribute. The drawer open path removes the helper's hidden class before opening so repeated open/close cycles remain functional.

Reuse the adapter for the splash's normal and recovery paths and for drawer closure. Existing storage, navigation, audio, and profile behavior remain unchanged.

## Verification

Unit tests assert the favicon and ordered focus contract. E2E tests exercise keyboard startup and drawer closure in Chromium, Firefox, and WebKit, while recording console messages matching the reported diagnostics and requests to `/favicon.ico`.
