import mongoose from "mongoose";
import { LogroModel } from "../schemas/logroSchema.js";

export class LogroRepository {
  constructor() {
    this.model = LogroModel;
  }

  async save(logro) {
    return await new this.model(logro).save();
  }

  async obtenerPorProyecto(idProyecto) {
    return await this.model.find({ idProyecto: idProyecto });
  }

  async buscarPorId(idProyecto, idLogro) {
    if (!mongoose.isValidObjectId(idLogro)) {
      return null;
    }
    return await this.model.findOne({ _id: idLogro, idProyecto });
  }

  async actualizar(idProyecto, idLogro, datos) {
    if (!mongoose.isValidObjectId(idLogro)) {
      return null;
    }
    return await this.model.findOneAndUpdate(
      { _id: idLogro, idProyecto },
      datos,
      { returnDocument: "after", runValidators: true },
    );
  }

  async eliminar(idProyecto, idLogro) {
    if (!mongoose.isValidObjectId(idLogro)) {
      return null;
    }
    return await this.model.findOneAndDelete({
      _id: idLogro,
      idProyecto,
    });
  }
}
