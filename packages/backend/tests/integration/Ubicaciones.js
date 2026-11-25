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

// req 15: el mapa corre sobre la seed real (Mongo embebido). Como hay otra
// suite de integracion que tambien levanta Mongo en paralelo, el boot necesita
// mas que el timeout default de Jest.
jest.setTimeout(60000);

// Ids fijos de la seed (ver seeds/datosIniciales.js).
const COLECTIVO_BUENOS_AIRES = "c00000000000000000000001";
const COLECTIVO_CORDOBA = "c00000000000000000000002";
const COLECTIVO_SIN_UBICACION = "c00000000000000000000003";
const PROYECTO_PORTAL = "a00000000000000000000001"; // sin ubicación propia
const PROYECTO_MAPA = "a00000000000000000000002"; // propio Mendoza
const PROYECTO_INVENTARIO = "a00000000000000000000003"; // finalizado, no va al mapa
const PROYECTO_LABORATORIO = "a00000000000000000000004"; // propio Mendoza
const USUARIOS_POR_COLECTIVO = {
  [COLECTIVO_BUENOS_AIRES]: "b00000000000000000000001",
  [COLECTIVO_CORDOBA]: "b00000000000000000000002",
  [COLECTIVO_SIN_UBICACION]: "b00000000000000000000003",
};

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
  const geolocalizacionService = {
    buscarDirecciones: jest.fn(async () => [
      {
        id: "osm-1",
        direccion: "Plaza Godoy Cruz, Mendoza, Argentina",
        latitud: -32.89,
        longitud: -68.83,
      },
    ]),
  };
  const proyectoController = new ProyectoController(
    proyectoService,
    geolocalizacionService,
  );
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
        // La suite no valida JWT: simula una colectiva autenticada.
        req.usuario = {
          rol: "COLECTIVO",
          _id:
            USUARIOS_POR_COLECTIVO[req.body?.idColectivo] ??
            USUARIOS_POR_COLECTIVO[COLECTIVO_BUENOS_AIRES],
        };
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

// Base limpia + seed fresca antes de cada test.
beforeEach(async () => {
  await limpiarLaBase();
  await sembrarDatosIniciales();
  await Promise.all(
    Object.entries(USUARIOS_POR_COLECTIVO).map(([idColectivo, idUsuario]) =>
      ColectivoModel.updateOne(
        { _id: idColectivo },
        { $set: { usuario: idUsuario } },
      ),
    ),
  );
});

