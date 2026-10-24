# Design

Use the Vite `writeBundle` lifecycle hook for the output split. At that point
the generated `dist/index.html` exists, so it can be renamed to
`dist/index_next.html` and copied back to `dist/index.html`. The existing
release validation remains the final check for both self-contained files.

