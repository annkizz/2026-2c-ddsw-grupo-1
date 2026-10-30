import { HabilidadService } from "../services/HabilidadService.js";
import { z } from "zod";

export const habilidadSchema = z
  .object({
    titulo: z.string().trim().min(1),
    descripcion: z.string().trim().default(""),
  })
  .strict();

export class HabilidadController {
  constructor(habilidadService = new HabilidadService()) {
    this.habilidadService = habilidadService;
  }

  async crear(req, res) {
    const habilidadNueva = req.body;
    await this.habilidadService.crear(habilidadNueva);
    res.status(201).json({ message: "habilidad creada exitosamente :)" });
  }

  async obtenerTodos(req, res) {
    const habilidades = await this.habilidadService.obtenerTodos();
    res.status(200).json(habilidades);
  }
}
