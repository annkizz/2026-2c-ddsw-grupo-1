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

const idColaboradorSchema = z
  .object({
    id_colaborador: z.string().trim().min(1)
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

  obtenerTodos = (req, res) => {
    const proyectos = this.proyectoService.obtenerTodos();
    res.status(200).json(proyectos);
  }
 
  crearColaboracion(req, res) {
    const proyectoId = req.params.id ;

    const body = req.body ;
    const resultado = idColaboradorSchema.safeParse(body)
    

    const proyectoExistente = this.proyectoService.obtenerProyectoPorId(proyectoId) ;

    if(!proyectoExistente){
      //throw new NotFoundException('Proyecto no encontrado');
      res.status(404).json({error: "Proyecto no Encontrado."})
      return;
    }

    if (!resultado.success) {
      throw new BadRequestError("los datos ingresados son invalidos :(");
    }
    const colaboradorId = resultado.data.id_colaborador;
    
    const colaboracion = this.proyectoService.crearColaboracion(proyectoExistente,colaboradorId)
    res.status(201).json(colaboracion);

  } 
}
