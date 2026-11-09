import express from "express";

export function crearEtiquetasRouter(etiquetaController) {
  const router = express.Router();

  router
    .route("/")
    .get((req, res) => etiquetaController.obtenerTodas(req, res));

  return router;
}
