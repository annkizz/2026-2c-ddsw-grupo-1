import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import mongoose from "mongoose";
import { ProyectoService } from "../../services/ProyectoService.js";
import { Proyecto } from "../../domain/Proyecto.js";
import { Colectivo } from "../../domain/Colectivo.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../errors/AppError.js";
import { crearPostulacionSchema } from "../../controllers/PostulacionController.js";
import { ColaboracionModel } from "../../schemas/colaboracionSchema.js";

// El _id lo genera Mongo: en el test se fija para poder comparar.
const proyectoActivo = (extra = {}) =>
  Object.assign(
    new Proyecto("Titulo", "Desc", [], "ACTIVO", new Date(), null, "col-1"),
    { _id: "p-1" },
    extra,
  );

const enUnaHora = () => new Date(Date.now() + 60 * 60 * 1000);
const haceUnaHora = () => new Date(Date.now() - 60 * 60 * 1000);

describe("ProyectoService", () => {
  let proyectoRepository;
  let colectivoRepository;
  let perfilRepository;
  let colaboracionRepository;
  let service;
  let colectivo;

  beforeEach(() => {
    colectivo = Object.assign(
      new Colectivo("Colectivo", "Desc", undefined, "ONG"),
      {
        _id: "col-1",
      },
    );
    proyectoRepository = {
      // El repo real asigna el _id al insertar: el fake lo imita.
      save: jest.fn(async (proyecto) => {
        if (!proyecto._id) proyecto._id = "p-nuevo";
        return proyecto;
      }),
      buscarPorId: jest.fn(async () => null),
      obtenerVencidos: jest.fn(async () => []),
    };
    colaboracionRepository = {
      obtenerPorProyecto: jest.fn(async () => []),
    };
    colectivoRepository = {
      buscarPorId: jest.fn(async (id) => (id === "col-1" ? colectivo : null)),
      agregarProyecto: jest.fn(async () => undefined),
    };
    perfilRepository = { obtenerTodos: jest.fn(async () => []) };
    service = new ProyectoService(
      proyectoRepository,
      {},
      colectivoRepository,
      colaboracionRepository,
      perfilRepository,
    );
  });

  describe("crear", () => {
    it("crea un proyecto activo, sin perfiles, ligado a su colectivo", async () => {
      const creado = await service.crear({
        idColectivo: "col-1",
        titulo: "T",
        descripcion: "D",
      });

      expect(creado.id).toBe("p-nuevo");
      expect(creado.estado).toBe("ACTIVO");
      expect(creado.perfiles).toEqual([]);
      expect(creado.idColectivo).toBe("col-1");
      expect(creado.busquedaAbierta).toBe(true);
      expect(creado.fechaLimiteBusqueda).toBeNull();
      expect(proyectoRepository.save).toHaveBeenCalledTimes(1);
    });

    it("guarda los datos de apertura de búsqueda del proyecto", async () => {
      const fechaLimiteBusqueda = enUnaHora();
      const creado = await service.crear({
        idColectivo: "col-1",
        titulo: "T",
        descripcion: "D",
        busquedaAbierta: false,
        fechaLimiteBusqueda,
      });

      expect(creado.busquedaAbierta).toBe(false);
      expect(creado.fechaLimiteBusqueda).toEqual(fechaLimiteBusqueda);
    });

    it("agrega el id del proyecto al colectivo a través del repositorio", async () => {
      await service.crear({
        idColectivo: "col-1",
        titulo: "T",
        descripcion: "D",
      });

      expect(colectivoRepository.agregarProyecto).toHaveBeenCalledWith(
        "col-1",
        "p-nuevo",
      );
    });

    it("falla si el colectivo no existe y no guarda nada", async () => {
      await expect(
        service.crear({ idColectivo: "otro", titulo: "T", descripcion: "D" }),
      ).rejects.toMatchObject({ codigo: "COLECTIVO_NO_ENCONTRADO" });
      expect(proyectoRepository.save).not.toHaveBeenCalled();
    });

    it("rechaza una fecha limite de cierre que ya paso", async () => {
      await expect(
        service.crear({
          idColectivo: "col-1",
          titulo: "T",
          descripcion: "D",
          fechaLimiteCierre: haceUnaHora(),
        }),
      ).rejects.toThrow(BadRequestError);
      expect(proyectoRepository.save).not.toHaveBeenCalled();
    });

    it("acepta una fecha limite futura", async () => {
      const fecha = enUnaHora();
      const creado = await service.crear({
        idColectivo: "col-1",
        titulo: "T",
        descripcion: "D",
        fechaLimiteCierre: fecha,
      });
      expect(creado.fechaLimiteCierre).toEqual(fecha);
    });

    it("deja el proyecto nuevo en 0% y sin enlaces", async () => {
      const creado = await service.crear({
        idColectivo: "col-1",
        titulo: "T",
        descripcion: "D",
      });

      expect(creado.porcentajeConcrecion).toBe(0);
      expect(creado.enlaceSistema).toBeNull();
      expect(creado.enlaceCodigoFuente).toBeNull();
    });
  });

  describe("cerrarProyecto", () => {
    it("finaliza el proyecto y lo guarda", async () => {
      const proyecto = proyectoActivo();
      proyectoRepository.buscarPorId.mockResolvedValue(proyecto);

      const cerrado = await service.cerrarProyecto("p-1");

      expect(cerrado.estado).toBe("FINALIZADO");
      expect(proyectoRepository.save).toHaveBeenCalledWith(proyecto);
    });

    it("falla si el proyecto no existe", async () => {
      await expect(service.cerrarProyecto("nope")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("actualizarAvance", () => {
    it("actualiza el avance, lo guarda y devuelve el DTO", async () => {
      const proyecto = proyectoActivo();
      proyectoRepository.buscarPorId.mockResolvedValue(proyecto);

      const resultado = await service.actualizarAvance("p-1", {
        porcentajeConcrecion: 40,
        enlaceCodigoFuente: "https://github.com/colectivo/app",
      });

      expect(proyectoRepository.save).toHaveBeenCalledWith(proyecto);
      expect(resultado.id).toBe("p-1");
      expect(resultado.porcentajeConcrecion).toBe(40);
      expect(resultado.enlaceCodigoFuente).toBe(
        "https://github.com/colectivo/app",
      );
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe y no guarda nada", async () => {
      await expect(
        service.actualizarAvance("nope", { porcentajeConcrecion: 10 }),
      ).rejects.toMatchObject({
        status: 404,
        codigo: "PROYECTO_NO_ENCONTRADO",
      });
      expect(proyectoRepository.save).not.toHaveBeenCalled();
    });

    it("falla con AVANCE_VACIO si no se indica ningún dato", async () => {
      proyectoRepository.buscarPorId.mockResolvedValue(proyectoActivo());

      await expect(service.actualizarAvance("p-1", {})).rejects.toMatchObject({
        status: 400,
        codigo: "AVANCE_VACIO",
      });
      expect(proyectoRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("programarCierre", () => {
    it("programa la fecha y guarda", async () => {
      const proyecto = proyectoActivo();
      proyectoRepository.buscarPorId.mockResolvedValue(proyecto);
      const fecha = enUnaHora();

      const resultado = await service.programarCierre("p-1", fecha);

      expect(resultado.fechaLimiteCierre).toEqual(fecha);
      expect(proyectoRepository.save).toHaveBeenCalledTimes(1);
    });

    it("no permite programar el cierre de un proyecto finalizado", async () => {
      proyectoRepository.buscarPorId.mockResolvedValue(
        proyectoActivo({ estado: "FINALIZADO" }),
      );
      await expect(service.programarCierre("p-1", enUnaHora())).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe("cerrarProyectosVencidos", () => {
    it("cierra los vencidos y reporta los que fallaron", async () => {
      const bueno = proyectoActivo({ _id: "ok" });
      const malo = proyectoActivo({ _id: "falla" });
      proyectoRepository.obtenerVencidos.mockResolvedValue([bueno, malo]);
      proyectoRepository.save.mockImplementation(async (p) => {
        if (p._id === "falla") throw new Error("se cayo la base");
        return p;
      });

      const resultado = await service.cerrarProyectosVencidos();

      expect(resultado.cerrados).toEqual(["ok"]);
      expect(resultado.fallidos).toEqual([
        { idProyecto: "falla", error: "se cayo la base" },
      ]);
    });
  });

  it("publica colaboraciones sin filtrar la identidad cuando son anónimas", async () => {
    const fecha = new Date();
    proyectoRepository.buscarPorId.mockResolvedValue(proyectoActivo());
    colaboracionRepository.obtenerPorProyecto.mockResolvedValue([
      {
        idProyecto: "p-1",
        idColaborador: {
          _id: "c-1",
          nombre: "Nombre privado",
          apellido: "Apellido privado",
        },
        fecha,
        esAnonima: true,
      },
      {
        idProyecto: "p-1",
        idColaborador: {
          _id: "c-2",
          nombreFantasia: "Colaboradora visible",
          usuarioGitHub: "visible-dev",
        },
        fecha,
        esAnonima: false,
      },
    ]);

    const contribuciones = await service.obtenerColaboracionesPublicas("p-1");

    expect(contribuciones[0]).toEqual({
      idProyecto: "p-1",
      idPerfil: null,
      fecha,
      esAnonima: true,
    });
    expect(contribuciones[1]).toEqual({
      idProyecto: "p-1",
      idPerfil: null,
      fecha,
      esAnonima: false,
      colaborador: {
        id: "c-2",
        nombreFantasia: "Colaboradora visible",
        usuarioGitHub: "visible-dev",
        nombre: undefined,
        apellido: undefined,
      },
    });
  });
});

describe("preferencia de anonimato de una postulación", () => {
  it("acepta la preferencia y la deja desactivada si se omite", () => {
    expect(crearPostulacionSchema.parse({ idColaborador: "c-1" })).toEqual({
      idColaborador: "c-1",
      esAnonima: false,
    });
    expect(
      crearPostulacionSchema.parse({
        idColaborador: "c-1",
        esAnonima: true,
      }),
    ).toEqual({ idColaborador: "c-1", esAnonima: true });
    expect(
      crearPostulacionSchema.safeParse({
        idColaborador: "c-1",
        esAnonima: "true",
      }).success,
    ).toBe(false);
  });

  it("usa false por defecto en Mongo y permite guardar true", () => {
    const fecha = new Date();
    const normal = new ColaboracionModel({
      idProyecto: new mongoose.Types.ObjectId(),
      idColaborador: new mongoose.Types.ObjectId(),
      fecha,
    });
    const anonima = new ColaboracionModel({
      idProyecto: new mongoose.Types.ObjectId(),
      idColaborador: new mongoose.Types.ObjectId(),
      fecha,
      esAnonima: true,
    });

    expect(normal.esAnonima).toBe(false);
    expect(anonima.esAnonima).toBe(true);
  });
});
