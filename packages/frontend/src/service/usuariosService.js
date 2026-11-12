import api, { conToken } from './api';

// { usuarioId, nombreUsuario, rol, tienePerfil, idColectivo, idColaborador }
export const obtenerSesion = async (token) => {
  const response = await api.get('/me', conToken(token));
  return response.data;
};
