import mongoose from "mongoose";
import { PerfilModel } from "../schemas/perfilSchema.js";

export class PerfilRepository {
  constructor() {
    this.model = PerfilModel;
  }

  async save(perfil, idProyecto) {
    const documento = new this.model({
      idProyecto,
      descripcion: perfil.descripcion,
      habilidadesRequeridas: perfil.habilidadesRequeridas,
      habilidadesOpcionales: perfil.habilidadesOpcionales,
      compromiso: perfil.compromiso,
    });
    return await documento.save();
  }

  async obtenerTodos(idProyecto) {
    return await this.model.find({ idProyecto });
  }

  async obtenerPorProyectos(idsProyectos) {
    if (idsProyectos.length === 0) return [];
    return await this.model.find({ idProyecto: { $in: idsProyectos } });
  }

  async buscarPorId(id) {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    return await this.model.findById(id);
  }

  async eliminar(id) {
    return await this.model.findByIdAndDelete(id);
  }

  async actualizar(id, datos) {
    return await this.model.findByIdAndUpdate(
      id,
      { $set: datos },
      { new: true, runValidators: true },
    );
  }
}
