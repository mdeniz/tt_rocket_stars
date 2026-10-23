# Design

The legacy runtime remains the application entry point. `index.html` exposes a hidden `#react-root` mount point, while `src/main.tsx` exports a small `mountReactRoot` function for future feature-level migration. No module script is injected into the page yet, so React cannot alter startup or compete with inline handlers.

TypeScript uses strict no-emit checking and includes only the new bootstrap until legacy globals are migrated behind typed adapters. CI runs the same `typecheck` command through the existing `check` script. The production Vite plugin continues to inline the legacy assets and must produce one self-contained HTML file.
