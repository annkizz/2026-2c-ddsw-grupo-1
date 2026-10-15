import express from "express";

export function crearMatchingRouter(matchingController) {
  const router = express.Router();

  router.get("/proyectos/:id/perfiles/:idPerfil/colaboradoras", (req, res) =>
    matchingController.buscarColaboradoras(req, res),
  );

  router.get("/colaboradoras/:id/proyectos", (req, res) =>
    matchingController.buscarProyectos(req, res),
  );

  return router;
}
