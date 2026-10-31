import express from "express";
import { validate } from "../middlewares/validate.js";
import { requerirRol } from "../middlewares/authMiddleware.js";
import { Rol } from "../domain/Rol.js";
import { colaboradorSchema } from "../controllers/ColaboradorController.js";

export function crearColaboradorRouter(colaboradorController, autenticar) {
  const router = express.Router();

  router
    .route("/")
    .get((req, res) => colaboradorController.obtenerTodos(req, res))
    .post(autenticar, validate(colaboradorSchema), (req, res) =>
      colaboradorController.crear(req, res),
    );

  // va antes de "/:id" para que "me" no se interprete como un id
  router
    .route("/me")
    .get(autenticar, requerirRol(Rol.COLABORADOR), (req, res) =>
      colaboradorController.obtenerPropia(req, res),
    );

  router
    .route("/:id")
    .get((req, res) => colaboradorController.obtenerPorId(req, res))
    .put(
      autenticar,
      requerirRol(Rol.COLABORADOR),
      validate(colaboradorSchema),
      (req, res) => colaboradorController.actualizar(req, res),
    );

  return router;
}
