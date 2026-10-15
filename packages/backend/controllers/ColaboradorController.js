import { z } from "zod";
import { ColaboradorService } from "../services/ColaboradorService.js";
import { medioDeContactoSchema } from "../schemas/zod/medioDeContactoSchema.js";

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
    const colaboradorNuevo = await this.colaboradorService.crear(req.body);
    res.status(201).json(this.toPublicDTO(colaboradorNuevo));
  }

  obtenerTodos = async (req, res) => {
    const colaboradores = await this.colaboradorService.obtenerTodos();
    res
      .status(200)
      .json(colaboradores.map((colaborador) => this.toPublicDTO(colaborador)));
  };

  toPublicDTO(colaborador) {
    return {
      idColaborador: colaborador.idColaborador,
      nombreFantasia: colaborador.nombreFantasia,
      usuarioGitHub: colaborador.usuarioGitHub,
      nombre: colaborador.nombre,
      apellido: colaborador.apellido,
      presentacion: colaborador.presentacion,
      pronombres: colaborador.pronombres,
      habilidades: colaborador.habilidades,
    };
  }
}
