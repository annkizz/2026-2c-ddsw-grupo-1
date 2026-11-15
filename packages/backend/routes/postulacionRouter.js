import express from "express";
import { validate } from "../middlewares/validate.js";
import {
  crearPostulacionSchema,
  resolverPostulacionSchema,
} from "../controllers/PostulacionController.js";

export function crearPostulacionRouter(
  postulacionController,
  autenticar,
) {
  const router = express.Router({ mergeParams: true });

  router
    .route("/perfiles/:idPerfil/postulaciones")
    .post(
      autenticar,
      validate(crearPostulacionSchema),
      (req, res) => postulacionController.crear(req, res),
    );

  router
    .route("/postulaciones")
    .get(autenticar, (req, res) =>
      postulacionController.obtenerPorProyecto(req, res),
    );

  router
    .route("/postulaciones/:idPostulacion")
    .patch(
      autenticar,
      validate(resolverPostulacionSchema),
      (req, res) => postulacionController.resolver(req, res),
    );

  router
    .route("/colaboraciones/:idColaborador")
    .delete(autenticar, (req, res) =>
      postulacionController.darDeBaja(req, res),
    );

  return router;
}
