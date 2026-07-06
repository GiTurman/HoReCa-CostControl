import { CURRENT_SCHEMA_VERSION, DEFAULT_STORAGE_KEY, STORAGE_MODES } from './constants';
import type { BackupPayload, StorageAdapter, StorageReadResult, StorageWriteResult } from './types';

function getLocalBrowserInfo() {
  const info = STORAGE_MODES.find((item) => item.mode === 'local-browser');

  if (!info) {
    throw new Error('Local Browser storage mode configuration is missing.');
  }

  return info;
}

function isBrowserStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function createLocalBrowserStorageAdapter<TData = unknown>(
  storageKey: string = DEFAULT_STORAGE_KEY,
): StorageAdapter<TData> {
  return {
    mode: 'local-browser',
    info: getLocalBrowserInfo(),

    async read(): Promise<StorageReadResult<TData>> {
      if (!isBrowserStorageAvailable()) {
        return { ok: false, error: 'Browser localStorage is not available in this environment.' };
      }

      try {
        const raw = window.localStorage.getItem(storageKey);

        if (!raw) {
          return { ok: true, data: undefined as TData };
        }

        return { ok: true, data: JSON.parse(raw) as TData };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Failed to read local browser storage.',
        };
      }
    },

    async write(data: TData): Promise<StorageWriteResult> {
      if (!isBrowserStorageAvailable()) {
        return { ok: false, error: 'Browser localStorage is not available in this environment.' };
      }

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(data));
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Failed to write local browser storage.',
        };
      }
    },

    async clear(): Promise<StorageWriteResult> {
      if (!isBrowserStorageAvailable()) {
        return { ok: false, error: 'Browser localStorage is not available in this environment.' };
      }

      try {
        window.localStorage.removeItem(storageKey);
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Failed to clear local browser storage.',
        };
      }
    },

    createBackup(data: TData): BackupPayload<TData> {
      return {
        appName: 'HoReCa CostControl',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        storageMode: 'local-browser',
        exportedAt: new Date().toISOString(),
        data,
      };
    },

    async restoreBackup(payload: BackupPayload<TData>): Promise<StorageWriteResult> {
      if (payload.appName !== 'HoReCa CostControl') {
        return { ok: false, error: 'Invalid backup file: app name does not match.' };
      }

      if (payload.schemaVersion > CURRENT_SCHEMA_VERSION) {
        return { ok: false, error: 'Backup file was created by a newer schema version.' };
      }

      return this.write(payload.data);
    },
  };
}

export const localBrowserStorage = createLocalBrowserStorageAdapter();
