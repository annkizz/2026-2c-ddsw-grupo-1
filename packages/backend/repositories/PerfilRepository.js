import mongoose from "mongoose";
import { PerfilModel } from "../schemas/perfilSchema.js";

export class PerfilRepository {
  constructor(model = PerfilModel) {
    this.model = model;
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

  async obtenerCompatiblesPorProyectos(idsProyectos, habilidades) {
    if (idsProyectos.length === 0 || habilidades.length === 0) return [];
    return this.model
      .find({
        idProyecto: { $in: idsProyectos },
        habilidadesRequeridas: { $in: habilidades },
      })
      .select(
        "_id idProyecto descripcion compromiso habilidadesRequeridas habilidadesOpcionales",
      )
      .exec();
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
    return await this.model.findByIdAndUpdate(id, datos, {
      returnDocument: "after",
      runValidators: true,
    });
  }
}
