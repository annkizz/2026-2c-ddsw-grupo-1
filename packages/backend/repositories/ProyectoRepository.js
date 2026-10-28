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
        estado: Estado.ACTIVO,
        _id: { $nin: idsExcluidos },
      })
      .select("_id titulo descripcion")
      .sort({ fechaInicio: -1 })
      .exec();
  }

  async buscarPorId(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return await this.proyectoModel.findById(id).exec();
  }

  async existe(idProyecto) {
    if (!mongoose.isValidObjectId(idProyecto)) return false;
    const resultado = await this.proyectoModel.exists({ _id: idProyecto });
    return resultado !== null;
  }

  async agregarPerfil(idProyecto, id) {
    const proyecto = await this.proyectoModel.findById(idProyecto).exec();
    if (!proyecto) return null;

    const yaAgregado = proyecto.perfiles.some(
      (perfil) => String(perfil) === String(id),
    );
    if (!yaAgregado) {
      proyecto.perfiles.push(id);
      await proyecto.save();
    }
    return proyecto;
  }

  async quitarPerfil(idProyecto, id) {
    const proyecto = await this.proyectoModel.findById(idProyecto).exec();
    if (!proyecto) return null;

    proyecto.perfiles = proyecto.perfiles.filter(
      (perfil) => String(perfil) !== String(id),
    );
    await proyecto.save();
    return proyecto;
  }

  obtenerVencidos(ahora = new Date()) {
    return this.proyectoModel
      .find({
        estado: Estado.ACTIVO,
        fechaLimiteCierre: { $lte: ahora },
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
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }
}
