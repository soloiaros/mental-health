import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

/**
 * Storage adapter for Zustand persist.
 *
 * Priority:
 *   1. react-native-mmkv  — fastest, synchronous under the hood; requires JSI
 *      (works in dev builds + production; NOT available in Expo Go).
 *   2. localStorage        — used automatically on web.
 *   3. In-memory Map       — silent fallback for Expo Go or any environment
 *      where neither native storage is available. Data lives only for the
 *      current session (not persisted across restarts), which is acceptable
 *      for the development workflow in Expo Go.
 *
 * We deliberately do NOT fall back to @react-native-async-storage/async-storage
 * because its v3.x package also requires a linked native module, which produces
 * the same "Native module is null" error when running under Expo Go.
 */

function createWebStorage(): StateStorage {
  return {
    getItem: async (name) => {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: async (name, value) => {
      try {
        localStorage.setItem(name, value);
      } catch {
        // Quota exceeded or private mode — ignore.
      }
    },
    removeItem: async (name) => {
      try {
        localStorage.removeItem(name);
      } catch {
        // Ignore.
      }
    },
  };
}

function createMemoryStorage(): StateStorage {
  const store = new Map<string, string>();
  return {
    getItem: async (name) => store.get(name) ?? null,
    setItem: async (name, value) => { store.set(name, value); },
    removeItem: async (name) => { store.delete(name); },
  };
}

function createNativeStorage(): StateStorage {
  if (Platform.OS === 'web') return createWebStorage();

  try {
    // react-native-mmkv v4 exposes createMMKV() instead of a class.
    // It uses Nitro modules (JSI) which requires a native dev build.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    const mmkv = createMMKV({ id: 'mentalhealth' });

    return {
      getItem: async (name) => mmkv.getString(name) ?? null,
      setItem: async (name, value) => { mmkv.set(name, value); },
      removeItem: async (name) => { mmkv.remove(name); },
    };
  } catch {
    // MMKV requires JSI / a native dev build. When running in Expo Go we
    // fall back to a plain in-memory Map so the app starts cleanly.
    // No AsyncStorage here — v3 also requires a linked native module.
    return createMemoryStorage();
  }
}

export const zustandStorage: StateStorage = createNativeStorage();
