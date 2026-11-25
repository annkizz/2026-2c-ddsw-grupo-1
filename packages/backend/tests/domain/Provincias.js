import { describe, expect, it } from "@jest/globals";
import {
  PROVINCIAS,
  construirUbicacionDeProyecto,
  normalizarPais,
  normalizarProvincia,
} from "../../domain/provincias.js";

describe("catalogo de provincias (req 15)", () => {
  it("tiene las 24 jurisdicciones con codigo ISO 3166-2:AR", () => {
    expect(PROVINCIAS).toHaveLength(24);
    for (const provincia of PROVINCIAS) {
      expect(provincia.codigoProvincia).toMatch(/^AR-[A-Z]$/);
      expect(provincia.nombreProvincia.length).toBeGreaterThan(0);
    }
  });

  it("reconoce los nombres oficiales aunque cambien acentos y mayusculas", () => {
    expect(normalizarProvincia("Córdoba")).toEqual({
      codigoProvincia: "AR-X",
      nombreProvincia: "Córdoba",
    });
    expect(normalizarProvincia("  CORDOBA ")).toEqual({
      codigoProvincia: "AR-X",
      nombreProvincia: "Córdoba",
    });
    expect(
      normalizarProvincia("tierra del fuego, antartida e islas del atlantico sur"),
    ).toMatchObject({ codigoProvincia: "AR-V" });
  });

  it("acepta alias comunes", () => {
    expect(normalizarProvincia("CABA")).toMatchObject({
      codigoProvincia: "AR-C",
    });
    expect(normalizarProvincia("Capital Federal")).toMatchObject({
      codigoProvincia: "AR-C",
    });
    expect(normalizarProvincia("Ciudad de Buenos Aires")).toMatchObject({
      codigoProvincia: "AR-C",
    });
    expect(normalizarProvincia("Tierra del Fuego")).toMatchObject({
      codigoProvincia: "AR-V",
    });
    expect(normalizarProvincia("AR-M")).toMatchObject({
      codigoProvincia: "AR-M",
    });
    expect(normalizarProvincia("ar-x")).toMatchObject({
      codigoProvincia: "AR-X",
    });
  });

  it("devuelve null si no reconoce o si no es texto", () => {
    expect(normalizarProvincia("Narnia")).toBeNull();
    expect(normalizarProvincia("")).toBeNull();
    expect(normalizarProvincia(undefined)).toBeNull();
    expect(normalizarProvincia(123)).toBeNull();
  });

  it("normaliza Argentina y rechaza otros países fuera del alcance", () => {
    expect(normalizarPais("argentina")).toEqual({
      codigoPais: "AR",
      nombrePais: "Argentina",
    });
    expect(normalizarPais("AR")).toEqual({
      codigoPais: "AR",
      nombrePais: "Argentina",
    });
    expect(normalizarPais("Uruguay")).toBeNull();
  });
});

describe("ubicacion de un proyecto (req 15)", () => {
  it("normaliza el país, la provincia y la localidad", () => {
    expect(
      construirUbicacionDeProyecto({
        pais: "Argentina",
        provincia: "Mendoza",
        ciudad: "Godoy Cruz",
        latitud: -32.89,
        longitud: -68.83,
      }),
    ).toEqual({
      codigoPais: "AR",
      nombrePais: "Argentina",
      codigoProvincia: "AR-M",
      nombreProvincia: "Mendoza",
      ciudad: "Godoy Cruz",
      direccion: null,
      latitud: -32.89,
      longitud: -68.83,
    });
  });

  it("normaliza coordenadas geograficas dentro de sus rangos", () => {
    expect(
      construirUbicacionDeProyecto({
        pais: "Argentina",
        provincia: "Mendoza",
        ciudad: "Godoy Cruz",
        direccion: "Plaza Godoy Cruz",
        latitud: "-32.89",
        longitud: "-68.83",
      }),
    ).toEqual({
      codigoPais: "AR",
      nombrePais: "Argentina",
      codigoProvincia: "AR-M",
      nombreProvincia: "Mendoza",
      ciudad: "Godoy Cruz",
      direccion: "Plaza Godoy Cruz",
      latitud: -32.89,
      longitud: -68.83,
    });
  });

  it("rechaza coordenadas incompletas o fuera de rango", () => {
    expect(
      construirUbicacionDeProyecto({
        pais: "Argentina",
        provincia: "Mendoza",
        ciudad: "Godoy Cruz",
      }),
    ).toBeNull();
    expect(
      construirUbicacionDeProyecto({
        pais: "Argentina",
        provincia: "Mendoza",
        ciudad: "Godoy Cruz",
        latitud: -32.89,
      }),
    ).toBeNull();
    expect(
      construirUbicacionDeProyecto({
        pais: "Argentina",
        provincia: "Mendoza",
        ciudad: "Godoy Cruz",
        latitud: -91,
        longitud: -68.83,
      }),
    ).toBeNull();
  });

  it("rechaza ubicaciones sin país, provincia o localidad", () => {
    expect(
      construirUbicacionDeProyecto({
        provincia: "Mendoza",
        ciudad: "Godoy Cruz",
      }),
    ).toBeNull();
    expect(
      construirUbicacionDeProyecto({
        pais: "Argentina",
        provincia: "Mendoza",
      }),
    ).toBeNull();
    expect(
      construirUbicacionDeProyecto({
        pais: "Uruguay",
        provincia: "Mendoza",
        ciudad: "Godoy Cruz",
      }),
    ).toBeNull();
  });

  it("normaliza el nombre de la provincia", () => {
    expect(
      construirUbicacionDeProyecto({
        pais: "Argentina",
        provincia: "mendoza",
        ciudad: "  Godoy Cruz  ",
        latitud: -32.89,
        longitud: -68.83,
      }),
    ).toEqual({
      codigoPais: "AR",
      nombrePais: "Argentina",
      codigoProvincia: "AR-M",
      nombreProvincia: "Mendoza",
      ciudad: "Godoy Cruz",
      direccion: null,
      latitud: -32.89,
      longitud: -68.83,
    });
  });

  it("devuelve null si la provincia no se reconoce o la ubicacion no es valida", () => {
    expect(construirUbicacionDeProyecto({ provincia: "Narnia" })).toBeNull();
    expect(construirUbicacionDeProyecto({})).toBeNull();
    expect(construirUbicacionDeProyecto(null)).toBeNull();
  });
});
