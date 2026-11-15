import express from "express";

export function crearUsuarioRouter(usuarioController, autenticar) {
  const router = express.Router();

  router.get("/", autenticar, (req, res) =>
    usuarioController.obtenerSesion(req, res),
  );

  return router;
}
