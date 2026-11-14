import express from "express";
import request from "supertest";
import { describe, expect, it, jest } from "@jest/globals";
import { PostulacionController } from "../../controllers/PostulacionController.js";
import { crearPostulacionRouter } from "../../routes/postulacionRouter.js";
import { errorHandler } from "../../middlewares/errorHandler.js";
import { notFoundHandler } from "../../middlewares/notFoundHandler.js";

describe("Postulacion API - integración HTTP", () => {
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
    app.use((req, res, next) => {
      req.auth = { rol: "COLABORADORA", id: "colaboradora-1" };
      next();
    });
    app.use(
      "/proyectos/:idProyecto",
      crearPostulacionRouter(new PostulacionController(service)),
    );
    app.use(notFoundHandler);
    app.use(errorHandler);

    const response = await request(app)
      .post("/proyectos/proyecto-1/perfiles/perfil-1/postulaciones")
      .send({ idColaborador: "colaboradora-1", esAnonima: true });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(postulacion);
    expect(service.crear).toHaveBeenCalledWith(
      "proyecto-1",
      "perfil-1",
      "colaboradora-1",
      true,
      { rol: "COLABORADORA", id: "colaboradora-1" },
    );
  });

  it("rechaza datos adicionales en el body", async () => {
    const service = { crear: jest.fn() };
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.auth = { rol: "COLABORADORA", id: "colaboradora-1" };
      next();
    });
    app.use(
      "/proyectos/:idProyecto",
      crearPostulacionRouter(new PostulacionController(service)),
    );
    app.use(notFoundHandler);
    app.use(errorHandler);

    const response = await request(app)
      .post("/proyectos/proyecto-1/perfiles/perfil-1/postulaciones")
      .send({ idColaborador: "colaboradora-1", administrador: true });

    expect(response.status).toBe(400);
    expect(service.crear).not.toHaveBeenCalled();
  });

  it("rechaza solicitudes sin contexto autenticado", async () => {
    const service = { crear: jest.fn() };
    const app = express();
    app.use(express.json());
    app.use(
      "/proyectos/:idProyecto",
      crearPostulacionRouter(new PostulacionController(service)),
    );
    app.use(notFoundHandler);
    app.use(errorHandler);

    const response = await request(app)
      .post("/proyectos/proyecto-1/perfiles/perfil-1/postulaciones")
      .send({ idColaborador: "colaboradora-1" });

    expect(response.status).toBe(401);
    expect(response.body.codigo).toBe("AUTENTICACION_REQUERIDA");
    expect(service.crear).not.toHaveBeenCalled();
  });
});
