import mongoose from "mongoose";
import { NotificacionModel } from "../schemas/notificacionSchema.js";

export class NotificacionRepository {
  constructor(model = NotificacionModel) {
    this.model = model;
  }

  // filtro: { idColaborador?, idColectivo? }. Más nuevas primero.
  obtenerTodos(filtro = {}) {
    return this.model.find(filtro).sort({ fecha: -1 }).exec();
  }

  encontrarPorId(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return this.model.findById(id).exec();
  }

  save(notificacion) {
    const { id, ...datos } = notificacion;
    if (!id) {
      return new this.model(datos).save();
    }

    return this.model
      .findByIdAndUpdate(id, datos, {
        returnDocument: "after",
        runValidators: true,
      })
      .exec();
  }
}
