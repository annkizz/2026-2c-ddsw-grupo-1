import express from "express";

export function crearProyectoRouter(proyectoController) {
  const router = express.Router();

  router
    .route("/")
    .get((req, res) => proyectoController.obtenerTodos(req, res))
    .post((req, res) => proyectoController.crear(req, res));

  return router;
}
