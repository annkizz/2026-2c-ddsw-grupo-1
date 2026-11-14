import { z } from "zod";
import { NotFoundError } from "../errors/AppError.js";
import { ProyectoService } from "../services/ProyectoService.js";

const fechaLimiteCierreSchema = z.coerce.date();

export const proyectoSchema = z
  .object({
    idColectivo: z.string().trim().min(1),
    titulo: z.string().trim().min(1),
    descripcion: z.string().trim().min(1),
    fechaLimiteCierre: fechaLimiteCierreSchema.optional(),
    busquedaAbierta: z.boolean().optional(),
    fechaLimiteBusqueda: z.coerce.date().nullable().optional(),
  })
  .strict();

export const cierreProgramadoSchema = z
  .object({
    fechaLimiteCierre: fechaLimiteCierreSchema,
  })
  .strict();

export const avanceSchema = z
  .object({
    porcentajeConcrecion: z.number().min(0).max(100).optional(),
    enlaceSistema: z.url({ protocol: /^https?$/ }).optional(),
    enlaceCodigoFuente: z.url({ protocol: /^https?$/ }).optional(),
  })
  .strict();

export class ProyectoController {
  constructor(proyectoService = new ProyectoService()) {
    this.proyectoService = proyectoService;
  }

  crear = async (req, res) => {
    const proyectoNuevo = await this.proyectoService.crear(req.body);
    res.status(201).json(proyectoNuevo);
  };

  obtenerTodos = async (req, res) => {
    const proyectos = await this.proyectoService.obtenerTodos();
    res.status(200).json(proyectos);
  };

  obtenerColaboracionesPublicas = async (req, res) => {
    const colaboraciones =
      await this.proyectoService.obtenerColaboracionesPublicas(
        req.params.idProyecto,
      );
    res.status(200).json(colaboraciones);
  };

  async programarCierre(req, res) {
    const proyecto = await this.proyectoService.programarCierre(
      req.params.idProyecto,
      req.body.fechaLimiteCierre,
    );
    res.status(200).json(proyecto);
  }

  async actualizarAvance(req, res) {
    const avance = await this.proyectoService.actualizarAvance(
      req.params.idProyecto,
      req.body,
    );
    res.status(200).json(avance);
  }

  async cerrarProyecto(req, res) {
    const proyectoId = req.params.idProyecto;
    const proyectoExistente =
      await this.proyectoService.obtenerProyectoPorId(proyectoId);

    if (!proyectoExistente) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }

    const proyectoCerrado =
      await this.proyectoService.cerrarProyecto(proyectoId);
    res.status(200).json(proyectoCerrado);
  }
}
