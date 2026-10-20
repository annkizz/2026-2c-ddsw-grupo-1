import mongoose from "mongoose";
import { ProyectoModel } from "../schemas/proyectoSchema.js";
import { Estado } from "../domain/Estado.js";

export class ProyectoRepository {
  constructor(proyectoModel = ProyectoModel) {
    this.proyectoModel = proyectoModel;
  }

  obtenerTodos() {
    return this.proyectoModel.find().sort({ fechaInicio: -1 }).exec();
  }

  obtenerAbiertos() {
    return this.proyectoModel
      .find({ estado: { $ne: Estado.FINALIZADO } })
      .sort({ fechaInicio: -1 })
      .exec();
  }

  async encontrarPorId(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return await this.proyectoModel.findById(id).exec();
  }

  agregarPerfil(idProyecto, idPerfil) {
    return this.proyectoModel
      .updateOne({ _id: idProyecto }, { $addToSet: { perfiles: idPerfil } })
      .exec();
  }

  quitarPerfil(idProyecto, idPerfil) {
    return this.proyectoModel
      .updateOne({ _id: idProyecto }, { $pull: { perfiles: idPerfil } })
      .exec();
  }

  obtenerVencidos(ahora = new Date()) {
    return this.proyectoModel
      .find({
        estado: { $ne: Estado.FINALIZADO },
        fechaLimiteCierre: { $ne: null, $lte: ahora },
      })
      .exec();
  }

  save(unProyecto, id = unProyecto._id) {
    return this.proyectoModel
      .findOneAndUpdate(
        { _id: id ?? new mongoose.Types.ObjectId() },
        {
          $set: {
            idColectivo: unProyecto.idColectivo,
            titulo: unProyecto.titulo,
            descripcion: unProyecto.descripcion,
            perfiles: unProyecto.perfiles,
            estado: unProyecto.estado,
            fechaInicio: unProyecto.fechaInicio,
            fechaLimiteCierre: unProyecto.fechaLimiteCierre,
            porcentajeConcrecion: unProyecto.porcentajeConcrecion,
            enlaceSistema: unProyecto.enlaceSistema,
            enlaceCodigoFuente: unProyecto.enlaceCodigoFuente,
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
