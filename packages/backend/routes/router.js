import express from "express";
import { HabilidadController } from "../controllers/HabilidadController.js";
import { HabilidadService } from "../services/HabilidadService.js";
import { HabilidadRepository } from "../repositories/HabilidadRepository.js";
import { ProyectoController } from "../controllers/ProyectoController.js";
import { ProyectoService } from "../services/ProyectoService.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { crearHabilidadRouter } from "./habilidadRouter.js";
import { crearProyectoRouter } from "./proyectoRouter.js";
import { ColectivoController } from "../controllers/ColectivoController.js";
import { ColectivoService } from "../services/ColectivoService.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";
import { crearColectivoRouter } from "./colectivoRouter.js";
import { ColaboradorController } from "../controllers/ColaboradorController.js";
import { ColaboradorService } from "../services/ColaboradorService.js";
import { ColaboradorRepository } from "../repositories/ColaboradorRepository.js";
import { crearColaboradorRouter } from "./colaboradorRouter.js";
import { PerfilRepository } from "../repositories/PerfilRepository.js";
import { PerfilController } from "../controllers/PerfilController.js";
import { PerfilService } from "../services/PerfilService.js";
import { crearPerfilRouter } from "./perfilRouter.js";
import { MatchingController } from "../controllers/MatchingController.js";
import { MatchingService } from "../services/MatchingService.js";
import { crearMatchingRouter } from "./matchingRouter.js";
export { proyectoService };

const router = express.Router();
const habilidadRepository = new HabilidadRepository();
const habilidadService = new HabilidadService(habilidadRepository);
const habilidadController = new HabilidadController(habilidadService);

const colectivoRepository = new ColectivoRepository();
const colectivoService = new ColectivoService(colectivoRepository);
const colectivoController = new ColectivoController(colectivoService);

const colaboradorRepository = new ColaboradorRepository();
const colaboradorService = new ColaboradorService(
  colaboradorRepository,
  habilidadRepository,
);
const colaboradorController = new ColaboradorController(colaboradorService);

const proyectoRepository = new ProyectoRepository();

const proyectoService = new ProyectoService(
  proyectoRepository,
  habilidadRepository,
  colaboradorService,
  colectivoRepository,
);
const proyectoController = new ProyectoController(proyectoService);

const perfilRepository = new PerfilRepository();
const perfilService = new PerfilService(perfilRepository, proyectoRepository, habilidadRepository)
const perfilController = new PerfilController(perfilService);

const matchingService = new MatchingService(
  colaboradorRepository,
  proyectoRepository,
  perfilRepository,
);
const matchingController = new MatchingController(matchingService);

router.use("/habilidades", crearHabilidadRouter(habilidadController));
router.use("/proyectos/:id/perfiles", crearPerfilRouter(perfilController));
router.use("/proyectos", crearProyectoRouter(proyectoController));
router.use("/colectivos", crearColectivoRouter(colectivoController));
router.use("/colaboradoras", crearColaboradorRouter(colaboradorController));
router.use(crearMatchingRouter(matchingController));

export default router;
