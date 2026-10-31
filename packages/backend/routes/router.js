import express from "express";
import { HabilidadController } from "../controllers/HabilidadController.js";
import { HabilidadService } from "../services/HabilidadService.js";
import { HabilidadRepository } from "../repositories/HabilidadRepository.js";
import { ProyectoController } from "../controllers/ProyectoController.js";
import { ProyectoService } from "../services/ProyectoService.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { ColaboracionRepository } from "../repositories/ColaboracionRepository.js";
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
import { MatchingController } from "../controllers/MatchingController.js";
import { MatchingService } from "../services/MatchingService.js";
import { crearMatchingRouter } from "./matchingRouter.js";
export { proyectoService };
import { LogroRepository } from "../repositories/LogroRepository.js";
import { LogroService } from "../services/LogroService.js";
import { LogroController } from "../controllers/LogroController.js";
import { crearLogroRouter } from "./logroRouter.js";
import { NotificacionRepository } from "../repositories/NotificacionRepository.js";
import { NotificacionService } from "../services/NotificacionService.js";
import { NotificacionController } from "../controllers/NotificacionController.js";
import { crearNotificacionRouter } from "./notificacionRouter.js";
import { UsuarioRepository } from "../repositories/UsuarioRepository.js";
import { UsuarioService } from "../services/UsuarioService.js";
import { UsuarioController } from "../controllers/UsuarioController.js";
import { crearUsuarioRouter } from "./usuarioRouter.js";
import {
  crearAutenticar,
  crearVerificadorLogto,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

const usuarioRepository = new UsuarioRepository();
const autenticar = crearAutenticar(usuarioRepository, crearVerificadorLogto());
// consultar es publico; crear, modificar o borrar requiere haber iniciado sesion
const autenticarSiModifica = (req, res, next) =>
  ["GET", "HEAD", "OPTIONS"].includes(req.method)
    ? next()
    : autenticar(req, res, next);

const habilidadRepository = new HabilidadRepository();
const habilidadService = new HabilidadService(habilidadRepository);
const habilidadController = new HabilidadController(habilidadService);

const colectivoRepository = new ColectivoRepository();
const colaboradorRepository = new ColaboradorRepository();
const usuarioService = new UsuarioService(
  usuarioRepository,
  colectivoRepository,
  colaboradorRepository,
);
const usuarioController = new UsuarioController(usuarioService);

const colectivoService = new ColectivoService(
  colectivoRepository,
  usuarioService,
);
const colectivoController = new ColectivoController(colectivoService);

const colaboradorService = new ColaboradorService(
  colaboradorRepository,
  habilidadRepository,
  usuarioService,
);
const colaboradorController = new ColaboradorController(colaboradorService);

const proyectoRepository = new ProyectoRepository();
const colaboracionRepository = new ColaboracionRepository();

const proyectoService = new ProyectoService(
  proyectoRepository,
  habilidadRepository,
  colaboradorService,
  colectivoRepository,
  colaboracionRepository,
);
const proyectoController = new ProyectoController(proyectoService);

const perfilRepository = new PerfilRepository();
const perfilService = new PerfilService(
  perfilRepository,
  proyectoRepository,
  habilidadRepository,
);
const perfilController = new PerfilController(perfilService);

const logroRepository = new LogroRepository();
const logroService = new LogroService(logroRepository, proyectoRepository);
const logroController = new LogroController(logroService);

const notificacionRepository = new NotificacionRepository();
const notificacionService = new NotificacionService(
  notificacionRepository,
  colectivoRepository,
  colaboradorRepository,
);
const notificacionController = new NotificacionController(notificacionService);

const matchingService = new MatchingService(
  colaboradorRepository,
  proyectoRepository,
  perfilRepository,
  colaboracionRepository,
);
const matchingController = new MatchingController(matchingService);

router.use("/me", crearUsuarioRouter(usuarioController, autenticar));
router.use(
  "/habilidades",
  autenticarSiModifica,
  crearHabilidadRouter(habilidadController),
);
// una sola vez para todo /proyectos (lo usan el router de proyectos y el de logros)
router.use("/proyectos", autenticarSiModifica);
router.use(
  "/proyectos",
  crearProyectoRouter(proyectoController, perfilController),
);
router.use(
  "/colectivos",
  crearColectivoRouter(colectivoController, autenticar),
);
router.use(
  "/colaboradoras",
  crearColaboradorRouter(colaboradorController, autenticar),
);
router.use("/proyectos", crearLogroRouter(logroController));
// los mensajes internos son siempre privados
router.use(
  "/notificaciones",
  autenticar,
  crearNotificacionRouter(notificacionController),
);
router.use(crearMatchingRouter(matchingController));

export default router;
