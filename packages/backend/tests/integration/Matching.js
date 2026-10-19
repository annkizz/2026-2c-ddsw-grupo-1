import mongoose from "mongoose";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import { MatchingService } from "../../services/MatchingService.js";
import { ColaboradorRepository } from "../../repositories/ColaboradorRepository.js";
import { ProyectoRepository } from "../../repositories/ProyectoRepository.js";
import { PerfilRepository } from "../../repositories/PerfilRepository.js";
import { ColaboracionRepository } from "../../repositories/ColaboracionRepository.js";
import { ProyectoModel } from "../../schemas/proyectoSchema.js";
import { ColaboradorModel } from "../../schemas/colaboradorSchema.js";
import { PerfilModel } from "../../schemas/perfilSchema.js";
import { ColaboracionModel } from "../../schemas/colaboracionSchema.js";
import {
  conectarALaBaseDePrueba,
  desconectarDeLaBaseDePrueba,
  limpiarLaBase,
} from "./utils/baseDeDatosDePrueba.js";
import { sembrarDatosIniciales } from "./utils/sembrarDatosIniciales.js";

// prueba de integracion matchingservice
// antes de cada test se levanta una base fresca, se carga la seed de ejemplo y el test opera sobre esos datos.
// usa service y repo real, no mockea

// Ids fijos de la seed, ObjectId reales (24 hex). Ver seeds/datosIniciales.js.
const PROYECTO_TURNOS = "a00000000000000000000001"; // Tester + Analista, sin colaboraciones
const PROYECTO_MAPA = "a00000000000000000000002"; // Frontend; Nico ya colabora (anónimo)
const PROYECTO_INVENTARIO = "a00000000000000000000003"; // FINALIZADO
const PROYECTO_LABORATORIO = "a00000000000000000000004"; // Tester de carga (habilidad exclusiva)

const PERFIL_TESTER = "000000000000000000000001";
const PERFIL_ANALISTA = "000000000000000000000002";
const PERFIL_FRONTEND = "000000000000000000000003";
const PERFIL_BACKEND = "000000000000000000000004";
const PERFIL_LOAD = "000000000000000000000005";

const LUNA = "b00000000000000000000001"; // Cypress + Soap UI + Jest
const SOFIA = "b00000000000000000000002"; // React + UX/UI + Accesibilidad
const MARTIN = "b00000000000000000000003"; // Pandas + SQL + Python
const KODAMA = "b00000000000000000000004"; // sólo una opcional del Tester
const NICO = "b00000000000000000000005"; // ya colabora en el mapa y el inventario
const TOMAS = "b00000000000000000000006"; // ninguna habilidad requerida
const PROBADORA = "b00000000000000000000007"; // sólo sirve para el laboratorio

const crearServicio = () =>
  new MatchingService(
    new ColaboradorRepository(),
    new ProyectoRepository(),
    new PerfilRepository(),
    new ColaboracionRepository(),
  );

beforeAll(async () => {
  await conectarALaBaseDePrueba();

  await Promise.all([
    ProyectoModel.init(),
    ColaboradorModel.init(),
    PerfilModel.init(),
    ColaboracionModel.init(),
  ]);
});

afterAll(async () => {
  await desconectarDeLaBaseDePrueba();
});

// Reset antes de cada test: base limpia + seed recién cargada.
beforeEach(async () => {
  await limpiarLaBase();
  await sembrarDatosIniciales();
});

