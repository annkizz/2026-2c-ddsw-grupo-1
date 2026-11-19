import mongoose from "mongoose";
import { NotificacionModel } from "../schemas/notificacionSchema.js";

export class NotificacionRepository {
  constructor(model = NotificacionModel) {
    this.model = model;
  }

  async obtenerTodosPaginado(filtro, pag, limite) {
    const skip = (pag - 1) * limite;
    const [notificaciones, total] = await Promise.all([
      this.model
        .find(filtro)
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limite)
        .exec(),
      this.model.countDocuments(filtro).exec(),
    ]);

    return {
      notificaciones,
      total,
      pag,
      totalPags: Math.ceil(total / limite),
    };
  }

  obtenerTodosPorColaboradora(id, pag, limite) {
    return this.obtenerTodosPaginado({ idColaborador: id }, pag, limite);
  }

  buscarPorId(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return this.model.findById(id).exec();
  }

  save(notificacion) {
    const datos = {
      fecha: notificacion.fecha,
      contenido: notificacion.contenido,
      idColectivo: notificacion.idColectivo,
      idColaborador: notificacion.idColaborador,
      envios: notificacion.envios,
      leida: notificacion.leida,
    };

    if (!notificacion.id) {
      return new this.model(datos).save();
    }

    return this.model
      .findByIdAndUpdate(notificacion.id, datos, {
        returnDocument: "after",
        runValidators: true,
      })
      .exec();
  }
}
