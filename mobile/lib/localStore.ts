import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Armazenamento local simples (JSON), usado como fallback quando a camada
 * API (edge functions) ainda não está disponível — assim a app continua
 * utilizável no dispositivo e sincroniza com o servidor mais tarde.
 * Web: localStorage. Nativo: expo-secure-store.
 */
async function readRaw(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeRaw(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    /* ignora — melhor não bloquear o utilizador */
  }
}

export async function localGet<T>(key: string, fallback: T): Promise<T> {
  const raw = await readRaw(`local:${key}`);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function localSet<T>(key: string, value: T): Promise<void> {
  await writeRaw(`local:${key}`, JSON.stringify(value));
}

export function localId() {
  return `local-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}
