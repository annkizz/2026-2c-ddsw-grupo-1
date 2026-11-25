import express from "express";
import request from "supertest";
import { describe, expect, it, jest } from "@jest/globals";
import { ColaboradorController } from "../../controllers/ColaboradorController.js";
import { crearColaboradorRouter } from "../../routes/colaboradorRouter.js";
import { notFoundHandler } from "../../middlewares/notFoundHandler.js";
import { errorHandler } from "../../middlewares/errorHandler.js";
import { Rol } from "../../domain/Rol.js";

const crearApp = (rol, colaboradorService) => {
  const autenticar = (req, res, next) => {
    req.usuario = { _id: "usuario-1", rol };
    next();
  };
  const controller = new ColaboradorController(colaboradorService);
  const app = express();
  app.use("/colaboradoras", crearColaboradorRouter(controller, autenticar));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe("Colaborador API - mis colaboraciones", () => {
  it("devuelve las colaboraciones de la sesión colaboradora", async () => {
    const colaboraciones = [{ idProyecto: "p1" }];
    const colaboradorService = {
      obtenerMisColaboraciones: jest.fn().mockResolvedValue(colaboraciones),
    };

    const response = await request(
      crearApp(Rol.COLABORADOR, colaboradorService),
    ).get("/colaboradoras/me/colaboraciones");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(colaboraciones);
    expect(colaboradorService.obtenerMisColaboraciones).toHaveBeenCalledWith({
      _id: "usuario-1",
      rol: Rol.COLABORADOR,
    });

    describe("Colaborador API - mis postulaciones", () => {
      it("consulta las postulaciones de la sesión colaboradora", async () => {
        const postulaciones = [{ id: "post-1", estado: "PENDIENTE" }];
        const colaboradorService = {
          obtenerMisPostulaciones: jest.fn().mockResolvedValue(postulaciones),
        };

        const response = await request(crearApp(Rol.COLABORADOR, colaboradorService))
          .get("/colaboradoras/me/postulaciones");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(postulaciones);
        expect(colaboradorService.obtenerMisPostulaciones).toHaveBeenCalledWith({
          _id: "usuario-1",
          rol: Rol.COLABORADOR,
        });
      });

      it("impide consultar postulaciones con el rol de colectivo", async () => {
        const colaboradorService = { obtenerMisPostulaciones: jest.fn() };
        const response = await request(crearApp(Rol.COLECTIVO, colaboradorService))
          .get("/colaboradoras/me/postulaciones");

        expect(response.status).toBe(403);
        expect(colaboradorService.obtenerMisPostulaciones).not.toHaveBeenCalled();
      });
    });
  });

  it("rechaza otras sesiones antes de consultar las colaboraciones", async () => {
    const colaboradorService = {
      obtenerMisColaboraciones: jest.fn(),
    };

    const response = await request(
      crearApp(Rol.COLECTIVO, colaboradorService),
    ).get("/colaboradoras/me/colaboraciones");

    expect(response.status).toBe(403);
    expect(colaboradorService.obtenerMisColaboraciones).not.toHaveBeenCalled();
  });
});
