import { z } from "zod";
import { BadRequestError } from "../errors/AppError.js";
import { NotFoundError } from "../errors/AppError.js";
import { ProyectoService } from "../services/ProyectoService.js";

const fechaLimiteCierreSchema = z.coerce.date();

export const proyectoSchema = z
  .object({
    idColectivo: z.string().trim().min(1),
    titulo: z.string().trim().min(1),
    descripcion: z.string().trim().min(1),
    fechaLimiteCierre: fechaLimiteCierreSchema.optional(),
  })
  .strict();

export const idColaboradorSchema = z
  .object({
    idColaborador: z.string().trim().min(1),
  })
  .strict();

export const cierreProgramadoSchema = z
  .object({
    fechaLimiteCierre: fechaLimiteCierreSchema,
  })
  .strict();

export class ProyectoController {
  constructor(proyectoService = new ProyectoService()) {
    this.proyectoService = proyectoService;
  }

  crear = (req, res) => {
    const proyectoNuevo = this.proyectoService.crear(req.body);
    res.status(201).json(proyectoNuevo);
  };

  obtenerTodos = (req, res) => {
    const proyectos = this.proyectoService.obtenerTodos();
    res.status(200).json(proyectos);
  };

  programarCierre(req, res) {
    const proyecto = this.proyectoService.programarCierre(
      req.params.id,
      req.body.fechaLimiteCierre,
    );
    res.status(200).json(proyecto);
  }

  crearColaboracion(req, res) {
    const proyectoId = req.params.id;
    const proyectoExistente =
      this.proyectoService.obtenerProyectoPorId(proyectoId);

    if (!proyectoExistente) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }

    const body = req.body;
    const resultado = idColaboradorSchema.safeParse(body);

    if (!resultado.success) {
      throw new BadRequestError(
        "los datos ingresados son invalidos :(",
        "DATOS_COLABORACION_INVALIDOS",
      );
    }

    const colaboradorId = resultado.data.idColaborador;
    const colaboracion = this.proyectoService.crearColaboracion(
      proyectoExistente,
      colaboradorId,
    );

    res.status(201).json(colaboracion);
  }

  cerrarProyecto(req, res) {
    const proyectoId = req.params.id;
    const proyectoExistente =
      this.proyectoService.obtenerProyectoPorId(proyectoId);

    if (!proyectoExistente) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }

    const proyectoCerrado = this.proyectoService.cerrarProyecto(proyectoId);
    res.status(200).json(proyectoCerrado);
  }
}
