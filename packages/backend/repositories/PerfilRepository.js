import mongoose from "mongoose";
import { PerfilModel } from "../schemas/perfilSchema.js";

export class PerfilRepository {
  constructor() {
    this.model = PerfilModel;
  }

  async save(perfil, idProyecto) {
    const documento = new this.model({
      proyecto: idProyecto,
      descripcion: perfil.descripcion,
      habilidadesRequeridas: perfil.habilidadesRequeridas,
      habilidadesOpcionales: perfil.habilidadesOpcionales,
      compromiso: perfil.compromiso,
    });
    return await documento.save();
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