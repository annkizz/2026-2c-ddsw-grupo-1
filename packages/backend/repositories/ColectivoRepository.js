import mongoose from "mongoose";
import { ColectivoModel } from "../schemas/colectivoSchema.js";

export class ColectivoRepository {
  constructor(model = ColectivoModel) {
    this.model = model;
  }

  obtenerTodos() {
    return this.model.find().exec();
  }

  async buscarPorId(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return await this.model.findById(id).exec();
  }

  save(unColectivo, id = unColectivo._id) {
    return this.model
      .findOneAndUpdate(
        { _id: id ?? new mongoose.Types.ObjectId() },
        {
          nombre: unColectivo.nombre,
          descripcion: unColectivo.descripcion,
          ubicacion: unColectivo.ubicacion,
          tipoDeColectivo: unColectivo.tipoDeColectivo,
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

  async agregarProyecto(idColectivo, idProyecto) {
    const colectivo = await this.model.findById(idColectivo).exec();
    if (!colectivo) return null;

    const yaAgregado = colectivo.proyectos.some(
      (proyecto) => String(proyecto) === String(idProyecto),
    );
    if (!yaAgregado) {
      colectivo.proyectos.push(idProyecto);
      await colectivo.save();
    }
    return colectivo;
  }
}
