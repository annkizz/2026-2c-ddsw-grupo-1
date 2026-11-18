import api, { conToken } from './api';

// donde volver desp de conectar linkedin 
export const CLAVE_VOLVER_A = 'linkedin:volverA';

export const obtenerEstadoLinkedIn = async (token) => {
  const response = await api.get('/linkedin/estado', conToken(token));
  return response.data; // { conectado, vencida, nombre, expiraEn }
};

export const pedirUrlLinkedIn = async (token) => {
  const response = await api.post('/linkedin/autorizacion', null, conToken(token));
  return response.data.url;
};

export const completarConexionLinkedIn = async (token, code, state) => {
  const response = await api.post('/linkedin/conexion', { code, state }, conToken(token));
  return response.data;
};

export const desconectarLinkedIn = async (token) => {
  await api.delete('/linkedin/conexion', conToken(token));
};