import { jest } from "@jest/globals";
import { ColectivoService } from "../../services/ColectivoService.js";

describe("ColectivoService", () => {
  let repository;
  let service;

  beforeEach(() => {
    repository = {
      save: jest.fn(async (colectivo) =>
        Object.assign(colectivo, { _id: "col-nuevo" }),
      ),
      obtenerTodos: jest.fn(async () => []),
    };
    service = new ColectivoService(repository);
  });

  it("crea un colectivo con los datos recibidos y lo guarda", async () => {
    const creado = await service.crear({
      nombre: "Manos Solidarias",
      descripcion: "Voluntariado",
      tipoDeColectivo: "FUNDACIONES",
      ubicacion: { pais: "Argentina" },
    });

    expect(creado.id).toBe("col-nuevo");
    expect(creado.nombre).toBe("Manos Solidarias");
    expect(creado.tipoDeColectivo).toBe("FUNDACIONES");
    expect(creado.ubicacion).toEqual({ pais: "Argentina" });
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it("permite crear un colectivo sin ubicacion (es opcional)", async () => {
    const creado = await service.crear({
      nombre: "N",
      descripcion: "D",
      tipoDeColectivo: "ONG",
    });
    expect(creado.ubicacion).toBeUndefined();
  });

  it("devuelve todos los colectivos con el DTO publico", async () => {
    repository.obtenerTodos.mockResolvedValue([
      { _id: "a", nombre: "A", proyectos: ["p-1"] },
      { _id: "b", nombre: "B", proyectos: [] },
    ]);
    expect(await service.obtenerTodos()).toEqual([
      { id: "a", nombre: "A", proyectos: ["p-1"] },
      { id: "b", nombre: "B", proyectos: [] },
    ]);
  });
});
