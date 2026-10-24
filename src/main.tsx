import { createRoot } from 'react-dom/client';
import type { ReactNode } from 'react';
import { ReactShell } from './shell';
import { installFullscreenAdapter } from './lib/shell-adapters';

export const REACT_ROOT_ID = 'react-root';

/**
 * Mounts a future React surface without taking ownership of the legacy DOM.
 * The initial bootstrap is intentionally not called by the legacy entry point.
 */
export function mountReactRoot(content: ReactNode = null): void {
  const element = document.getElementById(REACT_ROOT_ID);
  if (!element) return;
  element.dataset.reactShellMounted = 'true';
  createRoot(element).render(content);
}

/**
 * Starts the isolated React surface after the legacy document has loaded.
 * Legacy scripts keep their existing order and remain the active UI owners.
 */
export function bootstrapReactShell(): void {
  installFullscreenAdapter();
  const mount = () => mountReactRoot(<ReactShell />);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
}

bootstrapReactShell();
