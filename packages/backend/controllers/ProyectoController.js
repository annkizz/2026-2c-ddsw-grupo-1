import { z } from "zod";
import { BadRequestError } from "../errors/AppError.js";
import { ProyectoService } from "../services/ProyectoService.js";

const proyectoSchema = z
  .object({
    id_colectivo: z.string().trim().min(1),
    titulo: z.string().trim().min(1),
    descripcion: z.string().trim().min(1),
    habilidades: z.array(z.string().trim().min(1)).min(1),
    compromiso: z.object({
      tipoCompromiso: z.enum(["TOTALES", "SEMANALES", "MENSUALES"]),
      horas: z.number().positive(),
    }),
    modalidadColaboracion: z
      .array(z.enum(["GRATUITA", "INCENTIVO", "CONTRATACION"]))
      .min(1),
  })
  .strict();

export class ProyectoController {
  constructor(proyectoService = new ProyectoService()) {
    this.proyectoService = proyectoService;
  }

  crear(req, res) {
    const resultadoParseado = proyectoSchema.safeParse(req.body);

    if (!resultadoParseado.success) {
      throw new BadRequestError("los datos ingresados son invalidos :(");
    }

    const proyectoNuevo = this.proyectoService.crear(resultadoParseado.data);
    res.status(201).json(proyectoNuevo);
  }

  obtenerTodos(req, res) {
    const proyectos = this.proyectoService.obtenerTodos();
    res.status(200).json(proyectos);
  }
}
