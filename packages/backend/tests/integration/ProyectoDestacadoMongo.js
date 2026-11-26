import mongoose from "mongoose";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { Proyecto } from "../../domain/Proyecto.js";
import { Estado } from "../../domain/Estado.js";
import { ProyectoModel } from "../../schemas/proyectoSchema.js";
import { ProyectoRepository } from "../../repositories/ProyectoRepository.js";
import {
  conectarALaBaseDePrueba,
  desconectarDeLaBaseDePrueba,
  limpiarLaBase,
} from "./utils/baseDeDatosDePrueba.js";

jest.setTimeout(60000);

const crearProyecto = (extra = {}) =>
  new Proyecto(
    "Proyecto destacado",
    "Descripción",
    [],
    Estado.ACTIVO,
    new Date(),
    null,
    new mongoose.Types.ObjectId(),
    0,
    null,
    null,
    false,
    null,
    [],
    null,
    extra.destacado ?? false,
    extra.destacadoHasta ?? null,
  );

describe("Proyectos destacados con MongoDB", () => {
  let repository;

  beforeAll(async () => {
    await conectarALaBaseDePrueba();
    await ProyectoModel.init();
    repository = new ProyectoRepository();
  });

  beforeEach(async () => {
    await limpiarLaBase();
  });

  afterAll(async () => {
    await desconectarDeLaBaseDePrueba();
  });

  it("persiste la selección y la fecha de vencimiento", async () => {
    const hasta = new Date(Date.now() + 60 * 60 * 1000);
    const proyecto = await repository.save(crearProyecto());
    proyecto.configurarDestacado(true, hasta);
    await repository.save(proyecto);

    const encontrados = await repository.obtenerDestacados();

    expect(encontrados).toHaveLength(1);
    expect(encontrados[0].destacado).toBe(true);
    expect(encontrados[0].destacadoHasta.getTime()).toBe(hasta.getTime());
  });

  it("excluye proyectos vencidos o finalizados del listado público", async () => {
    const futuro = new Date(Date.now() + 60 * 60 * 1000);
    const pasado = new Date(Date.now() - 60 * 60 * 1000);
    const vigente = crearProyecto({ destacado: true, destacadoHasta: futuro });
    const vencido = crearProyecto({ destacado: true, destacadoHasta: pasado });
    const finalizado = crearProyecto({
      destacado: true,
      destacadoHasta: futuro,
    });
    finalizado.cerrar();

    await Promise.all([
      repository.save(vigente),
      repository.save(vencido),
      repository.save(finalizado),
    ]);

    const encontrados = await repository.obtenerDestacados();

    expect(encontrados).toHaveLength(1);
    expect(encontrados[0].destacadoHasta.getTime()).toBe(futuro.getTime());
  });
});
