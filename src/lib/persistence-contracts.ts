export type Language = 'en' | 'es';

export type PilotPayload = Record<string, unknown>;

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
