import { NotificacionModel } from "../schemas/notificacionSchema.js";

export class NotificacionRepository {
  constructor(model = NotificacionModel) {
    this.model = model;
  }

  // filtro: { idColaborador?, idColectivo? }. Más nuevas primero.
  obtenerTodos(filtro = {}) {
    return this.model.find(filtro).sort({ fecha: -1 }).exec();
  }

  encontrarPorId(idNotificacion) {
    return this.model.findOne({ idNotificacion }).exec();
  }

  save(unaNotificacion) {
    return this.model
      .findOneAndUpdate(
        { idNotificacion: unaNotificacion.idNotificacion },
        {
          $set: {
            fecha: unaNotificacion.fecha,
            contenido: unaNotificacion.contenido,
            idColectivo: unaNotificacion.idColectivo,
            idColaborador: unaNotificacion.idColaborador,
            envios: unaNotificacion.envios,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }
}