describe("req 15: mapa de proyectos por provincia (integracion sobre la seed)", () => {
  it("agrupa por provincia y cuenta lo que corresponde", async () => {
    const { status, body } = await request(app).get("/proyectos/ubicaciones");

    expect(status).toBe(200);
    expect(body.map((grupo) => [grupo.codigo, grupo.cantidad])).toEqual([
      ["AR-M", 2],
    ]);
  });

  it("puede agrupar por pais usando el mismo endpoint", async () => {
    const { status, body } = await request(app).get(
      "/proyectos/ubicaciones?nivel=pais",
    );

    expect(status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      nivel: "pais",
      codigo: "AR",
      nombre: "Argentina",
      cantidad: 2,
    });
  });

  it("responde 400 si el nivel del mapa no existe", async () => {
    const { status, body } = await request(app).get(
      "/proyectos/ubicaciones?nivel=planeta",
    );

    expect(status).toBe(400);
    expect(body.codigo).toBe("NIVEL_MAPA_INVALIDO");
  });

  it("no incluye proyectos finalizados", async () => {
    const { body } = await request(app).get("/proyectos/ubicaciones");
    const proyectos = body.flatMap((grupo) => grupo.proyectos);

    expect(body.some((grupo) => grupo.codigo === "AR-X")).toBe(false);
    expect(proyectos.map((proyecto) => proyecto.id)).not.toContain(
      PROYECTO_INVENTARIO,
    );
  });

  it("no incluye la ubicacion del colectivo si el proyecto no declara una", async () => {
    const { body } = await request(app).get("/proyectos/ubicaciones");
    const proyectos = body.flatMap((grupo) => grupo.proyectos);

    expect(proyectos.map((proyecto) => proyecto.id)).not.toContain(
      PROYECTO_PORTAL,
    );
    expect(body.some((grupo) => grupo.codigo === "AR-B")).toBe(false);
  });

  it("la ubicacion propia del proyecto manda sobre la del colectivo", async () => {
    const { body } = await request(app).get("/proyectos/ubicaciones");
    const mendoza = body.find((grupo) => grupo.codigo === "AR-M");
    const laboratorio = mendoza.proyectos.find(
      (proyecto) => proyecto.id === PROYECTO_LABORATORIO,
    );

    // El laboratorio pertenece a un colectivo de Buenos Aires, pero declaro
    // ubicacion propia en Mendoza: el mapa lo cuenta en Mendoza.
    expect(laboratorio).toMatchObject({
      titulo: "Laboratorio de pruebas",
      descripcion:
        "Proyecto para probar anotación, cierre programado y cierre automático.",
      ciudad: "Mendoza",
      direccion: null,
      colectivo: {
        id: "c00000000000000000000001",
        nombre: "Fundación Manos Solidarias",
      },
    });
  });

  it("filtra el listado por provincia (GET /proyectos?provincia=...)", async () => {
    const { status, body } = await request(app).get(
      "/proyectos?provincia=cordoba",
    );

    expect(status).toBe(200);
    expect(body).toEqual([]);
  });

  it("acepta el codigo ISO como filtro", async () => {
    const { body } = await request(app).get("/proyectos?provincia=AR-M");

    expect(body.map((proyecto) => proyecto.id).sort()).toEqual([
      PROYECTO_MAPA,
      PROYECTO_LABORATORIO,
    ]);
  });

  it("responde 400 si la provincia del filtro no existe", async () => {
    const { status, body } = await request(app).get(
      "/proyectos?provincia=Narnia",
    );

    expect(status).toBe(400);
    expect(body.codigo).toBe("PROVINCIA_INVALIDA");
  });

  it("normaliza la ubicacion al crear el proyecto", async () => {
    const { status, body } = await request(app).post("/proyectos").send({
      idColectivo: COLECTIVO_CORDOBA,
      titulo: "Nuevo",
      descripcion: "Desc",
      ubicacion: {
        pais: "Argentina",
        provincia: "  mendoza ",
        ciudad: "Godoy Cruz",
        direccion: "Plaza Godoy Cruz",
        latitud: -32.89,
        longitud: -68.83,
      },
    });

    expect(status).toBe(201);
    expect(body.ubicacion).toEqual({
      codigoPais: "AR",
      nombrePais: "Argentina",
      codigoProvincia: "AR-M",
      nombreProvincia: "Mendoza",
      ciudad: "Godoy Cruz",
      direccion: "Plaza Godoy Cruz",
      latitud: -32.89,
      longitud: -68.83,
    });

    const ubicacionesGeolocalizadas = await request(app).get(
      "/proyectos/ubicaciones?nivel=proyecto",
    );
    expect(ubicacionesGeolocalizadas.status).toBe(200);
    expect(ubicacionesGeolocalizadas.body).toContainEqual(
      expect.objectContaining({
        id: body.id,
        descripcion: "Desc",
        latitud: -32.89,
        longitud: -68.83,
        direccion: "Plaza Godoy Cruz",
        codigoProvincia: "AR-M",
      }),
    );
    const distribucion = await request(app).get("/proyectos/ubicaciones");
    const mendoza = distribucion.body.find(
      (grupo) => grupo.codigo === "AR-M",
    );
    expect(mendoza.proyectos).toContainEqual(
      expect.objectContaining({
        id: body.id,
        descripcion: "Desc",
        latitud: -32.89,
        longitud: -68.83,
        direccion: "Plaza Godoy Cruz",
      }),
    );
  });

  it("no hereda la ubicacion del colectivo al crear si no se manda", async () => {
    const { status, body } = await request(app).post("/proyectos").send({
      idColectivo: COLECTIVO_CORDOBA,
      titulo: "Nuevo",
      descripcion: "Desc",
    });

    expect(status).toBe(201);
    expect(body.ubicacion).toBeNull();
  });

  it("permite crear sin ubicacion si el colectivo tampoco tiene", async () => {
    const { status, body } = await request(app).post("/proyectos").send({
      idColectivo: COLECTIVO_SIN_UBICACION,
      titulo: "Sin ubicacion",
      descripcion: "Desc",
    });

    expect(status).toBe(201);
    expect(body.ubicacion).toBeNull();
  });

  it("responde 400 al crear con una provincia invalida", async () => {
    const { status, body } = await request(app).post("/proyectos").send({
      idColectivo: COLECTIVO_CORDOBA,
      titulo: "Nuevo",
      descripcion: "Desc",
      ubicacion: {
        pais: "Argentina",
        provincia: "Narnia",
        ciudad: "Ciudad",
        latitud: -34,
        longitud: -58,
      },
    });

    expect(status).toBe(400);
    expect(body.codigo).toBe("PROVINCIA_INVALIDA");
  });

  it("responde 400 cuando se envia una sola coordenada", async () => {
    const { status } = await request(app).post("/proyectos").send({
      idColectivo: COLECTIVO_CORDOBA,
      titulo: "Nuevo",
      descripcion: "Desc",
      ubicacion: {
        pais: "Argentina",
        provincia: "Mendoza",
        ciudad: "Godoy Cruz",
        latitud: -32.89,
      },
    });

    expect(status).toBe(400);
  });

  it("rechaza ubicaciones sin localidad", async () => {
    const { status } = await request(app).post("/proyectos").send({
      idColectivo: COLECTIVO_CORDOBA,
      titulo: "Nuevo",
      descripcion: "Desc",
      ubicacion: {
        pais: "Argentina",
        provincia: "Mendoza",
        latitud: -32.89,
        longitud: -68.83,
      },
    });

    expect(status).toBe(400);
  });

  it("ofrece búsqueda de direcciones a la colectiva autenticada", async () => {
    const { status, body } = await request(app)
      .post("/proyectos/geocodificar")
      .send({
        direccion: "Plaza Godoy Cruz",
        ciudad: "Godoy Cruz",
        provincia: "AR-M",
      });

    expect(status).toBe(200);
    expect(body).toEqual([
      {
        id: "osm-1",
        direccion: "Plaza Godoy Cruz, Mendoza, Argentina",
        latitud: -32.89,
        longitud: -68.83,
      },
    ]);
  });
});
