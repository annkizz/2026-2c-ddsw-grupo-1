import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLogto } from '@logto/react';
import { obtenerSesion } from '../service/usuariosService';

export const RESOURCE = process.env.REACT_APP_LOGTO_RESOURCES;

const AuthContext = createContext(null);

// Une Logto (quién sos) con el backend (GET /me: rol y si ya registraste tu perfil)
export const AuthProvider = ({ children }) => {
  const {
    isAuthenticated,
    isLoading,
    signIn,
    signOut: logtoSignOut,
    getAccessToken: logtoGetAccessToken
  } = useLogto();
  const [sesion, setSesion] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(false);
  const [errorSesion, setErrorSesion] = useState(false);
  const pidiendoSesion = useRef(false);

  const getAccessToken = useCallback(async () => {
    try {
      return await logtoGetAccessToken(RESOURCE);
    } catch {
      return null;
    }
  }, [logtoGetAccessToken]);

  const recargarSesion = useCallback(async () => {
    setCargandoSesion(true);
    setErrorSesion(false);
    try {
      const token = await getAccessToken();
      setSesion(await obtenerSesion(token));
    } catch {
      setErrorSesion(true);
    } finally {
      setCargandoSesion(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSesion(null);
      pidiendoSesion.current = false;
      return;
    }
    if (pidiendoSesion.current) return;
    pidiendoSesion.current = true;
    recargarSesion();
  }, [isAuthenticated, recargarSesion]);

  const iniciarSesion = useCallback(() => signIn(`${window.location.origin}/callback`), [signIn]);
  const registrarse = useCallback(
    () => signIn({ redirectUri: `${window.location.origin}/callback`, interactionMode: 'signUp' }),
    [signIn]
  );
  const cerrarSesion = useCallback(() => logtoSignOut(window.location.origin), [logtoSignOut]);

  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      // true mientras Logto o el backend todavía no respondieron
      cargando: isLoading || cargandoSesion || (isAuthenticated && !sesion && !errorSesion),
      sesion, // { rol, tienePerfil, idColectivo, idColaborador, ... }
      iniciarSesion,
      registrarse,
      cerrarSesion,
      getAccessToken,
      recargarSesion
    }),
    [isAuthenticated, isLoading, cargandoSesion, errorSesion, sesion, iniciarSesion, registrarse, cerrarSesion, getAccessToken, recargarSesion]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth tiene que usarse dentro de AuthProvider (que va dentro de LogtoProvider)');
  return ctx;
};
