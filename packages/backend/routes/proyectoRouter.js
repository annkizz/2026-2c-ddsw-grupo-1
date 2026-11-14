import express from "express";
import { validate } from "../middlewares/validate.js";
import {
  proyectoSchema,
  idColaboradorSchema,
  cierreProgramadoSchema,
  avanceSchema,
  proyectoEdicionSchema,
  busquedaSchema
} from "../controllers/ProyectoController.js";
import { crearPerfilRouter } from "./perfilRouter.js";

export function crearProyectoRouter(proyectoController, perfilController) {
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
    )
    .post(validate(idColaboradorSchema), (req, res) =>
      proyectoController.crearColaboracion(req, res),
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

    router
    .route("/:idProyecto")
    .get((req, res) => proyectoController.obtenerPorId(req, res))
    .put(validate(proyectoEdicionSchema), (req, res) =>
      proyectoController.actualizar(req, res),
    );

    router
    .route("/:idProyecto/busqueda")
    .put(validate(busquedaSchema), (req, res) =>
      proyectoController.configurarBusqueda(req, res),
    );

  router.use("/:idProyecto/perfiles", crearPerfilRouter(perfilController));

  return router;
}
