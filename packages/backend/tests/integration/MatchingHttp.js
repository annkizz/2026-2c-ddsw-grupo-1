import request from "supertest";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { crearAppDeMatching } from "./utils/buildApp.js";

const ID_COLABORADORA = "b00000000000000000000001";
const ID_PROYECTO = "a00000000000000000000001";
const ID_PERFIL = "000000000000000000000001";

describe("Matching API - integracion HTTP (estilo clase: repos falsos)", () => {
  let app;
  let colaboradorRepository;
  let proyectoRepository;
  let perfilRepository;
  let colaboracionRepository;

  beforeEach(() => {
    colaboradorRepository = {
      buscarPorId: jest.fn(),
      encontrarPorHabilidadesRequeridas: jest.fn(),
    };
    proyectoRepository = {
      buscarPorId: jest.fn(),
      obtenerAbiertosParaMatching: jest.fn(),
    };
    perfilRepository = {
      buscarPorId: jest.fn(),
      obtenerCompatiblesPorProyectos: jest.fn(),
    };
    colaboracionRepository = {
      obtenerIdsProyectosDeColaborador: jest.fn(),
      obtenerIdsColaboradoresDeProyecto: jest.fn(),
    };

    app = crearAppDeMatching(
      colaboradorRepository,
      proyectoRepository,
      perfilRepository,
      colaboracionRepository,
    );
  });

  describe("GET /colaboradoras/:id/proyectos", () => {
    it("responde 200 con los proyectos compatibles de la colaboradora", async () => {
      colaboradorRepository.buscarPorId.mockResolvedValue({
        _id: ID_COLABORADORA,
        habilidades: ["React"],
      });
      colaboracionRepository.obtenerIdsProyectosDeColaborador.mockResolvedValue(
        [],
      );
      proyectoRepository.obtenerAbiertosParaMatching.mockResolvedValue([
        { _id: ID_PROYECTO, titulo: "Proyecto React", descripcion: "Front" },
      ]);
      perfilRepository.obtenerCompatiblesPorProyectos.mockResolvedValue([
        {
          _id: ID_PERFIL,
          idProyecto: ID_PROYECTO,
          descripcion: "Frontend",
          habilidadesRequeridas: ["React"],
          habilidadesOpcionales: [],
          compromiso: { tipoCompromiso: "MENSUALES", horas: 5 },
        },
      ]);

      const response = await request(app).get(
        `/colaboradoras/${ID_COLABORADORA}/proyectos`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          id: ID_PROYECTO,
          titulo: "Proyecto React",
          descripcion: "Front",
          perfilesCompatibles: [
            {
              id: ID_PERFIL,
              descripcion: "Frontend",
              compromiso: { tipoCompromiso: "MENSUALES", horas: 5 },
              requeridasCoincidentes: ["React"],
              opcionalesCoincidentes: [],
            },
          ],
        },
      ]);
      expect(proyectoRepository.obtenerAbiertosParaMatching).toHaveBeenCalledWith(
        [],
      );
    });

    it("responde 404 con el codigo del error si la colaboradora no existe", async () => {
      colaboradorRepository.buscarPorId.mockResolvedValue(null);

      const response = await request(app).get(
        "/colaboradoras/b00000000000000000000099/proyectos",
      );

      expect(response.status).toBe(404);
      expect(response.body.codigo).toBe("COLABORADORA_NO_ENCONTRADA");
      expect(response.body.error).toBe("La colaboradora no existe");
    });

    it("responde 200 con un listado vacio cuando no hay proyectos candidatos", async () => {
      colaboradorRepository.buscarPorId.mockResolvedValue({
        habilidades: ["React"],
      });
      colaboracionRepository.obtenerIdsProyectosDeColaborador.mockResolvedValue(
        [],
      );
      proyectoRepository.obtenerAbiertosParaMatching.mockResolvedValue([]);

      const response = await request(app).get(
        `/colaboradoras/${ID_COLABORADORA}/proyectos`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(
        perfilRepository.obtenerCompatiblesPorProyectos,
      ).not.toHaveBeenCalled();
    });
  });

  describe("GET /proyectos/:idProyecto/perfiles/:id/colaboradoras", () => {
    it("responde 200 con las candidatas sin exponer datos privados", async () => {
      proyectoRepository.buscarPorId.mockResolvedValue({
        _id: ID_PROYECTO,
        estaFinalizado: () => false,
      });
      perfilRepository.buscarPorId.mockResolvedValue({
        _id: ID_PERFIL,
        idProyecto: ID_PROYECTO,
        habilidadesRequeridas: ["React", "SQL"],
        habilidadesOpcionales: ["Jest"],
      });
      colaboracionRepository.obtenerIdsColaboradoresDeProyecto.mockResolvedValue(
        ["c3"],
      );
      colaboradorRepository.encontrarPorHabilidadesRequeridas.mockResolvedValue([
        {
          _id: "c1",
          habilidades: ["React", "SQL"],
          nombreFantasia: "Completa",
          mediosDeContacto: ["privado"],
          pronombres: ["ella"],
        },
        { _id: "c2", habilidades: ["React", "Jest"] },
        { _id: "c3", habilidades: ["React", "SQL"] }, // ya anotada: se excluye
      ]);

      const response = await request(app).get(
        `/proyectos/${ID_PROYECTO}/perfiles/${ID_PERFIL}/colaboradoras`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        id: "c1",
        tieneCoincidencia: true,
        requeridasCoincidentes: ["React", "SQL"],
        pronombres: ["ella"],
      });
      expect(response.body[1]).toMatchObject({
        id: "c2",
        requeridasCoincidentes: ["React"],
      });
      // reglas de privacidad del matching: sin contacto, sin nombre real
      // y sin la clave pronombres cuando la colaboradora no tiene
      expect(response.body[0]).not.toHaveProperty("mediosDeContacto");
      expect(response.body[0]).not.toHaveProperty("nombre");
      expect(response.body[1]).not.toHaveProperty("pronombres");
    });

    it("responde 404 si el perfil no pertenece al proyecto", async () => {
      proyectoRepository.buscarPorId.mockResolvedValue({
        _id: ID_PROYECTO,
        estaFinalizado: () => false,
      });
      perfilRepository.buscarPorId.mockResolvedValue({
        idProyecto: "otro-proyecto",
      });

      const response = await request(app).get(
        `/proyectos/${ID_PROYECTO}/perfiles/${ID_PERFIL}/colaboradoras`,
      );

      expect(response.status).toBe(404);
      expect(response.body.codigo).toBe("PERFIL_NO_ENCONTRADO");
    });

    it("responde 409 si el proyecto esta finalizado", async () => {
      proyectoRepository.buscarPorId.mockResolvedValue({
        _id: ID_PROYECTO,
        estaFinalizado: () => true,
      });
      perfilRepository.buscarPorId.mockResolvedValue({
        idProyecto: ID_PROYECTO,
      });

      const response = await request(app).get(
        `/proyectos/${ID_PROYECTO}/perfiles/${ID_PERFIL}/colaboradoras`,
      );

      expect(response.status).toBe(409);
      expect(response.body.codigo).toBe("PROYECTO_FINALIZADO");
    });
  });
});
//Integracion HTTP (clase): repos falsos + supertest, con HTTP, sin BD real. Muestra la capa web: rutas, controller, errorHandler, formato.