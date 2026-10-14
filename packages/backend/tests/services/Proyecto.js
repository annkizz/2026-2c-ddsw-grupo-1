import { jest } from "@jest/globals";
import { ProyectoService } from "../../services/ProyectoService.js";
import { Proyecto } from "../../domain/Proyecto.js";
import { Colectivo } from "../../domain/Colectivo.js";
import { BadRequestError, ConflictError, NotFoundError } from "../../errors/AppError.js";
import { idColaboradorSchema } from "../../controllers/ProyectoController.js";
import { ColaboracionModel } from "../../schemas/colaboracionSchema.js";

const proyectoActivo = (extra = {}) =>
  Object.assign(new Proyecto("Titulo", "Desc", [], "ACTIVO", new Date(), "p-1", null, "col-1"), extra);

const enUnaHora = () => new Date(Date.now() + 60 * 60 * 1000);
const haceUnaHora = () => new Date(Date.now() - 60 * 60 * 1000);

describe("ProyectoService", () => {
  let proyectoRepository;
  let colectivoRepository;
  let colaboradorService;
  let perfilRepository;
  let service;
  let colectivo;

  beforeEach(() => {
    colectivo = new Colectivo("Colectivo", "col-1", "Desc", undefined, "ONG");
    proyectoRepository = {
      save: jest.fn(async (proyecto) => proyecto),
      encontrarPorId: jest.fn(async () => null),
      obtenerTodasColaboraciones: jest.fn(async () => []),
      obtenerColaboracionesPorProyecto: jest.fn(async () => []),
      saveColaboracion: jest.fn(async (colaboracion) => colaboracion),
      obtenerVencidos: jest.fn(async () => []),
    };
    colectivoRepository = {
      encontrarPorId: jest.fn(async (id) => (id === "col-1" ? colectivo : null)),
      save: jest.fn(async (c) => c),
    };
    colaboradorService = { obtenerPorId: jest.fn(async () => null) };
    perfilRepository = { obtenerTodos: jest.fn(async () => []) };
    service = new ProyectoService(
      proyectoRepository,
      {},
      colaboradorService,
      colectivoRepository,
      perfilRepository,
    );
  });

  describe("crear", () => {
    it("crea un proyecto activo, sin perfiles, ligado a su colectivo", async () => {
      const creado = await service.crear({ idColectivo: "col-1", titulo: "T", descripcion: "D" });

      expect(creado.estado).toBe("ACTIVO");
      expect(creado.perfiles).toEqual([]);
      expect(creado.idColectivo).toBe("col-1");
      expect(proyectoRepository.save).toHaveBeenCalledTimes(1);
    });

    it("agrega el id del proyecto al colectivo y guarda el colectivo", async () => {
      const creado = await service.crear({ idColectivo: "col-1", titulo: "T", descripcion: "D" });

      expect(colectivo.proyectos).toContain(creado.idProyecto);
      expect(colectivoRepository.save).toHaveBeenCalledWith(colectivo);
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
  });

  describe("cerrarProyecto", () => {
    it("finaliza el proyecto y lo guarda", async () => {
      const proyecto = proyectoActivo();
      proyectoRepository.encontrarPorId.mockResolvedValue(proyecto);

      const cerrado = await service.cerrarProyecto("p-1");

      expect(cerrado.estado).toBe("FINALIZADO");
      expect(proyectoRepository.save).toHaveBeenCalledWith(proyecto);
    });

    it("falla si el proyecto no existe", async () => {
      await expect(service.cerrarProyecto("nope")).rejects.toThrow(NotFoundError);
    });
  });

  describe("programarCierre", () => {
    it("programa la fecha y guarda", async () => {
      const proyecto = proyectoActivo();
      proyectoRepository.encontrarPorId.mockResolvedValue(proyecto);
      const fecha = enUnaHora();

      const resultado = await service.programarCierre("p-1", fecha);

      expect(resultado.fechaLimiteCierre).toEqual(fecha);
      expect(proyectoRepository.save).toHaveBeenCalledTimes(1);
    });

    it("no permite programar el cierre de un proyecto finalizado", async () => {
      proyectoRepository.encontrarPorId.mockResolvedValue(proyectoActivo({ estado: "FINALIZADO" }));
      await expect(service.programarCierre("p-1", enUnaHora())).rejects.toThrow(ConflictError);
    });
  });

  describe("cerrarProyectosVencidos", () => {
    it("cierra los vencidos y reporta los que fallaron", async () => {
      const bueno = proyectoActivo({ idProyecto: "ok" });
      const malo = proyectoActivo({ idProyecto: "falla" });
      proyectoRepository.obtenerVencidos.mockResolvedValue([bueno, malo]);
      proyectoRepository.save.mockImplementation(async (p) => {
        if (p.idProyecto === "falla") throw new Error("se cayo la base");
        return p;
      });

      const resultado = await service.cerrarProyectosVencidos();

      expect(resultado.cerrados).toEqual(["ok"]);
      expect(resultado.fallidos).toEqual([{ idProyecto: "falla", error: "se cayo la base" }]);
    });
  });

  describe("crearColaboracion (anotarse a un proyecto)", () => {
    const colaboradora = { idColaborador: "c-1", habilidades: ["Testing E2E con Cypress"] };
    const perfilTester = {
      habilidadesRequeridas: ["testing e2e con cypress"],
      habilidadesOpcionales: [],
    };

    beforeEach(() => {
      colaboradorService.obtenerPorId.mockResolvedValue(colaboradora);
      perfilRepository.obtenerTodos.mockResolvedValue([perfilTester]);
    });

    it("anota a la colaboradora cuando encaja con algun perfil", async () => {
      const proyecto = proyectoActivo();
      await service.crearColaboracion(proyecto, "c-1");

      expect(proyectoRepository.saveColaboracion).toHaveBeenCalledTimes(1);
      const guardada = proyectoRepository.saveColaboracion.mock.calls[0][0];
      expect(guardada.proyecto).toBe(proyecto);
      expect(guardada.colaborador).toBe(colaboradora);
      expect(guardada.esAnonima).toBe(false);
    });

    it("registra la preferencia de contribución anónima", async () => {
      await service.crearColaboracion(proyectoActivo(), "c-1", true);

      const guardada = proyectoRepository.saveColaboracion.mock.calls[0][0];
      expect(guardada.esAnonima).toBe(true);
    });

    it("publica la contribución sin identidad cuando es anónima", async () => {
      const fecha = new Date();
      proyectoRepository.encontrarPorId.mockResolvedValue(proyectoActivo());
      proyectoRepository.obtenerColaboracionesPorProyecto.mockResolvedValue([
        {
          colaborador: {
            idColaborador: "c-1",
            nombre: "Nombre privado",
            apellido: "Apellido privado",
          },
          fecha,
          esAnonima: true,
        },
        {
          colaborador: {
            idColaborador: "c-2",
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
        fecha,
        esAnonima: true,
      });
      expect(contribuciones[1]).toEqual({
        idProyecto: "p-1",
        fecha,
        esAnonima: false,
        colaborador: {
          idColaborador: "c-2",
          nombreFantasia: "Colaboradora visible",
          usuarioGitHub: "visible-dev",
          nombre: undefined,
          apellido: undefined,
        },
      });
    });

    it("rechaza anotarse a un proyecto finalizado", async () => {
      const proyecto = proyectoActivo({ estado: "FINALIZADO" });
      await expect(service.crearColaboracion(proyecto, "c-1")).rejects.toMatchObject({
        codigo: "PROYECTO_FINALIZADO",
      });
      expect(proyectoRepository.saveColaboracion).not.toHaveBeenCalled();
    });

    it("falla si la colaboradora no existe", async () => {
      colaboradorService.obtenerPorId.mockResolvedValue(null);
      await expect(service.crearColaboracion(proyectoActivo(), "x")).rejects.toThrow(NotFoundError);
    });

    it("rechaza anotarla dos veces en el mismo proyecto", async () => {
      proyectoRepository.obtenerTodasColaboraciones.mockResolvedValue([
        { proyecto: { idProyecto: "p-1" }, colaborador: { idColaborador: "c-1" } },
      ]);
      await expect(service.crearColaboracion(proyectoActivo(), "c-1")).rejects.toMatchObject({
        codigo: "COLABORACION_YA_EXISTENTE",
      });
    });

    it("detecta el duplicado aunque haya otras colaboraciones antes en el proyecto", async () => {
      proyectoRepository.obtenerTodasColaboraciones.mockResolvedValue([
        { proyecto: { idProyecto: "p-1" }, colaborador: { idColaborador: "otra" } },
        { proyecto: { idProyecto: "p-1" }, colaborador: { idColaborador: "c-1" } },
      ]);
      await expect(service.crearColaboracion(proyectoActivo(), "c-1")).rejects.toThrow(ConflictError);
    });

    it("rechaza si no tiene ninguna habilidad requerida de ningun perfil", async () => {
      colaboradorService.obtenerPorId.mockResolvedValue({ idColaborador: "c-1", habilidades: ["Jest"] });
      await expect(service.crearColaboracion(proyectoActivo(), "c-1")).rejects.toMatchObject({
        codigo: "HABILIDADES_INSUFICIENTES",
      });
      expect(proyectoRepository.saveColaboracion).not.toHaveBeenCalled();
    });

    it("rechaza si el proyecto no tiene perfiles", async () => {
      perfilRepository.obtenerTodos.mockResolvedValue([]);
      await expect(service.crearColaboracion(proyectoActivo(), "c-1")).rejects.toThrow(BadRequestError);
    });
  });
});

describe("preferencia de anonimato de una colaboración", () => {
  it("acepta la preferencia y la deja desactivada si se omite", () => {
    expect(idColaboradorSchema.parse({ idColaborador: "c-1" })).toEqual({
      idColaborador: "c-1",
      esAnonima: false,
    });
    expect(
      idColaboradorSchema.parse({ idColaborador: "c-1", esAnonima: true }),
    ).toEqual({ idColaborador: "c-1", esAnonima: true });
    expect(
      idColaboradorSchema.safeParse({ idColaborador: "c-1", esAnonima: "true" })
        .success,
    ).toBe(false);
  });

  it("usa false por defecto en Mongo y permite guardar true", () => {
    const fecha = new Date();
    const normal = new ColaboracionModel({
      idProyecto: "p-1",
      idColaborador: "c-1",
      fecha,
    });
    const anonima = new ColaboracionModel({
      idProyecto: "p-1",
      idColaborador: "c-2",
      fecha,
      esAnonima: true,
    });

    expect(normal.esAnonima).toBe(false);
    expect(anonima.esAnonima).toBe(true);
  });
});
