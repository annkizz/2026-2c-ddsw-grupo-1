import { NotificacionModel } from "../schemas/notificacionSchema.js";

export class NotificacionRepository {
  constructor(model = NotificacionModel) {
    this.model = model;
  }

  obtenerTodos() {
    return this.model.find().exec();
  }

  encontrarPorId(id) {
    return this.model.findOne({ idNotificacion: id }).exec();
  }

  save(unaNotificacion) {
    return this.model.findOneAndUpdate(
      { idNotificacion: unaNotificacion.idNotificacion },
      {
        $set: {
          fecha: unaNotificacion.fecha,
          contenido: unaNotificacion.contenido,
          colectivo: unaNotificacion.colectivo,
          colaborador: unaNotificacion.colaborador,
          medioDeContacto: unaNotificacion.medioDeContacto,
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).exec();
  }
}