describe("MatchingService.buscarColaboradorasParaPerfil (integración sobre la seed)", () => {
  it("encuentra a la única candidata del perfil Tester (Luna)", async () => {
    const resultado = await crearServicio().buscarColaboradorasParaPerfil(
      PROYECTO_TURNOS,
      PERFIL_TESTER,
    );

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      id: LUNA,
      nombreFantasia: "Luna Código",
      pronombres: ["ella"],
    });
    expect(resultado[0].requeridasCoincidentes).toEqual([
      "Testing E2E con Cypress",
    ]);
    expect(resultado[0].opcionalesCoincidentes).toEqual(["Uso de Soap UI"]);
  });

  it("no expone datos privados en el DTO público", async () => {
    const [candidata] = await crearServicio().buscarColaboradorasParaPerfil(
      PROYECTO_TURNOS,
      PERFIL_TESTER,
    );

    expect(candidata).not.toHaveProperty("nombre");
    expect(candidata).not.toHaveProperty("apellido");
    expect(candidata).not.toHaveProperty("mediosDeContacto");
    expect(candidata).not.toHaveProperty("colaboraciones");
    expect(candidata).not.toHaveProperty("aceptaMensajeria");
  });

  it("no considera candidata a quien sólo tiene habilidades opcionales (Kodama) ni a quien no comparte ninguna requerida (Tomás)", async () => {
    const ids = (
      await crearServicio().buscarColaboradorasParaPerfil(
        PROYECTO_TURNOS,
        PERFIL_TESTER,
      )
    ).map((c) => c.id);

    expect(ids).not.toContain(KODAMA);
    expect(ids).not.toContain(TOMAS);
  });

  it("resuelve el perfil Analista de Datos con otra candidata (Martín)", async () => {
    const resultado = await crearServicio().buscarColaboradorasParaPerfil(
      PROYECTO_TURNOS,
      PERFIL_ANALISTA,
    );

    expect(resultado.map((c) => c.id)).toEqual([MARTIN]);
    expect(resultado[0].requeridasCoincidentes).toEqual([
      "Conocimientos de Pandas",
    ]);
    expect(resultado[0].opcionalesCoincidentes).toEqual(["SQL"]);
    // Martín no cargó pronombres: la clave no debe aparecer en el DTO.
    expect(resultado[0]).not.toHaveProperty("pronombres");
  });

  it("excluye a quien ya está anotada en el proyecto (Nico en el mapa)", async () => {
    const resultado = await crearServicio().buscarColaboradorasParaPerfil(
      PROYECTO_MAPA,
      PERFIL_FRONTEND,
    );

    expect(resultado.map((c) => c.id)).toEqual([SOFIA]);
    expect(resultado[0].requeridasCoincidentes).toEqual(["React"]);
    expect(resultado[0].opcionalesCoincidentes).toEqual([
      "Accesibilidad web",
      "Diseño UX/UI",
    ]);
  });

  it("resuelve el perfil exclusivo del laboratorio (Tester de carga)", async () => {
    const resultado = await crearServicio().buscarColaboradorasParaPerfil(
      PROYECTO_LABORATORIO,
      PERFIL_LOAD,
    );

    expect(resultado.map((c) => c.id)).toEqual([PROBADORA]);
  });

  it("rechaza proyectos inexistentes o finalizados y perfiles que no son del proyecto", async () => {
    const servicio = crearServicio();

    await expect(
      servicio.buscarColaboradorasParaPerfil("no-existe", PERFIL_TESTER),
    ).rejects.toMatchObject({ codigo: "PROYECTO_NO_ENCONTRADO", status: 404 });

    await expect(
      servicio.buscarColaboradorasParaPerfil(
        PROYECTO_INVENTARIO,
        PERFIL_BACKEND,
      ),
    ).rejects.toMatchObject({ codigo: "PROYECTO_FINALIZADO", status: 409 });

    // El perfil existe, pero pertenece a otro proyecto.
    await expect(
      servicio.buscarColaboradorasParaPerfil(PROYECTO_TURNOS, PERFIL_FRONTEND),
    ).rejects.toMatchObject({ codigo: "PERFIL_NO_ENCONTRADO", status: 404 });

    // El perfil no existe.
    await expect(
      servicio.buscarColaboradorasParaPerfil(
        PROYECTO_TURNOS,
        "000000000000000000000099",
      ),
    ).rejects.toMatchObject({ codigo: "PERFIL_NO_ENCONTRADO", status: 404 });
  });
});

