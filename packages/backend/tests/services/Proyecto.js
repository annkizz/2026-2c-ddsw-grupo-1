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
  let colaboradorService;
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
      obtenerTodos: jest.fn(async () => []),
      obtenerActivosParaMapa: jest.fn(async () => []),
    };
    colaboradorService = { obtenerPorId: jest.fn(async () => null) };
    colaboracionRepository = {
      obtenerPorProyecto: jest.fn(async () => []),
    };
    colectivoRepository = {
      buscarPorId: jest.fn(async (id) =>
        id === "col-1" ? colectivo : null,
      ),
      buscarPorUsuario: jest.fn(async () => colectivo),
      esIdValido: jest.fn((id) => mongoose.isValidObjectId(id)),
      agregarProyecto: jest.fn(async () => undefined),
    };
    perfilRepository = {
      obtenerTodos: jest.fn(async () => []),
      obtenerProyectosPorHabilidades: jest.fn(async () => []),
    };
    service = new ProyectoService(
      proyectoRepository,
      {},
      colaboradorService,
      colectivoRepository,
      colaboracionRepository,
      perfilRepository,
    );

    // Los metodos que verifican que la cuenta sea dueña del colectivo reciben
    // el usuario como ultimo argumento: el helper lo agrega solo.
    service.cerrarProyecto = conUsuario("cerrarProyecto", 1);
    service.actualizarAvance = conUsuario("actualizarAvance", 2);
    service.actualizar = conUsuario("actualizar", 2);
    service.configurarBusqueda = conUsuario("configurarBusqueda", 2);
  });

  // crear() ahora exige la cuenta dueña del colectivo (chequeo de propiedad):
  // los tests la inyectan aca para no repetirla en cada caso.
  const crearProyecto = (datos) => service.crear(datos, { _id: "u-1" });

  const conUsuario =
    (metodo, posicion) =>
    (...args) => {
      const argumentos = [...args];
      argumentos.splice(posicion, 0, { _id: "u-1" });
      return service[metodo](...argumentos);
    };

  describe("crear", () => {
    it("crea un proyecto activo, sin perfiles, ligado a su colectivo", async () => {
      const creado = await crearProyecto({
        idColectivo: "col-1",
        titulo: "T",
        descripcion: "D",
      });

      expect(creado.id).toBe("p-nuevo");
      expect(creado.estado).toBe("ACTIVO");
      expect(creado.perfiles).toEqual([]);
      expect(creado.idColectivo).toBe("col-1");
      expect(creado.busquedaAbierta).toBe(false);
      expect(creado.fechaLimiteBusqueda).toBeNull();
      expect(proyectoRepository.save).toHaveBeenCalledTimes(1);
    });

    it("rechaza crear un proyecto para un colectivo ajeno", async () => {
      // la cuenta logueada es dueña de otro colectivo (col-2), no de col-1
      colectivoRepository.buscarPorUsuario.mockResolvedValueOnce({
        _id: "col-2",
      });

      await expect(
        crearProyecto({ idColectivo: "col-1", titulo: "T", descripcion: "D" }),
      ).rejects.toMatchObject({ codigo: "ACCESO_DENEGADO" });
      expect(proyectoRepository.save).not.toHaveBeenCalled();
    });

    it("guarda los datos de apertura de búsqueda del proyecto", async () => {
      const fechaLimiteBusqueda = enUnaHora();
      const creado = await crearProyecto({
        idColectivo: "col-1",
        titulo: "T",
        descripcion: "D",
        busquedaAbierta: true,
        fechaLimiteBusqueda,
      });

      expect(creado.busquedaAbierta).toBe(true);
      expect(creado.fechaLimiteBusqueda).toEqual(fechaLimiteBusqueda);
    });

    it("agrega el id del proyecto al colectivo a través del repositorio", async () => {
      await crearProyecto({
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
        crearProyecto({ idColectivo: "otro", titulo: "T", descripcion: "D" }),
      ).rejects.toMatchObject({ codigo: "COLECTIVO_NO_ENCONTRADO" });
      expect(proyectoRepository.save).not.toHaveBeenCalled();
    });

    it("rechaza una fecha limite de cierre que ya paso", async () => {
      await expect(
        crearProyecto({
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
      const creado = await crearProyecto({
        idColectivo: "col-1",
        titulo: "T",
        descripcion: "D",
        fechaLimiteCierre: fecha,
      });
      expect(creado.fechaLimiteCierre).toEqual(fecha);
    });

    it("por defecto la búsqueda queda cerrada y sin fecha límite", async () => {
      const creado = await crearProyecto({
        idColectivo: "col-1",
        titulo: "T",
        descripcion: "D",
      });

      expect(creado.busquedaAbierta).toBe(false);
      expect(creado.fechaLimiteBusqueda).toBeNull();
      expect(creado.busquedaVigente).toBe(false);
    });

    it("crea el proyecto con la búsqueda abierta hasta una fecha futura", async () => {
      const fecha = enUnaHora();
      const creado = await crearProyecto({
        idColectivo: "col-1",
        titulo: "T",
        descripcion: "D",
        busquedaAbierta: true,
        fechaLimiteBusqueda: fecha,
      });

      expect(creado.busquedaAbierta).toBe(true);
      expect(creado.fechaLimiteBusqueda).toEqual(fecha);
      expect(creado.busquedaVigente).toBe(true);
    });

    it("rechaza una fecha límite de búsqueda que ya pasó y no guarda nada", async () => {
      await expect(
        crearProyecto({
          idColectivo: "col-1",
          titulo: "T",
          descripcion: "D",
          busquedaAbierta: true,
          fechaLimiteBusqueda: haceUnaHora(),
        }),
      ).rejects.toMatchObject({
        status: 400,
        codigo: "FECHA_LIMITE_BUSQUEDA_INVALIDA",
      });
      expect(proyectoRepository.save).not.toHaveBeenCalled();
    });

    it("rechaza una fecha límite de búsqueda si la búsqueda no está abierta", async () => {
      await expect(
        crearProyecto({
          idColectivo: "col-1",
          titulo: "T",
          descripcion: "D",
          busquedaAbierta: false,
          fechaLimiteBusqueda: enUnaHora(),
        }),
      ).rejects.toMatchObject({
        status: 400,
        codigo: "BUSQUEDA_CERRADA_CON_FECHA",
      });
      expect(proyectoRepository.save).not.toHaveBeenCalled();
    });

    it("deja el proyecto nuevo en 0% y sin enlaces", async () => {
      const creado = await crearProyecto({
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

  describe("obtenerPorId", () => {
    it("devuelve el proyecto como DTO", async () => {
      proyectoRepository.buscarPorId.mockResolvedValue(proyectoActivo());

      const resultado = await service.obtenerPorId("p-1");

      expect(proyectoRepository.buscarPorId).toHaveBeenCalledWith("p-1");
      expect(resultado.id).toBe("p-1");
      expect(resultado.titulo).toBe("Titulo");
      expect(resultado.estado).toBe("ACTIVO");
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe", async () => {
      await expect(service.obtenerPorId("nope")).rejects.toMatchObject({
        status: 404,
        codigo: "PROYECTO_NO_ENCONTRADO",
      });
    });
  });

  describe("actualizar", () => {
    it("cambia título y descripción, guarda y devuelve el DTO", async () => {
      const proyecto = proyectoActivo();
      proyectoRepository.buscarPorId.mockResolvedValue(proyecto);

      const resultado = await service.actualizar("p-1", {
        titulo: "Nuevo título",
        descripcion: "Nueva descripción",
      });

      expect(proyectoRepository.save).toHaveBeenCalledWith(proyecto);
      expect(resultado.titulo).toBe("Nuevo título");
      expect(resultado.descripcion).toBe("Nueva descripción");
    });

    it("no modifica el colectivo ni el estado", async () => {
      proyectoRepository.buscarPorId.mockResolvedValue(proyectoActivo());

      const resultado = await service.actualizar("p-1", {
        titulo: "T",
        descripcion: "D",
      });

      expect(resultado.idColectivo).toBe("col-1");
      expect(resultado.estado).toBe("ACTIVO");
    });

    it("normaliza y reemplaza las etiquetas al editarlas", async () => {
      proyectoRepository.buscarPorId.mockResolvedValue(
        proyectoActivo({ etiquetas: ["salud"] }),
      );

      const resultado = await service.actualizar("p-1", {
        titulo: "T",
        descripcion: "D",
        etiquetas: ["Accesibilidad Web", "accesibilidad_web", "Salud"],
      });

      expect(resultado.etiquetas).toEqual(["accesibilidad_web", "salud"]);
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe y no guarda nada", async () => {
      await expect(
        service.actualizar("nope", { titulo: "T", descripcion: "D" }),
      ).rejects.toMatchObject({ status: 404, codigo: "PROYECTO_NO_ENCONTRADO" });
      expect(proyectoRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("configurarBusqueda", () => {
    it("abre la búsqueda hasta una fecha futura y guarda", async () => {
      const proyecto = proyectoActivo();
      proyectoRepository.buscarPorId.mockResolvedValue(proyecto);
      const fecha = enUnaHora();

      const resultado = await service.configurarBusqueda("p-1", {
        busquedaAbierta: true,
        fechaLimiteBusqueda: fecha,
      });

      expect(proyectoRepository.save).toHaveBeenCalledWith(proyecto);
      expect(resultado.busquedaAbierta).toBe(true);
      expect(resultado.fechaLimiteBusqueda).toEqual(fecha);
      expect(resultado.busquedaVigente).toBe(true);
    });

    it("abre la búsqueda sin fecha límite", async () => {
      proyectoRepository.buscarPorId.mockResolvedValue(proyectoActivo());

      const resultado = await service.configurarBusqueda("p-1", {
        busquedaAbierta: true,
      });

      expect(resultado.busquedaAbierta).toBe(true);
      expect(resultado.fechaLimiteBusqueda).toBeNull();
      expect(resultado.busquedaVigente).toBe(true);
    });

    it("al cerrar la búsqueda se borra la fecha límite", async () => {
      proyectoRepository.buscarPorId.mockResolvedValue(
        proyectoActivo({ busquedaAbierta: true, fechaLimiteBusqueda: enUnaHora() }),
      );

      const resultado = await service.configurarBusqueda("p-1", {
        busquedaAbierta: false,
      });

      expect(resultado.busquedaAbierta).toBe(false);
      expect(resultado.fechaLimiteBusqueda).toBeNull();
      expect(resultado.busquedaVigente).toBe(false);
    });

    it("no permite configurar la búsqueda de un proyecto finalizado", async () => {
      proyectoRepository.buscarPorId.mockResolvedValue(
        proyectoActivo({ estado: "FINALIZADO" }),
      );

      await expect(
        service.configurarBusqueda("p-1", { busquedaAbierta: true }),
      ).rejects.toMatchObject({ status: 409, codigo: "PROYECTO_FINALIZADO" });
      expect(proyectoRepository.save).not.toHaveBeenCalled();
    });

    it("rechaza una fecha límite que ya pasó", async () => {
      proyectoRepository.buscarPorId.mockResolvedValue(proyectoActivo());

      await expect(
        service.configurarBusqueda("p-1", {
          busquedaAbierta: true,
          fechaLimiteBusqueda: haceUnaHora(),
        }),
      ).rejects.toMatchObject({
        status: 400,
        codigo: "FECHA_LIMITE_BUSQUEDA_INVALIDA",
      });
      expect(proyectoRepository.save).not.toHaveBeenCalled();
    });

    it("rechaza una fecha límite si la búsqueda no está abierta", async () => {
      proyectoRepository.buscarPorId.mockResolvedValue(proyectoActivo());

      await expect(
        service.configurarBusqueda("p-1", {
          busquedaAbierta: false,
          fechaLimiteBusqueda: enUnaHora(),
        }),
      ).rejects.toMatchObject({
        status: 400,
        codigo: "BUSQUEDA_CERRADA_CON_FECHA",
      });
      expect(proyectoRepository.save).not.toHaveBeenCalled();
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe", async () => {
      await expect(
        service.configurarBusqueda("nope", { busquedaAbierta: true }),
      ).rejects.toMatchObject({ status: 404, codigo: "PROYECTO_NO_ENCONTRADO" });
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

  describe("req 15: ubicaciones", () => {
    it("hereda la ubicacion del colectivo si el proyecto no la manda", async () => {
      colectivo.ubicacion = {
        pais: "Argentina",
        provincia: "Córdoba",
        ciudad: "Córdoba",
      };

      const creado = await crearProyecto({
        idColectivo: "col-1",
        titulo: "T",
        descripcion: "D",
      });

      expect(creado.ubicacion).toEqual({
        codigoPais: "AR",
        nombrePais: "Argentina",
        codigoProvincia: "AR-X",
        nombreProvincia: "Córdoba",
        ciudad: "Córdoba",
      });
    });

    it("la ubicacion propia manda sobre la del colectivo", async () => {
      colectivo.ubicacion = { provincia: "Córdoba", ciudad: "Córdoba" };

      const creado = await crearProyecto({
        idColectivo: "col-1",
        titulo: "T",
        descripcion: "D",
        ubicacion: { provincia: "Mendoza", ciudad: "Godoy Cruz" },
      });

      expect(creado.ubicacion).toEqual({
        codigoPais: "AR",
        nombrePais: "Argentina",
        codigoProvincia: "AR-M",
        nombreProvincia: "Mendoza",
        ciudad: "Godoy Cruz",
      });
    });

    it("queda sin ubicacion si ni el proyecto ni el colectivo tienen", async () => {
      const creado = await crearProyecto({
        idColectivo: "col-1",
        titulo: "T",
        descripcion: "D",
      });

      expect(creado.ubicacion).toBeNull();
    });

    it("rechaza una provincia desconocida y no guarda nada", async () => {
      await expect(
        crearProyecto({
          idColectivo: "col-1",
          titulo: "T",
          descripcion: "D",
          ubicacion: { provincia: "Narnia" },
        }),
      ).rejects.toMatchObject({ codigo: "PROVINCIA_INVALIDA" });
      expect(proyectoRepository.save).not.toHaveBeenCalled();
    });

    it("normaliza el filtro por provincia antes de consultar", async () => {
      await service.obtenerTodos({ provincia: "cordoba" });

      expect(proyectoRepository.obtenerTodos).toHaveBeenCalledWith({
        provincia: "AR-X",
      });
    });

    it("rechaza un filtro por provincia desconocida", async () => {
      await expect(
        service.obtenerTodos({ provincia: "Narnia" }),
      ).rejects.toMatchObject({ codigo: "PROVINCIA_INVALIDA" });
    });

    it("agrupa solo los proyectos activos con ubicacion por provincia", async () => {
      proyectoRepository.obtenerActivosParaMapa.mockResolvedValue([
        {
          _id: "p-1",
          titulo: "Uno",
          idColectivo: { _id: "col-1", nombre: "Colectivo Uno" },
          ubicacion: {
            codigoPais: "AR",
            nombrePais: "Argentina",
            codigoProvincia: "AR-M",
            nombreProvincia: "Mendoza",
            ciudad: "Godoy Cruz",
          },
        },
        {
          _id: "p-2",
          titulo: "Dos",
          idColectivo: { _id: "col-1", nombre: "Colectivo Uno" },
          ubicacion: {
            codigoPais: "AR",
            nombrePais: "Argentina",
            codigoProvincia: "AR-M",
            nombreProvincia: "Mendoza",
            ciudad: null,
          },
        },
        {
          _id: "p-3",
          titulo: "Tres",
          idColectivo: { _id: "col-2", nombre: "Colectivo Dos" },
          ubicacion: {
            codigoPais: "AR",
            nombrePais: "Argentina",
            codigoProvincia: "AR-X",
            nombreProvincia: "Córdoba",
            ciudad: "Córdoba",
          },
        },
        {
          _id: "p-4",
          titulo: "Sin ubicacion",
          idColectivo: { _id: "col-2", nombre: "Colectivo Dos" },
          ubicacion: null,
        },
      ]);

      const resultado = await service.obtenerUbicaciones();

      expect(resultado[0]).toMatchObject({
        nivel: "provincia",
        codigo: "AR-M",
        nombre: "Mendoza",
        cantidad: 2,
      });
      expect(resultado[0].proyectos[0]).toEqual({
        id: "p-1",
        titulo: "Uno",
        ciudad: "Godoy Cruz",
        colectivo: { id: "col-1", nombre: "Colectivo Uno" },
      });
      expect(resultado[1]).toMatchObject({
        nivel: "provincia",
        codigo: "AR-X",
        nombre: "Córdoba",
        cantidad: 1,
      });
      expect(
        resultado.flatMap((grupo) => grupo.proyectos).map((p) => p.id),
      ).not.toContain("p-4");
    });

    it("puede agrupar por pais sin cambiar el resto del contrato", async () => {
      proyectoRepository.obtenerActivosParaMapa.mockResolvedValue([
        {
          _id: "p-1",
          titulo: "Uno",
          idColectivo: { _id: "col-1", nombre: "Colectivo Uno" },
          ubicacion: {
            codigoPais: "AR",
            nombrePais: "Argentina",
            codigoProvincia: "AR-M",
            nombreProvincia: "Mendoza",
            ciudad: "Godoy Cruz",
          },
        },
      ]);

      const resultado = await service.obtenerUbicaciones("pais");

      expect(resultado).toEqual([
        {
          nivel: "pais",
          codigo: "AR",
          nombre: "Argentina",
          cantidad: 1,
          proyectos: [
            {
              id: "p-1",
              titulo: "Uno",
              ciudad: "Godoy Cruz",
              colectivo: { id: "col-1", nombre: "Colectivo Uno" },
            },
          ],
        },
      ]);
    });

    it("rechaza un nivel de mapa desconocido", async () => {
      await expect(
        service.obtenerUbicaciones("planeta"),
      ).rejects.toMatchObject({
        status: 400,
        codigo: "NIVEL_MAPA_INVALIDO",
      });
      expect(
        proyectoRepository.obtenerActivosParaMapa,
      ).not.toHaveBeenCalled();
    });
  });

  describe("búsqueda de proyectos por estado", () => {
    it("normaliza el estado antes de consultar", async () => {
      await service.obtenerTodos({ estado: " activo " });

      expect(proyectoRepository.obtenerTodos).toHaveBeenCalledWith({
        estado: "ACTIVO",
      });
    });

    it("rechaza un estado desconocido", async () => {
      await expect(
        service.obtenerTodos({ estado: "PAUSADO" }),
      ).rejects.toMatchObject({
        status: 400,
        codigo: "ESTADO_INVALIDO",
      });
      expect(proyectoRepository.obtenerTodos).not.toHaveBeenCalled();
    });

    it("acepta y recorta un id de colectivo válido", async () => {
      const idColectivo = "c00000000000000000000001";

      await service.obtenerTodos({ idColectivo: ` ${idColectivo} ` });

      expect(proyectoRepository.obtenerTodos).toHaveBeenCalledWith({
        idColectivo,
      });
    });

    it("rechaza un id de colectivo inválido", async () => {
      await expect(
        service.obtenerTodos({ idColectivo: "no-es-un-id" }),
      ).rejects.toMatchObject({
        status: 400,
        codigo: "COLECTIVO_INVALIDO",
      });
      expect(proyectoRepository.obtenerTodos).not.toHaveBeenCalled();
    });

    it("resuelve los proyectos por habilidades de sus perfiles", async () => {
      perfilRepository.obtenerProyectosPorHabilidades.mockResolvedValue([
        "p-1",
      ]);

      await service.obtenerTodos({ habilidades: ["React", "SQL"] });

      expect(
        perfilRepository.obtenerProyectosPorHabilidades,
      ).toHaveBeenCalledWith(["React", "SQL"]);
      expect(proyectoRepository.obtenerTodos).toHaveBeenCalledWith({
        idsProyectos: ["p-1"],
      });
    });

    it("no consulta proyectos si ninguna habilidad tiene perfiles", async () => {
      perfilRepository.obtenerProyectosPorHabilidades.mockResolvedValue([]);

      const resultado = await service.obtenerTodos({
        habilidades: ["Habilidad inexistente"],
      });

      expect(resultado).toEqual([]);
      expect(proyectoRepository.obtenerTodos).not.toHaveBeenCalled();
    });
  });
});

describe("preferencia de anonimato de una postulación", () => {
  it("acepta la preferencia y la deja desactivada si se omite", () => {
    expect(crearPostulacionSchema.parse({})).toEqual({ esAnonima: false });
    expect(
      crearPostulacionSchema.parse({ esAnonima: true }),
    ).toEqual({ esAnonima: true });
    expect(
      crearPostulacionSchema.safeParse({ idColaborador: "c-1" }).success,
    ).toBe(false);
    expect(
      crearPostulacionSchema.safeParse({ esAnonima: "true" }).success,
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
