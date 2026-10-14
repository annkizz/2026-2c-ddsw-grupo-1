import { z } from "zod";
import { BadRequestError } from "../errors/AppError.js";
import { ColaboradorService } from "../services/ColaboradorService.js";




export const colaboradorSchema = z
  .object({
    nombreFantasia: z.string().optional(),
    usuarioGitHub: z.string().optional(),
    nombre: z.string().optional(),
    apellido: z.string().optional(),
    presentacion: z.string().min(1).optional(),
    pronombres: z.array(z.string()).optional(),
    habilidades: z.array(z.string()).min(1),
    aceptaMensajeria: z.boolean(),
    mediosDeContacto: z.array(medioDeContactoSchema).default([]),
  })
  .strict();

export class ColaboradorController {
  constructor(colaboradorService = new ColaboradorService()) {
    this.colaboradorService = colaboradorService;
  }

async crear(req, res) {
    const colaboradorNuevo = await this.colaboradorService.crear(req.body);
    res.status(201).json(colaboradorNuevo);
  }

  obtenerTodos = async (req, res) => {
    const colaboradores = await this.colaboradorService.obtenerTodos();
    res.status(200).json(colaboradores);
  };
}
