export type ShellRoute = 'dashboard' | 'home' | 'insights' | 'awards' | 'garage' | 'profile' | 'about' | 'settings';

export type ShellLanguage = 'en' | 'es';

export interface ShellState {
  route: ShellRoute;
  language: ShellLanguage;
  activePilotId: string | null;
  isSplashVisible: boolean;
  isPilotSelectorVisible: boolean;
}

export interface ShellPilotSummary {
  id: string;
  name: string;
  avatar?: string | null;
  language: ShellLanguage;
}

export interface ShellAdapters {
  navigate(route: ShellRoute): void;
  setLanguage(language: ShellLanguage): void;
  requestFullscreen(): Promise<boolean>;
  readPilots(): ShellPilotSummary[];
  choosePilot(id: string): boolean;
  createPilot(name: string): string | null;
  showSettingsPanel(panel: string): void;
}
