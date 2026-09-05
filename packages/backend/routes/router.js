import express from "express"
import { HabilidadController } from "../controllers/HabilidadController.js"
import { HabilidadService } from "../services/HabilidadService.js"
import { HabilidadRepository } from "../repositories/HabilidadRepository.js"
import { ProyectoController } from "../controllers/ProyectoController.js"
import { ProyectoService } from "../services/ProyectoService.js"
import { ProyectoRepository } from "../repositories/ProyectoRepository.js"
import { crearHabilidadRouter } from "./habilidadRouter.js"
import { crearProyectoRouter } from "./proyectoRouter.js"

const router = express.Router()
const habilidadRepository = new HabilidadRepository()
const habilidadService = new HabilidadService(habilidadRepository)
const habilidadController = new HabilidadController(habilidadService)
const proyectoService = new ProyectoService(
	new ProyectoRepository(),
	habilidadRepository,
)
const proyectoController = new ProyectoController(proyectoService)

router.use("/habilidades", crearHabilidadRouter(habilidadController));
router.use("/proyectos", crearProyectoRouter(proyectoController));

export default router