import express from "express";
import { validate } from "../middlewares/validate.js";
import {
  proyectoSchema,
  cierreProgramadoSchema,
  avanceSchema,
} from "../controllers/ProyectoController.js";
import { crearPerfilRouter } from "./perfilRouter.js";
import { crearPostulacionRouter } from "./postulacionRouter.js";

export function crearProyectoRouter(
  proyectoController,
  perfilController,
  postulacionController,
  autenticar,
  contextoPostulaciones,
) {
  const router = express.Router();

  router
    .route("/")
    .get((req, res) => proyectoController.obtenerTodos(req, res))
    .post(validate(proyectoSchema), (req, res) =>
      proyectoController.crear(req, res),
    );

  router
    .route("/:idProyecto/colaboraciones")
    .get((req, res) =>
      proyectoController.obtenerColaboracionesPublicas(req, res),
    );

  router
    .route("/:idProyecto/cierre")
    .patch((req, res) => proyectoController.cerrarProyecto(req, res));

  router
    .route("/:idProyecto/cierre-programado")
    .patch(validate(cierreProgramadoSchema), (req, res) =>
      proyectoController.programarCierre(req, res),
    );

  router
    .route("/:idProyecto/avance")
    .patch(validate(avanceSchema), (req, res) =>
      proyectoController.actualizarAvance(req, res),
    );

  router.use(
    "/:idProyecto",
    crearPostulacionRouter(
      postulacionController,
      autenticar,
      contextoPostulaciones,
    ),
  );
  router.use("/:idProyecto/perfiles", crearPerfilRouter(perfilController));

  return router;
}
