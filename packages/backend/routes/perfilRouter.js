import express from "express";
import { validate } from "../middlewares/validate.js";
import { perfilSchema } from "../controllers/PerfilController.js";
import { requerirRol } from "../middlewares/authMiddleware.js";
import { Rol } from "../domain/Rol.js";

export function crearPerfilRouter(perfilController, autenticar) {
  const router = express.Router({ mergeParams: true });

  router
    .route("/")
    .get((req, res) => perfilController.obtener(req, res))
    .post(
      autenticar,
      requerirRol(Rol.COLECTIVO),
      validate(perfilSchema),
      (req, res) => perfilController.crear(req, res),
    );

  router
    .route("/:id")
    .delete(
      autenticar,
      requerirRol(Rol.COLECTIVO),
      (req, res) => perfilController.eliminar(req, res),
    )
    .put(
      autenticar,
      requerirRol(Rol.COLECTIVO),
      validate(perfilSchema),
      (req, res) => perfilController.actualizar(req, res),
    )
    .get((req, res) => perfilController.obtenerPorId(req, res));

  return router;
}
