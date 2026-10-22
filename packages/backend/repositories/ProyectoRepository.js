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

  obtenerAbiertosParaMatching(idsExcluidos) {
    return this.proyectoModel
      .find({
        estado: { $ne: Estado.FINALIZADO },
        _id: { $nin: idsExcluidos },
      })
      .select("_id titulo descripcion")
      .sort({ fechaInicio: -1 })
      .exec();
  }

  async encontrarPorId(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return await this.proyectoModel.findById(id).exec();
  }

  async existe(idProyecto) {
    if (!mongoose.isValidObjectId(idProyecto)) return false;
    const resultado = await this.proyectoModel.exists({ _id: idProyecto });
    return resultado !== null;
  }

  agregarPerfil(idProyecto, id) {
    return this.proyectoModel
      .updateOne({ _id: idProyecto }, { $addToSet: { perfiles: id } })
      .exec();
  }

  quitarPerfil(idProyecto, id) {
    return this.proyectoModel
      .updateOne({ _id: idProyecto }, { $pull: { perfiles: id } })
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
