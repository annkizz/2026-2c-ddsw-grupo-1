import { HabilidadService } from "../services/HabilidadService.js"
import { BadRequestError } from "../errors/AppError.js"
import { z } from 'zod'

const habilidadSchema = z.object({
    titulo: z.string(),
}).strict()

export class HabilidadController {
    constructor(habilidadService = new HabilidadService()) {
        this.habilidadService = habilidadService;
    }

    crear(req, res) {
        const cuerpo = req.body
        const resultadoParseado = habilidadSchema.safeParse(cuerpo);
        if (!resultadoParseado.success) {
            throw new BadRequestError("los datos ingresados son invalidos :(");
        }
        const habilidadNueva = resultadoParseado.data;
        this.habilidadService.crear(habilidadNueva);
        res.status(201).json({ message: "habilidad creada exitosamente :)" });
    }

    obtenerTodos(req, res) {
        const habilidades = this.habilidadService.obtenerTodos();
        res.status(200).json(habilidades);
    }
}