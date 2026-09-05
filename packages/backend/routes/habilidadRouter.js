import express from "express"

export function crearHabilidadRouter(habilidadController) {
    const router = express.Router()

    router.route("/")
    .get((req, res) => habilidadController.obtenerTodos(req, res))
    .post((req, res) => habilidadController.crear(req, res))
    .put((req, res) => habilidadController.actualizar(req, res)) // falta implementar ??

    return router
}