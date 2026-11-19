import { NotificacionService } from "../services/NotificacionService.js";
import { BadRequestError } from "../errors/AppError.js";
import { notificacionFiltroSchema } from "../schemas/zod/notificacionSchema.js";

export class NotificacionController {
  constructor(notificacionService = new NotificacionService()) {
    this.notificacionService = notificacionService;
  }

  crear = async (req, res) => {
    const nuevaNotificacion = await this.notificacionService.crear(
      req.body,
      req.usuario,
    );
    res.status(201).json(nuevaNotificacion);
  };

  obtenerTodos = async (req, res) => {
    const resultado = notificacionFiltroSchema.safeParse(req.query);
    if (!resultado.success) {
      throw new BadRequestError(
        "los filtros son inválidos",
        "FILTROS_INVALIDOS",
      );
    }

    const notificaciones = await this.notificacionService.obtenerTodos(
      resultado.data,
    );
    res.status(200).json(notificaciones);
  };
 
  obtenerTodosPaginado = async (req, res) => {
    const pag = Number(req.query.pag) || 1;
    const limite = Number(req.query.limite) || 10;

    const notificaciones = await this.notificacionService.obtenerTodosPaginado(
      req.usuario._id,
      pag,
      limite,
    );
    res.status(200).json(notificaciones);
  };  

  obtenerTodosPorColaboradora = async (req, res) => {
    const pag = Number(req.query.pag) || 1;
    const limite = Number(req.query.limite) || 10; // Default
    const idColaboradora = req.params.id;

    const notificaciones = await this.notificacionService.obtenerTodosPorColaboradora(
      idColaboradora,
      pag,
      limite,
      req.usuario._id,
    );
    
    res.status(200).json(notificaciones);    
  }

  obtenerPorId = async (req, res) => {
    const notificacion = await this.notificacionService.obtenerPorId(
      req.params.id,
      req.usuario._id,
    );
    res.status(200).json(notificacion);
  };
}
