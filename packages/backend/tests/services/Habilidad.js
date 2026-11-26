import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { HabilidadService } from "../../services/HabilidadService.js";
import { ConflictError } from "../../errors/AppError.js";

describe("HabilidadService", () => {
  let repository;
  let service;

  beforeEach(() => {
    repository = {
      crear: jest.fn(async (habilidad) => habilidad),
      obtenerTodos: jest.fn(async () => []),
    };
    service = new HabilidadService(repository);
  });

  it("crea una habilidad nueva con su titulo original y su descripcion", async () => {
    const creada = await service.crear({
      titulo: "  Testing E2E con Cypress ",
      descripcion: "Pruebas de punta a punta",
    });

    expect(repository.crear).toHaveBeenCalledTimes(1);
    expect(creada.titulo).toBe("Testing E2E con Cypress");
    expect(creada.descripcion).toBe("Pruebas de punta a punta");
  });

  it("propaga el conflicto si la habilidad ya existe", async () => {
    repository.crear.mockRejectedValue(new ConflictError("La habilidad ya existe", "HABILIDAD_YA_EXISTE"));

    await expect(service.crear({ titulo: "react" })).rejects.toThrow(
      ConflictError,
    );
    await expect(service.crear({ titulo: "react" })).rejects.toMatchObject({
      codigo: "HABILIDAD_YA_EXISTE",
    });
  });

  it("devuelve todas las habilidades del repositorio", async () => {
    repository.obtenerTodos.mockResolvedValue([
      { titulo: "React" },
      { titulo: "Jest" },
    ]);
    expect(await service.obtenerTodos()).toHaveLength(2);
  });
});
