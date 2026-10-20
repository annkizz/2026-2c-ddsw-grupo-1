import { jest } from "@jest/globals";
import { LogroService } from "../../services/LogroService.js";
import { NotFoundError } from "../../errors/AppError.js";

const ID_PROYECTO = "proyecto-1";
const FECHA = new Date("2026-09-15");

const datosLogro = () => ({
  titulo: "Primer prototipo",
  descripcion: "Se publicó una versión navegable del sistema",
  fecha: FECHA,
});

// simula un documento tal como lo devuelve el repositorio
const logroGuardado = (extra = {}) => ({
  id: "logro-1",
  proyecto: ID_PROYECTO,
  ...datosLogro(),
  ...extra,
});

describe("LogroService", () => {
  let logroRepository;
  let proyectoRepository;
  let service;

  beforeEach(() => {
    logroRepository = {
      save: jest.fn(async (logro) => ({ id: "logro-1", ...logro })),
      obtenerPorProyecto: jest.fn(async () => []),
      buscarPorId: jest.fn(async () => null),
      actualizar: jest.fn(async () => null),
      eliminar: jest.fn(async () => null),
    };
    proyectoRepository = {
      encontrarPorId: jest.fn((id) =>
        id === ID_PROYECTO ? { idProyecto: id } : undefined,
      ),
    };
    service = new LogroService(logroRepository, proyectoRepository);
  });

  describe("crear", () => {
    it("guarda el logro asociado al proyecto y devuelve el DTO", async () => {
      const resultado = await service.crear(ID_PROYECTO, datosLogro());

      expect(logroRepository.save).toHaveBeenCalledTimes(1);
      expect(logroRepository.save).toHaveBeenCalledWith({
        ...datosLogro(),
        proyecto: ID_PROYECTO,
      });
      expect(resultado).toEqual({
        idLogro: "logro-1",
        idProyecto: ID_PROYECTO,
        ...datosLogro(),
      });
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe y no guarda nada", async () => {
      const promesa = service.crear("inexistente", datosLogro());

      await expect(promesa).rejects.toBeInstanceOf(NotFoundError);
      await expect(promesa).rejects.toMatchObject({
        status: 404,
        codigo: "PROYECTO_NO_ENCONTRADO",
      });
      expect(logroRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("obtenerPorProyecto", () => {
    it("devuelve los logros del proyecto como DTOs", async () => {
      logroRepository.obtenerPorProyecto.mockResolvedValue([
        logroGuardado(),
        logroGuardado({ id: "logro-2", titulo: "Repositorio público" }),
      ]);

      const resultado = await service.obtenerPorProyecto(ID_PROYECTO);

      expect(logroRepository.obtenerPorProyecto).toHaveBeenCalledWith(
        ID_PROYECTO,
      );
      expect(resultado).toHaveLength(2);
      expect(resultado.map((l) => l.idLogro)).toEqual(["logro-1", "logro-2"]);
      expect(resultado[1].titulo).toBe("Repositorio público");
    });

    it("devuelve una lista vacía si el proyecto no tiene logros", async () => {
      await expect(service.obtenerPorProyecto(ID_PROYECTO)).resolves.toEqual(
        [],
      );
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe", async () => {
      await expect(
        service.obtenerPorProyecto("inexistente"),
      ).rejects.toMatchObject({
        status: 404,
        codigo: "PROYECTO_NO_ENCONTRADO",
      });
      expect(logroRepository.obtenerPorProyecto).not.toHaveBeenCalled();
    });
  });

  describe("obtenerPorId", () => {
    it("devuelve el logro como DTO, buscándolo dentro del proyecto indicado", async () => {
      logroRepository.buscarPorId.mockResolvedValue(logroGuardado());

      const resultado = await service.obtenerPorId(ID_PROYECTO, "logro-1");

      expect(logroRepository.buscarPorId).toHaveBeenCalledWith(
        ID_PROYECTO,
        "logro-1",
      );
      expect(resultado).toEqual({
        idLogro: "logro-1",
        idProyecto: ID_PROYECTO,
        ...datosLogro(),
      });
    });

    it("falla con LOGRO_NO_ENCONTRADO si el logro no existe", async () => {
      await expect(
        service.obtenerPorId(ID_PROYECTO, "logro-x"),
      ).rejects.toMatchObject({
        status: 404,
        codigo: "LOGRO_NO_ENCONTRADO",
      });
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe", async () => {
      await expect(
        service.obtenerPorId("inexistente", "logro-1"),
      ).rejects.toMatchObject({
        codigo: "PROYECTO_NO_ENCONTRADO",
      });
      expect(logroRepository.buscarPorId).not.toHaveBeenCalled();
    });
  });

  describe("actualizar", () => {
    it("actualiza el logro y devuelve el DTO con los datos nuevos", async () => {
      const datosNuevos = { ...datosLogro(), titulo: "Versión 2" };
      logroRepository.actualizar.mockResolvedValue(
        logroGuardado({ titulo: "Versión 2" }),
      );

      const resultado = await service.actualizar(
        ID_PROYECTO,
        "logro-1",
        datosNuevos,
      );

      expect(logroRepository.actualizar).toHaveBeenCalledWith(
        ID_PROYECTO,
        "logro-1",
        datosNuevos,
      );
      expect(resultado.idLogro).toBe("logro-1");
      expect(resultado.titulo).toBe("Versión 2");
    });

    it("falla con LOGRO_NO_ENCONTRADO si el logro no existe", async () => {
      await expect(
        service.actualizar(ID_PROYECTO, "logro-x", datosLogro()),
      ).rejects.toMatchObject({
        status: 404,
        codigo: "LOGRO_NO_ENCONTRADO",
      });
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe y no actualiza nada", async () => {
      await expect(
        service.actualizar("inexistente", "logro-1", datosLogro()),
      ).rejects.toMatchObject({
        codigo: "PROYECTO_NO_ENCONTRADO",
      });
      expect(logroRepository.actualizar).not.toHaveBeenCalled();
    });
  });

  describe("eliminar", () => {
    it("elimina el logro si pertenece al proyecto", async () => {
      logroRepository.eliminar.mockResolvedValue(logroGuardado());

      await expect(
        service.eliminar(ID_PROYECTO, "logro-1"),
      ).resolves.toBeUndefined();

      expect(logroRepository.eliminar).toHaveBeenCalledWith(
        ID_PROYECTO,
        "logro-1",
      );
    });

    it("falla con LOGRO_NO_ENCONTRADO si el logro no existe o es de otro proyecto", async () => {
      await expect(
        service.eliminar(ID_PROYECTO, "logro-x"),
      ).rejects.toMatchObject({
        status: 404,
        codigo: "LOGRO_NO_ENCONTRADO",
      });
    });

    it("falla con PROYECTO_NO_ENCONTRADO si el proyecto no existe y no elimina nada", async () => {
      await expect(
        service.eliminar("inexistente", "logro-1"),
      ).rejects.toMatchObject({
        codigo: "PROYECTO_NO_ENCONTRADO",
      });
      expect(logroRepository.eliminar).not.toHaveBeenCalled();
    });
  });
});
