# Design: Viewport-relative root height

Apply a viewport-relative minimum height to both the document root and the
body, retaining the existing percentage fallback for older user agents. A
minimum height preserves natural document growth, so long settings and game
pages continue to scroll normally.

The existing fixed background pseudo-element remains the single animated
scenery layer. No additional image layer or JavaScript resize listener is
introduced. The regression test navigates to Settings, selects the Galaxy
theme, and verifies root/body coverage and horizontal overflow in a tall
viewport.
