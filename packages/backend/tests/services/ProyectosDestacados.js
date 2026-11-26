import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Proyecto } from "../../domain/Proyecto.js";
import { ProyectoService } from "../../services/ProyectoService.js";

const enUnaHora = () => new Date(Date.now() + 60 * 60 * 1000);
const haceUnaHora = () => new Date(Date.now() - 60 * 60 * 1000);

const crearProyecto = (extra = {}) =>
  Object.assign(
    new Proyecto(
      "Proyecto",
      "Descripción",
      [],
      "ACTIVO",
      new Date(),
      null,
      "colectivo-1",
    ),
    { _id: "proyecto-1" },
    extra,
  );

describe("Proyectos destacados", () => {
  let proyecto;
  let proyectoRepository;
  let service;

  beforeEach(() => {
    proyecto = crearProyecto();
    proyectoRepository = {
      buscarPorId: jest.fn(async () => proyecto),
      obtenerDestacados: jest.fn(async () => [proyecto]),
      save: jest.fn(async (unProyecto) => unProyecto),
    };
    service = new ProyectoService(proyectoRepository, {}, {}, {}, {}, {});
  });

  it("activa un destacado con vencimiento futuro y lo incluye en el DTO", async () => {
    const hasta = enUnaHora();

    const resultado = await service.configurarDestacado("proyecto-1", {
      destacado: true,
      destacadoHasta: hasta,
    });

    expect(proyectoRepository.save).toHaveBeenCalledWith(proyecto);
    expect(resultado).toMatchObject({
      destacado: true,
      destacadoHasta: hasta,
    });
  });

  it("rechaza un vencimiento pasado sin guardar cambios", async () => {
    await expect(
      service.configurarDestacado("proyecto-1", {
        destacado: true,
        destacadoHasta: haceUnaHora(),
      }),
    ).rejects.toMatchObject({
      status: 400,
      codigo: "FECHA_DESTACADO_INVALIDA",
    });
    expect(proyectoRepository.save).not.toHaveBeenCalled();
  });

  it("no permite destacar proyectos finalizados", async () => {
    proyecto = crearProyecto({ estado: "FINALIZADO" });

    await expect(
      service.configurarDestacado("proyecto-1", {
        destacado: true,
        destacadoHasta: enUnaHora(),
      }),
    ).rejects.toMatchObject({
      status: 409,
      codigo: "PROYECTO_FINALIZADO",
    });
    expect(proyectoRepository.save).not.toHaveBeenCalled();
  });

  it("al quitar un destacado también borra su vencimiento", async () => {
    proyecto.configurarDestacado(true, enUnaHora());

    const resultado = await service.configurarDestacado("proyecto-1", {
      destacado: false,
    });

    expect(resultado.destacado).toBe(false);
    expect(resultado.destacadoHasta).toBeNull();
  });

  it("obtiene los proyectos destacados vigentes desde el repositorio", async () => {
    const resultado = await service.obtenerDestacados();

    expect(proyectoRepository.obtenerDestacados).toHaveBeenCalledTimes(1);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe("proyecto-1");
  });
});
