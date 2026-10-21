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
      encontrarPorId: jest.fn(async () => ({
        _id: idColaboradora,
        habilidades: ["React"],
      })),
    };
    const proyectoRepository = {
      obtenerAbiertos: jest.fn(async () => [proyecto]),
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
    expect(perfilRepository.obtenerPorProyectos).toHaveBeenCalledWith([
      idProyecto,
    ]);
  });
});
