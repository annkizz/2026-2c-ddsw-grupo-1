import express from "express";
import { validate } from "../middlewares/validate.js"; 
import {
  proyectoSchema,
  idColaboradorSchema,
  cierreProgramadoSchema,
  avanceSchema,
} from "../controllers/ProyectoController.js";

export function crearProyectoRouter(proyectoController) {
  const router = express.Router();

  router
    .route("/")
    .get((req, res) => proyectoController.obtenerTodos(req, res))
    .post(validate(proyectoSchema), (req, res) =>
      proyectoController.crear(req, res),
    );

  router
    .route("/:id/colaboraciones")
    .get((req, res) => proyectoController.obtenerColaboracionesPublicas(req, res))
    .post(validate(idColaboradorSchema), (req, res) =>
      proyectoController.crearColaboracion(req, res),
    );

  router
    .route("/:id/cierre")
    .patch((req, res) => proyectoController.cerrarProyecto(req, res));

  router
  .route("/:id/cierre-programado")
  .patch(validate(cierreProgramadoSchema), (req, res) =>
    proyectoController.programarCierre(req, res),
  );

  router
    .route("/:id/avance")
    .patch(validate(avanceSchema), (req, res) =>
      proyectoController.actualizarAvance(req, res),
    );

  
  return router;
}
