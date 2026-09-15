import express from "express";
import { validate } from "../middlewares/validate.js";
import { proyectoSchema } from "../controllers/ProyectoController.js"; 

export function crearProyectoRouter(proyectoController) {
  const router = express.Router();

  router
    .route("/")
    .get((req, res) => proyectoController.obtenerTodos(req, res))
    .post(validate(proyectoSchema),
      (req, res) => proyectoController.crear(req, res));

  router 
    .route("/:id/colaboraciones")
    .post(validate(proyectoSchema),
      (req,res) => proyectoController.crearColaboracion(req, res)) ;

  return router;
}