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
      obtenerCompatiblesPorProyectos: jest.fn(async () => [perfil]),
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
        perfilesCompatibles: [
          {
            id: String(idPerfil),
            descripcion: "Frontend",
            compromiso: perfil.compromiso,
            requeridasCoincidentes: ["React"],
            opcionalesCoincidentes: [],
          },
        ],
      },
    ]);
    expect(proyectoRepository.obtenerAbiertosParaMatching).toHaveBeenCalledWith(
      [],
    );
    expect(
      perfilRepository.obtenerCompatiblesPorProyectos,
    ).toHaveBeenCalledWith([idProyecto], ["React"]);
  });
});

describe("MatchingService con al menos una habilidad requerida", () => {
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
      obtenerCompatiblesPorProyectos: jest.fn().mockResolvedValue([
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
        perfilesCompatibles: [
          {
            id: "f1",
            descripcion: "Completo",
            compromiso: { horas: 5 },
            requeridasCoincidentes: ["React", "SQL"],
            opcionalesCoincidentes: [],
          },
        ],
      },
      {
        id: "p2",
        titulo: "Incompatible",
        descripcion: "D2",
        perfilesCompatibles: [
          {
            id: "f2",
            requeridasCoincidentes: ["React"],
            opcionalesCoincidentes: [],
          },
        ],
      },
    ]);
    expect(proyectoRepository.obtenerAbiertosParaMatching).toHaveBeenCalledWith(
      ["p3"],
    );
    expect(
      perfilRepository.obtenerCompatiblesPorProyectos,
    ).toHaveBeenCalledWith(["p1", "p2"], ["React", "SQL"]);
    expect(
      perfilRepository.obtenerCompatiblesPorProyectos,
    ).toHaveBeenCalledTimes(1);
  });

  it("no consulta perfiles cuando no hay proyectos candidatos", async () => {
    const perfilRepository = { obtenerCompatiblesPorProyectos: jest.fn() };
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
    expect(
      perfilRepository.obtenerCompatiblesPorProyectos,
    ).not.toHaveBeenCalled();
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
    });
    expect(resultados[1]).toMatchObject({
      id: "c2",
      tieneCoincidencia: true,
      requeridasCoincidentes: ["React"],
    });
    expect(resultados[0]).not.toHaveProperty("mediosDeContacto");
    expect(
      colaboradorRepository.encontrarPorHabilidadesRequeridas,
    ).toHaveBeenCalledWith(["React", "SQL"]);
  });
});
