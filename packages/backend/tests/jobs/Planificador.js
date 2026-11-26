import { describe, expect, it, jest } from "@jest/globals";
import cron from "node-cron";
import { Planificador } from "../../jobs/Planificador.js";
import {
  crearTareasProgramadas,
  HORARIOS_POR_DEFECTO,
} from "../../jobs/tareasProgramadas.js";

const programadorFalso = () => ({
  validate: cron.validate,
  schedule: jest.fn(() => ({ stop: jest.fn() })),
});
const loggerFalso = () => ({ log: jest.fn(), error: jest.fn() });

describe("Planificador", () => {
  it("no deja que una tarea se superponga consigo misma", async () => {
    let terminar;
    const tarea = jest.fn(
      () =>
        new Promise((resolver) => {
          terminar = resolver;
        }),
    );
    const logger = loggerFalso();
    const planificador = new Planificador({
      programador: programadorFalso(),
      logger,
    }).agregar("lenta", "* * * * *", tarea);

    const primera = planificador.ejecutar("lenta");
    await planificador.ejecutar("lenta"); // llega mientras la primera sigue corriendo
    terminar("listo");
    await primera;

    expect(tarea).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining("se omite esta"),
    );
  });

  it("si una tarea falla lo registra y la próxima corrida funciona", async () => {
    const tarea = jest
      .fn()
      .mockRejectedValueOnce(new Error("Mongo caído"))
      .mockResolvedValueOnce("ok");
    const logger = loggerFalso();
    const planificador = new Planificador({
      programador: programadorFalso(),
      logger,
    }).agregar("x", "* * * * *", tarea);

    await expect(planificador.ejecutar("x")).resolves.toBeNull();
    await expect(planificador.ejecutar("x")).resolves.toBe("ok");
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Mongo caído"),
    );
  });

  it("solo escribe en el log cuando la tarea hizo algo", async () => {
    const logger = loggerFalso();
    const planificador = new Planificador({
      programador: programadorFalso(),
      logger,
    }).agregar("nada", "* * * * *", async () => null);
    await planificador.ejecutar("nada");
    expect(logger.log).not.toHaveBeenCalled();
  });

  it("rechaza expresiones cron inválidas y nombres repetidos", () => {
    const planificador = new Planificador({
      programador: programadorFalso(),
      logger: loggerFalso(),
    });
    expect(() => planificador.agregar("a", "cada rato", jest.fn())).toThrow(
      "inválida",
    );
    planificador.agregar("a", "* * * * *", jest.fn());
    expect(() => planificador.agregar("a", "* * * * *", jest.fn())).toThrow(
      "ya existe",
    );
  });
});

describe("tareas programadas del backend", () => {
  it("programa las tres tareas con sus horarios (y se pueden cambiar por variable de entorno)", () => {
    const programador = programadorFalso();
    crearTareasProgramadas(
      { proyectoService: {}, matchingService: {} },
      {
        config: { CRON_MATCHING: "*/10 * * * *" },
        programador,
        logger: loggerFalso(),
      },
    ).iniciar();

    const horarios = programador.schedule.mock.calls.map(
      ([expresion]) => expresion,
    );
    expect(horarios).toEqual([
      HORARIOS_POR_DEFECTO.CRON_CIERRE_AUTOMATICO,
      "*/10 * * * *",
      HORARIOS_POR_DEFECTO.CRON_MATCHING_COMPLETO,
    ]);
    // El cierre automático ya no corre cada minuto.
    expect(HORARIOS_POR_DEFECTO.CRON_CIERRE_AUTOMATICO).not.toBe("* * * * *");
  });

  it("la tarea de matching delega en el servicio y no escribe nada si no había cambios", async () => {
    const matchingService = {
      procesarCambiosPendientes: jest.fn(async () => ({
        procesado: false,
        pendientes: 0,
      })),
    };
    const logger = loggerFalso();
    const tareas = crearTareasProgramadas(
      { proyectoService: {}, matchingService },
      { config: {}, programador: programadorFalso(), logger },
    );
    await tareas.ejecutar("matching: procesar cambios");
    expect(matchingService.procesarCambiosPendientes).toHaveBeenCalledTimes(1);
    expect(logger.log).not.toHaveBeenCalled();
  });
});
