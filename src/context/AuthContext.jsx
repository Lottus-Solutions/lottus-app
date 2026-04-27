import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { setUnauthorizedHandler } from '../api/client';
import authService from '../services/authService';
import usuarioService from '../services/usuarioService';
import {
  clearSession,
  getAccessToken,
  getSelectedMatricula,
  getStoredUser,
  setSelectedMatricula as persistSelectedMatricula,
  setStoredUser,
  setTokens,
} from '../storage/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [matricula, setMatriculaState] = useState(null); // matrícula atualmente selecionada
  const [bootstrapping, setBootstrapping] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Flag para evitar setState após unmount.
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );

  /* -------------------------------------------------------------------- */
  /* Bootstrap: carrega sessão persistida ao iniciar o app.               */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const storedUser = await getStoredUser();
        if (storedUser && !cancel) setUser(storedUser);

        const storedMatricula = await getSelectedMatricula();
        if (storedMatricula && !cancel) setMatriculaState(storedMatricula);

        // Refaz GET /me para garantir dados frescos.
        try {
          const me = await usuarioService.getProfile();
          if (cancel || !mounted.current) return;
          setUser(me);
          await setStoredUser(me);

          // Se nenhuma matrícula está selecionada, escolhe a primeira disponível.
          if (!storedMatricula && me?.matriculasAlunos?.length) {
            const first = me.matriculasAlunos[0];
            setMatriculaState(first);
            await persistSelectedMatricula(first);
          }
          setAuthenticated(true);
        } catch (err) {
          // 401 já limpa sessão via interceptor; outros erros mantêm dados locais.
          if (storedUser && !cancel) setAuthenticated(true);
        }
      } finally {
        if (!cancel && mounted.current) setBootstrapping(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  /* -------------------------------------------------------------------- */
  /* Logout forçado (acionado pelo interceptor quando refresh falha).     */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!mounted.current) return;
      setUser(null);
      setMatriculaState(null);
      setAuthenticated(false);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  /* -------------------------------------------------------------------- */
  /* Ações                                                                 */
  /* -------------------------------------------------------------------- */
  const refreshProfile = useCallback(async () => {
    const me = await usuarioService.getProfile();
    if (!mounted.current) return me;
    setUser(me);
    await setStoredUser(me);
    if (!matricula && me?.matriculasAlunos?.length) {
      const first = me.matriculasAlunos[0];
      setMatriculaState(first);
      await persistSelectedMatricula(first);
    }
    return me;
  }, [matricula]);

  const login = useCallback(
    async ({ email, senha }) => {
      const auth = await authService.login({ email, senha });
      await setTokens({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
      });
      const me = await refreshProfile();
      if (mounted.current) setAuthenticated(true);
      return { auth, user: me };
    },
    [refreshProfile]
  );

  const register = useCallback(
    async ({ nome, email, senha, matriculaAluno }) => {
      // Cadastro do responsável + login automático.
      await authService.register({ nome, email, senha, matriculaAluno });
      return login({ email, senha });
    },
    [login]
  );

  /**
   * Autentica com tokens já obtidos por canais externos (ex: OAuth2 Google).
   * Persiste tokens, busca perfil e marca a sessão como autenticada.
   */
  const loginWithTokens = useCallback(
    async ({ accessToken, refreshToken }) => {
      if (!accessToken) {
        throw new Error('accessToken é obrigatório.');
      }
      await setTokens({ accessToken, refreshToken });
      const me = await refreshProfile();
      if (mounted.current) setAuthenticated(true);
      return { user: me };
    },
    [refreshProfile]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      /* ignora — sessão será limpa de qualquer forma */
    }
    await clearSession();
    if (!mounted.current) return;
    setUser(null);
    setMatriculaState(null);
    setAuthenticated(false);
  }, []);

  const setMatricula = useCallback(async (m) => {
    setMatriculaState(m || null);
    await persistSelectedMatricula(m || null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      matricula,
      authenticated,
      bootstrapping,
      login,
      loginWithTokens,
      register,
      logout,
      refreshProfile,
      setMatricula,
    }),
    [
      user,
      matricula,
      authenticated,
      bootstrapping,
      login,
      loginWithTokens,
      register,
      logout,
      refreshProfile,
      setMatricula,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }
  return ctx;
}

export default AuthContext;
