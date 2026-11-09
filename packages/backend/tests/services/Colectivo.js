import { jest } from "@jest/globals";
import { BadRequestError } from "../../errors/AppError.js";
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

  it("carga etiquetas normalizadas al crear (req 34)", async () => {
    const creado = await service.crear({
      nombre: "Manos Solidarias",
      descripcion: "Voluntariado",
      tipoDeColectivo: "FUNDACIONES",
      etiquetas: ["Accesibilidad Web", "accesibilidad_web", "Niños y Jóvenes"],
    });

    expect(creado.etiquetas).toEqual([
      "accesibilidad_web",
      "ninos_y_jovenes",
    ]);
  });

  it("rechaza mas de 10 etiquetas", async () => {
    const demasiadasEtiquetas = [];
    for (let i = 0; i < 11; i++) {
      demasiadasEtiquetas.push(`etiqueta ${i}`);
    }

    await expect(
      service.crear({
        nombre: "Manos Solidarias",
        descripcion: "Voluntariado",
        tipoDeColectivo: "FUNDACIONES",
        etiquetas: demasiadasEtiquetas,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it("devuelve todos los colectivos con el DTO publico", async () => {
    repository.obtenerTodos.mockResolvedValue([
      { _id: "a", nombre: "A", proyectos: ["p-1"], etiquetas: [] },
      { _id: "b", nombre: "B", proyectos: [], etiquetas: [] },
    ]);
    expect(await service.obtenerTodos()).toEqual([
      { id: "a", nombre: "A", proyectos: ["p-1"], etiquetas: [] },
      { id: "b", nombre: "B", proyectos: [], etiquetas: [] },
    ]);
  });
});
