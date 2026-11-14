import { z } from "zod";
import { EstadoPostulacion } from "../domain/EstadoPostulacion.js";
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

export class PostulacionController {
  constructor(postulacionService = new PostulacionService()) {
    this.postulacionService = postulacionService;
  }

  crear = async (req, res) => {
    const postulacion = await this.postulacionService.crear(
      req.params.idProyecto,
      req.params.idPerfil,
      req.body.esAnonima,
      req.auth,
    );
    res.status(201).json(postulacion);
  };

  obtenerPorProyecto = async (req, res) => {
    const postulaciones = await this.postulacionService.obtenerPorProyecto(
      req.params.idProyecto,
      req.auth,
    );
    res.status(200).json(postulaciones);
  };

  resolver = async (req, res) => {
    const postulacion = await this.postulacionService.resolver(
      req.params.idProyecto,
      req.params.idPostulacion,
      req.body.decision,
      req.auth,
    );
    res.status(200).json(postulacion);
  };

  darDeBaja = async (req, res) => {
    const colaboracion = await this.postulacionService.darDeBaja(
      req.params.idProyecto,
      req.params.idColaborador,
      req.auth,
    );
    res.status(200).json(colaboracion);
  };
}
