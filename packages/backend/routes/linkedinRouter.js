import express from "express";
import { validate } from "../middlewares/validate.js";
import { requerirRol } from "../middlewares/authMiddleware.js";
import { Rol } from "../domain/Rol.js";
import { conexionSchema } from "../controllers/LinkedinController.js";

export function crearLinkedInRouter(controller) {
  const router = express.Router();
  router.use(requerirRol(Rol.COLECTIVO));

  router.get("/estado", (req, res) => controller.obtenerEstado(req, res));
  router.post("/autorizacion", (req, res) => controller.iniciarAutorizacion(req, res));
  router
    .route("/conexion")
    .post(validate(conexionSchema), (req, res) => controller.conectar(req, res))
    .delete((req, res) => controller.desconectar(req, res));

  return router;
}