import { z } from "zod";
import { ETIQUETA_MAX, ETIQUETAS_MAX } from "../domain/etiquetas.js";
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
    // req 34: lista opcional etiquetas
    etiquetas: z
      .array(z.string().min(1).max(ETIQUETA_MAX))
      .max(ETIQUETAS_MAX)
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
const valores = req.query.etiqueta;
    let lista = [];
    if (valores !== undefined) {
      lista = Array.isArray(valores) ? valores : [valores];
    }
    const filtros = lista.length > 0 ? { etiquetas: lista } : {};
    const colectivos = await this.colectivoService.obtenerTodos(filtros);
    res.status(200).json(colectivos);
  }
}
