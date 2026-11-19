import express from "express";
import { validate } from "../middlewares/validate.js";
import {
  proyectoSchema,
  cierreProgramadoSchema,
  avanceSchema,
  proyectoEdicionSchema,
  busquedaSchema,
  destacarProyectoSchema,
} from "../controllers/ProyectoController.js";
import { crearPerfilRouter } from "./perfilRouter.js";
import { crearPostulacionRouter } from "./postulacionRouter.js";
import { requerirRol } from "../middlewares/authMiddleware.js";
import { Rol } from "../domain/Rol.js";

export function crearProyectoRouter(
  proyectoController,
  perfilController,
  postulacionController,
  autenticar,
) {
  const router = express.Router();

  router
    .route("/destacados")
    .get((req, res) => proyectoController.obtenerDestacados(req, res));

  router
    .route("/")
    .get((req, res) => proyectoController.obtenerTodos(req, res))
    .post(
      autenticar,
      requerirRol(Rol.COLECTIVO),
      validate(proyectoSchema),
      (req, res) => proyectoController.crear(req, res),
    );

  router
    .route("/ubicaciones")
    .get((req, res) => proyectoController.obtenerUbicaciones(req, res));

  router
    .route("/:idProyecto/colaboraciones")
    .get((req, res) =>
      proyectoController.obtenerColaboracionesPublicas(req, res),
    );

  router
    .route("/:idProyecto/destacado")
    .patch(
      requerirRol(Rol.ADMINISTRADOR),
      validate(destacarProyectoSchema),
      (req, res) => proyectoController.configurarDestacado(req, res),
    );

  router
    .route("/:idProyecto/cierre")
    .patch(autenticar, requerirRol(Rol.COLECTIVO), (req, res) =>
      proyectoController.cerrarProyecto(req, res),
    );

  router
    .route("/:idProyecto/cierre-programado")
    .patch(
      autenticar,
      requerirRol(Rol.COLECTIVO),
      validate(cierreProgramadoSchema),
      (req, res) => proyectoController.programarCierre(req, res),
    );

  router
    .route("/:idProyecto/avance")
    .patch(
      autenticar,
      requerirRol(Rol.COLECTIVO),
      validate(avanceSchema),
      (req, res) => proyectoController.actualizarAvance(req, res),
    );

  router
    .route("/:idProyecto")
    .get((req, res) => proyectoController.obtenerPorId(req, res))
    .put(
      autenticar,
      requerirRol(Rol.COLECTIVO),
      validate(proyectoEdicionSchema),
      (req, res) => proyectoController.actualizar(req, res),
    );

  router
    .route("/:idProyecto/busqueda")
    .put(
      autenticar,
      requerirRol(Rol.COLECTIVO),
      validate(busquedaSchema),
      (req, res) => proyectoController.configurarBusqueda(req, res),
    );

  if (postulacionController) {
    router.use(
      "/:idProyecto",
      crearPostulacionRouter(
        postulacionController,
        autenticar,
      ),
    );
  }

  router.use(
    "/:idProyecto/perfiles",
    crearPerfilRouter(perfilController, autenticar),
  );
    
  return router;
}
