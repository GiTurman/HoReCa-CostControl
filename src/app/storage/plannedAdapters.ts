import { STORAGE_MODES } from './constants';
import type { BackupPayload, StorageAdapter, StorageReadResult, StorageWriteResult } from './types';

function plannedModeError(modeLabel: string): string {
  return `${modeLabel} storage is planned but not implemented in this build.`;
}

function createPlannedAdapter(mode: 'desktop-local-folder' | 'local-network' | 'cloud'): StorageAdapter {
  const info = STORAGE_MODES.find((item) => item.mode === mode);

  if (!info) {
    throw new Error(`Storage mode configuration is missing: ${mode}`);
  }

  return {
    mode,
    info,

    async read(): Promise<StorageReadResult> {
      return { ok: false, error: plannedModeError(info.label) };
    },

    async write(): Promise<StorageWriteResult> {
      return { ok: false, error: plannedModeError(info.label) };
    },

    async clear(): Promise<StorageWriteResult> {
      return { ok: false, error: plannedModeError(info.label) };
    },

    createBackup(data: unknown): BackupPayload {
      return {
        appName: 'HoReCa CostControl',
        schemaVersion: 1,
        storageMode: mode,
        exportedAt: new Date().toISOString(),
        data,
      };
    },

    async restoreBackup(): Promise<StorageWriteResult> {
      return { ok: false, error: plannedModeError(info.label) };
    },
  };
}

export const desktopLocalFolderStorage = createPlannedAdapter('desktop-local-folder');
export const localNetworkStorage = createPlannedAdapter('local-network');
export const cloudStorage = createPlannedAdapter('cloud');
