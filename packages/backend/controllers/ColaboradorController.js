import { z } from "zod";
import { ColaboradorService } from "../services/ColaboradorService.js";

export const colaboradorSchema = z
  .object({
    nombreFantasia: z.string().optional(),
    usuarioGitHub: z.string().optional(),
    nombre: z.string().optional(),
    apellido: z.string().optional(),
    presentacion: z.string().min(1),
    pronombres: z.array(z.string()).min(1),
    habilidades: z.array(z.string()).min(1),
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

  obtenerTodos = (req, res) => {
    return this.colaboradorService.obtenerTodos().then((colaboradores) => {
      res.status(200).json(colaboradores);
    });
  };
}
