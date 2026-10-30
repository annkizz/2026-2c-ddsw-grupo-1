import { describe, expect, it } from "@jest/globals";
import { Logro } from "../../domain/Logro.js";

describe("Dominio - Logro", () => {
  const fecha = new Date("2026-09-15");

  it("se crea con todos sus atributos", () => {
    const logro = new Logro(
      "Primer prototipo",
      "Se publicó una versión navegable del sistema",
      fecha,
      "proyecto-1",
    );

    expect(logro.titulo).toBe("Primer prototipo");
    expect(logro.descripcion).toBe(
      "Se publicó una versión navegable del sistema",
    );
    expect(logro.fecha).toBe(fecha);
    expect(logro.idProyecto).toBe("proyecto-1");
  });

  it("guarda el id del proyecto, no el proyecto completo", () => {
    const logro = new Logro("MVP", "Primera versión", fecha, "proyecto-1");

    expect(typeof logro.idProyecto).toBe("string");
  });

  it("no genera un id propio: lo asigna la base de datos al guardar", () => {
    const logro = new Logro("MVP", "Primera versión", fecha, "proyecto-1");

    expect(logro.id).toBeUndefined();
  });
});
