import { beforeEach, describe, expect, it, jest } from "@jest/globals";
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
  let colaboracionRepository;
  let proyectoRepository;
  let postulacionRepository;
  let service;

  beforeEach(() => {
    colaboradorRepository = {
      save: jest.fn(async (colaborador) => colaborador),
      obtenerTodos: jest.fn(async () => []),
      buscarPorId: jest.fn(async () => null),
      buscarPorUsuario: jest.fn(async () => null),
    };
    habilidadRepository = {
      encontrarPorCodigos: jest.fn(async (codigos) =>
        codigos.map((codigo) => catalogo[codigo]).filter(Boolean),
      ),
    };
    colaboracionRepository = {
      obtenerPorColaborador: jest.fn(async () => []),
    };
    proyectoRepository = {
      obtenerPorIds: jest.fn(async () => []),
    };
    postulacionRepository = {
      obtenerPorColaborador: jest.fn(async () => []),
    };
    service = new ColaboradorService(
      colaboradorRepository,
      habilidadRepository,
      undefined,
      colaboracionRepository,
      proyectoRepository,
      postulacionRepository,
    );
  });

  it("consulta solo las postulaciones de la colaboradora autenticada con sus proyectos", async () => {
    colaboradorRepository.buscarPorUsuario.mockResolvedValue({ _id: "c1" });
    postulacionRepository.obtenerPorColaborador.mockResolvedValue([
      { _id: "post1", idProyecto: "p1", idPerfil: "f1", estado: "PENDIENTE", esAnonima: true },
      { _id: "post2", idProyecto: "p1", idPerfil: "f2", estado: "RECHAZADA", esAnonima: false },
    ]);
    proyectoRepository.obtenerPorIds.mockResolvedValue([
      { _id: "p1", titulo: "Proyecto", descripcion: "Descripción", privado: "no exponer" },
    ]);

    const resultado = await service.obtenerMisPostulaciones({ _id: "u1" });

    expect(colaboradorRepository.buscarPorUsuario).toHaveBeenCalledWith("u1");
    expect(postulacionRepository.obtenerPorColaborador).toHaveBeenCalledWith("c1");
    expect(proyectoRepository.obtenerPorIds).toHaveBeenCalledWith(["p1"]);
    expect(resultado).toHaveLength(2);
    expect(resultado[0]).toMatchObject({
      id: "post1", idProyecto: "p1", idPerfil: "f1", estado: "PENDIENTE",
      proyecto: { id: "p1", titulo: "Proyecto", descripcion: "Descripción" },
    });
    expect(resultado[0].proyecto.privado).toBeUndefined();
  });

  it("informa si falta el proyecto de una postulación", async () => {
    colaboradorRepository.buscarPorUsuario.mockResolvedValue({ _id: "c1" });
    postulacionRepository.obtenerPorColaborador.mockResolvedValue([
      { _id: "post1", idProyecto: "p1" },
    ]);

    await expect(service.obtenerMisPostulaciones({ _id: "u1" }))
      .rejects.toMatchObject({ codigo: "PROYECTO_NO_ENCONTRADO" });
  });

  it("guarda las habilidades como titulos (strings) tomados del catalogo", async () => {
    const creada = await service.crear({
      nombreFantasia: "ada",
      habilidades: ["testing e2e con cypress", "React"],
    });

    expect(creada.habilidades).toEqual(["Testing E2E con Cypress", "React"]);
  });

  it("no le asigna un id propio: lo genera la base al guardar", async () => {
    const creada = await service.crear({
      nombreFantasia: "ada",
      habilidades: ["React"],
    });
    expect(creada.idColaborador).toBeUndefined();
    expect(creada.id).toBeUndefined();
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
    colaboradorRepository.obtenerTodos.mockResolvedValue([{ _id: "c1" }]);
    colaboradorRepository.buscarPorId.mockResolvedValue({ _id: "c1" });

    expect(await service.obtenerTodos()).toEqual([{ _id: "c1" }]);
    expect(await service.obtenerPorId("c1")).toEqual({ _id: "c1" });
    expect(colaboradorRepository.buscarPorId).toHaveBeenCalledWith("c1");
  });

  it("devuelve las colaboraciones propias junto con el resumen actual de cada proyecto", async () => {
    const fecha = new Date("2026-10-01T00:00:00.000Z");
    colaboradorRepository.buscarPorUsuario.mockResolvedValue({
      _id: "c1",
    });
    colaboracionRepository.obtenerPorColaborador.mockResolvedValue([
      {
        idProyecto: "p1",
        idPerfil: "f1",
        fecha,
        esAnonima: true,
      },
    ]);
    proyectoRepository.obtenerPorIds.mockResolvedValue([
      {
        _id: "p1",
        titulo: "Proyecto solidario",
        descripcion: "Descripción",
        estado: "ACTIVO",
        fechaInicio: new Date("2026-09-01T00:00:00.000Z"),
        fechaLimiteCierre: null,
        porcentajeConcrecion: 35,
        datosInternos: "no se expone",
      },
    ]);

    await expect(
      service.obtenerMisColaboraciones({ _id: "u1" }),
    ).resolves.toEqual([
      {
        idProyecto: "p1",
        idPerfil: "f1",
        fecha,
        esAnonima: true,
        proyecto: {
          id: "p1",
          titulo: "Proyecto solidario",
          descripcion: "Descripción",
          estado: "ACTIVO",
          fechaInicio: new Date("2026-09-01T00:00:00.000Z"),
          fechaLimiteCierre: null,
          porcentajeConcrecion: 35,
        },
      },
    ]);
    expect(colaboradorRepository.buscarPorUsuario).toHaveBeenCalledWith("u1");
    expect(colaboracionRepository.obtenerPorColaborador).toHaveBeenCalledWith(
      "c1",
    );
    expect(proyectoRepository.obtenerPorIds).toHaveBeenCalledWith(["p1"]);
  });

  it("no consulta proyectos si la colaboradora todavía no tiene colaboraciones", async () => {
    colaboradorRepository.buscarPorUsuario.mockResolvedValue({ _id: "c1" });
    await expect(
      service.obtenerMisColaboraciones({ _id: "u1" }),
    ).resolves.toEqual([]);
    expect(proyectoRepository.obtenerPorIds).not.toHaveBeenCalled();
  });
});
