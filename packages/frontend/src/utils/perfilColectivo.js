export const CAMPOS_REQUERIDOS_COLECTIVO = [
  { clave: "nombreColectivo", etiquetaKey: "inicio.campoNombreColectivo" },
  { clave: "tipoDeColectivo", etiquetaKey: "inicio.campoTipoColectivo" },
  { clave: "descripcion", etiquetaKey: "inicio.campoDescripcion" },
];

export const camposFaltantesPerfilColectivo = (datos = {}) =>
  CAMPOS_REQUERIDOS_COLECTIVO.filter(({ clave }) => {
    const valor = datos[clave];
    return typeof valor === "string" ? !valor.trim() : !valor;
  });