describe("MatchingService.buscarProyectosParaColaboradora (integración sobre la seed)", () => {
  it("encuentra el proyecto donde Luna encaja en el perfil Tester", async () => {
    const resultado =
      await crearServicio().buscarProyectosParaColaboradora(LUNA);

    expect(resultado.map((p) => p.id)).toEqual([PROYECTO_TURNOS]);
    expect(resultado[0].perfilesCompatibles).toEqual([
      expect.objectContaining({
        id: PERFIL_TESTER,
        requeridasCoincidentes: ["Testing E2E con Cypress"],
      }),
    ]);
  });

  it("encuentra el mismo proyecto para Martín, pero en el perfil Analista", async () => {
    const resultado =
      await crearServicio().buscarProyectosParaColaboradora(MARTIN);

    expect(resultado.map((p) => p.id)).toEqual([PROYECTO_TURNOS]);
    expect(resultado[0].perfilesCompatibles).toEqual([
      expect.objectContaining({
        id: PERFIL_ANALISTA,
        requeridasCoincidentes: ["Conocimientos de Pandas"],
      }),
    ]);
  });

  it("propone el mapa a Sofía", async () => {
    const resultado =
      await crearServicio().buscarProyectosParaColaboradora(SOFIA);

    expect(resultado.map((p) => p.id)).toEqual([PROYECTO_MAPA]);
    expect(resultado[0].perfilesCompatibles).toEqual([
      expect.objectContaining({
        id: PERFIL_FRONTEND,
        requeridasCoincidentes: ["React"],
      }),
    ]);
  });

  it("no propone nada a Nico: ya colabora donde encajaría", async () => {
    const resultado =
      await crearServicio().buscarProyectosParaColaboradora(NICO);

    expect(resultado).toEqual([]);
  });

  it("ofrece el laboratorio sólo a la especialista en k6 (Probadora)", async () => {
    const resultado =
      await crearServicio().buscarProyectosParaColaboradora(PROBADORA);

    expect(resultado.map((p) => p.id)).toEqual([PROYECTO_LABORATORIO]);
    expect(resultado[0].perfilesCompatibles).toEqual([
      expect.objectContaining({ id: PERFIL_LOAD }),
    ]);
  });

  it("devuelve error cuando la colaboradora no existe", async () => {
    await expect(
      crearServicio().buscarProyectosParaColaboradora("no-existe"),
    ).rejects.toMatchObject({
      codigo: "COLABORADORA_NO_ENCONTRADA",
      status: 404,
    });
  });
});

describe("MatchingService sin N+1 (integración)", () => {
  // Con ObjectId los ids de estos datos de volumen los genera Mongo.
  const crearProyecto = (idProyecto) =>
    ProyectoModel.create({
      _id: idProyecto,
      idColectivo: new mongoose.Types.ObjectId(),
      titulo: String(idProyecto),
      descripcion: "proyecto de volumen",
      estado: "ACTIVO",
      fechaInicio: new Date(),
    });
  const crearColaboradora = (idColaborador) =>
    ColaboradorModel.create({
      _id: idColaborador,
      nombreFantasia: String(idColaborador),
      habilidades: ["React"],
    });
  const crearColaboracion = (idProyecto, idColaborador) =>
    ColaboracionModel.create({
      idProyecto,
      idColaborador,
      fecha: new Date(),
    });

  it("resuelve cada búsqueda con un número fijo de consultas", async () => {
    for (let i = 0; i < 15; i++) {
      const idProyecto = new mongoose.Types.ObjectId();
      const idColaborador = new mongoose.Types.ObjectId();
      await crearProyecto(idProyecto);
      await crearColaboradora(idColaborador);
      await crearColaboracion(idProyecto, idColaborador);
    }

    const servicio = crearServicio();
    const consultas = [];
    mongoose.set("debug", (...argumentos) => consultas.push(argumentos));
    const contarConsultas = async (ejecutar) => {
      consultas.length = 0;
      await ejecutar();
      return consultas.length;
    };

    try {
      const paraPerfil = await contarConsultas(() =>
        servicio.buscarColaboradorasParaPerfil(PROYECTO_TURNOS, PERFIL_TESTER),
      );
      const paraColaboradora = await contarConsultas(() =>
        servicio.buscarProyectosParaColaboradora(LUNA),
      );

      // Cada búsqueda usa una cantidad fija de consultas: el proyecto con su
      // perfil (o la colaboradora), los ids de las colaboraciones y los
      // proyectos abiertos con sus perfiles (populate). No crece con el volumen.
      expect(paraPerfil).toBeLessThanOrEqual(4);
      expect(paraColaboradora).toBeLessThanOrEqual(4);
    } finally {
      mongoose.set("debug", false);
    }
  });
});
