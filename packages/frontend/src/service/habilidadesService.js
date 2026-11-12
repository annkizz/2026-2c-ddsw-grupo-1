import api, { conToken } from './api';

export const obtenerHabilidades = async () => {
  const response = await api.get('/habilidades');
  return response.data;
};

export const crearHabilidad = async (token, habilidad) => {
  const response = await api.post('/habilidades', habilidad, conToken(token));
  return response.data;
};
