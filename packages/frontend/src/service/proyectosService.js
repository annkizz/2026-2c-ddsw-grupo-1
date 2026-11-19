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

export const obtenerColaboracionesParaGestion = async (token, idProyecto) => {
  const response = await api.get(`/proyectos/${idProyecto}/colaboraciones/gestion`, conToken(token));
  return response.data;
};

export const darDeBajaColaboracion = async (token, idProyecto, idColaborador) => {
  const response = await api.delete(
    `/proyectos/${idProyecto}/colaboraciones/${idColaborador}`,
    conToken(token)
  );
  return response.data;
};

export const crearPostulacion = async (token, idProyecto, idPerfil, postulacion) => {
  const response = await api.post(
    `/proyectos/${idProyecto}/perfiles/${idPerfil}/postulaciones`,
    postulacion,
    conToken(token)
  );
  return response.data;
};

export const obtenerPostulaciones = async (token, idProyecto) => {
  const response = await api.get(
    `/proyectos/${idProyecto}/postulaciones`,
    conToken(token)
  );
  return response.data;
};

export const resolverPostulacion = async (
  token,
  idProyecto,
  idPostulacion,
  decision
) => {
  const response = await api.patch(
    `/proyectos/${idProyecto}/postulaciones/${idPostulacion}`,
    { decision },
    conToken(token)
  );
  return response.data;
};

export const invitarAColaborar = async (
  token,
  idProyecto,
  idPerfil,
  idColaborador,
) => {
  const response = await api.post(
    `/proyectos/${idProyecto}/perfiles/${idPerfil}/invitaciones`,
    { idColaborador },
    conToken(token),
  );
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
export const obtenerCandidatas = async (idProyecto, idPerfil, pag = null) => {
  const response = await api.get(
    `/proyectos/${idProyecto}/perfiles/${idPerfil}/colaboradoras`,
    pag ? { params: { pag, limite: 6 } } : undefined,
  );
  return response.data;
};

export const obtenerProyectoPorId = async (idProyecto) => {
  const response = await api.get(`/proyectos/${idProyecto}`);
  return response.data;
};

// agrupacion de proyectos activos por ubicación para el mapa
export const obtenerUbicacionesProyectos = async (params) => {
  const response = await api.get('/proyectos/ubicaciones', { params });
  return response.data;
};

export const actualizarProyecto = async (token, idProyecto, proyecto) => {
  const response = await api.put(`/proyectos/${idProyecto}`, proyecto, conToken(token));
  return response.data;
};
export const configurarBusqueda = async (token, idProyecto, datos) => {
  const response = await api.put(`/proyectos/${idProyecto}/busqueda`, datos, conToken(token));
  return response.data;
};

export const programarCierre = async (token, idProyecto, fechaLimiteCierre) => {
  const response = await api.patch(`/proyectos/${idProyecto}/cierre-programado`, { fechaLimiteCierre }, conToken(token));
  return response.data;
};

export const actualizarAvance = async (token, idProyecto, datos) => {
  const response = await api.patch(`/proyectos/${idProyecto}/avance`, datos, conToken(token));
  return response.data;
};

export const publicarLogroEnLinkedin = async (token, idProyecto, idLogro) => {
  const response = await api.post(
    `/proyectos/${idProyecto}/logros/${idLogro}/linkedin`,
    null,
    conToken(token)
  );
  return response.data;
};
