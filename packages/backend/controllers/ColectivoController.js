import { z } from "zod";
import { ColectivoService } from "../services/ColectivoService.js";

export const colectivoSchema = z
  .object({
    nombre: z.string(),
    descripcion: z.string(),
    tipoDeColectivo: z.enum([
      "FUNDACIONES",
      "ASOCIACIONES_BARRIALES",
      "ONG",
      "ASAMBLEA",
    ]),
    ubicacion: z
      .object({
        pais: z.string().optional(),
        provincia: z.string().optional(),
        ciudad: z.string().optional(),
      })
      .optional(),
  })
  .strict();

export class ColectivoController {
  constructor(colectivoService = new ColectivoService()) {
    this.colectivoService = colectivoService;
  }

  async crear(req, res) {
    const colectivoNuevo = await this.colectivoService.crear(req.body);
    res.status(201).json(colectivoNuevo);
  }

  async obtenerTodos(req, res) {
    const colectivos = await this.colectivoService.obtenerTodos();
    res.status(200).json(colectivos);
  }
}
