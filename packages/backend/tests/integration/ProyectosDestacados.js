import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { crearProyectoRouter } from "../../routes/proyectoRouter.js";
import { errorHandler } from "../../middlewares/errorHandler.js";
import { notFoundHandler } from "../../middlewares/notFoundHandler.js";

const crearApp = () => {
  const autenticar = (req, res, next) => {
    const rol = req.header("x-rol");
    if (!rol) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    req.usuario = { rol };
    next();
  };
  const autenticarSiModifica = (req, res, next) =>
    req.method === "GET" ? next() : autenticar(req, res, next);
  const controller = {
    obtenerDestacados: (req, res) => res.status(200).json([{ id: "p-1" }]),
    configurarDestacado: (req, res) =>
      res.status(200).json({ id: req.params.idProyecto, ...req.body }),
  };
  const app = express();
  app.use(express.json());
  app.use(
    "/proyectos",
    autenticarSiModifica,
    crearProyectoRouter(controller, {}, null, autenticar),
  );
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe("API de proyectos destacados", () => {
  let app;

  beforeEach(() => {
    app = crearApp();
  });

  it("expone destacados vigentes públicamente", async () => {
    const response = await request(app).get("/proyectos/destacados");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: "p-1" }]);
  });

  it("requiere autenticación y permisos administrativos para modificarlos", async () => {
    const sinSesion = await request(app)
      .patch("/proyectos/p-1/destacado")
      .send({ destacado: false });
    const sinPermiso = await request(app)
      .patch("/proyectos/p-1/destacado")
      .set("x-rol", "COLABORADOR")
      .send({ destacado: false });

    expect(sinSesion.status).toBe(401);
    expect(sinPermiso.status).toBe(403);
    expect(sinPermiso.body.codigo).toBe("ROL_NO_PERMITIDO");
  });

  it("permite configurar el destacado a una cuenta administrativa", async () => {
    const destacadoHasta = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const response = await request(app)
      .patch("/proyectos/p-1/destacado")
      .set("x-rol", "ADMINISTRADOR")
      .send({ destacado: true, destacadoHasta });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: "p-1",
      destacado: true,
    });
    expect(new Date(response.body.destacadoHasta).getTime()).toBe(
      new Date(destacadoHasta).getTime(),
    );
  });

  it("rechaza destacar sin fecha de vencimiento", async () => {
    const response = await request(app)
      .patch("/proyectos/p-1/destacado")
      .set("x-rol", "ADMINISTRADOR")
      .send({ destacado: true });

    expect(response.status).toBe(400);
  });
});
