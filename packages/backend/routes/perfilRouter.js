import express from "express";
import { validate } from "../middlewares/validate.js";
import { perfilSchema } from "../controllers/PerfilController.js";

export function crearPerfilRouter(perfilController) {
  const router = express.Router({ mergeParams: true });

  router
    .route("/")
    .get((req, res) => perfilController.obtener(req, res))
    .post(validate(perfilSchema), (req, res) =>
      perfilController.crear(req, res),
    );

  router
    .route("/:idPerfil")
    .delete((req, res) => perfilController.eliminar(req, res))
    .put(validate(perfilSchema), (req, res) =>
      perfilController.actualizar(req, res),
    )
    .get((req, res) => perfilController.obtenerPorId(req, res));

  return router;
}
