import api, { conToken } from "./api";

const rutaWebhooks = (idColectivo) =>
  `/colectivos/${encodeURIComponent(idColectivo)}/webhooks`;

export const listarWebhooks = async (token, idColectivo) => {
  const response = await api.get(rutaWebhooks(idColectivo), conToken(token));
  return response.data;
};

export const crearWebhook = async (token, idColectivo, datos) => {
  const response = await api.post(
    rutaWebhooks(idColectivo),
    datos,
    conToken(token),
  );
  return response.data;
};

export const actualizarWebhook = async (
  token,
  idColectivo,
  idWebhook,
  datos,
) => {
  const response = await api.put(
    `${rutaWebhooks(idColectivo)}/${encodeURIComponent(idWebhook)}`,
    datos,
    conToken(token),
  );
  return response.data;
};

export const eliminarWebhook = async (token, idColectivo, idWebhook) => {
  await api.delete(
    `${rutaWebhooks(idColectivo)}/${encodeURIComponent(idWebhook)}`,
    conToken(token),
  );
};

export const probarWebhook = async (token, idColectivo, idWebhook) => {
  const response = await api.post(
    `${rutaWebhooks(idColectivo)}/${encodeURIComponent(idWebhook)}/prueba`,
    {},
    conToken(token),
  );
  return response.data;
};

export const regenerarSecretoWebhook = async (
  token,
  idColectivo,
  idWebhook,
) => {
  const response = await api.post(
    `${rutaWebhooks(idColectivo)}/${encodeURIComponent(idWebhook)}/secreto`,
    {},
    conToken(token),
  );
  return response.data;
};
