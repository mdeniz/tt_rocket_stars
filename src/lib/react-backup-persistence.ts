import type { BackupEnvelope, ValidationResult } from './persistence-contracts';

const BACKUP_KEY = 'tt-rocket-backups-v1';
const GAME_KEYS = ['cosmotablas-v2', 'cosmotablas-history-v1', 'tt-rocket-garage-v1'] as const;

interface BackupRuntime {
  createBackupPersistence(storage: LegacyLocalStore | undefined, options?: { keys?: readonly string[] }): {
    list(): Array<BackupEnvelope & Record<string, unknown>>;
    snapshot(): BackupEnvelope;
    create(label: string): { ok: boolean; value?: BackupEnvelope; error?: string };
    restore(value: unknown): ValidationResult<BackupEnvelope>;
    replace(value: unknown, recoveryLabel: string): ValidationResult<BackupEnvelope>;
  };
}

interface LegacyLocalStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void | boolean;
  removeItem(key: string): void | boolean;
}

interface LegacyBackupEvent extends Event {
  target: HTMLInputElement | null;
}

type BackupRuntimeWindow = Window & {
  TTPersistenceContracts?: BackupRuntime;
  renderBackups?: () => void;
};

export interface ReactBackupPersistenceAdapter {
  createManualBackup(): boolean;
  exportBackup(): boolean;
  resetWithBackup(): boolean;
  restoreBackup(id: string): boolean;
  importBackup(event: Event): void;
}

function browserWindow(): BackupRuntimeWindow {
  return window as BackupRuntimeWindow;
}

function persistence() {
  const current = browserWindow();
  return current.TTPersistenceContracts?.createBackupPersistence(current.TTLocalStore, { keys: GAME_KEYS });
}

function isSpanish(): boolean {
  return document.documentElement.lang === 'es';
}

function message(english: string, spanish: string): string {
  return isSpanish() ? spanish : english;
}

function refreshBackups(): void {
  browserWindow().renderBackups?.();
}

function syncAndReload(): void {
  browserWindow().TTProfiles?.sync();
  window.location.reload();
}

function saveFailure(error?: string): boolean {
  window.alert(message(
    error || 'Backup could not be saved. Nothing was deleted.',
    'No se pudo guardar la copia. No se ha borrado nada.',
  ));
  return false;
}

export function createReactBackupPersistence(): ReactBackupPersistenceAdapter {
  return {
    createManualBackup: () => {
      const store = persistence();
      if (!store) return saveFailure();
      const result = store.create('Manual');
      if (!result.ok) return saveFailure(result.error);
      refreshBackups();
      window.alert(message('Backup saved on this device.', 'Copia guardada en este dispositivo.'));
      return true;
    },
    exportBackup: () => {
      const store = persistence();
      if (!store) return saveFailure();
      try {
        const blob = new Blob([JSON.stringify(store.snapshot(), null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `tt-rocket-stars-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        return true;
      } catch {
        return saveFailure('Backup export failed. Nothing was deleted.');
      }
    },
    resetWithBackup: () => {
      if (!window.confirm(message(
        'Reset all game progress? An automatic backup will be created first.',
        '¿Borrar todo el progreso? Antes se creará una copia automática.',
      ))) return false;
      if (!window.confirm(message(
        'Final confirmation: start from level 1? Your backup will remain in Settings.',
        'Confirmación final: ¿empezar desde el nivel 1? La copia seguirá en Ajustes.',
      ))) return false;
      const store = persistence();
      if (!store) return saveFailure();
      const empty: BackupEnvelope = {
        format: 'tt-rocket-stars-backup',
        version: 1,
        createdAt: new Date().toISOString(),
        payload: Object.fromEntries(GAME_KEYS.map(key => [key, null])),
      };
      const result = store.replace(empty, 'Before reset');
      if (!result.ok) return saveFailure(result.error);
      syncAndReload();
      return true;
    },
    restoreBackup: id => {
      const store = persistence();
      const item = store?.list().find(candidate => candidate.id === id);
      if (!store || !item) {
        window.alert(message('Invalid backup.', 'Copia no válida.'));
        return false;
      }
      if (!window.confirm(message(
        'Restore this backup? Current progress will be saved first.',
        '¿Recuperar esta copia? Antes se guardará el progreso actual.',
      ))) return false;
      const result = store.replace(item, 'Before restore');
      if (!result.ok) return saveFailure(result.error);
      syncAndReload();
      return true;
    },
    importBackup: event => {
      const input = (event as LegacyBackupEvent).target;
      const file = input?.files?.[0];
      if (input) input.value = '';
      if (!file) return;
      if (file.size > 2e6) {
        window.alert(message('Backup file is too large.', 'El archivo de copia es demasiado grande.'));
        return;
      }
      void file.text().then(text => {
        const item = JSON.parse(text) as BackupEnvelope;
        if (!window.confirm(message(
          'Import and restore this backup? Current progress will be saved first.',
          '¿Importar y recuperar esta copia? Se guardará primero el progreso actual.',
        ))) return;
        const store = persistence();
        const result = store?.replace(item, 'Before restore');
        if (!result?.ok) {
          saveFailure(result?.error || 'Invalid backup file or restoration failed.');
          return;
        }
        syncAndReload();
      }).catch(() => {
        window.alert(message('Invalid backup file or restoration failed.', 'Archivo de copia no válido o error al restaurar.'));
      });
    },
  };
}
