export const CAMPOS_REQUERIDOS_COLECTIVO = [
  { clave: 'nombreColectivo', etiqueta: 'Nombre del colectivo' },
  { clave: 'tipoDeColectivo', etiqueta: 'Tipo de colectivo' },
  { clave: 'descripcion', etiqueta: 'Descripción' },
];

export const camposFaltantesPerfilColectivo = (datos = {}) =>
  CAMPOS_REQUERIDOS_COLECTIVO.filter(({ clave }) => {
    const valor = datos[clave];
    return typeof valor === 'string' ? !valor.trim() : !valor;
  });
