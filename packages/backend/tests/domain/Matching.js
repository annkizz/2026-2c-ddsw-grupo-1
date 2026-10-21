import { describe, expect, it } from "@jest/globals";
import {
  crearEvaluadorCoincidencia,
  evaluarCoincidencia,
} from "../../domain/Matching.js";

describe("evaluarCoincidencia", () => {
  it("normaliza habilidades y exige al menos una de las requeridas sin calcular porcentaje", () => {
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
    expect(
      evaluarCoincidencia(perfil, ["  testing   e2e CON cypress  ", "REACT"]),
    ).toEqual({
      tieneCoincidencia: true,
      requeridasCoincidentes: ["Testing E2E con Cypress", "React"],
      opcionalesCoincidentes: [],
    });
  });

  it("las opcionales no habilitan el coincidence sin requeridas", () => {
    expect(evaluarCoincidencia({
      habilidadesRequeridas: ["React", "SQL"],
      habilidadesOpcionales: ["Jest"],
    }, ["Jest"])).toEqual({
      tieneCoincidencia: false,
      requeridasCoincidentes: [],
      opcionalesCoincidentes: ["Jest"],
    });
  });

  it("deduplica requeridas y no las cuenta tambien como opcionales", () => {
    expect(evaluarCoincidencia({
      habilidadesRequeridas: ["Diseño UX/UI", " diseno ux/ui ", "React"],
      habilidadesOpcionales: ["React", "Jest"],
    }, ["DISENO UX/UI", "React", "Jest"])).toEqual({
      tieneCoincidencia: true,
      requeridasCoincidentes: ["Diseño UX/UI", "React"],
      opcionalesCoincidentes: ["Jest"],
    });
  });

  it("no considera compatible un perfil sin requeridas validas", () => {
    for (const habilidadesRequeridas of [[], ["  "]]) {
      expect(evaluarCoincidencia({
        habilidadesRequeridas,
        habilidadesOpcionales: ["Jest"],
      }, ["Jest"]).tieneCoincidencia).toBe(false);
    }
  });

  it("reutiliza las habilidades preparadas sin mezclar resultados entre perfiles", () => {
    const evaluar = crearEvaluadorCoincidencia(["REACT", "sql"]);
    expect(evaluar({
      habilidadesRequeridas: ["React", "SQL"],
    }).tieneCoincidencia).toBe(true);
    expect(evaluar({
      habilidadesRequeridas: ["React", "Java"],
    }).tieneCoincidencia).toBe(true);
  });
});
