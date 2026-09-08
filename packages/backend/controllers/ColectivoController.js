import { z } from "zod";
import { BadRequestError } from "../errors/AppError.js";
import { ColectivoService } from "../services/ColectivoService.js";

const colectivoSchema = z
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

  crear(req, res) {
    const resultadoParseado = colectivoSchema.safeParse(req.body);
    if (!resultadoParseado.success) {
      throw new BadRequestError("los datos ingresados son inválidos :(");
    }
    const colectivoNuevo = this.colectivoService.crear(resultadoParseado.data);
    res.status(201).json(colectivoNuevo);
  }

  obtenerTodos(req, res) {
    const colectivos = this.colectivoService.obtenerTodos();
    res.status(200).json(colectivos);
  }
}
