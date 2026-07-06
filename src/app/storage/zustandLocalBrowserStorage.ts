import { DEFAULT_STORAGE_KEY } from './constants';

export interface ZustandStorageValue {
  state: unknown;
  version?: number;
}

export interface ZustandLocalBrowserStorageOptions {
  storageKey?: string;
}

function isBrowserStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function createZustandLocalBrowserStorage(options: ZustandLocalBrowserStorageOptions = {}) {
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;

  return {
    storageKey,

    getItem(name: string): string | null {
      if (!isBrowserStorageAvailable()) {
        return null;
      }

      return window.localStorage.getItem(name);
    },

    setItem(name: string, value: string): void {
      if (!isBrowserStorageAvailable()) {
        return;
      }

      window.localStorage.setItem(name, value);
    },

    removeItem(name: string): void {
      if (!isBrowserStorageAvailable()) {
        return;
      }

      window.localStorage.removeItem(name);
    },
  };
}

export const zustandLocalBrowserStorage = createZustandLocalBrowserStorage();
