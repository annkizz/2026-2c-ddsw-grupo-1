import express from "express";
import { validate } from "../middlewares/validate.js";
import { habilidadSchema } from "../controllers/HabilidadController.js";
import { requerirRol } from "../middlewares/authMiddleware.js";
import { Rol } from "../domain/Rol.js";

export function crearHabilidadRouter(habilidadController) {
  const router = express.Router();

  router
    .route("/")
    .get((req, res) => habilidadController.obtenerTodos(req, res))
    .post(requerirRol(Rol.ADMINISTRADOR), validate(habilidadSchema), (req, res) =>
      habilidadController.crear(req, res),
    )
    .put((req, res) => habilidadController.actualizar(req, res)); // falta implementar ??

  return router;
}
