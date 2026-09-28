import { jest } from "@jest/globals";
import { PerfilService } from "../../services/PerfilService.js";
import { NotFoundError } from "../../errors/AppError.js";

const ID_PROYECTO = "proyecto-1";

const datosPerfil = () => ({
  descripcion: "Tester",
  habilidadesRequeridas: ["Testing E2E con Cypress"],
  habilidadesOpcionales: ["Uso de Soap UI"],
  compromiso: { tipoCompromiso: "MENSUALES", horas: 5, tipoColaboracion: "GRATUITA" },
});

// simula un documento tal como lo devuelve el repositorio
const perfilGuardado = (extra = {}) => ({
  id: "perfil-1",
  proyecto: ID_PROYECTO,
  ...datosPerfil(),
  ...extra,
});

describe("PerfilService", () => {
  let perfilRepository;
  let proyectoRepository;
  let habilidadRepository;
  let service;

  beforeEach(() => {
    perfilRepository = {
      save: jest.fn(async (datos) => ({ id: "perfil-1", ...datos })),
      obtenerTodos: jest.fn(async () => []),
      buscarPorId: jest.fn(async () => null),
      eliminar: jest.fn(async () => undefined),
    };
    proyectoRepository = {
      encontrarPorId: jest.fn((id) => (id === ID_PROYECTO ? { idProyecto: id } : undefined)),
    };
    habilidadRepository = {
      encontrarPorTitulo: jest.fn((titulo) => ({ titulo })),
    };
    service = new PerfilService(perfilRepository, proyectoRepository, habilidadRepository);
  });

  describe("crear", () => {
    it("guarda el perfil asociado al proyecto y devuelve el DTO", async () => {
      const resultado = await service.crear(ID_PROYECTO, datosPerfil());

      expect(perfilRepository.save).toHaveBeenCalledTimes(1);
      expect(perfilRepository.save).toHaveBeenCalledWith({
        proyecto: ID_PROYECTO,
        descripcion: "Tester",
        habilidadesRequeridas: ["Testing E2E con Cypress"],
        habilidadesOpcionales: ["Uso de Soap UI"],
        compromiso: datosPerfil().compromiso,
      });
      expect(resultado).toEqual({
        idPerfil: "perfil-1",
        idProyecto: ID_PROYECTO,
        descripcion: "Tester",
        habilidadesRequeridas: ["Testing E2E con Cypress"],
        habilidadesOpcionales: ["Uso de Soap UI"],
        compromiso: datosPerfil().compromiso,
      });
    });

    it("verifica cada habilidad requerida y opcional contra el repositorio de habilidades", async () => {
      await service.crear(ID_PROYECTO, datosPerfil());

      expect(habilidadRepository.encontrarPorTitulo).toHaveBeenCalledWith("Testing E2E con Cypress");
      expect(habilidadRepository.encontrarPorTitulo).toHaveBeenCalledWith("Uso de Soap UI");
    });

    it("permite crear un perfil sin habilidades opcionales", async () => {
      const datos = { ...datosPerfil(), habilidadesOpcionales: undefined };

      const resultado = await service.crear(ID_PROYECTO, datos);

      expect(resultado.habilidadesOpcionales).toEqual([]);
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe y no guarda nada", async () => {
      await expect(service.crear("inexistente", datosPerfil())).rejects.toMatchObject({
        status: 404,
        codigo: "PROYECTO_NO_ENCONTRADO",
      });
      expect(perfilRepository.save).not.toHaveBeenCalled();
    });

    it("falla con HABILIDAD_NO_ENCONTRADA si una habilidad requerida no existe", async () => {
      habilidadRepository.encontrarPorTitulo.mockImplementation((titulo) =>
        titulo === "Testing E2E con Cypress" ? undefined : { titulo },
      );

      const promesa = service.crear(ID_PROYECTO, datosPerfil());

      await expect(promesa).rejects.toBeInstanceOf(NotFoundError);
      await expect(promesa).rejects.toMatchObject({ codigo: "HABILIDAD_NO_ENCONTRADA" });
      expect(perfilRepository.save).not.toHaveBeenCalled();
    });

    it("falla con HABILIDAD_NO_ENCONTRADA si una habilidad opcional no existe", async () => {
      habilidadRepository.encontrarPorTitulo.mockImplementation((titulo) =>
        titulo === "Uso de Soap UI" ? undefined : { titulo },
      );

      await expect(service.crear(ID_PROYECTO, datosPerfil())).rejects.toMatchObject({
        codigo: "HABILIDAD_NO_ENCONTRADA",
      });
      expect(perfilRepository.save).not.toHaveBeenCalled();
    });

    it("guarda el título de la habilidad tal como está cargado, no como lo escribió el usuario", async () => {
      habilidadRepository.encontrarPorTitulo.mockImplementation(() => ({
        titulo: "testingE2EConCypress",
      }));
      const datos = { ...datosPerfil(), habilidadesOpcionales: [] };

      await service.crear(ID_PROYECTO, datos);

      expect(perfilRepository.save.mock.calls[0][0].habilidadesRequeridas).toEqual([
        "testingE2EConCypress",
      ]);
    });
  });

  describe("obtenerTodos", () => {
    it("devuelve los perfiles del proyecto como DTOs", async () => {
      perfilRepository.obtenerTodos.mockResolvedValue([
        perfilGuardado(),
        perfilGuardado({ id: "perfil-2", descripcion: "Analista de Datos" }),
      ]);

      const resultado = await service.obtenerTodos(ID_PROYECTO);

      expect(perfilRepository.obtenerTodos).toHaveBeenCalledWith(ID_PROYECTO);
      expect(resultado).toHaveLength(2);
      expect(resultado.map((p) => p.idPerfil)).toEqual(["perfil-1", "perfil-2"]);
      expect(resultado[1].descripcion).toBe("Analista de Datos");
    });

    it("devuelve una lista vacía si el proyecto no tiene perfiles", async () => {
      await expect(service.obtenerTodos(ID_PROYECTO)).resolves.toEqual([]);
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe", async () => {
      await expect(service.obtenerTodos("inexistente")).rejects.toMatchObject({
        status: 404,
        codigo: "PROYECTO_NO_ENCONTRADO",
      });
      expect(perfilRepository.obtenerTodos).not.toHaveBeenCalled();
    });
  });

  describe("eliminar", () => {
    it("elimina el perfil si pertenece al proyecto", async () => {
      perfilRepository.buscarPorId.mockResolvedValue(perfilGuardado());

      await service.eliminar(ID_PROYECTO, "perfil-1");

      expect(perfilRepository.eliminar).toHaveBeenCalledWith("perfil-1");
    });

    it("falla con PERFIL_NO_ENCONTRADO si el perfil no existe", async () => {
      await expect(service.eliminar(ID_PROYECTO, "perfil-x")).rejects.toMatchObject({
        status: 404,
        codigo: "PERFIL_NO_ENCONTRADO",
      });
      expect(perfilRepository.eliminar).not.toHaveBeenCalled();
    });

    it("falla con PERFIL_NO_ENCONTRADO si el perfil es de otro proyecto", async () => {
      perfilRepository.buscarPorId.mockResolvedValue(perfilGuardado({ proyecto: "otro-proyecto" }));

      await expect(service.eliminar(ID_PROYECTO, "perfil-1")).rejects.toMatchObject({
        codigo: "PERFIL_NO_ENCONTRADO",
      });
      expect(perfilRepository.eliminar).not.toHaveBeenCalled();
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe", async () => {
      await expect(service.eliminar("inexistente", "perfil-1")).rejects.toMatchObject({
        codigo: "PROYECTO_NO_ENCONTRADO",
      });
      expect(perfilRepository.buscarPorId).not.toHaveBeenCalled();
    });
  });
});