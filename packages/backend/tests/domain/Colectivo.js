import { Colectivo } from "../../domain/Colectivo.js";
import { Proyecto } from "../../domain/Proyecto.js";

describe("Dominio - Colectivo", () => {
  const crear = () =>
    new Colectivo("Nombre", "col-1", "Desc", undefined, "ONG");

  it("arranca sin proyectos", () => {
    expect(crear().proyectos).toEqual([]);
  });

  it("agrega un proyecto por su id", () => {
    const colectivo = crear();
    colectivo.agregarProyecto("p-1");
    expect(colectivo.proyectos).toEqual(["p-1"]);
  });

  it("agrega un proyecto recibido como objeto guardando solo su id", () => {
    const colectivo = crear();
    colectivo.agregarProyecto(
      new Proyecto("T", "D", [], "ACTIVO", new Date(), "p-2", null, "col-1"),
    );
    expect(colectivo.proyectos).toEqual(["p-2"]);
  });

  it("no repite un proyecto que ya tiene", () => {
    const colectivo = crear();
    colectivo.agregarProyecto("p-1");
    colectivo.agregarProyecto("p-1");
    expect(colectivo.proyectos).toEqual(["p-1"]);
  });

  it("finalizar un proyecto lo cierra", () => {
    const proyecto = new Proyecto(
      "T",
      "D",
      [],
      "ACTIVO",
      new Date(),
      "p-1",
      null,
      "col-1",
    );
    crear().finalizar(proyecto);
    expect(proyecto.estaFinalizado()).toBe(true);
  });
});
