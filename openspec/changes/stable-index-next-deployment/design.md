# Design

Vite emits the fully inlined application as `index_next.html` and copies that file to `index.html` for local builds where no released artifact is available. The Pages workflow then downloads the latest GitHub Release HTML asset and replaces only `dist/index.html` with it before uploading the Pages artifact. The development artifact remains the build produced from the current `main` revision.

The stable asset is selected from the latest GitHub Release tag and must match the existing release naming convention. If no release exists, the workflow keeps the local fallback and reports that condition explicitly. Both files remain self-contained and are checked for external scripts and stylesheets.
