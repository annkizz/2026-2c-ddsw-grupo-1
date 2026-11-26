import { CambioMatchingModel } from "../schemas/cambioMatchingSchema.js";

export class CambioMatchingRepository {
  constructor(model = CambioMatchingModel) {
    this.model = model;
  }

  // Si ya estaba en la cola, conserva la fecha del primer cambio.
  registrar({ tipo, idEntidad, idProyecto = null }, ahora = new Date()) {
    return this.model
      .updateOne(
        { tipo, idEntidad },
        {
          $set: { idProyecto, actualizadoEn: ahora },
          $setOnInsert: { registradoEn: ahora },
        },
        { upsert: true },
      )
      .exec();
  }

  obtenerPendientes() {
    return this.model.find().sort({ registradoEn: 1 }).lean().exec();
  }

  // Borra lo procesado. Si algo volvió a cambiar mientras se procesaba (actualizadoEn posterior),
  // queda en la cola para el próximo lote.
  eliminarProcesados(ids, hasta) {
    if (ids.length === 0) return Promise.resolve();
    return this.model
      .deleteMany({ _id: { $in: ids }, actualizadoEn: { $lte: hasta } })
      .exec();
  }
}
