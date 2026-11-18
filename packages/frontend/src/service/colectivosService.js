import api, { conToken } from './api';

// Valores del enum tipoDeColectivo del backend
export const TIPOS_COLECTIVO = [
  { valor: 'FUNDACIONES', texto: 'Fundación' },
  { valor: 'ASOCIACIONES_BARRIALES', texto: 'Asociación barrial' },
  { valor: 'ONG', texto: 'ONG' },
  { valor: 'ASAMBLEA', texto: 'Asamblea' }
];

export const obtenerColectivos = async () => {
  const response = await api.get('/colectivos');
  return response.data;
};

export const obtenerColectivoPorId = async (id) => {
  const response = await api.get(`/colectivos/${id}`);
  return response.data;
};

// El formulario tiene un solo campo "ubicacion" (ciudad), el backend espera { pais, provincia, ciudad }.
// En la edición se conservan país y provincia que ya tuviera guardados.
const armarUbicacion = (ciudad, ubicacionAnterior = {}) => {
  const ubicacion = { ...(ubicacionAnterior ?? {}), ciudad: ciudad.trim() };
  return Object.fromEntries(
    Object.entries(ubicacion).filter(([, valor]) => typeof valor === 'string' && valor.trim() !== '')
  );
};

const armarBodyColectivo = (formulario, ubicacionAnterior) => ({
  nombre: formulario.nombre.trim(),
  descripcion: formulario.descripcion.trim(),
  tipoDeColectivo: formulario.tipoDeColectivo,
  ubicacion: armarUbicacion(formulario.ubicacion, ubicacionAnterior),
  ...(formulario.etiquetas?.length > 0 ? { etiquetas: formulario.etiquetas } : {})
});

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
