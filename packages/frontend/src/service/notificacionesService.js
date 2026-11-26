import api, { conToken } from "./api";

export const obtenerNotificaciones = async (token, params) => {
  const response = await api.get("/notificaciones", {
    ...conToken(token),
    params,
  });
  return response.data;
};

export const obtenerNotificacion = async (token, id) => {
  const response = await api.get(`/notificaciones/${id}`, conToken(token));
  return response.data;
};

export const crearNotificacion = async (token, datos) => {
  const response = await api.post("/notificaciones", datos, conToken(token));
  return response.data;
};

export const obtenerNotificacionesDeColaboradora = async (
  token,
  id,
  params,
) => {
  const response = await api.get(`/notificaciones/colaboradora/${id}`, {
    ...conToken(token),
    params,
  });
  return response.data;
};
