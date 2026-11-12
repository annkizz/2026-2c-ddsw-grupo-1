import api, { conToken } from './api';

export const obtenerProyectos = async (params) => {
  const response = await api.get('/proyectos', { params });
  return response.data;
};

export const crearProyecto = async (token, proyecto) => {
  const response = await api.post('/proyectos', proyecto, conToken(token));
  return response.data;
};

export const obtenerColaboraciones = async (idProyecto) => {
  const response = await api.get(`/proyectos/${idProyecto}/colaboraciones`);
  return response.data;
};

export const sumarColaboradora = async (token, idProyecto, idColaborador) => {
  const response = await api.post(`/proyectos/${idProyecto}/colaboraciones`, { idColaborador }, conToken(token));
  return response.data;
};

export const cerrarProyecto = async (token, idProyecto) => {
  const response = await api.patch(`/proyectos/${idProyecto}/cierre`, null, conToken(token));
  return response.data;
};

// Perfiles requeridos por el proyecto
export const obtenerPerfiles = async (idProyecto) => {
  const response = await api.get(`/proyectos/${idProyecto}/perfiles`);
  return response.data;
};

export const crearPerfil = async (token, idProyecto, perfil) => {
  const response = await api.post(`/proyectos/${idProyecto}/perfiles`, perfil, conToken(token));
  return response.data;
};

export const actualizarPerfil = async (token, idProyecto, idPerfil, perfil) => {
  const response = await api.put(`/proyectos/${idProyecto}/perfiles/${idPerfil}`, perfil, conToken(token));
  return response.data;
};

export const eliminarPerfil = async (token, idProyecto, idPerfil) => {
  await api.delete(`/proyectos/${idProyecto}/perfiles/${idPerfil}`, conToken(token));
};

// Logros
export const obtenerLogros = async (idProyecto) => {
  const response = await api.get(`/proyectos/${idProyecto}/logros`);
  return response.data;
};

export const crearLogro = async (token, idProyecto, logro) => {
  const response = await api.post(`/proyectos/${idProyecto}/logros`, logro, conToken(token));
  return response.data;
};

// Matching: colaboradoras candidatas para un perfil
export const obtenerCandidatas = async (idProyecto, idPerfil) => {
  const response = await api.get(`/proyectos/${idProyecto}/perfiles/${idPerfil}/colaboradoras`);
  return response.data;
};
