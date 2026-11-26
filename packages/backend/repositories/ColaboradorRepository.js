import mongoose from "mongoose";
import { ColaboradorModel } from "../schemas/colaboradorSchema.js";

export class ColaboradorRepository {
  constructor(model = ColaboradorModel) {
    this.model = model;
  }

  obtenerTodos() {
    return this.model.find().exec();
  }

  async buscarPorId(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return await this.model.findById(id).exec();
  }

  buscarPorUsuario(idUsuario) {
    return this.model.findOne({ usuario: idUsuario }).exec();
  }

  obtenerPorIds(ids) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.model
      .find({ _id: { $in: ids } })
      .select("_id nombreFantasia")
      .exec();
  }

  // Datos públicos para listar candidatas (sin nombre real, colaboraciones ni medios de contacto).
  obtenerPublicosPorIds(ids) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.model
      .find({ _id: { $in: ids } })
      .select("_id nombreFantasia usuarioGitHub pronombres presentacion habilidades aceptaMensajeria")
      .exec();
  }

  async encontrarPorHabilidadesRequeridas(titulos) {
    if (titulos.length === 0) return [];
    return this.model
      .find({ habilidades: { $in: titulos } })
      .select(
        "_id nombreFantasia usuarioGitHub pronombres presentacion habilidades aceptaMensajeria",
      )
      .exec();
  }

  save(unColaborador, id = unColaborador._id) {
    return this.model
      .findOneAndUpdate(
        { _id: id ?? new mongoose.Types.ObjectId() },
        {
          nombreFantasia: unColaborador.nombreFantasia,
          usuarioGitHub: unColaborador.usuarioGitHub,
          nombre: unColaborador.nombre,
          apellido: unColaborador.apellido,
          presentacion: unColaborador.presentacion,
          pronombres: unColaborador.pronombres,
          aceptaMensajeria: unColaborador.aceptaMensajeria,
          habilidades: unColaborador.habilidades,
          mediosDeContacto: unColaborador.mediosDeContacto,
          usuario: unColaborador.usuario,
        },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }
}
