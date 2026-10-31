import express from "express";
import { validate } from "../middlewares/validate.js";
import { requerirRol } from "../middlewares/authMiddleware.js";
import { Rol } from "../domain/Rol.js";
import { colectivoSchema } from "../controllers/ColectivoController.js";

export function crearColectivoRouter(colectivoController, autenticar) {
  const router = express.Router();

  router
    .route("/")
    .get((req, res) => colectivoController.obtenerTodos(req, res))
    .post(autenticar, validate(colectivoSchema), (req, res) =>
      colectivoController.crear(req, res),
    );

  router
    .route("/:id")
    .get((req, res) => colectivoController.obtenerPorId(req, res))
    .put(
      autenticar,
      requerirRol(Rol.COLECTIVO),
      validate(colectivoSchema),
      (req, res) => colectivoController.actualizar(req, res),
    );

  return router;
}
