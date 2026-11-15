import express from "express";
import request from "supertest";
import { describe, expect, it, jest } from "@jest/globals";
import { PostulacionController } from "../../controllers/PostulacionController.js";
import { crearPostulacionRouter } from "../../routes/postulacionRouter.js";
import { errorHandler } from "../../middlewares/errorHandler.js";
import { notFoundHandler } from "../../middlewares/notFoundHandler.js";
import { crearAutenticar } from "../../middlewares/authMiddleware.js";

describe("Postulacion API - integración HTTP", () => {
  const crearAutenticacion = () =>
    crearAutenticar(
      {
        buscarOCrearPorLogtoId: jest.fn(async () => ({
          _id: "usuario-1",
          rol: "COLABORADOR",
        })),
      },
      async () => ({ sub: "logto-1" }),
    );
  const crearUsuarioService = (sesion = {}) => ({
      obtenerSesion: jest.fn(async () => ({
        rol: "COLABORADOR",
        idColaborador: "colaboradora-1",
        idColectivo: null,
        ...sesion,
      })),
    });

  it("crea una postulación validada al perfil indicado", async () => {
    const postulacion = {
      id: "post-1",
      idProyecto: "proyecto-1",
      idPerfil: "perfil-1",
      estado: "PENDIENTE",
      esAnonima: true,
    };
    const service = {
      crear: jest.fn(async () => postulacion),
    };
    const app = express();
    app.use(express.json());
    app.use(
      "/proyectos/:idProyecto",
      crearPostulacionRouter(
        new PostulacionController(service, crearUsuarioService()),
        crearAutenticacion(),
      ),
    );
    app.use(notFoundHandler);
    app.use(errorHandler);

    const response = await request(app)
      .post("/proyectos/proyecto-1/perfiles/perfil-1/postulaciones")
      .set("Authorization", "Bearer test")
      .send({ esAnonima: true });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(postulacion);
    expect(service.crear).toHaveBeenCalledWith(
      "proyecto-1",
      "perfil-1",
      true,
      { rol: "COLABORADOR", id: "colaboradora-1" },
    );
  });

  it("rechaza datos adicionales en el body", async () => {
    const service = { crear: jest.fn() };
    const app = express();
    app.use(express.json());
    app.use(
      "/proyectos/:idProyecto",
      crearPostulacionRouter(
        new PostulacionController(service, crearUsuarioService()),
        crearAutenticacion(),
      ),
    );
    app.use(notFoundHandler);
    app.use(errorHandler);

    const response = await request(app)
      .post("/proyectos/proyecto-1/perfiles/perfil-1/postulaciones")
      .set("Authorization", "Bearer test")
      .send({ idColaborador: "otra", esAnonima: true });

    expect(response.status).toBe(400);
    expect(service.crear).not.toHaveBeenCalled();
  });

  it("rechaza solicitudes sin contexto autenticado", async () => {
    const service = { crear: jest.fn() };
    const app = express();
    app.use(express.json());
    app.use(
      "/proyectos/:idProyecto",
      crearPostulacionRouter(
        new PostulacionController(service, crearUsuarioService()),
        crearAutenticacion(),
      ),
    );
    app.use(notFoundHandler);
    app.use(errorHandler);

    const response = await request(app)
      .post("/proyectos/proyecto-1/perfiles/perfil-1/postulaciones")
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.codigo).toBe("TOKEN_AUSENTE");
    expect(service.crear).not.toHaveBeenCalled();
  });

  it("rechaza a usuarios autenticados que todavía no tienen un perfil", async () => {
    const service = { crear: jest.fn() };
    const app = express();
    app.use(express.json());
    app.use(
      "/proyectos/:idProyecto",
      crearPostulacionRouter(
        new PostulacionController(
          service,
          crearUsuarioService({ rol: null, idColaborador: null }),
        ),
        crearAutenticacion(),
      ),
    );
    app.use(notFoundHandler);
    app.use(errorHandler);

    const response = await request(app)
      .post("/proyectos/proyecto-1/perfiles/perfil-1/postulaciones")
      .set("Authorization", "Bearer test")
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.codigo).toBe("PERFIL_REQUERIDO");
    expect(service.crear).not.toHaveBeenCalled();
  });
});
