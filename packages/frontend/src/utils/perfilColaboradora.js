export const CAMPOS_REQUERIDOS_COLABORADORA = [
  { clave: "nombreFantasia", etiquetaKey: "inicio.campoNombreFantasia" },
  { clave: "habilidades", etiquetaKey: "inicio.campoHabilidad" },
];

export const camposFaltantesPerfilColaboradora = (datos = {}) =>
  CAMPOS_REQUERIDOS_COLABORADORA.filter(({ clave }) => {
    const valor = datos[clave];
    if (clave === "habilidades")
      return !Array.isArray(valor) || valor.length === 0;
    return typeof valor === "string" ? !valor.trim() : !valor;
  });
