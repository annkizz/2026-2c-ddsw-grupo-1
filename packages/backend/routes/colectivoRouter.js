import express from "express";

export function crearColectivoRouter(colectivoController) {
  const router = express.Router();

  router
    .route("/")
    .get((req, res) => colectivoController.obtenerTodos(req, res))
    .post((req, res) => colectivoController.crear(req, res));

  return router;
}
