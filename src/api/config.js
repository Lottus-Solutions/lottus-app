import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolve a base URL da API.
 * Prioridade:
 *  1. process.env.EXPO_PUBLIC_API_URL (definida no .env / app.json)
 *  2. extra.apiUrl em app.json (Constants.expoConfig.extra.apiUrl)
 *  3. fallback por plataforma:
 *     - Android emulator: http://10.0.2.2:8080  (host loopback do emulador)
 *     - iOS simulator e Web: http://localhost:8080
 *
 * Em produção/dispositivo físico, defina EXPO_PUBLIC_API_URL com a URL pública do backend.
 */
function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const extra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
  if (extra.apiUrl) return String(extra.apiUrl).replace(/\/$/, '');

  if (Platform.OS === 'android') return 'http://10.0.2.2:8080';
  return 'http://localhost:8080';
}

export const API_BASE_URL = resolveBaseUrl();

export const API_TIMEOUT_MS = 20000;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@lottus:accessToken',
  REFRESH_TOKEN: '@lottus:refreshToken',
  USER: '@lottus:user',
  SELECTED_MATRICULA: '@lottus:selectedMatricula',
};

export const ENDPOINTS = {
  // Autenticação
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  REFRESH: '/api/auth/refresh',
  LOGOUT: '/api/auth/logout',
  GOOGLE_OAUTH: '/oauth2/authorization/google',

  // Usuários
  ME: '/api/usuarios/me',
  CHANGE_PASSWORD: '/api/usuarios/me/senha',
  ALUNOS_VINCULADOS: '/api/usuarios/me/alunos',
  VINCULAR_ALUNO: (matricula) => `/api/usuarios/me/alunos/${matricula}`,
  DESVINCULAR_ALUNO: (alunoId) => `/api/usuarios/me/alunos/${alunoId}`,

  // Alunos
  VERIFICAR_RA: (matricula) => `/api/alunos/verificar-ra/${matricula}`,

  // Metas
  METAS: (matricula) => `/api/alunos/${matricula}/metas`,
  META: (matricula, metaId) => `/api/alunos/${matricula}/metas/${metaId}`,
  META_PROGRESSO: (matricula, metaId) =>
    `/api/alunos/${matricula}/metas/${metaId}/progresso`,

  // Emprestimos / Leituras
  EMPRESTIMOS: (matricula) => `/api/alunos/${matricula}/emprestimos`,
  EMPRESTIMO_ATUAL: (matricula) => `/api/alunos/${matricula}/emprestimos/atual`,
  EMPRESTIMO_CONCLUIR: (matricula, emprestimoId) =>
    `/api/alunos/${matricula}/emprestimos/${emprestimoId}/concluir`,

  // Livros
  LIVROS: '/api/livros',
  LIVRO: (id) => `/api/livros/${id}`,
};
