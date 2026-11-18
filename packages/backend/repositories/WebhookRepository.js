import mongoose from "mongoose";
import { WebhookModel } from "../schemas/webhookSchema.js";

export class WebhookRepository {
  constructor(model = WebhookModel) {
    this.model = model;
  }

  esIdValido(id) {
    return mongoose.isValidObjectId(id);
  }

  save(webhook) {
    return this.model.create({
      idColectivo: webhook.idColectivo,
      url: webhook.url,
      eventos: webhook.eventos,
      formato: webhook.formato,
      activo: webhook.activo,
      secreto: webhook.secreto,
    });
  }

  async buscarPorId(id, { conSecreto = false } = {}) {
    if (!this.esIdValido(id)) return null;
    const consulta = this.model.findById(id);
    if (conSecreto) consulta.select("+secreto");
    return consulta.exec();
  }

  async obtenerPorColectivo(idColectivo) {
    if (!this.esIdValido(idColectivo)) return [];
    return this.model.find({ idColectivo }).sort({ createdAt: 1 }).exec();
  }

  contarPorColectivo(idColectivo) {
    return this.model.countDocuments({ idColectivo });
  }

  obtenerActivos(idColectivo, evento) {
    return this.model
      .find({ idColectivo, activo: true, eventos: evento })
      .select("+secreto")
      .exec();
  }

  actualizar(id, cambios) {
    return this.model
      .findByIdAndUpdate(
        id,
        { $set: cambios },
        { returnDocument: "after", runValidators: true },
      )
      .exec();
  }

  eliminar(id) {
    return this.model.findByIdAndDelete(id).exec();
  }

  registrarEntrega(id, entrega) {
    return this.model
      .updateOne({ _id: id }, { $set: { ultimaEntrega: entrega } })
      .exec();
  }
}