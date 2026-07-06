export type StorageMode =
  | 'local-browser'
  | 'desktop-local-folder'
  | 'local-network'
  | 'cloud';

export type StorageModeStatus = 'active' | 'planned' | 'disabled';

export interface StorageModeInfo {
  mode: StorageMode;
  label: string;
  description: string;
  status: StorageModeStatus;
  requiresServer: boolean;
  requiresCloud: boolean;
  supportsOffline: boolean;
  supportsMultiUser: boolean;
}

export interface StorageReadResult<TData = unknown> {
  ok: boolean;
  data?: TData;
  error?: string;
}

export interface StorageWriteResult {
  ok: boolean;
  error?: string;
}

export interface BackupPayload<TData = unknown> {
  appName: 'HoReCa CostControl';
  schemaVersion: number;
  storageMode: StorageMode;
  exportedAt: string;
  data: TData;
}

export interface StorageAdapter<TData = unknown> {
  readonly mode: StorageMode;
  readonly info: StorageModeInfo;
  read(): Promise<StorageReadResult<TData>>;
  write(data: TData): Promise<StorageWriteResult>;
  clear(): Promise<StorageWriteResult>;
  createBackup(data: TData): BackupPayload<TData>;
  restoreBackup(payload: BackupPayload<TData>): Promise<StorageWriteResult>;
}
