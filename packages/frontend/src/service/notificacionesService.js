import api, { conToken } from './api';

export const obtenerNotificaciones = async (token, params) => {
  const response = await api.get('/notificaciones', { ...conToken(token), params });
  return response.data;
};

export const obtenerNotificacion = async (token, id) => {
  const response = await api.get(`/notificaciones/${id}`, conToken(token));
  return response.data;
};
