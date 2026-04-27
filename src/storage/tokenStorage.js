/**
 * Abstração leve de armazenamento persistente.
 *
 * Usa @react-native-async-storage/async-storage quando disponível.
 * Caso o pacote não esteja instalado (ex: usuário ainda não rodou `npm install`),
 * cai para um Map em memória — o que evita quebrar o app, mas perde sessão ao
 * fechar. Adicione a dependência para ter persistência real:
 *
 *   npx expo install @react-native-async-storage/async-storage
 */

import { STORAGE_KEYS } from '../api/config';

let AsyncStorage = null;
try {
  // eslint-disable-next-line global-require
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // Fallback in-memory — desenvolvimento apenas.
  const memory = new Map();
  AsyncStorage = {
    getItem: async (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: async (key, value) => {
      memory.set(key, value);
    },
    removeItem: async (key) => {
      memory.delete(key);
    },
    multiRemove: async (keys) => {
      keys.forEach((k) => memory.delete(k));
    },
  };
  if (typeof console !== 'undefined') {
    console.warn(
      '[lottus] @react-native-async-storage/async-storage não encontrado. ' +
        'Usando fallback em memória — instale o pacote para persistir a sessão.'
    );
  }
}

export async function getAccessToken() {
  return AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export async function setTokens({ accessToken, refreshToken }) {
  if (accessToken !== undefined && accessToken !== null) {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  }
  if (refreshToken !== undefined && refreshToken !== null) {
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
}

export async function clearTokens() {
  await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export async function getStoredUser() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setStoredUser(user) {
  if (!user) {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export async function getSelectedMatricula() {
  return AsyncStorage.getItem(STORAGE_KEYS.SELECTED_MATRICULA);
}

export async function setSelectedMatricula(matricula) {
  if (!matricula) {
    await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_MATRICULA);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_MATRICULA, matricula);
}

export async function clearSession() {
  await clearTokens();
  await setStoredUser(null);
  await setSelectedMatricula(null);
}

export default {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  getStoredUser,
  setStoredUser,
  getSelectedMatricula,
  setSelectedMatricula,
  clearSession,
};
