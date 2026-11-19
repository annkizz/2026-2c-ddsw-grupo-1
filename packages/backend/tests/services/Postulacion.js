import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PostulacionService } from "../../services/PostulacionService.js";
import { EstadoPostulacion } from "../../domain/EstadoPostulacion.js";

const ID_PROYECTO = "p-1";
const ID_PERFIL = "f-1";
const ID_COLABORADOR = "c-1";
const actorColaboradora = { rol: "COLABORADOR", id: ID_COLABORADOR };
const actorColectivo = { rol: "COLECTIVO", id: "org-1" };

const crearProyecto = (extra = {}) => ({
  _id: ID_PROYECTO,
  idColectivo: "org-1",
  busquedaAbierta: true,
  estaFinalizado: () => false,
  cierreVencido: () => false,
  ...extra,
});

const crearPerfil = (extra = {}) => ({
  _id: ID_PERFIL,
  idProyecto: ID_PROYECTO,
  habilidadesRequeridas: ["React"],
  habilidadesOpcionales: [],
  limiteColaboraciones: null,
  ...extra,
});

const crearPostulacion = (extra = {}) => ({
  _id: "post-1",
  idProyecto: ID_PROYECTO,
  idPerfil: ID_PERFIL,
  idColaborador: ID_COLABORADOR,
  estado: EstadoPostulacion.PENDIENTE,
  fechaPostulacion: new Date(),
  esAnonima: false,
  toObject() {
    return { ...this };
  },
  ...extra,
});

