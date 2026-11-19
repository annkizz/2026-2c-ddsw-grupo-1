import { z } from "zod";
import { ColaboradorService } from "../services/ColaboradorService.js";
import { medioDeContactoSchema } from "../schemas/zod/medioDeContactoSchema.js";
import { paginacionSchema } from "../schemas/zod/paginacionSchema.js";
import { BadRequestError } from "../errors/AppError.js";

export const colaboradorSchema = z
  .object({
    nombreFantasia: z.string().optional(),
    usuarioGitHub: z.string().optional(),
    nombre: z.string().optional(),
    apellido: z.string().optional(),
    presentacion: z.string().min(1).optional(),
    pronombres: z.array(z.string()).default([]),
    habilidades: z.array(z.string()).min(1),
    aceptaMensajeria: z.boolean().default(false),
    mediosDeContacto: z.array(medioDeContactoSchema).default([]),
  })
  .strict();

export class ColaboradorController {
  constructor(colaboradorService = new ColaboradorService()) {
    this.colaboradorService = colaboradorService;
  }

  async crear(req, res) {
    const colaboradorNuevo = await this.colaboradorService.crear(
      req.body,
      req.usuario,
    );
    res.status(201).json(this.toPrivateDTO(colaboradorNuevo));
  }

  async actualizar(req, res) {
    const colaborador = await this.colaboradorService.actualizar(
      req.params.id,
      req.body,
      req.usuario,
    );
    res.status(200).json(this.toPrivateDTO(colaborador));
  }

  async obtenerPorId(req, res) {
    const colaborador = await this.colaboradorService.obtenerPorIdOFallar(
      req.params.id,
    );
    res.status(200).json(this.toPublicDTO(colaborador));
  }

  // el perfil propio: incluye lo que no es publico (medios de contacto y consentimiento)
  async obtenerPropia(req, res) {
    const colaborador = await this.colaboradorService.obtenerPorUsuario(
      req.usuario,
    );
    res.status(200).json(this.toPrivateDTO(colaborador));
  }

  async obtenerMisColaboraciones(req, res) {
    const colaboraciones =
      await this.colaboradorService.obtenerMisColaboraciones(req.usuario);
    res.status(200).json(colaboraciones);
  }

  obtenerTodos = async (req, res) => {
    let pag = null;
    let limite = null;
    if (req.query.pag !== undefined || req.query.limite !== undefined) {
      const paginacion = paginacionSchema.safeParse(req.query);
      if (!paginacion.success) {
        throw new BadRequestError(
          "Los parámetros de paginación son inválidos",
          "PAGINACION_INVALIDA",
        );
      }
      pag = paginacion.data.pag;
      limite = paginacion.data.limite;
    }
    const colaboradores = await this.colaboradorService.obtenerTodos(pag, limite);
    if (pag === null) {
      res
        .status(200)
        .json(colaboradores.map((colaborador) => this.toPublicDTO(colaborador)));
      return;
    }
    res
      .status(200)
      .json({
        colaboradoras: colaboradores.colaboradores.map((colaborador) =>
          this.toPublicDTO(colaborador),
        ),
        total: colaboradores.total,
        pag: colaboradores.pag,
        totalPags: colaboradores.totalPags,
      });
  };

  toPublicDTO(colaborador) {
    return {
      id: String(colaborador._id),
      nombreFantasia: colaborador.nombreFantasia,
      usuarioGitHub: colaborador.usuarioGitHub,
      nombre: colaborador.nombre,
      apellido: colaborador.apellido,
      presentacion: colaborador.presentacion,
      pronombres: colaborador.pronombres,
      habilidades: colaborador.habilidades,
    };
  }

  toPrivateDTO(colaborador) {
    return {
      ...this.toPublicDTO(colaborador),
      aceptaMensajeria: colaborador.aceptaMensajeria,
      mediosDeContacto: (colaborador.mediosDeContacto ?? []).map((medio) => ({
        tipoDeContacto: medio.tipoDeContacto,
        contacto: medio.contacto,
      })),
    };
  }
}
