import type { StorageModeInfo } from './types';

export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_STORAGE_MODE = 'local-browser' as const;

export const DEFAULT_STORAGE_KEY = 'cost-control-storage';

export const STORAGE_MODES: StorageModeInfo[] = [
  {
    mode: 'local-browser',
    label: 'Local Browser',
    description: 'Stores data in the current browser profile. This is the active free/offline mode.',
    status: 'active',
    requiresServer: false,
    requiresCloud: false,
    supportsOffline: true,
    supportsMultiUser: false,
  },
  {
    mode: 'desktop-local-folder',
    label: 'Desktop Local Folder',
    description: 'Planned installable desktop mode with data stored in a local folder or database file.',
    status: 'planned',
    requiresServer: false,
    requiresCloud: false,
    supportsOffline: true,
    supportsMultiUser: false,
  },
  {
    mode: 'local-network',
    label: 'Local Network',
    description: 'Planned local-server mode for multiple users on the same local network.',
    status: 'planned',
    requiresServer: true,
    requiresCloud: false,
    supportsOffline: true,
    supportsMultiUser: true,
  },
  {
    mode: 'cloud',
    label: 'Cloud',
    description: 'Optional future online mode with hosted database and authentication.',
    status: 'planned',
    requiresServer: true,
    requiresCloud: true,
    supportsOffline: false,
    supportsMultiUser: true,
  },
];

export function getStorageModeInfo(mode: string) {
  return STORAGE_MODES.find((item) => item.mode === mode);
}
