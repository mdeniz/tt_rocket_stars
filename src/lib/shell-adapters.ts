import type { ShellPilotSummary } from './shell-contracts';

export interface FullscreenAdapter {
  requestFullscreen(): Promise<boolean>;
}

interface LegacyPilotProfile {
  id: string;
  name: string;
  language: 'en' | 'es';
  avatar?: string | null;
}

interface LegacyPilotStore {
  read(): LegacyPilotProfile[];
  active(): LegacyPilotProfile | undefined;
  choose(id: string): void;
  create(name: string): string;
}

declare global {
  interface Window {
    TTFullscreenAdapter?: FullscreenAdapter;
    TTProfiles?: LegacyPilotStore;
    TTPilotAdapter?: PilotAdapter;
  }
}

export interface PilotAdapter {
  readPilots(): ShellPilotSummary[];
  choosePilot(id: string): boolean;
  createPilot(name: string): string | null;
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

export function createPilotAdapter(store: LegacyPilotStore | undefined = window.TTProfiles): PilotAdapter {
  return {
    readPilots: () => (store?.read() || []).map(profile => ({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar || null,
      language: profile.language,
    })),
    choosePilot: id => {
      if (!store?.read().some(profile => profile.id === id)) return false;
      store.choose(id);
      return true;
    },
    createPilot: name => {
      if (!store) return null;
      const error = store.create(name);
      return error ? null : store.active()?.id || null;
    },
  };
}

export function installPilotAdapter(): void {
  window.TTPilotAdapter = createPilotAdapter();
}
