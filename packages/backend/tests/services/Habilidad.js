import { jest } from "@jest/globals";
import { HabilidadService } from "../../services/HabilidadService.js";
import { ConflictError } from "../../errors/AppError.js";

describe("HabilidadService", () => {
  let repository;
  let service;

  beforeEach(() => {
    repository = {
      encontrarPorTitulo: jest.fn(async () => null),
      save: jest.fn(async (habilidad) => habilidad),
      obtenerTodos: jest.fn(async () => []),
    };
    service = new HabilidadService(repository);
  });

  it("crea una habilidad nueva con su titulo original y su descripcion", async () => {
    const creada = await service.crear({
      titulo: "  Testing E2E con Cypress ",
      descripcion: "Pruebas de punta a punta",
    });

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(creada.titulo).toBe("Testing E2E con Cypress"); 
    expect(creada.descripcion).toBe("Pruebas de punta a punta");
  });

  it("busca si ya existe usando el titulo recibido", async () => {
    await service.crear({ titulo: "React" });
    expect(repository.encontrarPorTitulo).toHaveBeenCalledWith("React");
  });

  it("rechaza una habilidad que ya existe y no la guarda", async () => {
    repository.encontrarPorTitulo.mockResolvedValue({ titulo: "React" });

    await expect(service.crear({ titulo: "react" })).rejects.toThrow(ConflictError);
    await expect(service.crear({ titulo: "react" })).rejects.toMatchObject({
      codigo: "HABILIDAD_YA_EXISTE",
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("devuelve todas las habilidades del repositorio", async () => {
    repository.obtenerTodos.mockResolvedValue([{ titulo: "React" }, { titulo: "Jest" }]);
    expect(await service.obtenerTodos()).toHaveLength(2);
  });
});
