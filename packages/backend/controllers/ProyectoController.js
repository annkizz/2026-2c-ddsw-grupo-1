import { z } from "zod";
import { BadRequestError } from "../errors/AppError.js";
import { NotFoundError } from "../errors/AppError.js";
import { ETIQUETA_MAX, ETIQUETAS_MAX } from "../domain/etiquetas.js";
import { ProyectoService } from "../services/ProyectoService.js";

const fechaLimiteCierreSchema = z.coerce.date();

export const proyectoSchema = z
  .object({
    idColectivo: z.string().trim().min(1),
    titulo: z.string().trim().min(1),
    descripcion: z.string().trim().min(1),
    fechaLimiteCierre: fechaLimiteCierreSchema.optional(),
    // req 34: lista opcional etiquetas
    etiquetas: z
      .array(z.string().min(1).max(ETIQUETA_MAX))
      .max(ETIQUETAS_MAX)
      .optional(),
    // req 15
    ubicacion: z
      .object({
        provincia: z.string().trim().min(1),
        ciudad: z.string().trim().min(1).optional(),
      })
      .strict()
      .optional(),
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

const primerValor = (valor) => (Array.isArray(valor) ? valor[0] : valor);
const valoresComoLista = (valor) => {
  if (valor === undefined) return [];
  return Array.isArray(valor) ? valor : [valor];
};

export class ProyectoController {
  constructor(proyectoService = new ProyectoService()) {
    this.proyectoService = proyectoService;
  }

  crear = async (req, res) => {
    const proyectoNuevo = await this.proyectoService.crear(req.body);
    res.status(201).json(proyectoNuevo);
  };

  obtenerTodos = async (req, res) => {
    const etiquetas = valoresComoLista(req.query.etiqueta);
    const filtros = etiquetas.length > 0 ? { etiquetas } : {};
    if (req.query.provincia !== undefined) {
      filtros.provincia = primerValor(req.query.provincia);
    }
    if (req.query.estado !== undefined) {
      filtros.estado = primerValor(req.query.estado);
    }
    if (req.query.idColectivo !== undefined) {
      filtros.idColectivo = primerValor(req.query.idColectivo);
    }
    if (req.query.habilidad !== undefined) {
      filtros.habilidades = valoresComoLista(req.query.habilidad);
    }
    const proyectos = await this.proyectoService.obtenerTodos(filtros);
    res.status(200).json(proyectos);
  };

  obtenerUbicaciones = async (req, res) => {
    const nivel = primerValor(req.query.nivel);
    const ubicaciones = await this.proyectoService.obtenerUbicaciones(nivel);
    res.status(200).json(ubicaciones);
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

  async crearColaboracion(req, res) {
    const proyectoId = req.params.idProyecto;
    const proyectoExistente =
      await this.proyectoService.obtenerProyectoPorId(proyectoId);

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
        "los datos ingresados son invalidos",
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

    res
      .status(201)
      .json(this.proyectoService.toContribucionPublica(colaboracion));
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
