import mongoose from "mongoose";
import { PerfilModel } from "../schemas/perfilSchema.js";

export class PerfilRepository {
  constructor() {
    this.model = PerfilModel;
  }

  async save(perfil) {
    return await new this.model(perfil).save();
  }

  async obtenerTodos(idProyecto) {
    return await this.model.find({ proyecto: idProyecto });
  }

  async buscarPorId(idPerfil) {
    if (!mongoose.isValidObjectId(idPerfil)) {
        return null;
    }
    return await this.model.findById(idPerfil);
  }

  async eliminar(idPerfil) {
    return await this.model.findByIdAndDelete(idPerfil);
  }
}