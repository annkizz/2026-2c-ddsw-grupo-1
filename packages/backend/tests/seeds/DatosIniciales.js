import { describe, expect, it } from "@jest/globals";
import { crearDatosIniciales } from "../../seeds/datosIniciales.js";

describe("escenarios ampliados de la seed", () => {
  it("incluye casos para destacados, búsquedas, ubicación y publicación", () => {
    const ahora = new Date("2026-11-18T12:00:00.000Z");
    const datos = crearDatosIniciales({
      ahora,
      incluirEscenariosAdicionales: true,
    });

    expect(
      datos.proyectos.some(
        (proyecto) =>
          proyecto.destacado && proyecto.destacadoHasta > ahora,
      ),
    ).toBe(true);
    expect(
      datos.proyectos.some(
        (proyecto) =>
          proyecto.destacado && proyecto.destacadoHasta < ahora,
      ),
    ).toBe(true);
    expect(
      datos.proyectos.some(
        (proyecto) =>
          proyecto.estado === "ACTIVO" && !proyecto.busquedaAbierta,
      ),
    ).toBe(true);
    expect(
      datos.proyectos.some((proyecto) =>
        proyecto.logros.some(
          (logro) => logro.publicacionLinkedin?.estado === "FALLIDO",
        ),
      ),
    ).toBe(true);
    expect(
      datos.proyectos.some(
        (proyecto) => proyecto.ubicacion?.provincia === "AR-N",
      ),
    ).toBe(true);
    expect(datos.colaboraciones.some((colaboracion) => colaboracion.idPerfil))
      .toBe(true);
  });
});
