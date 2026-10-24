export interface FullscreenAdapter {
  requestFullscreen(): Promise<boolean>;
}

declare global {
  interface Window {
    TTFullscreenAdapter?: FullscreenAdapter;
  }
}

/**
 * Requests fullscreen without making splash entry depend on browser support.
 * The browser call remains synchronous up to the returned promise so a user
 * gesture can authorize it on touch devices.
 */
export function requestFullscreenSafely(): Promise<boolean> {
  const requestFullscreen = document.documentElement?.requestFullscreen;
  if (typeof requestFullscreen !== 'function') return Promise.resolve(false);
  try {
    return Promise.resolve(requestFullscreen.call(document.documentElement))
      .then(() => true)
      .catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}

export function installFullscreenAdapter(): void {
  window.TTFullscreenAdapter = { requestFullscreen: requestFullscreenSafely };
}
