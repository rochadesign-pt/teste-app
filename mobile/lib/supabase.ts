import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Guardamos a sessão de forma segura no dispositivo.
 * - Em nativo (iOS/Android): expo-secure-store (Keychain / Keystore encriptado).
 * - Na web (durante o desenvolvimento): AsyncStorage, já que o SecureStore
 *   não existe no browser.
 *
 * O SecureStore tem um limite ~2KB por chave; para sessões maiores dividimos
 * o valor em pedaços.
 */
const CHUNK_SIZE = 1800;

const SecureStorageAdapter = {
  getItem: async (key: string) => {
    const chunkCount = await SecureStore.getItemAsync(`${key}__count`);
    if (!chunkCount) {
      return SecureStore.getItemAsync(key);
    }
    const count = parseInt(chunkCount, 10);
    let result = "";
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${key}__${i}`);
      if (part === null) return null;
      result += part;
    }
    return result;
  },
  setItem: async (key: string, value: string) => {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.deleteItemAsync(`${key}__count`);
      return SecureStore.setItemAsync(key, value);
    }
    const chunks = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < chunks; i++) {
      await SecureStore.setItemAsync(
        `${key}__${i}`,
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      );
    }
    await SecureStore.setItemAsync(`${key}__count`, String(chunks));
    await SecureStore.deleteItemAsync(key);
  },
  removeItem: async (key: string) => {
    const chunkCount = await SecureStore.getItemAsync(`${key}__count`);
    if (chunkCount) {
      const count = parseInt(chunkCount, 10);
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(`${key}__${i}`);
      }
      await SecureStore.deleteItemAsync(`${key}__count`);
    }
    await SecureStore.deleteItemAsync(key);
  },
};

const storage = Platform.OS === "web" ? AsyncStorage : SecureStorageAdapter;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
