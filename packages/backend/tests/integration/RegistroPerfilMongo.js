import express from "express";
import request from "supertest";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { UnauthorizedError } from "../../errors/AppError.js";
import { crearAutenticar } from "../../middlewares/authMiddleware.js";
import { UsuarioRepository } from "../../repositories/UsuarioRepository.js";
import { ColectivoRepository } from "../../repositories/ColectivoRepository.js";
import { ColaboradorRepository } from "../../repositories/ColaboradorRepository.js";
import { UsuarioModel } from "../../schemas/usuarioSchema.js";
import { ColectivoModel } from "../../schemas/colectivoSchema.js";
import { ColaboradorModel } from "../../schemas/colaboradorSchema.js";
import { UsuarioService } from "../../services/UsuarioService.js";
import { ColectivoService } from "../../services/ColectivoService.js";
import { ColaboradorService } from "../../services/ColaboradorService.js";
import { UsuarioController } from "../../controllers/UsuarioController.js";
import { ColectivoController } from "../../controllers/ColectivoController.js";
import { ColaboradorController } from "../../controllers/ColaboradorController.js";
import { crearUsuarioRouter } from "../../routes/usuarioRouter.js";
import { crearColectivoRouter } from "../../routes/colectivoRouter.js";
import { crearColaboradorRouter } from "../../routes/colaboradorRouter.js";
import { notFoundHandler } from "../../middlewares/notFoundHandler.js";
import { errorHandler } from "../../middlewares/errorHandler.js";
import {
  conectarALaBaseDePrueba,
  desconectarDeLaBaseDePrueba,
  limpiarLaBase,
} from "./utils/baseDeDatosDePrueba.js";

jest.setTimeout(60000);

const como = (usuario) => ({ Authorization: `Bearer token-${usuario}` });

const crearApp = () => {
  const usuarioRepository = new UsuarioRepository();
  const colectivoRepository = new ColectivoRepository();
  const colaboradorRepository = new ColaboradorRepository();
  const usuarioService = new UsuarioService(
    usuarioRepository,
    colectivoRepository,
    colaboradorRepository,
  );
  const habilidadRepository = {
    encontrarPorCodigos: async (codigos) =>
      codigos.map((codigo) => ({ codigo, titulo: codigo })),
  };
  const autenticar = crearAutenticar(usuarioRepository, async (token) => {
    if (!token.startsWith("token-")) {
      throw new UnauthorizedError("token invalido", "TOKEN_INVALIDO");
    }
    return { sub: token.slice("token-".length) };
  });

  const app = express();
  app.use(express.json());
  app.use(crearUsuarioRouter(new UsuarioController(usuarioService), autenticar));
  app.use(
    "/colectivos",
    crearColectivoRouter(
      new ColectivoController(
        new ColectivoService(colectivoRepository, usuarioService),
      ),
      autenticar,
    ),
  );
  app.use(
    "/colaboradoras",
    crearColaboradorRouter(
      new ColaboradorController(
        new ColaboradorService(
          colaboradorRepository,
          habilidadRepository,
          usuarioService,
        ),
      ),
      autenticar,
    ),
  );
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

let app;

beforeAll(async () => {
  await conectarALaBaseDePrueba();
  await Promise.all([
    UsuarioModel.init(),
    ColectivoModel.init(),
    ColaboradorModel.init(),
  ]);
  app = crearApp();
});

afterAll(async () => {
  await desconectarDeLaBaseDePrueba();
});

beforeEach(async () => {
  await limpiarLaBase();
});

describe("registro de perfiles contra Mongo", () => {
  it("persiste un colectivo y lo devuelve en GET /me", async () => {
    const creado = await request(app)
      .post("/colectivos")
      .set(como("colectivo"))
      .send({
        nombre: "Manos Solidarias",
        descripcion: "Voluntariado barrial",
        tipoDeColectivo: "ONG",
      });

    expect(creado.status).toBe(201);
    const sesion = await request(app).get("/me").set(como("colectivo"));
    expect(sesion.body).toMatchObject({
      rol: "COLECTIVO",
      tienePerfil: true,
      idColectivo: creado.body.id,
    });
  });

  it("persiste una colaboradora y la devuelve en GET /me", async () => {
    const creado = await request(app)
      .post("/colaboradoras")
      .set(como("colaboradora"))
      .send({
        nombreFantasia: "ada",
        habilidades: ["javascript"],
        presentacion: "Me gusta colaborar",
      });

    expect(creado.status).toBe(201);
    const sesion = await request(app).get("/me").set(como("colaboradora"));
    expect(sesion.body).toMatchObject({
      rol: "COLABORADOR",
      tienePerfil: true,
      idColaborador: creado.body.id,
    });
  });
});
