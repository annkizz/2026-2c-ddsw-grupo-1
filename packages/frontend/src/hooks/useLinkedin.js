import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth.jsx';
import { mensajeDeError } from '../utils/mensajeDeError';
import { t } from '../i18n/t';
import {
  CLAVE_VOLVER_A,
  obtenerEstadoLinkedin,
  pedirUrlLinkedin,
  desconectarLinkedin
} from '../service/linkedinService';

// habilitado: solo los colectivos consultan el estado
export const useLinkedin = (habilitado = true) => {
  const { getAccessToken } = useAuth();
  const [estado, setEstado] = useState(null); // null mientras carga
  const [error, setError] = useState('');
  const pedido = useRef(false);

  const recargar = useCallback(async () => {
    try {
      const token = await getAccessToken();
      setEstado(await obtenerEstadoLinkedin(token));
    } catch (err) {
      setError(mensajeDeError(err, t('linkedin.errorConectarContexto')));
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (!habilitado || pedido.current) return;
    pedido.current = true;
    recargar();
  }, [habilitado, recargar]);

  const conectar = useCallback(async () => {
    setError('');
    try {
      const token = await getAccessToken();
      const url = await pedirUrlLinkedin(token);
      sessionStorage.setItem(CLAVE_VOLVER_A, window.location.pathname);
      window.location.assign(url); 
    } catch (err) {
      setError(mensajeDeError(err, t('linkedin.errorConectarContexto')));
    }
  }, [getAccessToken]);

  const desconectar = useCallback(async () => {
    setError('');
    try {
      const token = await getAccessToken();
      await desconectarLinkedin(token);
      await recargar();
    } catch (err) {
      setError(mensajeDeError(err, t('linkedin.errorConectarContexto')));
    }
  }, [getAccessToken, recargar]);

  return { estado, error, recargar, conectar, desconectar };
};