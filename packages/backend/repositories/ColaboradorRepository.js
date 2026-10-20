import mongoose from "mongoose";
import { ColaboradorModel } from "../schemas/colaboradorSchema.js";

export class ColaboradorRepository {
  constructor(model = ColaboradorModel) {
    this.model = model;
  }

  obtenerTodos() {
    return this.model.find().exec();
  }

  async encontrarPorId(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return await this.model.findById(id).exec();
  }

  async encontrarPorHabilidades(titulos) {
    if (titulos.length === 0) return [];
    return await this.model.find({ habilidades: { $in: titulos } }).exec();
  }

  save(unColaborador, id = unColaborador._id) {
    return this.model
      .findOneAndUpdate(
        { _id: id ?? new mongoose.Types.ObjectId() },
        {
          $set: {
            nombreFantasia: unColaborador.nombreFantasia,
            usuarioGitHub: unColaborador.usuarioGitHub,
            nombre: unColaborador.nombre,
            apellido: unColaborador.apellido,
            presentacion: unColaborador.presentacion,
            pronombres: unColaborador.pronombres,
            aceptaMensajeria: unColaborador.aceptaMensajeria,
            habilidades: unColaborador.habilidades,
            mediosDeContacto: unColaborador.mediosDeContacto,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }
}
