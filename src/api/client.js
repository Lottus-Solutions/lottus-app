import { API_BASE_URL, API_TIMEOUT_MS, ENDPOINTS } from './config';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearSession,
} from '../storage/tokenStorage';

/**
 * Erro padronizado da API. Mantém status, código e payload original.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, data = null, code = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = code;
  }
}

/* ---------------------------------------------------------------------------
 * Listeners para eventos globais (ex: logout forçado quando refresh falha).
 * O AuthContext registra um handler aqui para reagir.
 * ------------------------------------------------------------------------- */
const listeners = {
  onUnauthorized: null,
};

export function setUnauthorizedHandler(handler) {
  listeners.onUnauthorized = handler;
}

/* ---------------------------------------------------------------------------
 * Refresh token: garante que apenas uma requisição de refresh aconteça por vez.
 * Demais chamadas aguardam o mesmo Promise.
 * ------------------------------------------------------------------------- */
let refreshPromise = null;

async function performRefresh() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new ApiError('Sem refresh token', { status: 401 });

  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.REFRESH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new ApiError(json?.message || 'Falha ao renovar token', {
      status: res.status,
      data: json,
    });
  }

  const data = json?.data ?? {};
  await setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  return data.accessToken;
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/* ---------------------------------------------------------------------------
 * Request principal (interceptor de request + response).
 * - Adiciona Authorization Bearer se houver token.
 * - Em 401, tenta refresh uma vez e reexecuta a chamada.
 * - Faz unwrap do envelope ApiResponse padrão (data + success + message).
 * ------------------------------------------------------------------------- */

function buildUrl(path, query) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.append(key, value);
    }
  });
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function timeout(ms) {
  return new Promise((_, reject) =>
    setTimeout(
      () => reject(new ApiError('Tempo de requisição excedido', { code: 'TIMEOUT' })),
      ms
    )
  );
}

async function rawRequest(
  method,
  path,
  { body, query, headers = {}, auth = true, signal } = {}
) {
  const url = buildUrl(path, query);

  const finalHeaders = {
    Accept: 'application/json',
    ...headers,
  };
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
  }
  if (auth) {
    const token = await getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const init = {
    method,
    headers: finalHeaders,
    signal,
  };
  if (body !== undefined) {
    init.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  const fetchPromise = fetch(url, init);
  const response = await Promise.race([fetchPromise, timeout(API_TIMEOUT_MS)]);

  const status = response.status;
  // 204 No Content
  if (status === 204) {
    return { _envelope: null, data: null, status };
  }

  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      // resposta não-JSON
    }
  }

  if (!response.ok) {
    throw new ApiError(json?.message || response.statusText || 'Erro na requisição', {
      status,
      data: json,
    });
  }

  // Envelope padrão da API: { success, message, data, timestamp }
  const isEnvelope =
    json && typeof json === 'object' && 'success' in json && 'data' in json;

  if (isEnvelope && json.success === false) {
    throw new ApiError(json.message || 'Operação não bem-sucedida', {
      status,
      data: json,
    });
  }

  return {
    _envelope: isEnvelope ? json : null,
    data: isEnvelope ? json.data : json,
    status,
  };
}

async function request(method, path, options = {}) {
  try {
    const result = await rawRequest(method, path, options);
    return result.data;
  } catch (err) {
    // Tenta refresh em 401, exceto para os endpoints de login/refresh/register.
    const path401Whitelist = [
      ENDPOINTS.LOGIN,
      ENDPOINTS.REGISTER,
      ENDPOINTS.REFRESH,
    ];
    const shouldTryRefresh =
      err instanceof ApiError &&
      err.status === 401 &&
      options.auth !== false &&
      !path401Whitelist.includes(path) &&
      !options._retried;

    if (shouldTryRefresh) {
      try {
        await refreshAccessToken();
        return request(method, path, { ...options, _retried: true });
      } catch (refreshErr) {
        await clearSession();
        if (typeof listeners.onUnauthorized === 'function') {
          try {
            listeners.onUnauthorized();
          } catch {
            /* noop */
          }
        }
        throw refreshErr instanceof ApiError
          ? refreshErr
          : new ApiError('Sessão expirada', { status: 401 });
      }
    }

    if (err instanceof ApiError && err.status === 401) {
      // Auth falhou definitivamente — limpa sessão e propaga.
      await clearSession();
      if (typeof listeners.onUnauthorized === 'function') {
        try {
          listeners.onUnauthorized();
        } catch {
          /* noop */
        }
      }
    }

    throw err;
  }
}

export const apiClient = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  put: (path, body, options) => request('PUT', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
  raw: rawRequest,
};

export default apiClient;
