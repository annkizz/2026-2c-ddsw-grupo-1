import api, { conToken } from './api';

const TIMEOUT_VERIFICACION_SESION_MS = 15000;

// { usuarioId, nombreUsuario, rol, tienePerfil, idColectivo, idColaborador }
export const obtenerSesion = async (token) => {
  const response = await api.get('/me', {
    ...conToken(token),
    timeout: TIMEOUT_VERIFICACION_SESION_MS
  });
  return response.data;
};
