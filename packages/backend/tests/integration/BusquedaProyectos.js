import request from "supertest";
import express from "express";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { ProyectoRepository } from "../../repositories/ProyectoRepository.js";
import { ColectivoRepository } from "../../repositories/ColectivoRepository.js";
import { ColaboracionRepository } from "../../repositories/ColaboracionRepository.js";
import { PerfilRepository } from "../../repositories/PerfilRepository.js";
import { HabilidadRepository } from "../../repositories/HabilidadRepository.js";
import { ColaboradorRepository } from "../../repositories/ColaboradorRepository.js";
import { ColaboradorService } from "../../services/ColaboradorService.js";
import { ProyectoService } from "../../services/ProyectoService.js";
import { ProyectoController } from "../../controllers/ProyectoController.js";
import { PerfilService } from "../../services/PerfilService.js";
import { PerfilController } from "../../controllers/PerfilController.js";
import { crearProyectoRouter } from "../../routes/proyectoRouter.js";
import { notFoundHandler } from "../../middlewares/notFoundHandler.js";
import { errorHandler } from "../../middlewares/errorHandler.js";
import { ProyectoModel } from "../../schemas/proyectoSchema.js";
import { ColectivoModel } from "../../schemas/colectivoSchema.js";
import {
  conectarALaBaseDePrueba,
  desconectarDeLaBaseDePrueba,
  limpiarLaBase,
} from "./utils/baseDeDatosDePrueba.js";
import { sembrarDatosIniciales } from "./utils/sembrarDatosIniciales.js";

// La suite comparte Mongo embebido con las otras suites de integracion; el
// arranque puede necesitar mas que el timeout default de Jest.
jest.setTimeout(60000);

// Ids fijos de la seed (ver seeds/datosIniciales.js).
const PROYECTO_PORTAL = "a00000000000000000000001";
const PROYECTO_MAPA = "a00000000000000000000002";
const PROYECTO_INVENTARIO = "a00000000000000000000003";
const PROYECTO_LABORATORIO = "a00000000000000000000004";

const COLECTIVO_MANOS = "c00000000000000000000001";
const COLECTIVO_BARRIO = "c00000000000000000000002";

const PERFIL_TESTER = "000000000000000000000001";
const PERFIL_ANALISTA = "000000000000000000000002";

