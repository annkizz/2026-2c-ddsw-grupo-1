import { Colectivo } from "../../domain/Colectivo.js";
import { Proyecto } from "../../domain/Proyecto.js";

describe("Dominio - Colectivo", () => {
  const crear = () => new Colectivo("Nombre", "Desc", "Ubicacion", "ONG");

  // La lista de proyectos del colectivo ya no se arma en memoria: el repo la
  // mantiene con $addToSet (ColectivoRepository.agregarProyecto).

  it("guarda los datos con los que se creo", () => {
    const colectivo = crear();

    expect(colectivo.nombre).toBe("Nombre");
    expect(colectivo.descripcion).toBe("Desc");
    expect(colectivo.ubicacion).toBe("Ubicacion");
    expect(colectivo.tipoDeColectivo).toBe("ONG");
  });

  it("finalizar un proyecto lo cierra", () => {
    const proyecto = new Proyecto(
      "T",
      "D",
      [],
      "ACTIVO",
      new Date(),
      null,
      "col-1",
    );
    crear().finalizar(proyecto);
    expect(proyecto.estaFinalizado()).toBe(true);
  });
});
