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
    esAnonima: z.boolean().default(false),
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
    const colaboraciones = await this.proyectoService.obtenerColaboracionesPublicas(
      req.params.id,
    );
    res.status(200).json(colaboraciones);
  };

  async programarCierre(req, res) {
    const proyecto = await this.proyectoService.programarCierre(
      req.params.id,
      req.body.fechaLimiteCierre,
    );
    res.status(200).json(proyecto);
  }

  async crearColaboracion(req, res) {
    const proyectoId = req.params.id;
    const proyectoExistente = await this.proyectoService.obtenerProyectoPorId(
      proyectoId,
    );

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
    const { esAnonima } = resultado.data;
    const colaboracion = await this.proyectoService.crearColaboracion(
      proyectoExistente,
      colaboradorId,
      esAnonima,
    );

    res.status(201).json(
      this.proyectoService.toContribucionPublica(colaboracion),
    );
  }

  async actualizarAvance(req, res) {
    const avance = await this.proyectoService.actualizarAvance(
      req.params.id,
      req.body,
    );
    res.status(200).json(avance);
    }

  async cerrarProyecto(req, res) {
    const proyectoId = req.params.id;
    const proyectoExistente = await this.proyectoService.obtenerProyectoPorId(
      proyectoId,
    );

    if (!proyectoExistente) {
      throw new NotFoundError(
        "Proyecto no encontrado",
        "PROYECTO_NO_ENCONTRADO",
      );
    }

    const proyectoCerrado = await this.proyectoService.cerrarProyecto(proyectoId);
    res.status(200).json(proyectoCerrado);

    
  }
}
