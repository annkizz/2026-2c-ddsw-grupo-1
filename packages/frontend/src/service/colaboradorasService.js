import api, { conToken } from './api';

// Valores de TipoDeContacto del backend
export const TIPOS_CONTACTO = [
  { valor: 'EMAIL', texto: 'Email' },
  { valor: 'WHATSAPP', texto: 'WhatsApp' },
  { valor: 'SMS', texto: 'SMS' }
];

// El backend pide el celular como +5491145678901 (sin espacios ni guiones)
const sinSeparadores = (valor) => valor.replace(/[\s-]/g, '');

export const obtenerColaboradoras = async () => {
  const response = await api.get('/colaboradoras');
  return response.data;
};

export const obtenerColaboradoraPorId = async (id) => {
  const response = await api.get(`/colaboradoras/${id}`);
  return response.data;
};

export const obtenerMiPerfilColaboradora = async (token) => {
  const response = await api.get('/colaboradoras/me', conToken(token));
  return response.data;
};

export const obtenerProyectosDeColaboradora = async (id) => {
  const response = await api.get(`/colaboradoras/${id}/proyectos`);
  return response.data;
};

// Recibe lo que cargó el formulario y arma el body que valida el backend
export const crearColaboradora = async (token, formulario) => {
  const response = await api.post(
    '/colaboradoras',
    {
      nombreFantasia: formulario.nombreFantasia.trim() || undefined,
      usuarioGitHub: formulario.usuarioGitHub.trim() || undefined,
      nombre: formulario.nombre.trim() || undefined,
      apellido: formulario.apellido.trim() || undefined,
      presentacion: formulario.presentacion.trim() || undefined,
      pronombres: formulario.pronombres
        .split(',')
        .map((pronombre) => pronombre.trim())
        .filter((pronombre) => pronombre !== ''),
      habilidades: formulario.habilidades,
      aceptaMensajeria: formulario.aceptaMensajeria,
      mediosDeContacto: formulario.medios.map((medio) => ({
        tipoDeContacto: medio.tipo,
        contacto: medio.tipo === 'EMAIL' ? medio.valor.trim() : sinSeparadores(medio.valor)
      }))
    },
    conToken(token)
  );
  return response.data;
};
