# Design

## Runtime translation lookup

Move the credential-error translation source into a non-rendered runtime
representation that remains compatible with the existing Vite translation
transformation. The authentication runtime will resolve the selected locale
from that source and will not depend on a visible DOM node.

## Authentication status lifecycle

Centralize the transition to the signed-in status so it always replaces the
previous authentication error and resets the status state. Preserve the current
error path for rejected credentials and keep the status region as the only
rendered destination for authentication feedback.

## Verification

Add a source contract proving that no visible translation anchor is required,
extend credential-flow browser coverage for rejected-then-successful login and
session restoration, and inspect the hosted development artifact with Chrome
DevTools for visible text, console errors, and authentication network behavior.
