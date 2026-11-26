import api, { conToken } from "./api";

// donde volver desp de conectar linkedin
export const CLAVE_VOLVER_A = "linkedin:volverA";

export const obtenerEstadoLinkedin = async (token) => {
  const response = await api.get("/linkedin/estado", conToken(token));
  return response.data; // { conectado, vencida, nombre, expiraEn }
};

export const pedirUrlLinkedin = async (token) => {
  const response = await api.post(
    "/linkedin/autorizacion",
    null,
    conToken(token),
  );
  return response.data.url;
};

export const completarConexionLinkedin = async (token, code, state) => {
  const response = await api.post(
    "/linkedin/conexion",
    { code, state },
    conToken(token),
  );
  return response.data;
};

export const desconectarLinkedin = async (token) => {
  await api.delete("/linkedin/conexion", conToken(token));
};
