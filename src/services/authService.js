import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/config';

/**
 * POST /api/auth/login
 * @param {{email: string, senha: string}} credentials
 * @returns {Promise<AuthResponse>} { accessToken, refreshToken, tokenType, userId, nome }
 */
export function login(credentials) {
  return apiClient.post(ENDPOINTS.LOGIN, credentials, { auth: false });
}

/**
 * POST /api/auth/register
 * @param {{nome: string, email: string, senha: string, matriculaAluno: string}} payload
 */
export function register(payload) {
  return apiClient.post(ENDPOINTS.REGISTER, payload, { auth: false });
}

/**
 * POST /api/auth/refresh
 * @param {string} refreshToken
 */
export function refresh(refreshToken) {
  return apiClient.post(ENDPOINTS.REFRESH, { refreshToken }, { auth: false });
}

/**
 * POST /api/auth/logout — revoga refresh tokens do usuário autenticado.
 */
export function logout() {
  return apiClient.post(ENDPOINTS.LOGOUT);
}

export default { login, register, refresh, logout };
