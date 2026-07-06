import { CURRENT_SCHEMA_VERSION } from '../storage/constants';
import type { BackupPayload } from '../storage/types';

export interface MigrationResult<TData = unknown> {
  ok: boolean;
  data?: TData;
  schemaVersion?: number;
  error?: string;
}

export function isBackupPayload(value: unknown): value is BackupPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<BackupPayload>;

  return (
    candidate.appName === 'HoReCa CostControl' &&
    typeof candidate.schemaVersion === 'number' &&
    typeof candidate.exportedAt === 'string' &&
    'data' in candidate
  );
}

export function migrateBackupPayload<TData = unknown>(payload: BackupPayload<TData>): MigrationResult<TData> {
  if (payload.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: 'Backup schema version is newer than this application build supports.',
    };
  }

  // Phase 1 keeps the existing data shape unchanged.
  // Future migrations should be added here, for example:
  // if (payload.schemaVersion === 1) migrateV1ToV2(payload.data)
  return {
    ok: true,
    data: payload.data,
    schemaVersion: payload.schemaVersion,
  };
}
