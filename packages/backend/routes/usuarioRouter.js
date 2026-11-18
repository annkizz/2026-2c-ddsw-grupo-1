import express from "express";

export function crearUsuarioRouter(usuarioController, autenticar) {
  const router = express.Router();

  router.get("/me", autenticar, (req, res) =>
    usuarioController.obtenerSesion(req, res),
  );

  return router;
}
