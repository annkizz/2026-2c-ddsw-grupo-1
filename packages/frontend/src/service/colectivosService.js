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

// El formulario tiene un solo campo "ubicacion"; el backend espera { pais, provincia, ciudad }
export const crearColectivo = async (token, formulario) => {
  const response = await api.post(
    '/colectivos',
    {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim(),
      tipoDeColectivo: formulario.tipoDeColectivo,
      ubicacion: { ciudad: formulario.ubicacion.trim() }
    },
    conToken(token)
  );
  return response.data;
};

export const actualizarColectivo = async (token, id, datos) => {
  const response = await api.put(`/colectivos/${id}`, datos, conToken(token));
  return response.data;
};
