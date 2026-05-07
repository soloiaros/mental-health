import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * MMKV-first storage adapter for Zustand persist.
 *
 * Notes:
 * - On web we always use AsyncStorage (MMKV is native-only).
 * - We `require()` MMKV at runtime to avoid bundling/runtime issues
 *   in environments where the native module isn't available yet.
 */
function createNativeStorage(): StateStorage {
  if (Platform.OS === 'web') return AsyncStorage;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mmkvModule = require('react-native-mmkv') as any;
    const MMKVClass = mmkvModule?.MMKV ?? mmkvModule?.default ?? mmkvModule;
    const mmkv = new MMKVClass({ id: 'mentalhealth' });

    const storage: StateStorage = {
      getItem: async (name) => {
        const value = mmkv.getString(name);
        return value ?? null;
      },
      setItem: async (name, value) => {
        mmkv.set(name, value);
      },
      removeItem: async (name) => {
        mmkv.delete(name);
      },
    };

    return storage;
  } catch {
    return AsyncStorage;
  }
}

export const zustandStorage: StateStorage = createNativeStorage();

