import { jest } from "@jest/globals";
import { ColectivoService } from "../../services/ColectivoService.js";

describe("ColectivoService", () => {
  let repository;
  let service;

  beforeEach(() => {
    repository = {
      save: jest.fn(async (colectivo) => colectivo),
      obtenerTodos: jest.fn(async () => []),
    };
    service = new ColectivoService(repository);
  });

  it("crea un colectivo con id propio y sin proyectos", async () => {
    const creado = await service.crear({
      nombre: "Manos Solidarias",
      descripcion: "Voluntariado",
      tipoDeColectivo: "FUNDACIONES",
      ubicacion: { pais: "Argentina" },
    });

    expect(creado.nombre).toBe("Manos Solidarias");
    expect(creado.tipoDeColectivo).toBe("FUNDACIONES");
    expect(creado.ubicacion).toEqual({ pais: "Argentina" });
    expect(creado.proyectos).toEqual([]);
    expect(typeof creado.idColectivo).toBe("string");
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it("permite crear un colectivo sin ubicacion (es opcional)", async () => {
    const creado = await service.crear({ nombre: "N", descripcion: "D", tipoDeColectivo: "ONG" });
    expect(creado.ubicacion).toBeUndefined();
  });

  it("devuelve todos los colectivos del repositorio", async () => {
    repository.obtenerTodos.mockResolvedValue([{ nombre: "A" }, { nombre: "B" }]);
    expect(await service.obtenerTodos()).toHaveLength(2);
  });
});