describe("PostulacionService", () => {
  let proyecto;
  let perfil;
  let colaborador;
  let proyectoRepository;
  let perfilRepository;
  let colaboradorService;
  let colaboracionRepository;
  let postulacionRepository;
  let service;

  beforeEach(() => {
    proyecto = crearProyecto();
    perfil = crearPerfil();
    colaborador = {
      _id: ID_COLABORADOR,
      habilidades: ["React"],
      nombreFantasia: "Dev",
      mediosDeContacto: [{ email: "dev@example.com" }],
    };
    proyectoRepository = {
      buscarPorId: jest.fn(async () => proyecto),
    };
    perfilRepository = {
      buscarPorId: jest.fn(async () => perfil),
    };
    colaboradorService = {
      obtenerPorId: jest.fn(async () => colaborador),
    };
    colaboracionRepository = {
      existeColaboracion: jest.fn(async () => false),
      contarPorPerfil: jest.fn(async () => 0),
      crearDesdePostulacion: jest.fn(async () => undefined),
      darDeBaja: jest.fn(async () => null),
      obtenerPorProyecto: jest.fn(async () => []),
    };
    postulacionRepository = {
      save: jest.fn(async (postulacion) => ({
        ...postulacion,
        _id: "post-1",
      })),
      existePendiente: jest.fn(async () => false),
      obtenerPorProyecto: jest.fn(async () => []),
      buscarPorId: jest.fn(async () => crearPostulacion()),
      actualizarEstadoSiPendiente: jest.fn(async (_id, estado) =>
        crearPostulacion({ estado }),
      ),
      reabrirSiAceptada: jest.fn(async () => ({ modifiedCount: 1 })),
    };
    service = new PostulacionService(
      proyectoRepository,
      perfilRepository,
      colaboradorService,
      colaboracionRepository,
      postulacionRepository,
    );
  });

  describe("gestión de colaboraciones", () => {
    it("permite solo al colectivo dueño consultar colaboraciones, incluidas las anónimas", async () => {
      colaboracionRepository.obtenerPorProyecto.mockResolvedValue([
        { idColaborador: colaborador, idPerfil: ID_PERFIL, esAnonima: true },
      ]);

      await expect(service.obtenerColaboracionesParaGestion(ID_PROYECTO, actorColectivo))
        .resolves.toEqual([{
          idColaborador: ID_COLABORADOR,
          idPerfil: ID_PERFIL,
          nombreFantasia: "Dev",
          nombre: undefined,
          apellido: undefined,
          usuarioGitHub: undefined,
          esAnonima: true,
        }]);
      await expect(service.obtenerColaboracionesParaGestion(ID_PROYECTO, actorColaboradora))
        .rejects.toMatchObject({ codigo: "ACCESO_POSTULACIONES_DENEGADO" });
      await expect(service.obtenerColaboracionesParaGestion(ID_PROYECTO, { rol: "COLECTIVO", id: "otro" }))
        .rejects.toMatchObject({ codigo: "ACCESO_POSTULACIONES_DENEGADO" });
      expect(colaboracionRepository.obtenerPorProyecto).toHaveBeenCalledTimes(1);
    });
  });

  describe("crear", () => {
    it("guarda una postulación pendiente asociada al perfil indicado", async () => {
      const resultado = await service.crear(
        ID_PROYECTO,
        ID_PERFIL,
        true,
        actorColaboradora,
      );

      expect(resultado).toMatchObject({
        id: "post-1",
        idProyecto: ID_PROYECTO,
        idPerfil: ID_PERFIL,
        estado: EstadoPostulacion.PENDIENTE,
        esAnonima: true,
      });
      expect(postulacionRepository.save).toHaveBeenCalledTimes(1);
      expect(
        colaboracionRepository.crearDesdePostulacion,
      ).not.toHaveBeenCalled();
    });

    it("no incluye identidad ni datos de contacto mientras está pendiente", async () => {
      const resultado = await service.crear(
        ID_PROYECTO,
        ID_PERFIL,
        false,
        actorColaboradora,
      );

      expect(resultado).not.toHaveProperty("colaborador");
      expect(JSON.stringify(resultado)).not.toContain("dev@example.com");
    });

    it("rechaza postulaciones cuando la búsqueda está cerrada", async () => {
      proyecto.busquedaAbierta = false;

      await expect(
        service.crear(
          ID_PROYECTO,
          ID_PERFIL,
          false,
          actorColaboradora,
        ),
      ).rejects.toMatchObject({ codigo: "BUSQUEDA_CERRADA", status: 409 });
      expect(postulacionRepository.save).not.toHaveBeenCalled();
    });

    it("permite postularse al perfil sin exigir coincidencia de habilidades", async () => {
      colaborador.habilidades = ["Testing"];

      await service.crear(
        ID_PROYECTO,
        ID_PERFIL,
        false,
        actorColaboradora,
      );

      expect(postulacionRepository.save).toHaveBeenCalledTimes(1);
    });

    it("rechaza postulaciones cuando pasó la fecha límite de búsqueda", async () => {
      proyecto.fechaLimiteBusqueda = new Date(Date.now() - 1000);

      await expect(
        service.crear(
          ID_PROYECTO,
          ID_PERFIL,
          false,
          actorColaboradora,
        ),
      ).rejects.toMatchObject({ codigo: "BUSQUEDA_CERRADA", status: 409 });
      expect(postulacionRepository.save).not.toHaveBeenCalled();
    });

    it("rechaza una segunda postulación pendiente al mismo perfil", async () => {
      postulacionRepository.existePendiente.mockResolvedValue(true);

      await expect(
        service.crear(
          ID_PROYECTO,
          ID_PERFIL,
          false,
          actorColaboradora,
        ),
      ).rejects.toMatchObject({ codigo: "POSTULACION_YA_EXISTENTE" });
    });

    it("no permite que un colectivo cree una postulación", async () => {
      await expect(
        service.crear(ID_PROYECTO, ID_PERFIL, false, {
          rol: "COLECTIVO",
          id: "otra",
        }),
      ).rejects.toMatchObject({ codigo: "ACCESO_POSTULACION_DENEGADO" });
      expect(proyectoRepository.buscarPorId).not.toHaveBeenCalled();
    });
  });

  describe("resolver", () => {
    it("acepta una postulación y crea la colaboración para su perfil", async () => {
      const resultado = await service.resolver(
        ID_PROYECTO,
        "post-1",
        EstadoPostulacion.ACEPTADA,
        actorColectivo,
      );

      expect(resultado.estado).toBe(EstadoPostulacion.ACEPTADA);
      expect(resultado.colaborador).toMatchObject({
        id: ID_COLABORADOR,
        mediosDeContacto: colaborador.mediosDeContacto,
      });
      expect(colaboracionRepository.contarPorPerfil).toHaveBeenCalledWith(
        ID_PERFIL,
      );
      expect(colaboracionRepository.crearDesdePostulacion).toHaveBeenCalledWith(
        expect.objectContaining({
          perfil,
          postulacion: expect.objectContaining({ _id: "post-1" }),
          colaborador,
          esAnonima: false,
        }),
      );
    });

    it("rechaza una postulación sin crear una colaboración", async () => {
      const resultado = await service.resolver(
        ID_PROYECTO,
        "post-1",
        EstadoPostulacion.RECHAZADA,
        actorColectivo,
      );

      expect(resultado.estado).toBe(EstadoPostulacion.RECHAZADA);
      expect(colaboracionRepository.contarPorPerfil).not.toHaveBeenCalled();
      expect(
        colaboracionRepository.crearDesdePostulacion,
      ).not.toHaveBeenCalled();
    });

    it("no acepta postulaciones una vez alcanzado el límite del perfil", async () => {
      perfil.limiteColaboraciones = 1;
      colaboracionRepository.contarPorPerfil.mockResolvedValue(1);

      await expect(
        service.resolver(
          ID_PROYECTO,
          "post-1",
          EstadoPostulacion.ACEPTADA,
          actorColectivo,
        ),
      ).rejects.toMatchObject({
        codigo: "LIMITE_COLABORACIONES_ALCANZADO",
        status: 409,
      });
      expect(
        postulacionRepository.actualizarEstadoSiPendiente,
      ).not.toHaveBeenCalled();
    });

    it("reabre la postulación si falla la creación de la colaboración", async () => {
      colaboracionRepository.crearDesdePostulacion.mockRejectedValue(
        new Error("persistencia fallida"),
      );

      await expect(
        service.resolver(
          ID_PROYECTO,
          "post-1",
          EstadoPostulacion.ACEPTADA,
          actorColectivo,
        ),
      ).rejects.toThrow("persistencia fallida");

      expect(postulacionRepository.reabrirSiAceptada).toHaveBeenCalledWith(
        "post-1",
      );
    });
  });

  describe("obtenerPorProyecto", () => {
    it("solo revela los datos de las postulantes aceptadas al colectivo dueño", async () => {
      postulacionRepository.obtenerPorProyecto.mockResolvedValue([
        crearPostulacion({
          estado: EstadoPostulacion.PENDIENTE,
          idColaborador: colaborador,
        }),
        crearPostulacion({
          _id: "post-2",
          estado: EstadoPostulacion.ACEPTADA,
          idColaborador: colaborador,
        }),
      ]);

      const resultado = await service.obtenerPorProyecto(
        ID_PROYECTO,
        actorColectivo,
      );

      expect(resultado[0]).not.toHaveProperty("colaborador");
      expect(resultado[1].colaborador).toMatchObject({
        id: ID_COLABORADOR,
        mediosDeContacto: colaborador.mediosDeContacto,
      });
    });

    it("deniega el acceso a un colectivo que no es dueño del proyecto", async () => {
      await expect(
        service.obtenerPorProyecto(ID_PROYECTO, {
          rol: "COLECTIVO",
          id: "otro",
        }),
      ).rejects.toMatchObject({ codigo: "ACCESO_POSTULACIONES_DENEGADO" });
      expect(postulacionRepository.obtenerPorProyecto).not.toHaveBeenCalled();
    });
  });

  describe("darDeBaja", () => {
    it("elimina la colaboración", async () => {
      colaboracionRepository.darDeBaja.mockResolvedValue({
        idProyecto: ID_PROYECTO,
        idPerfil: ID_PERFIL,
        idColaborador: ID_COLABORADOR,
        fecha: new Date("2026-01-01"),
        esAnonima: false,
      });

      const resultado = await service.darDeBaja(
        ID_PROYECTO,
        ID_COLABORADOR,
        actorColaboradora,
      );

      expect(resultado).not.toHaveProperty("fechaBaja");
      expect(colaboracionRepository.darDeBaja).toHaveBeenCalledWith(
        ID_PROYECTO,
        ID_COLABORADOR,
      );
    });
  });
});
