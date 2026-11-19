import { BadRequestError } from "../errors/AppError.js";

export const ETIQUETA_MAX = 30;
export const ETIQUETAS_MAX = 10;

export function normalizarEtiqueta(texto) {
  if (typeof texto !== "string") {
    throw new BadRequestError(
      "la etiqueta debe ser un texto",
      "ETIQUETA_INVALIDA",
    );
  }

  const codigo = texto
    .normalize("NFD") // descompone "á" en "a" + acento suelto
    .replace(/[\u0300-\u036f]/g, "") // borra los acentos sueltos
    .trim() //sin espacios en los bordes
    .toLowerCase() //sin mayusculas
    .replace(/[^a-z0-9]+/g, "_") // lo que no sea letra/digito -> guion bajo
    .replace(/^_+|_+$/g, ""); // sin guion bajo al inicio ni al final

  if (codigo.length === 0) {
    throw new BadRequestError(
      "la etiqueta no puede quedar vacia",
      "ETIQUETA_INVALIDA",
    );
  }

  if (codigo.length > ETIQUETA_MAX) {
    throw new BadRequestError(
      `la etiqueta no puede superar ${ETIQUETA_MAX} caracteres`,
      "ETIQUETA_INVALIDA",
    );
  }

  return codigo;
}

export function normalizarEtiquetas(valores) {
  if (valores === undefined || valores === null) {
    return [];
  }

  if (!Array.isArray(valores)) {
    throw new BadRequestError(
      "las etiquetas deben ser una lista",
      "ETIQUETAS_INVALIDAS",
    );
  }

  const unicas = [];
  for (const valor of valores) {
    const codigo = normalizarEtiqueta(valor);
    if (!unicas.includes(codigo)) {
      unicas.push(codigo);
    }
  }

  if (unicas.length > ETIQUETAS_MAX) {
    throw new BadRequestError(
      `se permiten hasta ${ETIQUETAS_MAX} etiquetas por documento`,
      "ETIQUETAS_DEMASIADAS",
    );
  }

  return unicas;
}
