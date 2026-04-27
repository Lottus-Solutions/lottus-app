import { Platform } from 'react-native';
import { API_BASE_URL, ENDPOINTS } from '../api/config';

/**
 * Login com Google via OAuth2 do backend.
 *
 * Fluxo:
 *  1. App abre o navegador in-app apontando para `${API}/oauth2/authorization/google`
 *  2. Spring Security redireciona para o Google
 *  3. Após o consentimento, Google volta para o backend com o `code`
 *  4. Backend troca o code por user info, gera JWT (access + refresh)
 *  5. OAuth2AuthenticationSuccessHandler redireciona para `lottus://oauth2/callback?accessToken=...&refreshToken=...`
 *  6. WebBrowser intercepta o deep link e devolve o controle ao app
 *  7. Aqui parseamos a URL e retornamos os tokens
 *
 * Em web (rodando Expo Web), o deep link funcionaria diferente — o ideal
 * é o backend redirecionar para `http://localhost:8081/oauth2/callback` em vez
 * do scheme nativo. Para simplificar este preview, o login com Google é
 * declarado disponível apenas em mobile.
 */

const REDIRECT_URI = 'lottus://oauth2/callback';

let WebBrowser = null;
try {
  // eslint-disable-next-line global-require
  WebBrowser = require('expo-web-browser');
} catch (e) {
  WebBrowser = null;
}

export const GOOGLE_LOGIN_DISPONIVEL =
  !!WebBrowser && Platform.OS !== 'web';

function parseTokensFromUrl(url) {
  if (!url) return null;
  const idx = url.indexOf('?');
  if (idx < 0) return null;
  const query = url.slice(idx + 1);
  const params = {};
  query.split('&').forEach((piece) => {
    const [k, v] = piece.split('=');
    if (k) params[decodeURIComponent(k)] = v ? decodeURIComponent(v) : '';
  });
  if (!params.accessToken) return null;
  return {
    accessToken: params.accessToken,
    refreshToken: params.refreshToken || null,
  };
}

/**
 * Inicia o fluxo de login com Google.
 * @returns {Promise<{accessToken, refreshToken} | null>}
 *  null quando o usuário cancela.
 *  Lança Error em falhas inesperadas.
 */
export async function loginWithGoogle() {
  if (!GOOGLE_LOGIN_DISPONIVEL) {
    throw new Error('Login com Google indisponível nesta plataforma.');
  }

  const authUrl = `${API_BASE_URL}${ENDPOINTS.GOOGLE_OAUTH}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI, {
    showInRecents: true,
  });

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return null;
  }

  if (result.type !== 'success' || !result.url) {
    throw new Error('Falha ao concluir o login com Google.');
  }

  const tokens = parseTokensFromUrl(result.url);
  if (!tokens?.accessToken) {
    throw new Error('Resposta do Google sem tokens válidos.');
  }
  return tokens;
}

export default { loginWithGoogle, GOOGLE_LOGIN_DISPONIVEL };
