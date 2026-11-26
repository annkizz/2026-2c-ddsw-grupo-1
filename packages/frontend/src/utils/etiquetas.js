//para que lo que se crea desde el formulario llegue tal cual y no falle
export const ETIQUETA_MAX = 30;
export const ETIQUETAS_MAX = 10;

export function normalizarEtiqueta(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function etiquetaLegible(codigo) {
  return String(codigo ?? "").replaceAll("_", " ");
}
