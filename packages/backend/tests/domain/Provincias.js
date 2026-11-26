import { describe, expect, it } from "@jest/globals";
import {
  PROVINCIAS,
  construirUbicacionDeProyecto,
  normalizarProvincia,
  ubicacionHeredadaDeColectivo,
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
      normalizarProvincia(
        "tierra del fuego, antartida e islas del atlantico sur",
      ),
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
});

describe("ubicacion de un proyecto (req 15)", () => {
  it("normaliza la provincia y deja la ciudad opcional", () => {
    expect(
      construirUbicacionDeProyecto({
        provincia: "Mendoza",
        ciudad: "Godoy Cruz",
      }),
    ).toEqual({
      codigoPais: "AR",
      nombrePais: "Argentina",
      codigoProvincia: "AR-M",
      nombreProvincia: "Mendoza",
      ciudad: "Godoy Cruz",
    });

    expect(construirUbicacionDeProyecto({ provincia: "mendoza" })).toEqual({
      codigoPais: "AR",
      nombrePais: "Argentina",
      codigoProvincia: "AR-M",
      nombreProvincia: "Mendoza",
      ciudad: null,
    });
  });

  it("devuelve null si la provincia no se reconoce o la ubicacion no es valida", () => {
    expect(construirUbicacionDeProyecto({ provincia: "Narnia" })).toBeNull();
    expect(construirUbicacionDeProyecto({})).toBeNull();
    expect(construirUbicacionDeProyecto(null)).toBeNull();
  });

  it("hereda la provincia y la ciudad del colectivo", () => {
    expect(
      ubicacionHeredadaDeColectivo({
        ubicacion: { provincia: "Córdoba", ciudad: "Córdoba" },
      }),
    ).toEqual({
      codigoPais: "AR",
      nombrePais: "Argentina",
      codigoProvincia: "AR-X",
      nombreProvincia: "Córdoba",
      ciudad: "Córdoba",
    });
  });

  it("queda sin ubicacion si el colectivo no tiene o no se reconoce", () => {
    expect(ubicacionHeredadaDeColectivo(null)).toBeNull();
    expect(ubicacionHeredadaDeColectivo({})).toBeNull();
    expect(
      ubicacionHeredadaDeColectivo({ ubicacion: { ciudad: "Córdoba" } }),
    ).toBeNull();
    expect(
      ubicacionHeredadaDeColectivo({
        ubicacion: { provincia: "Narnia" },
      }),
    ).toBeNull();
  });
});
