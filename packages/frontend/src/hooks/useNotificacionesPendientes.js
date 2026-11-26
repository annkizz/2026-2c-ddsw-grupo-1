import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthOpcional } from './useAuth.jsx';
import { obtenerNotificaciones } from '../service/notificacionesService';

// El backend no tiene (todavía) un endpoint para marcar notificaciones como leídas,
// así que el contador se resuelve en el front: se guarda cuántas notificaciones
// había la última vez que la persona abrió la bandeja y se compara con el total actual.
const EVENTO = 'notificaciones-vistas';
// Para no consultar al backend todo el tiempo:
//  - se pregunta cada 2 minutos, y solo si la pestaña está a la vista;
//  - al navegar o al volver a la pestaña, solo si pasaron al menos 30 segundos desde la última consulta.
const INTERVALO_MS = 2 * 60_000;
const MINIMO_ENTRE_CONSULTAS_MS = 30_000;

const clave = (usuarioId) => `notificaciones-vistas:${usuarioId}`;

export const leerVistas = (usuarioId) => {
  try {
    const valor = Number(window.localStorage.getItem(clave(usuarioId)));
    return Number.isFinite(valor) ? valor : 0;
  } catch {
    return 0;
  }
};

export const marcarVistas = (usuarioId, total) => {
  if (!usuarioId || !Number.isFinite(total)) return;
  try {
    window.localStorage.setItem(clave(usuarioId), String(total));
  } catch {
    // Sin almacenamiento disponible: el contador vale solo para esta visita.
  }
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: { usuarioId, total } }));
};

// Devuelve { pendientes, total }. Se refresca al navegar, cada 2 minutos y al volver a la pestaña (ver arriba).
export const useNotificacionesPendientes = () => {
  const auth = useAuthOpcional();
  const { pathname } = useLocation();
  const usuarioId = auth?.sesion?.usuarioId ?? auth?.sesion?.idColectivo ?? auth?.sesion?.idColaborador;
  const habilitado = Boolean(auth?.isAuthenticated && auth?.sesion?.tienePerfil && usuarioId);
  const getAccessToken = auth?.getAccessToken;
  const [total, setTotal] = useState(null);
  const [vistas, setVistas] = useState(() => (usuarioId ? leerVistas(usuarioId) : 0));
  const ultimaConsulta = useRef(0);

  const consultar = useCallback(async ({ siPasoUnRato = false } = {}) => {
    if (!habilitado || !getAccessToken) return;
    if (document.visibilityState === 'hidden') return;
    if (siPasoUnRato && Date.now() - ultimaConsulta.current < MINIMO_ENTRE_CONSULTAS_MS) return;
    ultimaConsulta.current = Date.now();
    try {
      const token = await getAccessToken();
      const resultado = await obtenerNotificaciones(token, { pag: 1, limite: 1 });
      if (Number.isFinite(resultado?.total)) setTotal(resultado.total);
    } catch {
      // El contador es informativo: si falla, no se muestra nada.
    }
  }, [habilitado, getAccessToken]);

  useEffect(() => {
    if (usuarioId) setVistas(leerVistas(usuarioId));
  }, [usuarioId]);

  // Al entrar se consulta siempre; al cambiar de página, solo si pasó un rato.
  useEffect(() => {
    consultar();
  }, [consultar]);

  useEffect(() => {
    consultar({ siPasoUnRato: true });
  }, [consultar, pathname]);

  useEffect(() => {
    if (!habilitado) return undefined;
    const intervalo = window.setInterval(consultar, INTERVALO_MS);
    const alVolver = () => document.visibilityState === 'visible' && consultar({ siPasoUnRato: true });
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [habilitado, consultar]);

  useEffect(() => {
    const alMarcar = (evento) => {
      if (evento.detail?.usuarioId !== usuarioId) return;
      setVistas(evento.detail.total);
      setTotal(evento.detail.total);
    };
    window.addEventListener(EVENTO, alMarcar);
    return () => window.removeEventListener(EVENTO, alMarcar);
  }, [usuarioId]);

  const pendientes = habilitado && total != null ? Math.max(0, total - vistas) : 0;
  return { pendientes, total, usuarioId };
};

export default useNotificacionesPendientes;
