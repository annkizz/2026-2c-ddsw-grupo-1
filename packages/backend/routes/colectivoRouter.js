import express from "express";
import { validate } from "../middlewares/validate.js";
import { colectivoSchema } from "../controllers/ColectivoController.js"; 

export function crearColectivoRouter(colectivoController) {
  const router = express.Router();

  router
    .route("/")
    .get((req, res) => colectivoController.obtenerTodos(req, res))
    .post(validate(colectivoSchema),
      (req, res) => colectivoController.crear(req, res));

  return router;
}
