# Design

Vite emits the fully inlined application as `index_next.html` and copies that file to `index.html` for local builds where no released artifact is available. The Pages workflow then downloads the latest GitHub Release HTML asset and replaces only `dist/index.html` with it before uploading the Pages artifact. The development artifact remains the build produced from the current `main` revision.

The stable asset is selected from the latest GitHub Release tag and supports the existing release asset names as well as the explicit future naming convention. If no release exists, the workflow keeps the local fallback and reports that condition explicitly. Publishing a new release triggers a Pages redeploy after the asset is available, so `index.html` changes only through an explicit release. Both files remain self-contained and are checked for external scripts and stylesheets.
