import { NotificacionService } from "../services/NotificacionService.js";
import { BadRequestError } from "../errors/AppError.js";
import { notificacionPaginasSchema } from "../schemas/zod/notificacionSchema.js";

export class NotificacionController {
  constructor(notificacionService = new NotificacionService()) {
    this.notificacionService = notificacionService;
  }

  crear = async (req, res) => {
    const notificacion = await this.notificacionService.crear(
      req.body,
      req.usuario,
    );
    res.status(201).json(notificacion);
  };

  obtenerTodosPaginado = async (req, res) => {
    const pagina = notificacionPaginasSchema.safeParse(req.query);
    if (!pagina.success) {
      throw new BadRequestError(
        "Los parámetros de paginación son inválidos",
        "PAGINACION_INVALIDA",
      );
    }

    const resultado = await this.notificacionService.obtenerTodosPaginado(
      req.usuario,
      pagina.data.pag,
      pagina.data.limite,
    );
    res.status(200).json(resultado);
  };

  obtenerTodosPorColaboradora = async (req, res) => {
    const pagina = notificacionPaginasSchema.safeParse(req.query);
    if (!pagina.success) {
      throw new BadRequestError(
        "Los parámetros de paginación son inválidos",
        "PAGINACION_INVALIDA",
      );
    }

    const resultado =
      await this.notificacionService.obtenerTodosPorColaboradora(
        req.params.id,
        pagina.data.pag,
        pagina.data.limite,
        req.usuario,
      );
    res.status(200).json(resultado);
  };

  obtenerPorId = async (req, res) => {
    const notificacion = await this.notificacionService.obtenerPorId(
      req.params.id,
      req.usuario,
    );
    res.status(200).json(notificacion);
  };
}
