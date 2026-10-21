import { describe, expect, it } from "@jest/globals";
import { evaluarCoincidencia } from "../../domain/Matching.js";

describe("evaluarCoincidencia", () => {
  it("normaliza habilidades y exige al menos una requerida sin calcular porcentaje", () => {
    const perfil = {
      habilidadesRequeridas: ["Testing E2E con Cypress", "React"],
      habilidadesOpcionales: ["Jest"],
    };

    expect(
      evaluarCoincidencia(perfil, ["  testing   e2e CON cypress  "]),
    ).toEqual({
      tieneCoincidencia: true,
      requeridasCoincidentes: ["Testing E2E con Cypress"],
      opcionalesCoincidentes: [],
    });
    expect(evaluarCoincidencia(perfil, ["Jest"]).tieneCoincidencia).toBe(false);
  });
});
