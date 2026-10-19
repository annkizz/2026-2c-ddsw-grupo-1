import { jest } from "@jest/globals";
import { ColaboradorService } from "../../services/ColaboradorService.js";
import { NotFoundError } from "../../errors/AppError.js";

const catalogo = {
  testing_e2e_con_cypress: {
    codigo: "testing_e2e_con_cypress",
    titulo: "Testing E2E con Cypress",
  },
  react: { codigo: "react", titulo: "React" },
};

describe("ColaboradorService", () => {
  let colaboradorRepository;
  let habilidadRepository;
  let service;

  beforeEach(() => {
    colaboradorRepository = {
      save: jest.fn(async (colaborador) => colaborador),
      obtenerTodos: jest.fn(async () => []),
      encontrarPorId: jest.fn(async () => null),
    };
    habilidadRepository = {
      encontrarPorCodigos: jest.fn(async (codigos) =>
        codigos.map((codigo) => catalogo[codigo]).filter(Boolean),
      ),
    };
    service = new ColaboradorService(
      colaboradorRepository,
      habilidadRepository,
    );
  });

  it("guarda las habilidades como titulos (strings) tomados del catalogo", async () => {
    const creada = await service.crear({
      nombreFantasia: "ada",
      habilidades: ["testing e2e con cypress", "React"],
    });

    expect(creada.habilidades).toEqual(["Testing E2E con Cypress", "React"]);
  });

  it("le asigna un id propio a la colaboradora", async () => {
    const creada = await service.crear({
      nombreFantasia: "ada",
      habilidades: ["React"],
    });
    expect(typeof creada.idColaborador).toBe("string");
    expect(creada.idColaborador.length).toBeGreaterThan(0);
  });

  it("permite crear sin presentacion ni pronombres (son opcionales)", async () => {
    const creada = await service.crear({
      nombreFantasia: "ada",
      habilidades: ["React"],
    });
    expect(creada.presentacion).toBeUndefined();
    expect(colaboradorRepository.save).toHaveBeenCalledTimes(1);
  });

  it("persiste el consentimiento de mensajeria y lo deja desactivado por defecto", async () => {
    const acepto = await service.crear({
      nombreFantasia: "ada",
      habilidades: ["React"],
      aceptaMensajeria: true,
    });
    const noAcepto = await service.crear({
      nombreFantasia: "bea",
      habilidades: ["React"],
    });

    expect(acepto.aceptaMensajeria).toBe(true);
    expect(noAcepto.aceptaMensajeria).toBe(false);
  });

  it("falla si alguna habilidad no existe y no guarda nada", async () => {
    await expect(
      service.crear({
        nombreFantasia: "ada",
        habilidades: ["React", "Cocina molecular"],
      }),
    ).rejects.toThrow(NotFoundError);
    await expect(
      service.crear({
        nombreFantasia: "ada",
        habilidades: ["Cocina molecular"],
      }),
    ).rejects.toMatchObject({ codigo: "HABILIDAD_NO_ENCONTRADA" });
    expect(colaboradorRepository.save).not.toHaveBeenCalled();
  });

  it("obtiene todas y por id delegando en el repositorio", async () => {
    colaboradorRepository.obtenerTodos.mockResolvedValue([
      { idColaborador: "c1" },
    ]);
    colaboradorRepository.encontrarPorId.mockResolvedValue({
      idColaborador: "c1",
    });

    expect(await service.obtenerTodos()).toHaveLength(1);
    expect(await service.obtenerPorId("c1")).toEqual({ idColaborador: "c1" });
    expect(colaboradorRepository.encontrarPorId).toHaveBeenCalledWith("c1");
  });
});
