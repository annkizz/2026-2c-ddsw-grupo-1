import mongoose from "mongoose";
import { ColectivoModel } from "../schemas/colectivoSchema.js";

export class ColectivoRepository {
  constructor(model = ColectivoModel) {
    this.model = model;
  }

  obtenerTodos() {
    return this.model.find().exec();
  }

  async encontrarPorId(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return await this.model.findById(id).exec();
  }

  save(unColectivo, id = unColectivo._id) {
    return this.model
      .findOneAndUpdate(
        { _id: id ?? new mongoose.Types.ObjectId() },
        {
          $set: {
            nombre: unColectivo.nombre,
            descripcion: unColectivo.descripcion,
            ubicacion: unColectivo.ubicacion,
            tipoDeColectivo: unColectivo.tipoDeColectivo,
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

  agregarProyecto(idColectivo, idProyecto) {
    return this.model
      .updateOne({ _id: idColectivo }, { $addToSet: { proyectos: idProyecto } })
      .exec();
  }
}
