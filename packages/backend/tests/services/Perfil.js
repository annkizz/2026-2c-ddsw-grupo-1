import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PerfilService } from "../../services/PerfilService.js";
import { NotFoundError } from "../../errors/AppError.js";

const ID_PROYECTO = "proyecto-1";

const datosPerfil = () => ({
  descripcion: "Tester",
  habilidadesRequeridas: ["Testing E2E con Cypress"],
  habilidadesOpcionales: ["Uso de Soap UI"],
  compromiso: {
    tipoCompromiso: "MENSUALES",
    horas: 5,
    tipoColaboracion: "GRATUITA",
  },
});

// simula un documento tal como lo devuelve el repositorio
const perfilGuardado = (extra = {}) => ({
  id: "perfil-1",
  idProyecto: ID_PROYECTO,
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
      save: jest.fn(async (perfil, idProyecto) => ({
        id: "perfil-1",
        idProyecto,
        ...perfil,
      })),
      obtenerTodos: jest.fn(async () => []),
      buscarPorId: jest.fn(async () => null),
      actualizar: jest.fn(async (id, datos) => ({
        id,
        idProyecto: ID_PROYECTO,
        ...datos,
      })),
      eliminar: jest.fn(async () => undefined),
    };
    proyectoRepository = {
      encontrarPorId: jest.fn((id) =>
        id === ID_PROYECTO ? { idProyecto: id, perfiles: [] } : undefined,
      ),
      agregarPerfil: jest.fn(async () => undefined),
      quitarPerfil: jest.fn(async () => undefined),
    };
    habilidadRepository = {
      encontrarPorCodigos: jest.fn(async (codigos) =>
        [
          {
            codigo: "testing_e2e_con_cypress",
            titulo: "Testing E2E con Cypress",
          },
          { codigo: "uso_de_soap_ui", titulo: "Uso de Soap UI" },
        ].filter((habilidad) => codigos.includes(habilidad.codigo)),
      ),
    };
    service = new PerfilService(
      perfilRepository,
      proyectoRepository,
      habilidadRepository,
    );
  });

  describe("crear", () => {
    it("guarda el perfil asociado al proyecto y devuelve el DTO", async () => {
      const resultado = await service.crear(ID_PROYECTO, datosPerfil());

      expect(perfilRepository.save).toHaveBeenCalledTimes(1);
      expect(perfilRepository.save).toHaveBeenCalledWith(
        {
          descripcion: "Tester",
          habilidadesRequeridas: ["Testing E2E con Cypress"],
          habilidadesOpcionales: ["Uso de Soap UI"],
          compromiso: datosPerfil().compromiso,
        },
        ID_PROYECTO,
      );
      expect(resultado).toEqual({
        id: "perfil-1",
        idProyecto: ID_PROYECTO,
        descripcion: "Tester",
        habilidadesRequeridas: ["Testing E2E con Cypress"],
        habilidadesOpcionales: ["Uso de Soap UI"],
        compromiso: datosPerfil().compromiso,
      });
    });

    it("registra el id del perfil en el proyecto", async () => {
      await service.crear(ID_PROYECTO, datosPerfil());

      expect(proyectoRepository.agregarPerfil).toHaveBeenCalledWith(
        ID_PROYECTO,
        "perfil-1",
      );
    });

    it("verifica todas las habilidades en una consulta al repositorio", async () => {
      await service.crear(ID_PROYECTO, datosPerfil());

      expect(habilidadRepository.encontrarPorCodigos).toHaveBeenCalledTimes(1);
      expect(habilidadRepository.encontrarPorCodigos).toHaveBeenCalledWith(
        ["testing_e2e_con_cypress", "uso_de_soap_ui"],
      );
    });

    it("permite crear un perfil sin habilidades opcionales", async () => {
      const datos = { ...datosPerfil(), habilidadesOpcionales: undefined };

      const resultado = await service.crear(ID_PROYECTO, datos);

      expect(resultado.habilidadesOpcionales).toEqual([]);
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe y no guarda nada", async () => {
      await expect(
        service.crear("inexistente", datosPerfil()),
      ).rejects.toMatchObject({
        status: 404,
        codigo: "PROYECTO_NO_ENCONTRADO",
      });
      expect(perfilRepository.save).not.toHaveBeenCalled();
    });

    it("falla con HABILIDAD_NO_ENCONTRADA si una habilidad requerida no existe", async () => {
      habilidadRepository.encontrarPorCodigos.mockImplementation((codigos) =>
        codigos.includes("testing_e2e_con_cypress")
          ? [{ codigo: "uso_de_soap_ui", titulo: "Uso de Soap UI" }]
          : [],
      );

      const promesa = service.crear(ID_PROYECTO, datosPerfil());

      await expect(promesa).rejects.toBeInstanceOf(NotFoundError);
      await expect(promesa).rejects.toMatchObject({
        codigo: "HABILIDAD_NO_ENCONTRADA",
      });
      expect(perfilRepository.save).not.toHaveBeenCalled();
    });

    it("falla con HABILIDAD_NO_ENCONTRADA si una habilidad opcional no existe", async () => {
      habilidadRepository.encontrarPorCodigos.mockImplementation((codigos) =>
        codigos.includes("testing_e2e_con_cypress")
          ? [
              {
                codigo: "testing_e2e_con_cypress",
                titulo: "Testing E2E con Cypress",
              },
            ]
          : [],
      );

      await expect(
        service.crear(ID_PROYECTO, datosPerfil()),
      ).rejects.toMatchObject({
        codigo: "HABILIDAD_NO_ENCONTRADA",
      });
      expect(perfilRepository.save).not.toHaveBeenCalled();
    });

    it("guarda el título de la habilidad tal como está cargado, no como lo escribió el usuario", async () => {
      habilidadRepository.encontrarPorCodigos.mockResolvedValue([
        {
          codigo: "testing_e2e_con_cypress",
          titulo: "testingE2EConCypress",
        },
      ]);
      const datos = { ...datosPerfil(), habilidadesOpcionales: [] };

      await service.crear(ID_PROYECTO, datos);

      expect(
        perfilRepository.save.mock.calls[0][0].habilidadesRequeridas,
      ).toEqual(["testingE2EConCypress"]);
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
      expect(resultado.map((p) => p.id)).toEqual([
        "perfil-1",
        "perfil-2",
      ]);
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

  describe("obtenerPorId", () => {
    it("devuelve el perfil como DTO si pertenece al proyecto", async () => {
      perfilRepository.buscarPorId.mockResolvedValue(perfilGuardado());

      const resultado = await service.obtenerPorId(ID_PROYECTO, "perfil-1");

      expect(perfilRepository.buscarPorId).toHaveBeenCalledWith("perfil-1");
      expect(resultado).toEqual({
        id: "perfil-1",
        idProyecto: ID_PROYECTO,
        descripcion: "Tester",
        habilidadesRequeridas: ["Testing E2E con Cypress"],
        habilidadesOpcionales: ["Uso de Soap UI"],
        compromiso: datosPerfil().compromiso,
      });
    });

    it("falla con PERFIL_NO_ENCONTRADO si el perfil no existe", async () => {
      await expect(
        service.obtenerPorId(ID_PROYECTO, "perfil-x"),
      ).rejects.toMatchObject({
        status: 404,
        codigo: "PERFIL_NO_ENCONTRADO",
      });
    });

    it("falla con PERFIL_NO_ENCONTRADO si el perfil es de otro proyecto", async () => {
      perfilRepository.buscarPorId.mockResolvedValue(
        perfilGuardado({ idProyecto: "otro-proyecto" }),
      );

      await expect(
        service.obtenerPorId(ID_PROYECTO, "perfil-1"),
      ).rejects.toMatchObject({
        codigo: "PERFIL_NO_ENCONTRADO",
      });
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe", async () => {
      await expect(
        service.obtenerPorId("inexistente", "perfil-1"),
      ).rejects.toMatchObject({
        status: 404,
        codigo: "PROYECTO_NO_ENCONTRADO",
      });
      expect(perfilRepository.buscarPorId).not.toHaveBeenCalled();
    });
  });

  describe("actualizar", () => {
    const nuevosDatos = () => ({
      descripcion: "Analista de Datos",
      habilidadesRequeridas: ["Testing E2E con Cypress"],
      habilidadesOpcionales: [],
      compromiso: {
        tipoCompromiso: "SEMANALES",
        horas: 10,
        tipoColaboracion: "INCENTIVO",
      },
    });

    beforeEach(() => {
      perfilRepository.buscarPorId.mockResolvedValue(perfilGuardado());
    });

    it("actualiza el perfil y devuelve el DTO con los datos nuevos", async () => {
      const resultado = await service.actualizar(
        ID_PROYECTO,
        "perfil-1",
        nuevosDatos(),
      );

      expect(perfilRepository.actualizar).toHaveBeenCalledWith(
        "perfil-1",
        nuevosDatos(),
      );
      expect(resultado).toEqual({
        id: "perfil-1",
        idProyecto: ID_PROYECTO,
        ...nuevosDatos(),
      });
    });

    it("no modifica la lista de perfiles del proyecto", async () => {
      await service.actualizar(ID_PROYECTO, "perfil-1", nuevosDatos());

      expect(proyectoRepository.agregarPerfil).not.toHaveBeenCalled();
      expect(proyectoRepository.quitarPerfil).not.toHaveBeenCalled();
    });

    it("verifica todas las habilidades en una consulta al repositorio", async () => {
      await service.actualizar(ID_PROYECTO, "perfil-1", {
        ...nuevosDatos(),
        habilidadesOpcionales: ["Uso de Soap UI"],
      });

      expect(habilidadRepository.encontrarPorCodigos).toHaveBeenCalledTimes(1);
      expect(habilidadRepository.encontrarPorCodigos).toHaveBeenCalledWith(
        ["testing_e2e_con_cypress", "uso_de_soap_ui"],
      );
    });

    it("guarda el título de la habilidad tal como está cargado, no como lo escribió el usuario", async () => {
      habilidadRepository.encontrarPorCodigos.mockResolvedValue([
        {
          codigo: "testing_e2e_con_cypress",
          titulo: "testingE2EConCypress",
        },
      ]);

      await service.actualizar(ID_PROYECTO, "perfil-1", nuevosDatos());

      expect(
        perfilRepository.actualizar.mock.calls[0][1].habilidadesRequeridas,
      ).toEqual(["testingE2EConCypress"]);
    });

    it("falla con HABILIDAD_NO_ENCONTRADA si una habilidad no existe y no actualiza nada", async () => {
      habilidadRepository.encontrarPorCodigos.mockResolvedValue(
        [],
      );

      await expect(
        service.actualizar(ID_PROYECTO, "perfil-1", nuevosDatos()),
      ).rejects.toMatchObject({
        codigo: "HABILIDAD_NO_ENCONTRADA",
      });
      expect(perfilRepository.actualizar).not.toHaveBeenCalled();
    });

    it("falla con PERFIL_NO_ENCONTRADO si el perfil no existe", async () => {
      perfilRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.actualizar(ID_PROYECTO, "perfil-x", nuevosDatos()),
      ).rejects.toMatchObject({
        status: 404,
        codigo: "PERFIL_NO_ENCONTRADO",
      });
      expect(perfilRepository.actualizar).not.toHaveBeenCalled();
    });

    it("falla con PERFIL_NO_ENCONTRADO si el perfil es de otro proyecto", async () => {
      perfilRepository.buscarPorId.mockResolvedValue(
        perfilGuardado({ idProyecto: "otro-proyecto" }),
      );

      await expect(
        service.actualizar(ID_PROYECTO, "perfil-1", nuevosDatos()),
      ).rejects.toMatchObject({
        codigo: "PERFIL_NO_ENCONTRADO",
      });
      expect(perfilRepository.actualizar).not.toHaveBeenCalled();
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe", async () => {
      await expect(
        service.actualizar("inexistente", "perfil-1", nuevosDatos()),
      ).rejects.toMatchObject({
        codigo: "PROYECTO_NO_ENCONTRADO",
      });
      expect(perfilRepository.actualizar).not.toHaveBeenCalled();
    });
  });

  describe("eliminar", () => {
    it("elimina el perfil si pertenece al proyecto", async () => {
      perfilRepository.buscarPorId.mockResolvedValue(perfilGuardado());

      await service.eliminar(ID_PROYECTO, "perfil-1");

      expect(perfilRepository.eliminar).toHaveBeenCalledWith("perfil-1");
    });

    it("quita el id del perfil del proyecto", async () => {
      perfilRepository.buscarPorId.mockResolvedValue(perfilGuardado());

      await service.eliminar(ID_PROYECTO, "perfil-1");

      expect(proyectoRepository.quitarPerfil).toHaveBeenCalledWith(
        ID_PROYECTO,
        "perfil-1",
      );
    });

    it("falla con PERFIL_NO_ENCONTRADO si el perfil no existe", async () => {
      await expect(
        service.eliminar(ID_PROYECTO, "perfil-x"),
      ).rejects.toMatchObject({
        status: 404,
        codigo: "PERFIL_NO_ENCONTRADO",
      });
      expect(perfilRepository.eliminar).not.toHaveBeenCalled();
    });

    it("falla con PERFIL_NO_ENCONTRADO si el perfil es de otro proyecto", async () => {
      perfilRepository.buscarPorId.mockResolvedValue(
        perfilGuardado({ idProyecto: "otro-proyecto" }),
      );

      await expect(
        service.eliminar(ID_PROYECTO, "perfil-1"),
      ).rejects.toMatchObject({
        codigo: "PERFIL_NO_ENCONTRADO",
      });
      expect(perfilRepository.eliminar).not.toHaveBeenCalled();
      expect(proyectoRepository.quitarPerfil).not.toHaveBeenCalled();
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe", async () => {
      await expect(
        service.eliminar("inexistente", "perfil-1"),
      ).rejects.toMatchObject({
        codigo: "PROYECTO_NO_ENCONTRADO",
      });
      expect(perfilRepository.buscarPorId).not.toHaveBeenCalled();
    });
  });
});
