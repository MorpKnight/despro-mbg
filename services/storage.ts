import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

type SecureStoreModule = typeof import('expo-secure-store');

let secureStoreModulePromise: Promise<SecureStoreModule | null> | null = null;
let secureStoreAvailable: boolean | null = null;

async function getSecureStoreModule(): Promise<SecureStoreModule | null> {
  if (!secureStoreModulePromise) {
    secureStoreModulePromise = (async () => {
      try {
        const mod = await import('expo-secure-store');
        return mod;
      } catch (err) {
        console.warn('[secureStorage] expo-secure-store unavailable, falling back to AsyncStorage', err);
        return null;
      }
    })();
  }
  return secureStoreModulePromise;
}

async function isSecureStoreAvailable(): Promise<boolean> {
  const secureStore = await getSecureStoreModule();
  if (!secureStore) return false;
  if (secureStoreAvailable === null) {
    try {
      secureStoreAvailable = await secureStore.isAvailableAsync();
    } catch (err) {
      console.warn('[secureStorage] availability check failed', err);
      secureStoreAvailable = false;
    }
  }
  return Boolean(secureStoreAvailable);
}

const extraConfig = (Constants?.expoConfig as any)?.extra || (Constants as any)?.manifest?.extra || {};
const extraApiUrl = typeof extraConfig?.apiUrl === 'string' ? extraConfig.apiUrl : undefined;
const nestedApiUrl = typeof extraConfig?.api?.baseUrl === 'string' ? extraConfig.api.baseUrl : undefined;

const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  || extraApiUrl
  || nestedApiUrl
  || 'http://10.0.2.2:8000/api/v1';

export const SERVER_URL_KEY = 'server_url';

export async function getServerUrl(): Promise<string> {
  try {
    const storedUrl = await AsyncStorage.getItem(SERVER_URL_KEY);
    return storedUrl || DEFAULT_BASE_URL;
  } catch {
    return DEFAULT_BASE_URL;
  }
}

export async function setServerUrl(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SERVER_URL_KEY, url);
  } catch (err) {
    console.warn('[storage] failed to set server url', err);
  }
}

export const storage = {
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const v = await AsyncStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  },
  async set(key: string, value: unknown) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  },
};

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (await isSecureStoreAvailable()) {
        const mod = await getSecureStoreModule();
        if (mod) {
          return await mod.getItemAsync(key);
        }
      }
      return await AsyncStorage.getItem(key);
    } catch (err) {
      console.warn('[secureStorage] get failed', err);
      return null;
    }
  },
  async setItem(key: string, value: string | null): Promise<void> {
    try {
      if (value == null) {
        await secureStorage.removeItem(key);
        return;
      }
      if (await isSecureStoreAvailable()) {
        const mod = await getSecureStoreModule();
        if (mod) {
          const accessible = mod.AFTER_FIRST_UNLOCK ?? undefined;
          await mod.setItemAsync(
            key,
            value,
            accessible ? { keychainService: key, keychainAccessible: accessible } : { keychainService: key },
          );
          return;
        }
      }
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      console.warn('[secureStorage] set failed', err);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (await isSecureStoreAvailable()) {
        const mod = await getSecureStoreModule();
        if (mod) {
          await mod.deleteItemAsync(key);
          return;
        }
      }
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn('[secureStorage] remove failed', err);
    }
  },
};
