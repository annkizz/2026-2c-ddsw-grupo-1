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

  encontrarPorId(idProyecto) {
    return this.proyectoModel.findOne({ idProyecto }).exec();
  }

  agregarPerfil(idProyecto, idPerfil) {
    return this.proyectoModel
      .updateOne({ idProyecto }, { $addToSet: { perfiles: idPerfil } })
      .exec();
  }

  quitarPerfil(idProyecto, idPerfil) {
    return this.proyectoModel
      .updateOne({ idProyecto }, { $pull: { perfiles: idPerfil } })
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

  save(unProyecto) {
    return this.proyectoModel
      .findOneAndUpdate(
        { idProyecto: unProyecto.idProyecto },
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
