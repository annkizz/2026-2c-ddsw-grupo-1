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
      limiteColaboraciones: perfil.limiteColaboraciones,
      tipoAceptacion: perfil.tipoAceptacion,
    });
    return await documento.save();
  }

  async obtenerProyectosPorHabilidades(habilidades) {
    if (habilidades.length === 0) return [];
    return await this.model.distinct("idProyecto", {
      $or: [
        { habilidadesRequeridas: { $in: habilidades } },
        { habilidadesOpcionales: { $in: habilidades } },
      ],
    });
  }

  async obtenerTodos(idProyecto) {
    return await this.model.find({ idProyecto });
  }

  async obtenerPorProyectos(idsProyectos) {
    if (idsProyectos.length === 0) return [];
    return this.model
      .find({ idProyecto: { $in: idsProyectos } })
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
