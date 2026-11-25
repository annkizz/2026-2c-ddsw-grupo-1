import api, { conToken } from './api';

// Valores del enum tipoDeColectivo del backend
export const TIPOS_COLECTIVO = [
  { valor: 'FUNDACIONES', textoKey: 'tiposColectivo.FUNDACIONES' },
  { valor: 'ASOCIACIONES_BARRIALES', textoKey: 'tiposColectivo.ASOCIACIONES_BARRIALES' },
  { valor: 'ONG', textoKey: 'tiposColectivo.ONG' },
  { valor: 'ASAMBLEA', textoKey: 'tiposColectivo.ASAMBLEA' }
];

export const obtenerColectivos = async () => {
  const response = await api.get('/colectivos');
  return response.data;
};

export const obtenerColectivoPorId = async (id) => {
  const response = await api.get(`/colectivos/${id}`);
  return response.data;
};

const armarUbicacion = (formulario, ubicacionAnterior = {}) => {
  const ubicacionFormulario = formulario.ubicacion;
  let ubicacion;
  if (ubicacionFormulario && typeof ubicacionFormulario === 'object') {
    ubicacion = ubicacionFormulario;
  } else if (
    formulario.pais !== undefined ||
    formulario.provincia !== undefined ||
    formulario.ciudad !== undefined
  ) {
    ubicacion = {
      pais: formulario.pais,
      provincia: formulario.provincia,
      ciudad: formulario.ciudad
    };
  } else {
    ubicacion = {
      ...(ubicacionAnterior ?? {}),
      ...(typeof ubicacionFormulario === 'string' ? { ciudad: ubicacionFormulario } : {})
    };
  }
  return Object.fromEntries(
    Object.entries(ubicacion)
      .filter(([, valor]) => typeof valor === 'string' && valor.trim() !== '')
      .map(([campo, valor]) => [campo, valor.trim()])
  );
};

const armarBodyColectivo = (formulario, ubicacionAnterior) => {
  const ubicacion = armarUbicacion(formulario, ubicacionAnterior);
  return {
    nombre: formulario.nombre.trim(),
    descripcion: formulario.descripcion.trim(),
    tipoDeColectivo: formulario.tipoDeColectivo,
    ...(Object.keys(ubicacion).length > 0 ? { ubicacion } : {}),
    ...(formulario.etiquetas?.length > 0 ? { etiquetas: formulario.etiquetas } : {})
  };
};

export const crearColectivo = async (token, formulario) => {
  const response = await api.post('/colectivos', armarBodyColectivo(formulario), conToken(token));
  return response.data;
};

// PUT reemplaza el documento completo: hay que mandar todos los campos (incluidas las etiquetas)
export const actualizarColectivo = async (token, id, formulario, ubicacionAnterior) => {
  const response = await api.put(
    `/colectivos/${id}`,
    armarBodyColectivo(formulario, ubicacionAnterior),
    conToken(token)
  );
  return response.data;
};

export const obtenerMiPerfilColectivo = async (token) => {
  const response = await api.get('/colectivos/me', conToken(token));
  return response.data;
};
