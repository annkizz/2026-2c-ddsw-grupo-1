import express from "express";
import { validate } from "../middlewares/validate.js";
import {
  crearPostulacionSchema,
  resolverPostulacionSchema,
} from "../controllers/PostulacionController.js";

export function crearPostulacionRouter(
  postulacionController,
  autenticar,
  contextoPostulaciones,
) {
  const router = express.Router({ mergeParams: true });

  router
    .route("/perfiles/:idPerfil/postulaciones")
    .post(
      autenticar,
      contextoPostulaciones,
      validate(crearPostulacionSchema),
      (req, res) => postulacionController.crear(req, res),
    );

  router
    .route("/postulaciones")
    .get(autenticar, contextoPostulaciones, (req, res) =>
      postulacionController.obtenerPorProyecto(req, res),
    );

  router
    .route("/postulaciones/:idPostulacion")
    .patch(
      autenticar,
      contextoPostulaciones,
      validate(resolverPostulacionSchema),
      (req, res) => postulacionController.resolver(req, res),
    );

  router
    .route("/colaboraciones/:idColaborador")
    .delete(autenticar, contextoPostulaciones, (req, res) =>
      postulacionController.darDeBaja(req, res),
    );

  return router;
}
