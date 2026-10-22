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

  async obternerTodosPaginado(pag, limite) {
    const skipN = (pag - 1) * limite;

    // Se puede hacer una query que incluya el dato del total de documentos
    const notificaciones = await this.model.find({}).skip(skipN).limit(limite);

    const total = await this.model.countDocuments({});

    return {notificaciones, total, pag, totalPags: Math.ceil(total/limite)} ;


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
      .findByIdAndUpdate(
        id,
        {
          $set: datos,
        },
        {
          returnDocument: "after",
          runValidators: true,
        },
      )
      .exec();
  }
}