const construirApp = () => {
  const habilidadRepository = new HabilidadRepository();
  const proyectoRepository = new ProyectoRepository();
  const colectivoRepository = new ColectivoRepository();
  const colaboracionRepository = new ColaboracionRepository();
  const perfilRepository = new PerfilRepository();
  const colaboradorService = new ColaboradorService(
    new ColaboradorRepository(),
    habilidadRepository,
  );

  const proyectoService = new ProyectoService(
    proyectoRepository,
    habilidadRepository,
    colaboradorService,
    colectivoRepository,
    colaboracionRepository,
    perfilRepository,
  );
  const proyectoController = new ProyectoController(proyectoService);
  const perfilService = new PerfilService(
    perfilRepository,
    proyectoRepository,
    habilidadRepository,
  );
  const perfilController = new PerfilController(perfilService);

  const app = express();
  app.use(express.json());
  app.use(
    "/proyectos",
    crearProyectoRouter(
      proyectoController,
      perfilController,
      null,
      (req, res, next) => {
        // La suite no valida JWT: simula una colectiva autenticada, que es el
        // rol que exigen las rutas de perfiles de proyecto.
        req.usuario = { rol: "COLECTIVO" };
        next();
      },
    ),
  );
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

let app;

beforeAll(async () => {
  await conectarALaBaseDePrueba();
  await Promise.all([ProyectoModel.init(), ColectivoModel.init()]);
  app = construirApp();
});

afterAll(async () => {
  await desconectarDeLaBaseDePrueba();
});

beforeEach(async () => {
  await limpiarLaBase();
  await sembrarDatosIniciales();
});

describe("búsqueda de proyectos activos (GET /proyectos?estado=...)", () => {
  it("solo devuelve activos cuando la búsqueda pide ACTIVO", async () => {
    const { status, body } = await request(app).get("/proyectos?estado=ACTIVO");

    expect(status).toBe(200);
    expect(body.map((proyecto) => proyecto.id).sort()).toEqual(
      [PROYECTO_PORTAL, PROYECTO_MAPA, PROYECTO_LABORATORIO].sort(),
    );
    expect(body.map((proyecto) => proyecto.id)).not.toContain(
      PROYECTO_INVENTARIO,
    );
  });

  it("puede listar solo finalizados para otros usos internos", async () => {
    const { status, body } = await request(app).get(
      "/proyectos?estado=FINALIZADO",
    );

    expect(status).toBe(200);
    expect(body.map((proyecto) => proyecto.id)).toEqual([PROYECTO_INVENTARIO]);
  });

  it("normaliza el estado en minúsculas", async () => {
    const { status, body } = await request(app).get("/proyectos?estado=activo");

    expect(status).toBe(200);
    expect(body).toHaveLength(3);
  });

  it("responde 400 si el estado no existe", async () => {
    const { status, body } = await request(app).get(
      "/proyectos?estado=PAUSADO",
    );

    expect(status).toBe(400);
    expect(body.codigo).toBe("ESTADO_INVALIDO");
  });

  it("filtra por colectivo dueño combinado con estado ACTIVO", async () => {
    const { status, body } = await request(app).get(
      `/proyectos?estado=ACTIVO&idColectivo=${COLECTIVO_MANOS}`,
    );

    expect(status).toBe(200);
    expect(body.map((proyecto) => proyecto.id).sort()).toEqual(
      [PROYECTO_PORTAL, PROYECTO_LABORATORIO].sort(),
    );
  });

  it("devuelve vacío si el colectivo no tiene proyectos activos", async () => {
    const { status, body } = await request(app).get(
      `/proyectos?estado=ACTIVO&idColectivo=${COLECTIVO_BARRIO}`,
    );

    expect(status).toBe(200);
    expect(body).toEqual([]);
  });

  it("responde 400 si el id del colectivo no es válido", async () => {
    const { status, body } = await request(app).get(
      "/proyectos?estado=ACTIVO&idColectivo=no-es-un-id",
    );

    expect(status).toBe(400);
    expect(body.codigo).toBe("COLECTIVO_INVALIDO");
  });

  it("filtra por habilidad requerida de los perfiles", async () => {
    const { status, body } = await request(app).get(
      `/proyectos?estado=ACTIVO&habilidad=${encodeURIComponent("React")}`,
    );

    expect(status).toBe(200);
    expect(body.map((proyecto) => proyecto.id)).toEqual([PROYECTO_MAPA]);
  });

  it("filtra por habilidad opcional de los perfiles", async () => {
    const { status, body } = await request(app).get(
      `/proyectos?estado=ACTIVO&habilidad=${encodeURIComponent("SQL")}`,
    );

    expect(status).toBe(200);
    expect(body.map((proyecto) => proyecto.id)).toEqual([PROYECTO_PORTAL]);
  });

  it("combina habilidades con OR y con otros filtros", async () => {
    const { status, body } = await request(app).get(
      `/proyectos?estado=ACTIVO&habilidad=${encodeURIComponent(
        "React",
      )}&habilidad=${encodeURIComponent("Testing E2E con Cypress")}`,
    );

    expect(status).toBe(200);
    expect(body.map((proyecto) => proyecto.id).sort()).toEqual(
      [PROYECTO_MAPA, PROYECTO_PORTAL].sort(),
    );

    const filtrado = await request(app).get(
      `/proyectos?estado=ACTIVO&habilidad=${encodeURIComponent(
        "React",
      )}&provincia=AR-M`,
    );
    expect(filtrado.status).toBe(200);
    expect(filtrado.body.map((proyecto) => proyecto.id)).toEqual([
      PROYECTO_MAPA,
    ]);
  });
});

describe("búsqueda con al menos una coincidencia (GET /proyectos?modo=cualquiera)", () => {
  it("devuelve proyectos que coinciden en al menos un filtro y detalla qué coincidió", async () => {
    const { status, body } = await request(app).get(
      `/proyectos?modo=cualquiera&estado=ACTIVO&habilidad=${encodeURIComponent(
        "React",
      )}&etiqueta=salud`,
    );

    expect(status).toBe(200);
    // Mapa entra por la habilidad, Portal por la etiqueta: alcanza con una.
    expect(body.map((proyecto) => proyecto.id).sort()).toEqual(
      [PROYECTO_MAPA, PROYECTO_PORTAL].sort(),
    );

    const mapa = body.find((proyecto) => proyecto.id === PROYECTO_MAPA);
    expect(mapa.coincidencias).toEqual([{ tipo: "HABILIDAD", valor: "React" }]);

    const portal = body.find((proyecto) => proyecto.id === PROYECTO_PORTAL);
    expect(portal.coincidencias).toEqual([
      { tipo: "ETIQUETA", valor: "salud" },
    ]);
  });

  it("acumula todas las coincidencias de un mismo proyecto", async () => {
    const { status, body } = await request(app).get(
      `/proyectos?modo=cualquiera&estado=ACTIVO&habilidad=${encodeURIComponent(
        "React",
      )}&etiqueta=accesibilidad_web&provincia=AR-M`,
    );

    expect(status).toBe(200);
    // Mapa coincide en los tres filtros; Laboratorio entra sólo por Mendoza.
    expect(body.map((proyecto) => proyecto.id).sort()).toEqual(
      [PROYECTO_MAPA, PROYECTO_LABORATORIO].sort(),
    );

    const mapa = body.find((proyecto) => proyecto.id === PROYECTO_MAPA);
    expect(mapa.coincidencias).toHaveLength(3);
    expect(mapa.coincidencias).toEqual(
      expect.arrayContaining([
        { tipo: "HABILIDAD", valor: "React" },
        { tipo: "ETIQUETA", valor: "accesibilidad_web" },
        { tipo: "PROVINCIA", valor: "Mendoza" },
      ]),
    );

    const laboratorio = body.find(
      (proyecto) => proyecto.id === PROYECTO_LABORATORIO,
    );
    expect(laboratorio.coincidencias).toEqual([
      { tipo: "PROVINCIA", valor: "Mendoza" },
    ]);
  });

  it("acepta varias provincias y varios colectivos", async () => {
    const provincias = await request(app).get(
      "/proyectos?modo=cualquiera&provincia=AR-X&provincia=AR-B",
    );
    expect(provincias.status).toBe(200);
    expect(provincias.body.map((proyecto) => proyecto.id).sort()).toEqual(
      [PROYECTO_INVENTARIO, PROYECTO_PORTAL].sort(),
    );

    const colectivos = await request(app).get(
      `/proyectos?modo=cualquiera&estado=ACTIVO&idColectivo=${COLECTIVO_MANOS}&idColectivo=c00000000000000000000003`,
    );
    expect(colectivos.status).toBe(200);
    expect(colectivos.body.map((proyecto) => proyecto.id).sort()).toEqual(
      [PROYECTO_PORTAL, PROYECTO_LABORATORIO, PROYECTO_MAPA].sort(),
    );

    const mapa = colectivos.body.find(
      (proyecto) => proyecto.id === PROYECTO_MAPA,
    );
    expect(mapa.coincidencias).toEqual([
      { tipo: "COLECTIVO", valor: "Datos para Todos" },
    ]);
  });

  it("normaliza el id del colectivo antes de informar la coincidencia", async () => {
    const { status, body } = await request(app).get(
      `/proyectos?modo=cualquiera&idColectivo=${COLECTIVO_MANOS.toUpperCase()}`,
    );

    expect(status).toBe(200);
    expect(body.flatMap((proyecto) => proyecto.coincidencias)).toContainEqual({
      tipo: "COLECTIVO",
      valor: "Fundación Manos Solidarias",
    });
  });

  it("devuelve vacío si la habilidad pedida no existe en ningún perfil", async () => {
    const { status, body } = await request(app).get(
      `/proyectos?modo=cualquiera&habilidad=${encodeURIComponent(
        "Habilidad inexistente",
      )}`,
    );

    expect(status).toBe(200);
    expect(body).toEqual([]);
  });

  it("responde 400 si una provincia o un colectivo no son válidos", async () => {
    const provincia = await request(app).get(
      "/proyectos?modo=cualquiera&provincia=NoExiste",
    );
    expect(provincia.status).toBe(400);

    const colectivo = await request(app).get(
      "/proyectos?modo=cualquiera&idColectivo=no-es-un-id",
    );
    expect(colectivo.status).toBe(400);
  });

  it("responde 400 si el modo de búsqueda no está soportado", async () => {
    const { status, body } = await request(app).get(
      "/proyectos?modo=desconocido",
    );

    expect(status).toBe(400);
    expect(body.codigo).toBe("MODO_BUSQUEDA_INVALIDO");
  });
});

describe("perfiles de un proyecto (GET /proyectos/:idProyecto/perfiles)", () => {
  it("devuelve solo los perfiles del proyecto pedido", async () => {
    const { status, body } = await request(app).get(
      `/proyectos/${PROYECTO_PORTAL}/perfiles`,
    );

    expect(status).toBe(200);
    expect(body.map((perfil) => perfil.id).sort()).toEqual(
      [PERFIL_TESTER, PERFIL_ANALISTA].sort(),
    );
  });

  it("responde 404 si el proyecto no existe", async () => {
    const { status, body } = await request(app).get(
      "/proyectos/no-es-un-id/perfiles",
    );

    expect(status).toBe(404);
    expect(body.codigo).toBe("PROYECTO_NO_ENCONTRADO");
  });
});
