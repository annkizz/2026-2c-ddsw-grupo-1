import { NotificacionService } from "../services/NotificacionService";

export class NotificacionController {
  constructor(notificacionService = new NotificacionService()){
    this.notificacionService = notificacionService
  }

  crear(req, res){
    const nuevaNotificacion = this.notificacionService.crear(req.body);
    res.status(201).json(nuevaNotificacion);
  }
}