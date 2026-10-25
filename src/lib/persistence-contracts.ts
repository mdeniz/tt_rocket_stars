export type Language = 'en' | 'es';

export type PilotPayload = Record<string, unknown>;

/** Opaque pilot-local state owned by a migrated domain adapter. */
export type PilotDomainPayload = Readonly<Record<string, unknown>>;

export interface PilotProfile {
  id: string;
  name: string;
  language: Language;
  createdAt: number;
  payload: PilotPayload;
  avatar?: string | null;
  updatedAt?: string;
}

export interface BackupEnvelope {
  format: 'tt-rocket-stars-backup';
  version: 1;
  createdAt: string;
  payload: Record<string, string | null>;
  label?: string;
  id?: string;
}

export interface CloudSnapshot {
  localId: string;
  name: string;
  avatar: string | null;
  language: Language;
  payload: PilotPayload;
  updatedAt: string;
  version?: number;
}

export interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

export interface ValidationFailure {
  ok: false;
  error: string;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): boolean;
  removeItem(key: string): boolean;
}

/**
 * Typed boundary for pilot selection and profile persistence.
 * Implementations must preserve the existing profile and payload shape.
 */
export interface PilotPersistenceAdapter {
  readProfiles(): readonly PilotProfile[];
  activeProfile(): PilotProfile | null;
  choosePilot(id: string): boolean;
  createPilot(name: string): string | null;
}

/** Typed boundary for pilot-local inventory state. */
export interface InventoryPersistenceAdapter {
  read(pilotId: string): PilotDomainPayload;
  write(pilotId: string, payload: PilotDomainPayload): boolean;
}

/** Typed boundary for pilot-local achievement state. */
export interface AchievementPersistenceAdapter {
  read(pilotId: string): PilotDomainPayload;
  write(pilotId: string, payload: PilotDomainPayload): boolean;
}

/** Typed boundary for compatible backup export and restore. */
export interface BackupPersistenceAdapter {
  export(label?: string): BackupEnvelope | null;
  restore(value: unknown): ValidationResult<BackupEnvelope>;
}

/** All persistence domains exposed to React-owned surfaces. */
export interface ReactPersistenceBoundary {
  pilots: PilotPersistenceAdapter;
  inventory: InventoryPersistenceAdapter;
  achievements: AchievementPersistenceAdapter;
  backups: BackupPersistenceAdapter;
}
