import express from "express";
import { validate } from "../middlewares/validate.js";
import { habilidadSchema } from "../controllers/HabilidadController.js";

export function crearHabilidadRouter(habilidadController) {
  const router = express.Router();

  router
    .route("/")
    .get((req, res) => habilidadController.obtenerTodos(req, res))
    .post(validate(habilidadSchema), (req, res) =>
      habilidadController.crear(req, res),
    )
    .put((req, res) => habilidadController.actualizar(req, res)); // falta implementar ??

  return router;
}
