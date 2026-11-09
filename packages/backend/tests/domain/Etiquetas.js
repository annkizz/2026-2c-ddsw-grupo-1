import { describe, expect, it } from "@jest/globals";
import { BadRequestError } from "../../errors/AppError.js";
import {
  ETIQUETA_MAX,
  ETIQUETAS_MAX,
  normalizarEtiqueta,
  normalizarEtiquetas,
} from "../../domain/etiquetas.js";

describe("normalizarEtiqueta", () => {
  it("pasa a codigo: minusculas, sin acentos y espacios a guion bajo", () => {
    expect(normalizarEtiqueta("Accesibilidad Web")).toBe("accesibilidad_web");
    expect(normalizarEtiqueta("  Navidad  ")).toBe("navidad");
    expect(normalizarEtiqueta("Reciclaje Comunitario")).toBe(
      "reciclaje_comunitario",
    );
  });

  it("la ñ se traslada a n: las etiquetas quedan ASCII", () => {
    expect(normalizarEtiqueta("Año Nuevo")).toBe("ano_nuevo");
    expect(normalizarEtiqueta("Niños y Ñandú")).toBe("ninos_y_nandu");
  });

  it("los separadores consecutivos colapsan en un solo guion bajo", () => {
    expect(normalizarEtiqueta("Ayuda -- social")).toBe("ayuda_social");
    expect(normalizarEtiqueta("!!!Donacion!!!")).toBe("donacion");
  });

  it("rechaza si no es texto, si queda vacia o si supera el maximo", () => {
    expect(() => normalizarEtiqueta(123)).toThrow(BadRequestError);
    expect(() => normalizarEtiqueta("   ")).toThrow(BadRequestError);
    expect(() => normalizarEtiqueta("!!!")).toThrow(BadRequestError);
    expect(() => normalizarEtiqueta("a".repeat(ETIQUETA_MAX + 1))).toThrow(
      BadRequestError,
    );
    // el maximo queda incluido: 30 caracteres es valido
    expect(normalizarEtiqueta("a".repeat(ETIQUETA_MAX))).toContain("a");
  });
});

describe("normalizarEtiquetas", () => {
  it("lista vacia o ausente devuelve lista vacia", () => {
    expect(normalizarEtiquetas(undefined)).toEqual([]);
    expect(normalizarEtiquetas(null)).toEqual([]);
    expect(normalizarEtiquetas([])).toEqual([]);
  });

  it("normaliza cada una y elimina repeticiones", () => {
    expect(
      normalizarEtiquetas([
        "Accesibilidad Web",
        "accesibilidad_web",
        "React",
      ]),
    ).toEqual(["accesibilidad_web", "react"]);
  });

  it("rechaza si el dato no es una lista", () => {
    expect(() => normalizarEtiquetas("accesibilidad")).toThrow(BadRequestError);
  });

  it("rechaza con mas etiquetas que el maximo, tras deduplicar", () => {
    const repetidas = [];
    for (let i = 0; i < ETIQUETAS_MAX; i++) {
      repetidas.push("React");
    }
    expect(normalizarEtiquetas(repetidas)).toEqual(["react"]);

    const demasiadas = [];
    for (let i = 0; i < ETIQUETAS_MAX + 1; i++) {
      demasiadas.push(`Etiqueta numero ${i}`);
    }
    expect(() => normalizarEtiquetas(demasiadas)).toThrow(BadRequestError);
  });
});
