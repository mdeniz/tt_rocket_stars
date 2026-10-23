# React migration boundary

The application currently starts through ordered classic scripts. The hidden `#react-root` element and `src/main.tsx` provide a typed React mount contract for incremental migration, but the bootstrap is intentionally not imported by `index.html` yet.

Legacy navigation, inline handlers, storage keys, translations, offline gameplay, and the self-contained release remain authoritative until each surface has an adapter and compatibility coverage. Future React migrations must mount only into the isolated root or an explicitly migrated surface; they must not reorder or duplicate legacy scripts.
