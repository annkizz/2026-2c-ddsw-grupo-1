import express from "express"
import { HabilidadController } from "../controllers/HabilidadController.js"

const habilidadController = new HabilidadController()

const router = express.Router()

router.route("/")
    .get((req, res) => habilidadController.obtenerTodos(req, res))
    .post((req, res) => habilidadController.crear(req, res))
    .put((req, res) => habilidadController.actualizar(req, res)) // falta implementar ??

export default router