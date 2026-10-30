import { NotificacionService } from "../services/NotificacionService.js";
import { BadRequestError } from "../errors/AppError.js";
import { notificacionFiltroSchema, notificacionPaginasSchema } from "../schemas/zod/notificacionSchema.js";

export class NotificacionController {
  constructor(notificacionService = new NotificacionService()) {
    this.notificacionService = notificacionService;
  }

  crear = async (req, res) => {
    const nuevaNotificacion = await this.notificacionService.crear(req.body);
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
    const pag = req.query.pag;
    const limite = req.query.limite;
    /*
    if (!resultado.success) {
      throw new BadRequestError(
        "No se le enviaron los datos necesarios",
        "PAGINA_INVALIDA",
      );
    }*/

    const notificaciones = await this.notificacionService.obtenerTodosPaginado(
      pag, limite,
    );
    res.status(200).json(notificaciones);
  };  

  obtenerPorId = async (req, res) => {
    const notificacion = await this.notificacionService.obtenerPorId(
      req.params.id,
    );
    res.status(200).json(notificacion);
  };
}
