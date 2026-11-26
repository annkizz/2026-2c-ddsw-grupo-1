import { describe, expect, it, jest } from "@jest/globals";
import mongoose from "mongoose";
import { MatchingService } from "../../services/MatchingService.js";

describe("MatchingService", () => {
  it("asocia perfiles a proyectos con referencias ObjectId", async () => {
    const idProyecto = new mongoose.Types.ObjectId();
    const idPerfil = new mongoose.Types.ObjectId();
    const idColaboradora = new mongoose.Types.ObjectId();
    const proyecto = {
      _id: idProyecto,
      titulo: "Proyecto React",
      descripcion: "Descripción",
    };
    const perfil = {
      _id: idPerfil,
      idProyecto,
      descripcion: "Frontend",
      habilidadesRequeridas: ["React"],
      habilidadesOpcionales: [],
      compromiso: { tipoCompromiso: "MENSUALES", horas: 5 },
    };
    const colaboradorRepository = {
      buscarPorId: jest.fn(async () => ({
        _id: idColaboradora,
        habilidades: ["React"],
      })),
    };
    const proyectoRepository = {
      obtenerAbiertosParaMatching: jest.fn(async () => [proyecto]),
    };
    const perfilRepository = {
      obtenerPorProyectos: jest.fn(async () => [perfil]),
    };
    const colaboracionRepository = {
      obtenerIdsProyectosDeColaborador: jest.fn(async () => []),
    };
    const service = new MatchingService(
      colaboradorRepository,
      proyectoRepository,
      perfilRepository,
      colaboracionRepository,
    );

    await expect(
      service.buscarProyectosParaColaboradora(String(idColaboradora)),
    ).resolves.toEqual([
      {
        id: String(idProyecto),
        titulo: "Proyecto React",
        descripcion: "Descripción",
        puntaje: 2,
        puntajeMaximo: 2,
        porcentajeCobertura: 100,
        porcentajeRequeridas: 100,
        perfilesCompatibles: [
          {
            id: String(idPerfil),
            descripcion: "Frontend",
            compromiso: perfil.compromiso,
            requeridasCoincidentes: ["React"],
            opcionalesCoincidentes: [],
            puntaje: 2,
            puntajeMaximo: 2,
            porcentajeCobertura: 100,
          },
        ],
      },
    ]);
    expect(proyectoRepository.obtenerAbiertosParaMatching).toHaveBeenCalledWith(
      [],
    );
    expect(perfilRepository.obtenerPorProyectos).toHaveBeenCalledWith([
      idProyecto,
    ]);
  });
});

