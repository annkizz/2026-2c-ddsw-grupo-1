import express from "express";

export function crearProyectoRouter(proyectoController) {
  const router = express.Router();

  router
    .route("/")
    .get((req, res) => proyectoController.obtenerTodos(req, res))
    .post((req, res) => proyectoController.crear(req, res));

  router 
    .route("/:id/colaboraciones")
    .post((req,res) => proyectoController.crearColaboracion(req, res)) ;

  return router;
}