import { describe, expect, it } from "@jest/globals";
import {
  crearEvaluadorCoincidencia,
  evaluarCoincidencia,
  puntajeDeCoincidencia,
  puntajeMaximoDeCoincidencia,
  porcentajeDeCobertura,
  porcentajeDeCoberturaRequerida,
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
      requeridasTotales: 2,
      opcionalesTotales: 1,
    });
    expect(evaluarCoincidencia(perfil, ["Jest"]).tieneCoincidencia).toBe(false);
    expect(
      evaluarCoincidencia(perfil, ["  testing   e2e CON cypress  ", "REACT"]),
    ).toEqual({
      tieneCoincidencia: true,
      requeridasCoincidentes: ["Testing E2E con Cypress", "React"],
      opcionalesCoincidentes: [],
      requeridasTotales: 2,
      opcionalesTotales: 1,
    });
  });

  it("las opcionales no habilitan el coincidence sin requeridas", () => {
    expect(
      evaluarCoincidencia(
        {
          habilidadesRequeridas: ["React", "SQL"],
          habilidadesOpcionales: ["Jest"],
        },
        ["Jest"],
      ),
    ).toEqual({
      tieneCoincidencia: false,
      requeridasCoincidentes: [],
      opcionalesCoincidentes: ["Jest"],
      requeridasTotales: 2,
      opcionalesTotales: 1,
    });
  });

  it("deduplica requeridas y no las cuenta tambien como opcionales", () => {
    expect(
      evaluarCoincidencia(
        {
          habilidadesRequeridas: ["Diseño UX/UI", " diseno ux/ui ", "React"],
          habilidadesOpcionales: ["React", "Jest"],
        },
        ["DISENO UX/UI", "React", "Jest"],
      ),
    ).toEqual({
      tieneCoincidencia: true,
      requeridasCoincidentes: ["Diseño UX/UI", "React"],
      opcionalesCoincidentes: ["Jest"],
      requeridasTotales: 2,
      opcionalesTotales: 1,
    });
  });

  it("no considera compatible un perfil sin requeridas validas", () => {
    for (const habilidadesRequeridas of [[], ["  "]]) {
      expect(
        evaluarCoincidencia(
          {
            habilidadesRequeridas,
            habilidadesOpcionales: ["Jest"],
          },
          ["Jest"],
        ).tieneCoincidencia,
      ).toBe(false);
    }
  });

  it("reutiliza las habilidades preparadas sin mezclar resultados entre perfiles", () => {
    const evaluar = crearEvaluadorCoincidencia(["REACT", "sql"]);
    expect(
      evaluar({
        habilidadesRequeridas: ["React", "SQL"],
      }).tieneCoincidencia,
    ).toBe(true);
    expect(
      evaluar({
        habilidadesRequeridas: ["React", "Java"],
      }).tieneCoincidencia,
    ).toBe(true);
  });
});

describe("puntajeDeCoincidencia", () => {
  it("pondera las requeridas con 2 y las opcionales con 1", () => {
    expect(
      puntajeDeCoincidencia({
        requeridasCoincidentes: ["React", "SQL"],
        opcionalesCoincidentes: ["Jest"],
      }),
    ).toBe(5);
  });

  it("devuelve 0 si no hay coincidencias", () => {
    expect(puntajeDeCoincidencia()).toBe(0);
    expect(
      puntajeDeCoincidencia({
        requeridasCoincidentes: [],
        opcionalesCoincidentes: [],
      }),
    ).toBe(0);
  });
});

describe("puntajeMaximoDeCoincidencia", () => {
  it("usa las requeridas con peso 2 y las opcionales con peso 1", () => {
    expect(
      puntajeMaximoDeCoincidencia({
        requeridasTotales: 3,
        opcionalesTotales: 2,
      }),
    ).toBe(8);
  });

  it("devuelve 0 si no hay habilidades buscables", () => {
    expect(puntajeMaximoDeCoincidencia()).toBe(0);
    expect(
      puntajeMaximoDeCoincidencia({
        requeridasTotales: 0,
        opcionalesTotales: 5,
      }),
    ).toBe(0);
  });
});

describe("porcentajeDeCobertura", () => {
  it("compara proyectos de distinto tamaño por cobertura", () => {
    expect(porcentajeDeCobertura({ puntaje: 20, puntajeMaximo: 100 })).toBe(20);
    expect(porcentajeDeCobertura({ puntaje: 15, puntajeMaximo: 15 })).toBe(100);
  });

  it("devuelve 0 si el máximo es 0", () => {
    expect(porcentajeDeCobertura({ puntaje: 5, puntajeMaximo: 0 })).toBe(0);
    expect(porcentajeDeCobertura()).toBe(0);
  });
});

describe("porcentajeDeCoberturaRequerida", () => {
  it("prioriza las habilidades obligatorias", () => {
    expect(
      porcentajeDeCoberturaRequerida({
        requeridasCoincidentes: 3,
        requeridasTotales: 4,
      }),
    ).toBe(75);
  });

  it("devuelve 0 si no hay requeridas", () => {
    expect(
      porcentajeDeCoberturaRequerida({
        requeridasCoincidentes: 0,
        requeridasTotales: 0,
      }),
    ).toBe(0);
  });
});
