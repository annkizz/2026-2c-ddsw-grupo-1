import { z } from "zod";
import { BadRequestError } from "../errors/AppError.js";
import { ColaboradorService } from "../services/ColaboradorService.js"

export const colaboradorSchema = z.object({
    nombreFantasia: z.string().optional(),
    usuarioGitHub: z.string().optional(),
    nombre: z.string().optional(),
    apellido: z.string().optional(),
    presentacion: z.string().min(1),
    pronombres:  z.array((z.string())).min(1),
    habilidades: z.array(z.string()).min(1),
}).strict();

export class ColaboradorController {
    constructor(colaboradorService = new ColaboradorService()){
        this.colaboradorService = colaboradorService;
    }

crear(req, res) {
    const colaboradorNuevo = this.colaboradorService.crear(req.body);
    res.status(201).json(colaboradorNuevo)
    }

obtenerTodos = (req,res) => {
        const colaboradores = this.colaboradorService.obtenerTodos();
        res.status(200).json(colaboradores)
    }
}