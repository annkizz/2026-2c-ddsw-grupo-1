import { z } from "zod";
import { BadRequestError } from "../errors/AppError.js";
import { ColaboradorService } from "../services/ColaboradorService.js"

const colaborador = z.object({
    nombreFantasia: z.string().optional(),
    usuarioGitHub: z.string().optional(),
    nombre: z.string().optional(),
    apellido: z.string().optional(),
    presentacion: z.string().min(1),
    pronombres: z.string().min(1),
    proyectos: z.array(z.string()).min(0),
    habilidades: z.array(z.string()).min(1),
}).strict();

export class ColaboradorController {
    constructor(colaboradorService = new ColaboradorService()){
        this.colaboradorService = colaboradorService;
    }

crear(req, res) {
    const resultadoParseado = colaborador.safeParse(req.body);
    
    if(!resultadoParseado.success){
        throw new BadRequestError("datos invalidos")
    }

    const colaboradorNuevo = this.colaboradorService.crear(resultadoParseado.data);
    res.status(201).json(colaboradorNuevo)
    }

    obtenerTodos = (req,res) => {
        const colaboradores = this.colaboradorService.obtenerTodos();
        res.status(200).json(colaboradores)
    }
}