import express from "express";
import { validate } from "../middlewares/validate.js";
import { notificacionSchema } from "../schemas/zod/notificacionSchema.js";

export function crearNotificacionRouter(notificacionController) {
  const router = express.Router();

  router
    .route("/")
    .get((req, res) => notificacionController.obtenerTodos(req, res))
    .post(validate(notificacionSchema), (req, res) =>
      notificacionController.crear(req, res),
    );

  router
    .route("/:id")
    .get((req, res) => notificacionController.obtenerPorId(req, res));

  return router;
}
