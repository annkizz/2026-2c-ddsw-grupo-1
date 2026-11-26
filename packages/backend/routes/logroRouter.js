import express from "express";
import { validate } from "../middlewares/validate.js";
import {
  logroSchema,
  logroCreacionSchema,
} from "../controllers/LogroController.js";

export function crearLogroRouter(logroController) {
  const router = express.Router();

  router
    .route("/:idProyecto/logros")
    .get((req, res) => logroController.obtenerPorProyecto(req, res))
    .post(validate(logroCreacionSchema), (req, res) =>
      logroController.crear(req, res),
    );

  router
    .route("/:idProyecto/logros/:id")
    .get((req, res) => logroController.obtenerPorId(req, res))
    .put(validate(logroSchema), (req, res) =>
      logroController.actualizar(req, res),
    )
    .delete((req, res) => logroController.eliminar(req, res));

  router
    .route("/:idProyecto/logros/:id/linkedin")
    .post((req, res) => logroController.publicarEnLinkedin(req, res));

  return router;
}
