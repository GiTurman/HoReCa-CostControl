import { ActivityLog, Dish, InventoryAudit, Product, Purchase, Sale } from '../types';

export const BACKUP_APP_NAME = 'HoReCa CostControl';
export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupData {
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  dishes: Dish[];
  inventoryAudits: InventoryAudit[];
  activityLogs: ActivityLog[];
}

export interface BackupEnvelope {
  appName: typeof BACKUP_APP_NAME;
  schemaVersion: number;
  exportedAt: string;
  data: BackupData;
}

export interface BackupValidationResult {
  ok: boolean;
  data?: Partial<BackupData>;
  isEnvelope: boolean;
  error?: string;
}

const RESTORABLE_KEYS: Array<keyof BackupData> = [
  'products',
  'purchases',
  'sales',
  'dishes',
  'inventoryAudits',
  'activityLogs',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getBackupCandidate(input: unknown): { data: unknown; isEnvelope: boolean; error?: string } {
  if (!isRecord(input)) {
    return { data: input, isEnvelope: false, error: 'Backup file must contain a JSON object.' };
  }

  if ('appName' in input || 'schemaVersion' in input || 'data' in input) {
    if (input.appName !== BACKUP_APP_NAME) {
      return { data: input, isEnvelope: true, error: 'Backup file belongs to another app.' };
    }

    if (typeof input.schemaVersion !== 'number') {
      return { data: input, isEnvelope: true, error: 'Backup schema version is missing or invalid.' };
    }

    if (input.schemaVersion > BACKUP_SCHEMA_VERSION) {
      return { data: input, isEnvelope: true, error: 'Backup file was created by a newer app version.' };
    }

    if (!('data' in input)) {
      return { data: input, isEnvelope: true, error: 'Backup data section is missing.' };
    }

    return { data: input.data, isEnvelope: true };
  }

  return { data: input, isEnvelope: false };
}

export function createBackupEnvelope(data: BackupData): BackupEnvelope {
  return {
    appName: BACKUP_APP_NAME,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function validateBackupPayload(input: unknown): BackupValidationResult {
  const candidate = getBackupCandidate(input);

  if (candidate.error) {
    return { ok: false, isEnvelope: candidate.isEnvelope, error: candidate.error };
  }

  if (!isRecord(candidate.data)) {
    return {
      ok: false,
      isEnvelope: candidate.isEnvelope,
      error: 'Backup data must be a JSON object.',
    };
  }

  const restoredData: Partial<BackupData> = {};
  const invalidKeys: string[] = [];

  for (const key of RESTORABLE_KEYS) {
    if (!(key in candidate.data)) {
      continue;
    }

    const value = candidate.data[key];

    if (!Array.isArray(value)) {
      invalidKeys.push(key);
      continue;
    }

    restoredData[key] = value as never;
  }

  if (invalidKeys.length > 0) {
    return {
      ok: false,
      isEnvelope: candidate.isEnvelope,
      error: `Invalid backup sections: ${invalidKeys.join(', ')} must be arrays.`,
    };
  }

  if (Object.keys(restoredData).length === 0) {
    return {
      ok: false,
      isEnvelope: candidate.isEnvelope,
      error: 'Backup file does not contain any restorable data sections.',
    };
  }

  return {
    ok: true,
    data: restoredData,
    isEnvelope: candidate.isEnvelope,
  };
}
