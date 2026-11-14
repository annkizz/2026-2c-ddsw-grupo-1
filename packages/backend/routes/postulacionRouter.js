import express from "express";
import { validate } from "../middlewares/validate.js";
import {
  crearPostulacionSchema,
  resolverPostulacionSchema,
} from "../controllers/PostulacionController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

export function crearPostulacionRouter(postulacionController) {
  const router = express.Router({ mergeParams: true });

  router
    .route("/perfiles/:idPerfil/postulaciones")
    .post(requireAuth, validate(crearPostulacionSchema), (req, res) =>
      postulacionController.crear(req, res),
    );

  router
    .route("/postulaciones")
    .get(requireAuth, (req, res) =>
      postulacionController.obtenerPorProyecto(req, res),
    );

  router
    .route("/postulaciones/:idPostulacion")
    .patch(requireAuth, validate(resolverPostulacionSchema), (req, res) =>
      postulacionController.resolver(req, res),
    );

  router
    .route("/colaboraciones/:idColaborador")
    .delete(requireAuth, (req, res) =>
      postulacionController.darDeBaja(req, res),
    );

  return router;
}
