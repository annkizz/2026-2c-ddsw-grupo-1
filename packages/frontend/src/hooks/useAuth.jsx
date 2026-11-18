import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLogto } from '@logto/react';
import { obtenerSesion } from '../service/usuariosService';
import { borrarTipo } from '../features/registro/tipoElegido';

export const RESOURCE = process.env.REACT_APP_LOGTO_RESOURCES;

const AuthContext = createContext(null);

// Une Logto (quién sos) con el backend (GET /me: rol y si ya registraste tu perfil)
export const AuthProvider = ({ children }) => {
  const {
    isAuthenticated,
    isLoading,
    error: errorLogto,
    signIn,
    signOut: logtoSignOut,
    getAccessToken: logtoGetAccessToken,
    fetchUserInfo: logtoFetchUserInfo
  } = useLogto();
  const [sesion, setSesion] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(false);
  const [errorSesion, setErrorSesion] = useState(null);
  const pidiendoSesion = useRef(false);

  const getAccessToken = useCallback(async () => {
    const token = await logtoGetAccessToken(RESOURCE);
    if (!token) {
      throw new Error(
        'Logto no devolvio el token JWT de la API. Verifica que la aplicacion tenga habilitado el refresh token y acceso al recurso de la API.'
      );
    }
    return token;
  }, [logtoGetAccessToken]);

  const recargarSesion = useCallback(async () => {
    setCargandoSesion(true);
    setErrorSesion(null);
    try {
      const token = await getAccessToken();
      const nuevaSesion = await obtenerSesion(token);
      setSesion(nuevaSesion);
      return nuevaSesion;
    } catch (error) {
      const mensaje = error?.response?.data?.error ?? error?.message ?? 'No se pudo verificar la sesión.';
      const codigo = error?.response?.data?.codigo;
      setErrorSesion(codigo ? `${mensaje} (${codigo})` : mensaje);
      return null;
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

  const iniciarSesion = useCallback(() => {
    borrarTipo();
    return signIn({
      redirectUri: `${window.location.origin}/callback`,
      firstScreen: 'identifier:sign_in',
      identifiers: ['email'],
      prompt: ['login', 'consent']
    });
  }, [signIn]);
  const registrarse = useCallback(
    () => signIn({ redirectUri: `${window.location.origin}/callback`, interactionMode: 'signUp' }),
    [signIn]
  );
  const cerrarSesion = useCallback(() => logtoSignOut(window.location.origin), [logtoSignOut]);
  const obtenerEmailCuenta = useCallback(async () => {
    const userInfo = await logtoFetchUserInfo();
    const email = typeof userInfo?.email === 'string' ? userInfo.email.trim() : '';
    if (!email) {
      throw new Error(
        'Logto no devolvio el email. Verifica que la cuenta tenga un email y que la aplicacion tenga habilitado el permiso email.'
      );
    }
    return email;
  }, [logtoFetchUserInfo]);
  const cambiarContrasena = useCallback(
    (email) =>
      signIn({
        redirectUri: `${window.location.origin}/callback`,
        firstScreen: 'reset_password',
        identifiers: ['email'],
        ...(email ? { loginHint: email } : {})
      }),
    [signIn]
  );
  
  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      errorLogto,
      errorSesion,
      // true mientras Logto o el backend todavía no respondieron
      cargando:
        (!isAuthenticated && isLoading) ||
        cargandoSesion ||
        (isAuthenticated && !sesion && !errorSesion),
      sesion, // { rol, tienePerfil, idColectivo, idColaborador, ... }
      iniciarSesion,
      registrarse,
      cerrarSesion,
      obtenerEmailCuenta,
      cambiarContrasena,
      getAccessToken,
      recargarSesion
    }),
    [isAuthenticated, isLoading, errorLogto, cargandoSesion, errorSesion, sesion, iniciarSesion, registrarse, cerrarSesion, obtenerEmailCuenta, cambiarContrasena, getAccessToken, recargarSesion]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth tiene que usarse dentro de AuthProvider (que va dentro de LogtoProvider)');
  return ctx;
};
