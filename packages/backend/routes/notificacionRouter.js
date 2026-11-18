import express from "express";
import { validate } from "../middlewares/validate.js";
import { requerirRol } from "../middlewares/authMiddleware.js";
import { Rol } from "../domain/Rol.js";
import { notificacionSchema } from "../schemas/zod/notificacionSchema.js";

export function crearNotificacionRouter(notificacionController) {
  const router = express.Router();

  router
    .route("/")
    .get(requerirRol(Rol.COLABORADOR), (req, res) =>
      notificacionController.obtenerTodosPaginado(req, res),
    )
    .post(
      requerirRol(Rol.COLECTIVO),
      validate(notificacionSchema),
      (req, res) => notificacionController.crear(req, res),
    );

  router
    .route("/:id")
    .get(requerirRol(Rol.COLABORADOR), (req, res) =>
      notificacionController.obtenerPorId(req, res),
    );
  
  router
    .route("/colaboradora/:id")
    .get(requerirRol(Rol.COLABORADOR), (req, res) =>
      notificacionController.obtenerTodosPorColaboradora(req, res),
    );

  return router;
}