describe("MatchingService con al menos una habilidad requerida", () => {
  it("recalcula todas las recomendaciones con una sola lectura compartida de proyectos y perfiles", async () => {
    const colaboradoras = [
      { _id: "c1", habilidades: ["React"] },
      { _id: "c2", habilidades: ["SQL"] },
    ];
    const perfilRepository = {
      obtenerPorProyectos: jest.fn().mockResolvedValue([]),
    };
    const matchingCacheRepository = { guardar: jest.fn() };
    const proyectoRepository = {
      obtenerAbiertosParaMatching: jest.fn().mockResolvedValue([]),
    };
    const colaboradorRepository = {
      obtenerTodos: jest.fn().mockResolvedValue(colaboradoras),
    };
    const service = new MatchingService(
      colaboradorRepository,
      proyectoRepository,
      perfilRepository,
      {},
      matchingCacheRepository,
    );

    await service.recalcularTodas();

    expect(
      proyectoRepository.obtenerAbiertosParaMatching,
    ).toHaveBeenCalledTimes(1);
    expect(perfilRepository.obtenerPorProyectos).not.toHaveBeenCalled();
    expect(matchingCacheRepository.guardar).toHaveBeenCalledTimes(2);
  });

  it("persiste el resultado calculado y reutiliza el snapshot en búsquedas siguientes", async () => {
    const colaboradora = { _id: "c1", habilidades: ["React"] };
    const proyecto = {
      _id: "p1",
      titulo: "Proyecto React",
      descripcion: "Descripción actual",
    };
    const perfil = {
      _id: "f1",
      idProyecto: "p1",
      descripcion: "Frontend",
      habilidadesRequeridas: ["React"],
      habilidadesOpcionales: [],
      compromiso: { horas: 5 },
    };
    const cache = {
      proyectos: [
        {
          id: "p1",
          titulo: "Título viejo",
          descripcion: "Descripción vieja",
          puntaje: 2,
          puntajeMaximo: 2,
          porcentajeCobertura: 100,
          porcentajeRequeridas: 100,
          perfilesCompatibles: [],
        },
      ],
    };
    const cacheRepository = {
      buscarPorColaborador: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(cache),
      guardar: jest.fn().mockResolvedValue(cache),
    };
    const proyectoRepository = {
      obtenerAbiertosParaMatching: jest.fn().mockResolvedValue([proyecto]),
    };
    const perfilRepository = {
      obtenerPorProyectos: jest.fn().mockResolvedValue([perfil]),
    };
    const service = new MatchingService(
      { buscarPorId: jest.fn().mockResolvedValue(colaboradora) },
      proyectoRepository,
      perfilRepository,
      { obtenerIdsProyectosDeColaborador: jest.fn().mockResolvedValue([]) },
      cacheRepository,
    );

    await service.buscarProyectosParaColaboradora("c1");
    const resultado = await service.buscarProyectosParaColaboradora("c1");

    expect(perfilRepository.obtenerPorProyectos).toHaveBeenCalledTimes(1);
    expect(cacheRepository.guardar).toHaveBeenCalledTimes(1);
    expect(resultado[0]).toMatchObject({
      id: "p1",
      titulo: "Proyecto React",
      descripcion: "Descripción actual",
    });
  });

  it("pasa las exclusiones a Mongo y conserva los proyectos con un perfil compatible", async () => {
    const colaboradorRepository = {
      buscarPorId: jest
        .fn()
        .mockResolvedValue({ habilidades: ["React", "SQL"] }),
    };
    const proyectoRepository = {
      obtenerAbiertosParaMatching: jest.fn().mockResolvedValue([
        { _id: "p1", titulo: "Compatible", descripcion: "D1" },
        { _id: "p2", titulo: "Incompatible", descripcion: "D2" },
      ]),
    };
    const perfilRepository = {
      obtenerPorProyectos: jest.fn().mockResolvedValue([
        {
          _id: "f1",
          idProyecto: "p1",
          descripcion: "Completo",
          habilidadesRequeridas: ["React", "SQL"],
          habilidadesOpcionales: ["Jest"],
          compromiso: { horas: 5 },
        },
        {
          _id: "f2",
          idProyecto: "p2",
          habilidadesRequeridas: ["React", "Java"],
          habilidadesOpcionales: [],
        },
      ]),
    };
    const colaboracionRepository = {
      obtenerIdsProyectosDeColaborador: jest.fn().mockResolvedValue(["p3"]),
    };
    const service = new MatchingService(
      colaboradorRepository,
      proyectoRepository,
      perfilRepository,
      colaboracionRepository,
    );

    await expect(
      service.buscarProyectosParaColaboradora("c1"),
    ).resolves.toEqual([
      {
        id: "p1",
        titulo: "Compatible",
        descripcion: "D1",
        puntaje: 4,
        puntajeMaximo: 5,
        porcentajeCobertura: 80,
        porcentajeRequeridas: 100,
        perfilesCompatibles: [
          {
            id: "f1",
            descripcion: "Completo",
            compromiso: { horas: 5 },
            requeridasCoincidentes: ["React", "SQL"],
            opcionalesCoincidentes: [],
            puntaje: 4,
            puntajeMaximo: 5,
            porcentajeCobertura: 80,
          },
        ],
      },
      {
        id: "p2",
        titulo: "Incompatible",
        descripcion: "D2",
        puntaje: 2,
        puntajeMaximo: 4,
        porcentajeCobertura: 50,
        porcentajeRequeridas: 50,
        perfilesCompatibles: [
          {
            id: "f2",
            requeridasCoincidentes: ["React"],
            opcionalesCoincidentes: [],
            puntaje: 2,
            puntajeMaximo: 4,
            porcentajeCobertura: 50,
          },
        ],
      },
    ]);
    expect(proyectoRepository.obtenerAbiertosParaMatching).toHaveBeenCalledWith(
      ["p3"],
    );
    expect(perfilRepository.obtenerPorProyectos).toHaveBeenCalledWith([
      "p1",
      "p2",
    ]);
    expect(perfilRepository.obtenerPorProyectos).toHaveBeenCalledTimes(1);
  });

  it("ordena por cobertura: gana el proyecto que la persona cubre completo", async () => {
    const colaboradorRepository = {
      buscarPorId: jest
        .fn()
        .mockResolvedValue({ habilidades: ["React", "SQL"] }),
    };
    const proyectoRepository = {
      obtenerAbiertosParaMatching: jest.fn().mockResolvedValue([
        { _id: "grande", titulo: "Muchas requeridas", descripcion: "D1" },
        { _id: "chico", titulo: "Pocas requeridas", descripcion: "D2" },
      ]),
    };
    const perfilRepository = {
      obtenerPorProyectos: jest.fn().mockResolvedValue([
        {
          _id: "f-grande",
          idProyecto: "grande",
          habilidadesRequeridas: [
            "React",
            "Java",
            "Python",
            "Go",
            "Rust",
            "C++",
            "Kotlin",
          ],
          habilidadesOpcionales: [],
        },
        {
          _id: "f-chico",
          idProyecto: "chico",
          habilidadesRequeridas: ["React"],
          habilidadesOpcionales: [],
        },
      ]),
    };
    const service = new MatchingService(
      colaboradorRepository,
      proyectoRepository,
      perfilRepository,
      { obtenerIdsProyectosDeColaborador: jest.fn().mockResolvedValue([]) },
    );

    const resultados = await service.buscarProyectosParaColaboradora("c1");

    expect(resultados.map((proyecto) => proyecto.id)).toEqual([
      "chico",
      "grande",
    ]);
    expect(resultados[0].porcentajeRequeridas).toBe(100);
    expect(resultados[1].porcentajeRequeridas).toBe(14);
  });

  it("no consulta perfiles cuando no hay proyectos candidatos", async () => {
    const perfilRepository = { obtenerPorProyectos: jest.fn() };
    const service = new MatchingService(
      {
        buscarPorId: jest.fn().mockResolvedValue({ habilidades: ["React"] }),
      },
      { obtenerAbiertosParaMatching: jest.fn().mockResolvedValue([]) },
      perfilRepository,
      { obtenerIdsProyectosDeColaborador: jest.fn().mockResolvedValue([]) },
    );
    await expect(
      service.buscarProyectosParaColaboradora("c1"),
    ).resolves.toEqual([]);
    expect(perfilRepository.obtenerPorProyectos).not.toHaveBeenCalled();
  });

  it("no busca proyectos si la persona no tiene habilidades", async () => {
    const proyectoRepository = { obtenerAbiertosParaMatching: jest.fn() };
    const service = new MatchingService(
      { buscarPorId: jest.fn().mockResolvedValue({ habilidades: [] }) },
      proyectoRepository,
      {},
      {},
    );
    await expect(
      service.buscarProyectosParaColaboradora("c1"),
    ).resolves.toEqual([]);
    expect(
      proyectoRepository.obtenerAbiertosParaMatching,
    ).not.toHaveBeenCalled();
  });

  it("busca candidatas con alguna de las requeridas y excluye las ya anotadas", async () => {
    const colaboradorRepository = {
      encontrarPorHabilidadesRequeridas: jest.fn().mockResolvedValue([
        {
          _id: "c1",
          habilidades: ["React", "SQL"],
          nombreFantasia: "Completa",
          mediosDeContacto: ["privado"],
        },
        { _id: "c2", habilidades: ["React", "Jest"] },
        { _id: "c3", habilidades: ["React", "SQL"] },
      ]),
    };
    const service = new MatchingService(
      colaboradorRepository,
      {
        buscarPorId: jest
          .fn()
          .mockResolvedValue({ estaFinalizado: () => false }),
      },
      {
        buscarPorId: jest.fn().mockResolvedValue({
          idProyecto: "p1",
          habilidadesRequeridas: ["React", "SQL"],
          habilidadesOpcionales: ["Jest"],
        }),
      },
      {
        obtenerIdsColaboradoresDeProyecto: jest.fn().mockResolvedValue(["c3"]),
      },
    );
    const resultados = await service.buscarColaboradorasParaPerfil("p1", "f1");
    expect(resultados).toHaveLength(2);
    expect(resultados[0]).toMatchObject({
      id: "c1",
      tieneCoincidencia: true,
      requeridasCoincidentes: ["React", "SQL"],
      puntaje: 4,
    });
    expect(resultados[1]).toMatchObject({
      id: "c2",
      tieneCoincidencia: true,
      requeridasCoincidentes: ["React"],
      puntaje: 3,
    });
    expect(resultados[0]).not.toHaveProperty("mediosDeContacto");
    expect(
      colaboradorRepository.encontrarPorHabilidadesRequeridas,
    ).toHaveBeenCalledWith(["React", "SQL"]);
  });
});
