import express from "express";
import { validate } from "../middlewares/validate.js";
import { logroSchema } from "../controllers/LogroController.js";

export function crearLogroRouter(logroController) {
  const router = express.Router();

  router
    .route("/:idProyecto/logros")
    .get((req, res) => logroController.obtenerPorProyecto(req, res))
    .post(validate(logroSchema), (req, res) => logroController.crear(req, res));

  router
    .route("/:idProyecto/logros/:id")
    .get((req, res) => logroController.obtenerPorId(req, res))
    .put(validate(logroSchema), (req, res) =>
      logroController.actualizar(req, res),
    )
    .delete((req, res) => logroController.eliminar(req, res));

  return router;
}
