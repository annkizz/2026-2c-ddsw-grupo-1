import { z } from "zod";
import { EstadoPostulacion } from "../domain/EstadoPostulacion.js";
import { Rol } from "../domain/Rol.js";
import { ForbiddenError } from "../errors/AppError.js";
import { UsuarioService } from "../services/UsuarioService.js";
import { PostulacionService } from "../services/PostulacionService.js";

export const crearPostulacionSchema = z
  .object({
    esAnonima: z.boolean().default(false),
  })
  .strict();

export const resolverPostulacionSchema = z
  .object({
    decision: z.enum([EstadoPostulacion.ACEPTADA, EstadoPostulacion.RECHAZADA]),
  })
  .strict();

export const crearInvitacionSchema = z
  .object({
    idColaborador: z.string().trim().regex(/^[\da-f]{24}$/i),
  })
  .strict();

export class PostulacionController {
  constructor(
    postulacionService = new PostulacionService(),
    usuarioService = new UsuarioService(),
  ) {
    this.postulacionService = postulacionService;
    this.usuarioService = usuarioService;
  }

  async obtenerActor(req) {
    const sesion = await this.usuarioService.obtenerSesion(req.usuario);
    let id = null;
    if (sesion.rol === Rol.COLECTIVO) {
      id = sesion.idColectivo;
    } else if (sesion.rol === Rol.COLABORADOR) {
      id = sesion.idColaborador;
    }

    if (!id) {
      throw new ForbiddenError(
        "El usuario debe registrar un perfil para realizar esta acción",
        "PERFIL_REQUERIDO",
      );
    }

    return { rol: sesion.rol, id };
  }

  crear = async (req, res) => {
    const actor = await this.obtenerActor(req);
    const postulacion = await this.postulacionService.crear(
      req.params.idProyecto,
      req.params.idPerfil,
      req.body.esAnonima,
      actor,
    );
    res.status(201).json(postulacion);
  };

  invitar = async (req, res) => {
    const actor = await this.obtenerActor(req);
    const invitacion = await this.postulacionService.invitar(
      req.params.idProyecto,
      req.params.idPerfil,
      req.body.idColaborador,
      actor,
    );
    res.status(201).json(invitacion);
  };

  obtenerPorProyecto = async (req, res) => {
    const actor = await this.obtenerActor(req);
    const postulaciones = await this.postulacionService.obtenerPorProyecto(
      req.params.idProyecto,
      actor,
    );
    res.status(200).json(postulaciones);
  };

  obtenerColaboracionesParaGestion = async (req, res) => {
    const actor = await this.obtenerActor(req);
    const colaboraciones = await this.postulacionService.obtenerColaboracionesParaGestion(
      req.params.idProyecto,
      actor,
    );
    res.status(200).json(colaboraciones);
  };

  resolver = async (req, res) => {
    const actor = await this.obtenerActor(req);
    const postulacion = await this.postulacionService.resolver(
      req.params.idProyecto,
      req.params.idPostulacion,
      req.body.decision,
      actor,
    );
    res.status(200).json(postulacion);
  };

  darDeBaja = async (req, res) => {
    const actor = await this.obtenerActor(req);
    const colaboracion = await this.postulacionService.darDeBaja(
      req.params.idProyecto,
      req.params.idColaborador,
      actor,
    );
    res.status(200).json(colaboracion);
  };
}
