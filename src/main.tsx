import { createRoot } from 'react-dom/client';
import type { ReactNode } from 'react';

export const REACT_ROOT_ID = 'react-root';

/**
 * Mounts a future React surface without taking ownership of the legacy DOM.
 * The initial bootstrap is intentionally not called by the legacy entry point.
 */
export function mountReactRoot(content: ReactNode = null): void {
  const element = document.getElementById(REACT_ROOT_ID);
  if (!element) return;
  createRoot(element).render(content);
}
